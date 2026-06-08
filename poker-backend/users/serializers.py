from decimal import Decimal
from django.contrib.auth import authenticate
from django.db import transaction
from django.conf import settings
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User, Wallet, UserStats


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password_confirm')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password': 'Passwords do not match.'})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        # Initialize wallet with ₹10,000 starting balance
        Wallet.objects.create(user=user, balance=Decimal('10000.00'))
        UserStats.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(username=attrs['username'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid credentials.')
        if not user.is_active:
            raise serializers.ValidationError('Account is disabled.')
        attrs['user'] = user
        return attrs

    def get_tokens(self, user):
        refresh = RefreshToken.for_user(user)
        return {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }


class WalletSerializer(serializers.ModelSerializer):
    class Meta:
        model = Wallet
        fields = ('balance',)


class UserStatsSerializer(serializers.ModelSerializer):
    win_rate = serializers.ReadOnlyField()

    class Meta:
        model = UserStats
        fields = ('hands_played', 'hands_won', 'total_winnings', 'total_losses', 'win_rate')


class UserProfileSerializer(serializers.ModelSerializer):
    wallet = WalletSerializer(read_only=True)
    stats = UserStatsSerializer(read_only=True)
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'wallet', 'stats', 'date_joined', 'avatar_url')

    def get_avatar_url(self, obj):
        """Return the absolute URL of the avatar, or None if not set."""
        if obj.avatar:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.avatar.url)
            return f"{settings.MEDIA_URL}{obj.avatar.name}"
        return None


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Current password is incorrect.')
        return value

    def validate_new_password(self, value):
        from django.contrib.auth.password_validation import validate_password
        try:
            validate_password(value, self.context['request'].user)
        except Exception as e:
            raise serializers.ValidationError(list(e.messages))
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ChangeUsernameSerializer(serializers.Serializer):
    new_username = serializers.CharField(min_length=3, max_length=30)

    def validate_new_username(self, value):
        user = self.context['request'].user
        if User.objects.filter(username__iexact=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('This username is already taken.')
        # Alphanumeric + underscores only
        import re
        if not re.match(r'^[a-zA-Z0-9_]+$', value):
            raise serializers.ValidationError('Username may only contain letters, numbers, and underscores.')
        return value

    def save(self):
        user = self.context['request'].user
        user.username = self.validated_data['new_username']
        user.save(update_fields=['username'])
        return user

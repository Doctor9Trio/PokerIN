from rest_framework import serializers
from .models import PokerTable


class CreateTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = PokerTable
        fields = (
            'name', 'small_blind', 'big_blind',
            'min_buy_in', 'max_buy_in', 'max_players',
        )

    def validate(self, attrs):
        if attrs['big_blind'] != attrs['small_blind'] * 2:
            raise serializers.ValidationError(
                'Big blind must be exactly 2x the small blind.'
            )
        if attrs['min_buy_in'] < attrs['big_blind'] * 20:
            raise serializers.ValidationError(
                'Minimum buy-in must be at least 20x the big blind.'
            )
        if attrs['max_buy_in'] < attrs['min_buy_in']:
            raise serializers.ValidationError(
                'Maximum buy-in must be greater than or equal to minimum buy-in.'
            )
        return attrs


class TableInfoSerializer(serializers.ModelSerializer):
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = PokerTable
        fields = (
            'id', 'invite_code', 'name',
            'small_blind', 'big_blind',
            'min_buy_in', 'max_buy_in',
            'max_players', 'is_active',
            'created_by_username', 'created_at',
        )

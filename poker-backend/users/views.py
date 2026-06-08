import os
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenRefreshView

from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    ChangeUsernameSerializer,
)

ALLOWED_AVATAR_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif'}
MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """Create a new player account with ₹10,000 starting balance."""
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {
                'message': 'Account created successfully.',
                'username': user.username,
                'starting_balance': '₹10,000.00',
            },
            status=status.HTTP_201_CREATED,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """Authenticate and return JWT access + refresh tokens."""
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        tokens = serializer.get_tokens(user)
        return Response(
            {
                'access': tokens['access'],
                'refresh': tokens['refresh'],
                'username': user.username,
                'user_id': user.id,
            },
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profile(request):
    """Return the authenticated player's full profile, balance, and stats."""
    serializer = UserProfileSerializer(request.user, context={'request': request})
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_avatar(request):
    """Upload or replace the authenticated player's profile avatar."""
    avatar_file = request.FILES.get('avatar')
    if not avatar_file:
        return Response({'error': 'No avatar file provided.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate extension
    ext = os.path.splitext(avatar_file.name)[1].lower()
    if ext not in ALLOWED_AVATAR_EXTENSIONS:
        return Response(
            {'error': f'Unsupported file type. Allowed: {", ".join(ALLOWED_AVATAR_EXTENSIONS)}'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate size
    if avatar_file.size > MAX_AVATAR_SIZE_BYTES:
        return Response(
            {'error': 'File too large. Maximum size is 5 MB.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    user = request.user
    # Remove old avatar file to avoid orphaned files
    if user.avatar:
        try:
            old_path = user.avatar.path
            if os.path.isfile(old_path):
                os.remove(old_path)
        except Exception:
            pass

    user.avatar = avatar_file
    user.save(update_fields=['avatar'])

    serializer = UserProfileSerializer(user, context={'request': request})
    return Response(
        {'avatar_url': serializer.data['avatar_url'], 'message': 'Avatar updated successfully.'},
        status=status.HTTP_200_OK,
    )


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    """Change the authenticated user's password."""
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({'message': 'Password changed successfully.'}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_username(request):
    """Change the authenticated user's username."""
    serializer = ChangeUsernameSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = serializer.save()
        return Response(
            {'message': 'Username changed successfully.', 'username': user.username},
            status=status.HTTP_200_OK,
        )
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

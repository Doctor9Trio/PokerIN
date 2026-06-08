from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    path('register/', views.register, name='register'),
    path('login/', views.login, name='login'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('profile/', views.profile, name='profile'),
    path('avatar/', views.upload_avatar, name='upload-avatar'),
    path('change-password/', views.change_password, name='change-password'),
    path('change-username/', views.change_username, name='change-username'),
]

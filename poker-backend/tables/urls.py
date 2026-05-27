from django.urls import path
from . import views

urlpatterns = [
    path('create/', views.create_table, name='create_table'),
    path('join/', views.join_table, name='join_table'),
    path('<str:invite_code>/info/', views.table_info, name='table_info'),
]

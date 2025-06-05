from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TripViewSet, 
    BookingViewSet, 
    ChatViewSet, 
    MessageViewSet,
    UserViewSet
)

router = DefaultRouter()
router.register(r'trips', TripViewSet, basename='trip')
router.register(r'bookings', BookingViewSet, basename='booking')
router.register(r'chats', ChatViewSet, basename='chat')
router.register(r'messages', MessageViewSet, basename='message')
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [
    path('api/', include(router.urls)),
] 
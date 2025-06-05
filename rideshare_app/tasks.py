from celery import shared_task
from django.utils import timezone
from datetime import timedelta
from .models import Trip
from .services import NotificationService

@shared_task
def send_trip_reminders():
    """
    Отправляет напоминания о поездках, которые состоятся завтра
    """
    tomorrow = timezone.now().date() + timedelta(days=1)
    trips = Trip.objects.filter(
        date=tomorrow,
        status='confirmed'
    ).select_related('driver').prefetch_related('bookings__passenger')

    for trip in trips:
        # Отправляем напоминание водителю
        NotificationService.send_trip_reminder(trip, trip.driver)

        # Отправляем напоминания пассажирам
        for booking in trip.bookings.filter(status='confirmed'):
            NotificationService.send_trip_reminder(trip, booking.passenger) 
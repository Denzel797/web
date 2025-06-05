from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from .models import Notification, Message
from datetime import datetime, timedelta
import requests
from .models import User
from typing import Optional, Dict, Any
from django.utils import timezone

class NotificationService:
    @staticmethod
    def create_notification(user, notification_type, title, message, related_trip=None, related_booking=None):
        notification = Notification.objects.create(
            user=user,
            notification_type=notification_type,
            title=title,
            message=message,
            related_trip=related_trip,
            related_booking=related_booking
        )
        
        # Try to send email notification, but don't fail if it doesn't work
        if user.email_notifications:
            try:
                NotificationService.send_email_notification(notification)
            except Exception as e:
                print(f"Failed to send email notification: {str(e)}")
        
        return notification

    @staticmethod
    def send_email_notification(notification):
        try:
            context = {
                'notification': notification,
                'user': notification.user,
            }
            
            html_message = render_to_string('email/notification.html', context)
            plain_message = render_to_string('email/notification.txt', context)
            
            send_mail(
                subject=notification.title,
                message=plain_message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[notification.user.email],
                html_message=html_message,
                fail_silently=True  # Don't raise exceptions on email failures
            )
        except Exception as e:
            print(f"Error sending email: {str(e)}")

    @staticmethod
    def send_booking_notification(booking):
        # Уведомление водителю о новом бронировании
        driver_notification = NotificationService.create_notification(
            user=booking.trip.driver,
            notification_type='booking',
            title='New Booking',
            message=f'New booking for your trip from {booking.trip.departure_location} to {booking.trip.destination_location}',
            related_trip=booking.trip,
            related_booking=booking
        )
        
        # Уведомление пассажиру о подтверждении бронирования
        passenger_notification = NotificationService.create_notification(
            user=booking.passenger,
            notification_type='booking',
            title='Booking Confirmed',
            message=f'Your booking for the trip from {booking.trip.departure_location} to {booking.trip.destination_location} has been confirmed',
            related_trip=booking.trip,
            related_booking=booking
        )

    @staticmethod
    def send_trip_update_notification(trip, update_type):
        message = f'Your trip from {trip.departure_location} to {trip.destination_location} has been {update_type}'
        
        # Уведомление водителю
        NotificationService.create_notification(
            user=trip.driver,
            notification_type='trip_update',
            title=f'Trip {update_type.title()}',
            message=message,
            related_trip=trip
        )
        
        # Уведомление всем пассажирам
        for booking in trip.bookings.filter(status='confirmed'):
            NotificationService.create_notification(
                user=booking.passenger,
                notification_type='trip_update',
                title=f'Trip {update_type.title()}',
                message=message,
                related_trip=trip
            )

    @staticmethod
    def send_trip_reminder():
        # Отправка напоминаний о предстоящих поездках
        tomorrow = datetime.now().date() + timedelta(days=1)
        
        from .models import Trip
        upcoming_trips = Trip.objects.filter(
            departure_time__date=tomorrow,
            status='active'
        )
        
        for trip in upcoming_trips:
            # Напоминание водителю
            NotificationService.create_notification(
                user=trip.driver,
                notification_type='reminder',
                title='Trip Tomorrow',
                message=f'You have a trip tomorrow from {trip.departure_location} to {trip.destination_location}',
                related_trip=trip
            )
            
            # Напоминание пассажирам
            for booking in trip.bookings.filter(status='confirmed'):
                NotificationService.create_notification(
                    user=booking.passenger,
                    notification_type='reminder',
                    title='Trip Tomorrow',
                    message=f'You have a trip tomorrow from {trip.departure_location} to {trip.destination_location}',
                    related_trip=trip
                )

    @staticmethod
    def send_message_notification(message):
        NotificationService.create_notification(
            user=message.receiver,
            notification_type='message',
            title='New Message',
            message=f'New message from {message.sender.username} about trip from {message.trip.departure_location} to {message.trip.destination_location}',
            related_trip=message.trip
        )

    @staticmethod
    def send_complaint_notification(complaint):
        """
        Отправляет уведомление о новой жалобе
        """
        # Уведомление для администраторов
        admin_users = User.objects.filter(is_staff=True)
        for admin in admin_users:
            Notification.objects.create(
                user=admin,
                notification_type='complaint',
                title='Новая жалоба',
                message=f'Получена новая жалоба от {complaint.reporter.username} на {complaint.reported_user.username}',
                related_trip=complaint.trip
            )
            
        # Уведомление для пользователя, на которого пожаловались
        Notification.objects.create(
            user=complaint.reported_user,
            notification_type='complaint',
            title='Жалоба на вас',
            message=f'На вас поступила жалоба от пользователя {complaint.reporter.username}',
            related_trip=complaint.trip
        )
        
    @staticmethod
    def send_complaint_status_notification(complaint):
        """
        Отправляет уведомление об изменении статуса жалобы
        """
        # Уведомление для пользователя, подавшего жалобу
        Notification.objects.create(
            user=complaint.reporter,
            notification_type='complaint_update',
            title='Обновление статуса жалобы',
            message=f'Статус вашей жалобы на {complaint.reported_user.username} изменен на {complaint.get_status_display()}',
            related_trip=complaint.trip
        )
        
        # Если жалоба решена и пользователь заблокирован, отправляем уведомление
        if complaint.status == 'resolved' and complaint.reported_user.is_blocked:
            Notification.objects.create(
                user=complaint.reported_user,
                notification_type='account_blocked',
                title='Аккаунт заблокирован',
                message=f'Ваш аккаунт заблокирован по жалобе. Причина: {complaint.reported_user.block_reason}',
                related_trip=complaint.trip
            )
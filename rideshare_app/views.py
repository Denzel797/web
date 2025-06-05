from rest_framework import viewsets, permissions, status, filters
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly, IsAdminUser
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.utils import timezone
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from .models import User, Trip, Booking, Review, Notification, Message, Complaint, TripReport, Chat, ChatMessage
from .serializers import (
    UserSerializer, TripSerializer,
    BookingSerializer, ReviewSerializer,
    NotificationSerializer, MessageSerializer, ComplaintSerializer, TripReportSerializer,
    ChatSerializer, ChatMessageSerializer
)
from .filters import TripFilter, BookingFilter, ReviewFilter
from .authentication import get_tokens_for_user
from .services import NotificationService
from .permissions import IsDriverOrReadOnly, IsAdminOrReadOnly, IsPassengerOrReadOnly
from django.db.models import Avg, Count, Sum
from django.db.models.functions import Concat
from django.db.models import Value
from django.shortcuts import get_object_or_404
from django.db.models import Q
from rest_framework.exceptions import ValidationError

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet для управления пользователями.
    
    Предоставляет CRUD операции для пользователей, а также дополнительные
    эндпоинты для управления профилем и получения информации о текущем пользователе.
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def me(self, request):
        """
        Получение информации о текущем пользователе.
        
        Returns:
            Response: Сериализованные данные текущего пользователя
        """
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['put', 'patch'])
    def update_me(self, request):
        """
        Обновление профиля текущего пользователя.
        
        Args:
            request: Запрос с данными для обновления
            
        Returns:
            Response: Обновленные данные пользователя или ошибки валидации
        """
        user = request.user
        serializer = self.get_serializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class TripViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления поездками.
    
    Предоставляет CRUD операции для поездок, а также дополнительные
    эндпоинты для бронирования, отмены и завершения поездок.
    """
    queryset = Trip.objects.all()
    serializer_class = TripSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering_fields = ['date', 'price', 'available_seats']

    def create(self, request, *args, **kwargs):
        print("Received data:", request.data)  # Логируем входящие данные
        serializer = self.get_serializer(data=request.data)
        if not serializer.is_valid():
            print("Validation errors:", serializer.errors)  # Логируем ошибки валидации
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        return super().create(request, *args, **kwargs)

    def get_queryset(self):
        queryset = Trip.objects.all()
        date_from = self.request.query_params.get('date_from', None)
        date_to = self.request.query_params.get('date_to', None)
        price_min = self.request.query_params.get('price_min', None)
        price_max = self.request.query_params.get('price_max', None)
        seats = self.request.query_params.get('seats', None)
        departure = self.request.query_params.get('departure', None)
        destination = self.request.query_params.get('destination', None)

        if date_from:
            queryset = queryset.filter(date__gte=date_from)
        if date_to:
            queryset = queryset.filter(date__lte=date_to)
        if price_min:
            queryset = queryset.filter(price__gte=price_min)
        if price_max:
            queryset = queryset.filter(price__lte=price_max)
        if seats:
            queryset = queryset.filter(available_seats__gte=seats)
        if departure:
            queryset = queryset.filter(departure_location__icontains=departure)
        if destination:
            queryset = queryset.filter(destination_location__icontains=destination)

        return queryset

    def perform_create(self, serializer):
        # Получаем координаты из данных запроса
        departure_coords = serializer.validated_data.get('departure_coords')
        destination_coords = serializer.validated_data.get('destination_coords')
        print("Coordinates:", departure_coords, destination_coords)  # Логируем координаты

        # Преобразуем строки координат в списки чисел
        try:
            departure_coords_list = [float(x) for x in departure_coords.split(',')]
            destination_coords_list = [float(x) for x in destination_coords.split(',')]
        except (ValueError, AttributeError) as e:
            print("Coordinate parsing error:", str(e))  # Логируем ошибку парсинга координат
            raise serializer.ValidationError("Неверный формат координат")

        # Сохраняем поездку
        trip = serializer.save(
            driver=self.request.user,
            status='active'  # Устанавливаем статус active по умолчанию
        )

        # Отправляем уведомление о создании новой поездки
        NotificationService.create_notification(
            user=self.request.user,
            notification_type='trip_update',
            title='Поездка создана',
            message=f'Ваша поездка {trip.departure_location} → {trip.destination_location} успешно создана',
            related_trip=trip
        )

        return trip

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def book(self, request, pk=None):
        """
        Бронирование поездки пассажиром.
        
        Args:
            request: Запрос с количеством мест для бронирования
            pk: ID поездки
            
        Returns:
            Response: Данные созданного бронирования или ошибка
        """
        trip = self.get_object()
        
        if trip.driver == request.user:
            return Response(
                {"error": "Вы не можете забронировать свою собственную поездку"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if trip.status != 'active':
            return Response(
                {"error": "Эта поездка недоступна для бронирования"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if trip.available_seats < 1:
            return Response(
                {"error": "Нет свободных мест"},
                status=status.HTTP_400_BAD_REQUEST
            )

        seats_booked = request.data.get('seats_booked', 1)
        if not isinstance(seats_booked, int) or seats_booked < 1:
            return Response(
                {"error": "Неверное количество мест"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if seats_booked > trip.available_seats:
            return Response(
                {"error": f"Доступно только {trip.available_seats} мест"},
                status=status.HTTP_400_BAD_REQUEST
            )

        booking = Booking.objects.create(
            trip=trip,
            passenger=request.user,
            status='pending',
            seats_booked=seats_booked
        )
        
        trip.available_seats -= seats_booked
        trip.save()
        
        return Response(
            BookingSerializer(booking).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True, methods=['post'], permission_classes=[IsDriverOrReadOnly])
    def complete(self, request, pk=None):
        """
        Завершение поездки водителем.
        
        Args:
            request: Запрос на завершение поездки
            pk: ID поездки
            
        Returns:
            Response: Обновленные данные поездки или ошибка
        """
        trip = self.get_object()
        
        if trip.driver != request.user:
            return Response(
                {"error": "Только водитель может завершить поездку"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if trip.status != 'active':
            return Response(
                {"error": "Можно завершить только активную поездку"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        trip.status = 'completed'
        trip.save()
        
        trip.bookings.filter(status='confirmed').update(status='completed')
        NotificationService.send_trip_update_notification(trip, 'completed')
        
        return Response(TripSerializer(trip).data)

    @action(detail=True, methods=['post'], permission_classes=[IsDriverOrReadOnly])
    def cancel(self, request, pk=None):
        trip = self.get_object()
        
        if trip.driver != request.user:
            return Response(
                {"error": "Только водитель может отменить поездку"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        trip.status = 'cancelled'
        trip.save()
        
        # Обновляем статус всех бронирований
        trip.bookings.filter(status__in=['pending', 'confirmed']).update(status='cancelled')
        
        # Отправляем уведомление
        NotificationService.send_trip_update_notification(trip, 'cancelled')
        
        return Response(TripSerializer(trip).data)

    @action(detail=False, methods=['get'])
    def driver_trips(self, request):
        """
        Получить поездки текущего водителя
        """
        trips = Trip.objects.filter(driver=request.user)
        serializer = self.get_serializer(trips, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def passenger_trips(self, request):
        """
        Получить поездки текущего пассажира
        """
        trips = Trip.objects.filter(bookings__passenger=request.user).distinct()
        serializer = self.get_serializer(trips, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_trips(self, request):
        trips = Trip.objects.filter(driver=request.user)
        page = self.paginate_queryset(trips)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(trips, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def my_bookings(self, request):
        bookings = Booking.objects.filter(passenger=request.user)
        trips = Trip.objects.filter(bookings__in=bookings)
        page = self.paginate_queryset(trips)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(trips, many=True)
        return Response(serializer.data)

    def retrieve(self, request, *args, **kwargs):
        print(f"Retrieving trip with kwargs: {kwargs}")  # Логируем параметры запроса
        try:
            instance = self.get_object()
            print(f"Found trip: {instance}")  # Логируем найденную поездку
            serializer = self.get_serializer(instance)
            return Response(serializer.data)
        except Trip.DoesNotExist:
            print("Trip not found")  # Логируем, если поездка не найдена
            return Response({"error": "Trip not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error retrieving trip: {str(e)}")  # Логируем другие ошибки
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class BookingViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления бронированиями.
    
    Предоставляет CRUD операции для бронирований, а также дополнительные
    эндпоинты для подтверждения, отклонения и отмены бронирований.
    """
    queryset = Booking.objects.all()
    serializer_class = BookingSerializer
    permission_classes = [IsPassengerOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['status', 'trip']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def get_queryset(self):
        """
        Возвращает отфильтрованный QuerySet бронирований в зависимости от роли пользователя.
        
        Returns:
            QuerySet: Отфильтрованный список бронирований
        """
        role = self.request.query_params.get('role', None)
        
        if role == 'passenger':
            return Booking.objects.filter(passenger=self.request.user)
        elif role == 'driver':
            return Booking.objects.filter(trip__driver=self.request.user)
        
        return Booking.objects.filter(
            Q(passenger=self.request.user) | 
            Q(trip__driver=self.request.user)
        )
        
    def perform_create(self, serializer):
        trip = serializer.validated_data['trip']
        
        # Validate trip is active
        if trip.status != 'active':
            raise ValidationError('This trip is not available for booking')
            
        # Check available seats
        if trip.available_seats < 1:
            raise ValidationError('No available seats')
            
        # Prevent driver from booking their own trip
        if trip.driver == self.request.user:
            raise ValidationError('Driver cannot book their own trip')
            
        serializer.save(passenger=self.request.user)
        
        # Update available seats
        trip.available_seats -= 1
        trip.save()

    @action(detail=True, methods=['post'])
    def accept(self, request, pk=None):
        """
        Подтверждение бронирования водителем.
        
        Args:
            request: Запрос на подтверждение бронирования
            pk: ID бронирования
            
        Returns:
            Response: Обновленные данные бронирования или ошибка
        """
        booking = self.get_object()
        print(f"Accept booking request - Booking ID: {pk}")
        print(f"Booking status: {booking.status}")
        print(f"Current user: {request.user}")
        print(f"Trip driver: {booking.trip.driver}")
        
        # Only trip driver can accept bookings
        if booking.trip.driver != request.user:
            print("Error: User is not the trip driver")
            return Response(
                {'error': 'Only the trip driver can accept bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        # If booking is already confirmed, return success response
        if booking.status == 'confirmed':
            return Response(
                {'message': 'Booking is already confirmed'},
                status=status.HTTP_200_OK
            )
            
        # Can only accept pending bookings
        if booking.status != 'pending':
            print(f"Error: Invalid booking status: {booking.status}")
            return Response(
                {'error': 'Can only accept pending bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        booking.status = 'confirmed'
        booking.save()
        print("Booking successfully confirmed")
        
        # Create or get chat for the trip
        chat, created = Chat.objects.get_or_create(trip=booking.trip)
        
        # Add participants to chat
        chat.participants.add(booking.passenger, booking.trip.driver)
        
        # Send notification
        NotificationService.send_booking_notification(booking)
        
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        booking = self.get_object()
        print(f"Reject booking request - Booking ID: {pk}")
        print(f"Booking status: {booking.status}")
        print(f"Current user: {request.user}")
        print(f"Trip driver: {booking.trip.driver}")
        
        # Only trip driver can reject bookings
        if booking.trip.driver != request.user:
            print("Error: User is not the trip driver")
            return Response(
                {'error': 'Only the trip driver can reject bookings'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if booking.status.lower() != 'pending':
            print(f"Error: Invalid booking status: {booking.status}")
            return Response(
                {'error': 'Can only reject pending bookings'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        booking.status = 'cancelled'
        booking.save()
        print("Booking successfully cancelled")
        
        # Restore available seats
        trip = booking.trip
        trip.available_seats += booking.seats_booked
        trip.save()
        print(f"Restored {booking.seats_booked} seats to trip")
        
        return Response(BookingSerializer(booking).data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        booking = self.get_object()
        
        # Only passenger can cancel their booking
        if booking.passenger != request.user:
            return Response(
                {'error': 'Only the passenger can cancel their booking'},
                status=status.HTTP_403_FORBIDDEN
            )
            
        if booking.status not in ['pending', 'confirmed']:
            return Response(
                {'error': 'Cannot cancel this booking'},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        booking.status = 'cancelled'
        booking.save()
        
        # Restore available seats
        trip = booking.trip
        trip.available_seats += 1
        trip.save()
        
        return Response(BookingSerializer(booking).data)

class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_fields = ['reviewer', 'reviewed_user', 'trip']
    ordering_fields = ['created_at']
    ordering = ['-created_at']
    
    def perform_create(self, serializer):
        review = serializer.save(reviewer=self.request.user)
        
        # Обновляем рейтинг пользователя
        # Определяем, является ли пользователь водителем или пассажиром
        trip = review.trip
        is_driver = trip.driver == review.reviewed_user
        
        # Вычисляем новый рейтинг
        if is_driver:
            # Для водителя
            driver_reviews = Review.objects.filter(
                reviewed_user=review.reviewed_user,
                trip__driver=review.reviewed_user
            )
            avg_rating = driver_reviews.aggregate(Avg('rating'))['rating__avg']
            review.reviewed_user.update_rating(avg_rating, is_driver=True)
        else:
            # Для пассажира
            passenger_reviews = Review.objects.filter(
                reviewed_user=review.reviewed_user,
                trip__bookings__passenger=review.reviewed_user
            )
            avg_rating = passenger_reviews.aggregate(Avg('rating'))['rating__avg']
            review.reviewed_user.update_rating(avg_rating, is_driver=False)
            
        # Отправляем уведомление
        NotificationService.send_review_notification(review)
        
    def get_queryset(self):
        user = self.request.user
        return Review.objects.filter(
            Q(reviewer=user) | Q(reviewed_user=user)
        )

    @action(detail=False, methods=['get'])
    def user_reviews(self, request):
        user_id = request.query_params.get('user_id')
        if not user_id:
            return Response(
                {"error": "user_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        reviews = Review.objects.filter(reviewed_user_id=user_id)
        serializer = self.get_serializer(reviews, many=True)
        return Response(serializer.data)

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Notification.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save()
        return Response({'status': 'notification marked as read'})

    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        self.get_queryset().update(is_read=True)
        return Response({'status': 'all notifications marked as read'})

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at']
    ordering = ['-created_at']

    def get_queryset(self):
        return Message.objects.filter(
            Q(sender=self.request.user) | 
            Q(receiver=self.request.user)
        )

    def perform_create(self, serializer):
        message = serializer.save(sender=self.request.user)
        NotificationService.send_message_notification(message)

    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        message = self.get_object()
        if message.receiver == request.user:
            message.is_read = True
            message.save()
            return Response({'status': 'message marked as read'})
        return Response(
            {'error': 'You can only mark messages sent to you as read'},
            status=status.HTTP_403_FORBIDDEN
        )

    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        count = Message.objects.filter(
            receiver=request.user,
            is_read=False
        ).count()
        return Response({'unread_count': count})

class ComplaintViewSet(viewsets.ModelViewSet):
    queryset = Complaint.objects.all()
    serializer_class = ComplaintSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Complaint.objects.all()
        return Complaint.objects.filter(complainant=user)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        complaint = serializer.save()
        return Response(
            self.get_serializer(complaint).data,
            status=status.HTTP_201_CREATED
        )

class TripReportViewSet(viewsets.ModelViewSet):
    queryset = TripReport.objects.all()
    serializer_class = TripReportSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    ordering_fields = ['created_at', 'report_type']
    ordering = ['-created_at']

    def get_queryset(self):
        print("[TripReportViewSet] Getting queryset")
        queryset = TripReport.objects.all()
        report_type = self.request.query_params.get('report_type')
        if report_type:
            print(f"[TripReportViewSet] Filtering by report_type: {report_type}")
            queryset = queryset.filter(report_type=report_type)
        return queryset

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """
        Генерирует новый отчет на основе параметров запроса
        """
        print("[TripReportViewSet] Generating new report")
        print("[TripReportViewSet] Request data:", request.data)
        
        report_type = request.data.get('report_type')
        start_date = request.data.get('start_date')
        end_date = request.data.get('end_date')
        user_id = request.data.get('user_id')

        print(f"[TripReportViewSet] Parameters: type={report_type}, start={start_date}, end={end_date}, user={user_id}")

        if not all([report_type, start_date, end_date]):
            print("[TripReportViewSet] Missing required parameters")
            return Response(
                {'error': 'Missing required parameters'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            # Создаем новый отчет
            report = TripReport.objects.create(
                report_type=report_type,
                start_date=start_date,
                end_date=end_date,
                user_id=user_id if report_type == 'user' else None
            )

            print(f"[TripReportViewSet] Created report with ID: {report.id}")

            # Генерируем данные отчета
            report.generate_report()
            print("[TripReportViewSet] Report data generated successfully")

            serializer = self.get_serializer(report)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            print(f"[TripReportViewSet] Error generating report: {str(e)}")
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

class ChatViewSet(viewsets.ModelViewSet):
    """
    ViewSet для управления чатами.
    
    Предоставляет CRUD операции для чатов и сообщений, а также
    эндпоинты для отправки сообщений и получения истории чата.
    """
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Возвращает чаты, где пользователь является участником:
        - Как прямой участник чата
        - Как водитель поездки
        - Как пассажир с подтвержденным бронированием
        """
        user = self.request.user
        return Chat.objects.filter(
            Q(participants=user) |  # Пользователь уже участник чата
            Q(trip__driver=user) |  # Пользователь является водителем
            Q(trip__bookings__passenger=user, trip__bookings__status='confirmed')  # Пользователь является подтвержденным пассажиром
        ).distinct().order_by('-updated_at')

    def perform_create(self, serializer):
        chat = serializer.save()
        chat.participants.add(self.request.user)
        trip = chat.trip
        if trip and trip.driver != self.request.user:
            chat.participants.add(trip.driver)
        return chat

    @action(detail=True)
    def messages(self, request, pk=None):
        try:
            chat = self.get_object()  # This will use get_queryset() internally

            if not chat:
                return Response({"error": "Чат не найден или у вас нет к нему доступа"}, status=404)

            messages = chat.messages.all().order_by('created_at')
            
            # Отмечаем сообщения как прочитанные
            messages.filter(
                is_read=False
            ).exclude(
                sender=request.user
            ).update(is_read=True)
            
            page = self.paginate_queryset(messages)
            if page is not None:
                serializer = ChatMessageSerializer(page, many=True, context={'request': request})
                return self.get_paginated_response(serializer.data)

            serializer = ChatMessageSerializer(messages, many=True, context={'request': request})
            return Response(serializer.data)

        except Chat.DoesNotExist:
            return Response({"error": "Чат не найден или у вас нет к нему доступа"}, status=404)
        except Exception as e:
            return Response({"error": f"Произошла ошибка: {str(e)}"}, status=500)

    @action(detail=True, methods=['post'])
    def send_message(self, request, pk=None):
        """
        Отправка сообщения в чат.
        
        Args:
            request: Запрос с текстом сообщения
            pk: ID чата
            
        Returns:
            Response: Данные отправленного сообщения или ошибка
        """
        chat = self.get_object()
        
        if request.user not in chat.participants.all():
            return Response(
                {"error": "Вы не являетесь участником этого чата"},
                status=status.HTTP_403_FORBIDDEN
            )
            
        content = request.data.get('content')
        if not content:
            return Response(
                {"error": "Сообщение не может быть пустым"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        message = ChatMessage.objects.create(
            chat=chat,
            sender=request.user,
            content=content
        )
        
        return Response(
            ChatMessageSerializer(message).data,
            status=status.HTTP_201_CREATED
        )

    @action(detail=True)
    def unread_count(self, request, pk=None):
        try:
            chat = Chat.objects.get(
                Q(id=pk) & (
                    Q(participants=request.user) |
                    Q(trip__driver=request.user) |
                    Q(trip__bookings__passenger=request.user)
                )
            )
        except Chat.DoesNotExist:
            return Response({"error": "Чат не найден или у вас нет к нему доступа"}, status=404)

        count = chat.messages.filter(
            is_read=False
        ).exclude(
            sender=request.user
        ).count()
        return Response({'unread_count': count})

    @action(detail=False, methods=['get'])
    def trip_chat(self, request):
        trip_id = request.query_params.get('trip_id')
        if not trip_id:
            return Response({'error': 'trip_id is required'}, status=400)

        try:
            trip = Trip.objects.get(id=trip_id)
            # Проверяем, является ли пользователь водителем или пассажиром
            is_participant = (
                trip.driver == request.user or 
                trip.bookings.filter(passenger=request.user).exists()
            )
            
            if not is_participant:
                return Response({'error': 'Вы не являетесь участником этой поездки'}, status=403)

            # Получаем или создаем чат для поездки
            chat, created = Chat.objects.get_or_create(trip=trip)
            
            # Добавляем участников, если чат только что создан
            if created:
                chat.participants.add(request.user)
                if trip.driver != request.user:
                    chat.participants.add(trip.driver)
                # Добавляем пассажиров с подтвержденными бронированиями
                for booking in trip.bookings.filter(status='confirmed'):
                    chat.participants.add(booking.passenger)

            serializer = self.get_serializer(chat, context={'request': request})
            return Response(serializer.data)

        except Trip.DoesNotExist:
            return Response({'error': 'Поездка не найдена'}, status=404)

from rest_framework import serializers
from .models import User, Trip, Booking, Review, Notification, Message, Complaint, TripReport, Chat, ChatMessage, Package

class UserSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели User.
    
    Преобразует данные пользователя в JSON формат и обратно.
    Включает базовую информацию о пользователе, его рейтинги и настройки профиля.
    """
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'first_name', 'last_name', 
            'phone_number', 'driver_rating', 'passenger_rating', 
            'is_verified', 'is_blocked', 'is_staff', 'block_reason', 'block_until',
            'bio', 'profile_picture', 'email_notifications'
        )
        read_only_fields = ('driver_rating', 'passenger_rating', 'is_verified', 'is_blocked', 'block_reason', 'block_until')
        extra_kwargs = {
            'password': {'write_only': True},
            'email': {'required': True, 'error_messages': {
                'required': 'Пожалуйста, укажите email адрес.',
                'invalid': 'Пожалуйста, укажите корректный email адрес.'
            }},
            'phone_number': {'required': True, 'error_messages': {
                'required': 'Пожалуйста, укажите номер телефона.'
            }}
        }

class ReviewSerializer(serializers.ModelSerializer):
    reviewer = UserSerializer(read_only=True)
    reviewed_user = UserSerializer(read_only=True)

    class Meta:
        model = Review
        fields = '__all__'
        read_only_fields = ('created_at',)

    def validate(self, data):
        if data['reviewer'] == data['reviewed_user']:
            raise serializers.ValidationError("You cannot review yourself")
        return data

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError('Оценка должна быть от 1 до 5.')
        return value

class TripSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Trip.
    
    Преобразует данные поездки в JSON формат и обратно.
    Включает всю информацию о поездке, водителе и связанных бронированиях.
    """
    driver = UserSerializer(read_only=True)
    date = serializers.DateField(format='%Y-%m-%d', required=False)
    time = serializers.TimeField(format='%H:%M', required=False)
    departure_time = serializers.DateTimeField(required=False, write_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    bookings = serializers.SerializerMethodField()

    class Meta:
        model = Trip
        fields = [
            'id', 'driver', 'departure_location', 'destination_location',
            'departure_coords', 'destination_coords', 'date', 'time',
            'departure_time', 'price', 'available_seats', 'description',
            'status', 'created_at', 'updated_at', 'reviews', 'bookings'
        ]
        read_only_fields = ['created_at', 'updated_at']

    def validate(self, data):
        if not data.get('departure_coords'):
            raise serializers.ValidationError('Необходимо указать координаты места отправления')
        if not data.get('destination_coords'):
            raise serializers.ValidationError('Необходимо указать координаты места назначения')

        departure_time = data.pop('departure_time', None)
        if departure_time:
            data['date'] = departure_time.date()
            data['time'] = departure_time.time()
        elif not (data.get('date') and data.get('time')):
            raise serializers.ValidationError('Необходимо указать дату и время отправления')

        return data

    def validate_available_seats(self, value):
        if value < 1:
            raise serializers.ValidationError('Количество мест должно быть больше 0.')
        return value

    def validate_price(self, value):
        if value <= 0:
            raise serializers.ValidationError('Цена должна быть больше 0.')
        return value

    def get_bookings(self, obj):
        """
        Возвращает список бронирований для поездки.
        Фильтрует бронирования в зависимости от роли пользователя.
        """
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return []
            
        if request.user == obj.driver:
            # Водитель видит все бронирования
            bookings = obj.bookings.all()
        else:
            # Пассажир видит только свои бронирования
            bookings = obj.bookings.filter(passenger=request.user)
            
        return BookingSerializer(bookings, many=True).data

class BookingSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Booking.
    
    Преобразует данные бронирования в JSON формат и обратно.
    Включает информацию о пассажире, поездке и статусе бронирования.
    """
    passenger = UserSerializer(read_only=True)
    trip = TripSerializer(read_only=True)

    class Meta:
        model = Booking
        fields = ['id', 'passenger', 'trip', 'seats_booked', 'status',
                  'created_at', 'updated_at', 'total_price', 'payment_note']
        read_only_fields = ('created_at', 'updated_at', 'total_price', 'payment_note')

    def validate_seats_booked(self, value):
        """
        Проверяет корректность количества бронируемых мест.
        
        Args:
            value: Количество мест для бронирования
            
        Returns:
            int: Проверенное количество мест
            
        Raises:
            ValidationError: Если количество мест некорректно
        """
        if value < 1:
            raise serializers.ValidationError('Необходимо забронировать хотя бы одно место.')

        trip = self.context.get('trip')
        if trip and value > trip.available_seats:
            raise serializers.ValidationError(f'Доступно только {trip.available_seats} мест.')

        return value


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'
        read_only_fields = ('created_at',)

class MessageSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Message.
    
    Преобразует данные сообщения в JSON формат и обратно.
    Включает информацию об отправителе и содержании сообщения.
    """
    sender = UserSerializer(read_only=True)
    receiver = UserSerializer(read_only=True)
    trip = TripSerializer(read_only=True)

    class Meta:
        model = Message
        fields = '__all__'
        read_only_fields = ('created_at',)

    def validate(self, data):
        if data['sender'] == data['receiver']:
            raise serializers.ValidationError("You cannot send a message to yourself")
        return data

    def validate_content(self, value):
        if not value.strip():
            raise serializers.ValidationError('Сообщение не может быть пустым.')
        return value

class ComplaintSerializer(serializers.ModelSerializer):
    complainant_username = serializers.CharField(source='complainant.username', read_only=True)
    reported_user_username = serializers.CharField(write_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Complaint
        fields = ['id', 'complainant_username', 'reported_user_username', 'description', 
                 'status', 'status_display', 'created_at', 'resolved_at', 'admin_comment']
        read_only_fields = ['complainant', 'status', 'resolved_at', 'admin_comment']

    def create(self, validated_data):
        reported_username = validated_data.pop('reported_user_username')
        try:
            reported_user = User.objects.get(username=reported_username)
        except User.DoesNotExist:
            raise serializers.ValidationError({'reported_user_username': 'Пользователь не найден'})

        validated_data['reported_user'] = reported_user
        validated_data['complainant'] = self.context['request'].user
        return super().create(validated_data)

class TripReportSerializer(serializers.ModelSerializer):
    class Meta:
        model = TripReport
        fields = [
            'id',
            'report_type',
            'start_date',
            'end_date',
            'total_trips',
            'completed_trips',
            'cancelled_trips',
            'total_earnings',
            'total_passengers',
            'average_rating',
            'popular_routes',
            'created_at',
        ]
        read_only_fields = [
            'total_trips',
            'completed_trips',
            'cancelled_trips',
            'total_earnings',
            'total_passengers',
            'average_rating',
            'popular_routes',
            'created_at',
        ]

    def validate(self, data):
        if data['start_date'] > data['end_date']:
            raise serializers.ValidationError('Дата начала не может быть позже даты окончания.')
        return data

class ChatMessageSerializer(serializers.ModelSerializer):
    sender = UserSerializer(read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_full_name = serializers.SerializerMethodField()

    class Meta:
        model = ChatMessage
        fields = ['id', 'chat', 'sender', 'sender_name', 'sender_full_name', 'content', 'created_at', 'is_read']
        read_only_fields = ['sender', 'is_read']

    def get_sender_name(self, obj):
        return obj.sender.username

    def get_sender_full_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username

class ChatSerializer(serializers.ModelSerializer):
    """
    Сериализатор для модели Chat.
    
    Преобразует данные чата в JSON формат и обратно.
    Включает информацию об участниках чата и связанной поездке.
    """
    participants = UserSerializer(many=True, read_only=True)
    messages = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    participants_info = UserSerializer(source='participants', many=True, read_only=True)
    unread_count = serializers.SerializerMethodField()
    trip_details = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'participants', 'trip', 'messages', 'created_at', 'updated_at', 'last_message', 'unread_count', 'participants_info', 'trip_details']
        read_only_fields = ['created_at', 'updated_at']

    def get_messages(self, obj):
        """
        Возвращает список сообщений в чате.
        Сортирует сообщения по времени создания.
        """
        messages = obj.messages.order_by('created_at')
        return MessageSerializer(messages, many=True).data

    def get_last_message(self, obj):
        last_message = obj.messages.first()
        if last_message:
            return ChatMessageSerializer(last_message, context=self.context).data
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count()

    def get_trip_details(self, obj):
        if obj.trip:
            return {
                'id': obj.trip.id,
                'departure_location': obj.trip.departure_location,
                'destination_location': obj.trip.destination_location,
                'date': obj.trip.date,
                'time': obj.trip.time,
                'driver': {
                    'id': obj.trip.driver.id,
                    'username': obj.trip.driver.username,
                    'full_name': f"{obj.trip.driver.first_name} {obj.trip.driver.last_name}".strip() or obj.trip.driver.username
                }
            }
        return None


class PackageSerializer(serializers.ModelSerializer):
    """Serializer for the Package model."""

    sender = UserSerializer(read_only=True)
    trip = TripSerializer(read_only=True)

    class Meta:
        model = Package
        fields = '__all__'
        read_only_fields = (
            'created_at',
            'updated_at',
            'status',
            'sender',
        )

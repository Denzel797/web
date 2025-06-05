from django.db import models
from django.contrib.auth.models import AbstractUser
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

class User(AbstractUser):
    """
    Расширенная модель пользователя системы.
    
    Добавляет дополнительные поля для профиля пользователя и рейтинга.
    Наследует стандартную модель пользователя Django (AbstractUser).
    """
    phone_number = models.CharField(max_length=15, blank=True, verbose_name='Номер телефона')
    driver_rating = models.FloatField(
        default=5.0,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        verbose_name='Рейтинг водителя'
    )
    passenger_rating = models.FloatField(
        default=5.0,
        validators=[MinValueValidator(1.0), MaxValueValidator(5.0)],
        verbose_name='Рейтинг пассажира'
    )
    is_verified = models.BooleanField(default=False)
    is_blocked = models.BooleanField(default=False)
    block_reason = models.TextField(blank=True)
    block_until = models.DateTimeField(null=True, blank=True)
    bio = models.TextField(blank=True, verbose_name='О себе')
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True, verbose_name='Фото профиля')
    email_notifications = models.BooleanField(default=True)

    def __str__(self):
        return self.username

    def update_rating(self, rating, is_driver=True):
        """
        Обновляет рейтинг пользователя (водителя или пассажира)
        """
        if is_driver:
            self.driver_rating = rating
        else:
            self.passenger_rating = rating
        self.save()
        
    def block_user(self, reason, duration_days=None):
        """
        Блокирует пользователя на указанный срок или бессрочно
        """
        self.is_blocked = True
        self.block_reason = reason
        
        if duration_days:
            self.block_until = timezone.now() + timezone.timedelta(days=duration_days)
            
        self.save()
        
    def unblock_user(self):
        """
        Разблокирует пользователя
        """
        self.is_blocked = False
        self.block_reason = ""
        self.block_until = None
        self.save()
        
    def is_temporarily_blocked(self):
        """
        Проверяет, временно ли заблокирован пользователь
        """
        if not self.is_blocked:
            return False
            
        if not self.block_until:
            return False
            
        return timezone.now() < self.block_until

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('booking', 'Бронирование'),
        ('trip_update', 'Обновление поездки'),
        ('message', 'Сообщение'),
        ('review', 'Отзыв'),
        ('complaint', 'Жалоба'),
        ('payment', 'Оплата'),
    )

    user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='notifications', verbose_name='Пользователь')
    notification_type = models.CharField(max_length=20, choices=NOTIFICATION_TYPES, verbose_name='Тип уведомления')
    title = models.CharField(max_length=255, verbose_name='Заголовок')
    message = models.TextField(verbose_name='Сообщение')
    related_trip = models.ForeignKey('Trip', on_delete=models.CASCADE, null=True, blank=True)
    related_booking = models.ForeignKey('Booking', on_delete=models.CASCADE, null=True, blank=True)
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Уведомление'
        verbose_name_plural = 'Уведомления'

    def __str__(self):
        return f"{self.get_notification_type_display()} для {self.user}"

class Message(models.Model):
    """
    Модель сообщения в чате.
    
    Хранит текст сообщения, автора и время отправки.
    """
    chat = models.ForeignKey('Chat', on_delete=models.CASCADE, related_name='legacy_messages', verbose_name='Чат')
    sender = models.ForeignKey('User', on_delete=models.CASCADE, related_name='sent_messages', verbose_name='Отправитель')
    content = models.TextField(verbose_name='Содержание')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Отправлено')

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Сообщение'
        verbose_name_plural = 'Сообщения'

    def __str__(self):
        """
        Возвращает строковое представление сообщения в формате:
        '{отправитель}: {текст сообщения}'
        """
        return f"{self.sender}: {self.content[:50]}..."

class Trip(models.Model):
    """
    Модель поездки в системе.
    
    Содержит всю информацию о поездке: маршрут, время, цену, статус и т.д.
    Связана с водителем (User) и может иметь множество бронирований (Booking).
    """
    STATUS_CHOICES = (
        ('draft', 'Черновик'),
        ('active', 'Активная'),
        ('completed', 'Завершена'),
        ('cancelled', 'Отменена'),
    )

    driver = models.ForeignKey('User', on_delete=models.CASCADE, related_name='trips', verbose_name='Водитель')
    departure_location = models.CharField(max_length=255, verbose_name='Место отправления')
    destination_location = models.CharField(max_length=255, verbose_name='Место назначения')
    departure_coords = models.CharField(max_length=50, verbose_name='Координаты отправления')
    destination_coords = models.CharField(max_length=50, verbose_name='Координаты назначения')
    date = models.DateField(default=timezone.now, verbose_name='Дата')
    time = models.TimeField(default=timezone.now, verbose_name='Время')
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name='Цена')
    available_seats = models.PositiveIntegerField(verbose_name='Свободные места')
    description = models.TextField(blank=True, verbose_name='Описание')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active', verbose_name='Статус')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')

    class Meta:
        ordering = ['-date', '-time']
        verbose_name = 'Поездка'
        verbose_name_plural = 'Поездки'

    def __str__(self):
        """
        Возвращает строковое представление поездки в формате:
        'Место отправления → Место назначения (Дата)'
        """
        return f"{self.departure_location} → {self.destination_location} ({self.date})"

class Booking(models.Model):
    """
    Модель бронирования поездки.
    
    Связывает пассажира с конкретной поездкой и хранит информацию о бронировании:
    количество мест, статус, стоимость и т.д.
    """
    STATUS_CHOICES = (
        ('pending', 'Ожидает подтверждения'),
        ('confirmed', 'Подтверждено'),
        ('cancelled', 'Отменено'),
        ('completed', 'Завершено'),
        ('paid', 'Оплачено'),
    )

    passenger = models.ForeignKey('User', on_delete=models.CASCADE, related_name='bookings', verbose_name='Пассажир')
    trip = models.ForeignKey('Trip', on_delete=models.CASCADE, related_name='bookings', verbose_name='Поездка')
    seats_booked = models.PositiveIntegerField(default=1, verbose_name='Забронировано мест')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending', verbose_name='Статус')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлено')
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    payment_note = models.TextField(blank=True, verbose_name='Примечание к оплате')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Бронирование'
        verbose_name_plural = 'Бронирования'

    def __str__(self):
        """
        Возвращает строковое представление бронирования в формате:
        'Бронирование {пассажир} на поездку {поездка}'
        """
        return f"Бронирование {self.passenger} на поездку {self.trip}"

    def save(self, *args, **kwargs):
        """
        Переопределенный метод сохранения.
        Автоматически рассчитывает полную стоимость бронирования
        на основе цены поездки и количества забронированных мест.
        """
        if not self.total_price:
            self.total_price = self.trip.price * self.seats_booked
        super().save(*args, **kwargs)

class Review(models.Model):
    reviewer = models.ForeignKey('User', on_delete=models.CASCADE, related_name='reviews_given', verbose_name='Автор отзыва')
    reviewed_user = models.ForeignKey('User', on_delete=models.CASCADE, related_name='reviews_received', verbose_name='Получатель отзыва')
    trip = models.ForeignKey('Trip', on_delete=models.CASCADE, related_name='reviews', verbose_name='Поездка')
    rating = models.PositiveSmallIntegerField(choices=[(i, str(i)) for i in range(1, 6)], verbose_name='Оценка')
    comment = models.TextField(verbose_name='Комментарий')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Отзыв'
        verbose_name_plural = 'Отзывы'

    def __str__(self):
        return f"Отзыв от {self.reviewer} для {self.reviewed_user}"

class Complaint(models.Model):
    PENDING = 'pending'
    RESOLVED = 'resolved'
    REJECTED = 'rejected'

    STATUS_CHOICES = [
        (PENDING, 'На рассмотрении'),
        (RESOLVED, 'Рассмотрено'),
        (REJECTED, 'Отклонено'),
    ]

    complainant = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='filed_complaints',
        verbose_name='Заявитель'
    )
    reported_user = models.ForeignKey(
        'User',
        on_delete=models.CASCADE,
        related_name='complaints_against',
        verbose_name='Жалоба на пользователя'
    )
    description = models.TextField(verbose_name='Описание жалобы')
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
        verbose_name='Статус'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Дата создания')
    resolved_at = models.DateTimeField(null=True, blank=True, verbose_name='Дата рассмотрения')
    admin_comment = models.TextField(null=True, blank=True, verbose_name='Комментарий администратора')

    class Meta:
        verbose_name = 'Жалоба'
        verbose_name_plural = 'Жалобы'
        ordering = ['-created_at']

    def __str__(self):
        return f'Жалоба от {self.complainant.username} на {self.reported_user.username}'

class TripReport(models.Model):
    REPORT_TYPES = (
        ('user', 'Отчет пользователя'),
        ('trip', 'Отчет по поездкам'),
        ('financial', 'Финансовый отчет'),
    )

    report_type = models.CharField(max_length=20, choices=REPORT_TYPES, verbose_name='Тип отчета')
    user = models.ForeignKey('User', on_delete=models.CASCADE, null=True, blank=True, related_name='reports', verbose_name='Пользователь')
    start_date = models.DateField(verbose_name='Дата начала')
    end_date = models.DateField(verbose_name='Дата окончания')
    total_trips = models.IntegerField(default=0, verbose_name='Всего поездок')
    completed_trips = models.IntegerField(default=0, verbose_name='Завершенных поездок')
    cancelled_trips = models.IntegerField(default=0, verbose_name='Отмененных поездок')
    total_earnings = models.DecimalField(max_digits=10, decimal_places=2, default=0, verbose_name='Общий доход')
    total_passengers = models.IntegerField(default=0, verbose_name='Всего пассажиров')
    average_rating = models.DecimalField(max_digits=3, decimal_places=2, default=0, verbose_name='Средний рейтинг')
    popular_routes = models.JSONField(default=dict, verbose_name='Популярные маршруты')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создано')

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Отчет'
        verbose_name_plural = 'Отчеты'

    def __str__(self):
        return f"{self.get_report_type_display()} ({self.start_date} - {self.end_date})"

    def generate_report(self):
        """
        Генерирует отчет на основе типа и параметров
        """
        from django.db.models import Count, Avg, Sum
        from django.db.models.functions import Concat
        from django.db.models import Value
        
        # Базовый queryset для поездок
        trips = Trip.objects.filter(
            date__range=[self.start_date, self.end_date]
        )
        
        # Если отчет для конкретного пользователя
        if self.user:
            if self.report_type == 'user':
                # Поездки как водитель
                trips = trips.filter(driver=self.user)
                bookings = Booking.objects.filter(
                    passenger=self.user,
                    trip__date__range=[self.start_date, self.end_date]
                )
            
        # Подсчет статистики
        stats = trips.aggregate(
            total=Count('id'),
            completed=Count('id', filter=models.Q(status='completed')),
            cancelled=Count('id', filter=models.Q(status='cancelled')),
            earnings=Sum('price'),
            avg_price=Avg('price'),
            avg_rating=Avg('driver__driver_rating')
        )
        
        # Обновление полей отчета
        self.total_trips = stats['total']
        self.completed_trips = stats['completed']
        self.cancelled_trips = stats['cancelled']
        self.total_earnings = stats['earnings'] or 0
        self.average_trip_price = stats['avg_price'] or 0
        self.average_rating = stats['avg_rating'] or 0
        
        # Подсчет уникальных пассажиров
        self.total_passengers = Booking.objects.filter(
            trip__in=trips
        ).values('passenger').distinct().count()
        
        # Популярные маршруты
        popular_routes = trips.values(
            route=Concat(
                'departure_location',
                Value(' → '),
                'destination_location'
            )
        ).annotate(
            count=Count('id')
        ).order_by('-count')[:5]
        
        self.popular_routes = {
            route['route']: route['count']
            for route in popular_routes
        }
        
        self.save()

class Chat(models.Model):
    """
    Модель чата для общения между участниками поездки.
    
    Связывает поездку с участниками чата и хранит историю сообщений.
    """
    trip = models.ForeignKey('Trip', on_delete=models.CASCADE, related_name='chats', verbose_name='Поездка')
    participants = models.ManyToManyField('User', related_name='chats', verbose_name='Участники')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Создан')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Обновлен')

    class Meta:
        verbose_name = 'Чат'
        verbose_name_plural = 'Чаты'

    def __str__(self):
        """
        Возвращает строковое представление чата в формате:
        'Чат поездки {поездка}'
        """
        return f"Чат поездки {self.trip}"

class ChatMessage(models.Model):
    chat = models.ForeignKey('Chat', on_delete=models.CASCADE, related_name='messages', verbose_name='Чат')
    sender = models.ForeignKey('User', on_delete=models.CASCADE, related_name='chat_messages', verbose_name='Отправитель')
    content = models.TextField(verbose_name='Содержание')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Отправлено')
    is_read = models.BooleanField(default=False, verbose_name='Прочитано')

    class Meta:
        ordering = ['created_at']
        verbose_name = 'Сообщение чата'
        verbose_name_plural = 'Сообщения чата'

    def __str__(self):
        return f"Сообщение от {self.sender.username} в чате {self.chat.id}"
class Package(models.Model):
    """Посылка, передаваемая между пользователями."""

    PENDING = "pending"
    ASSIGNED = "assigned"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

    STATUS_CHOICES = [
        (PENDING, "В поиске водителя"),
        (ASSIGNED, "В пути"),
        (DELIVERED, "Доставлено"),
        (CANCELLED, "Отменено"),
    ]

    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="sent_packages",
        verbose_name="Отправитель",
    )
    trip = models.ForeignKey(
        "Trip",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="packages",
        verbose_name="Поездка",
    )
    recipient_name = models.CharField(max_length=100, verbose_name="Получатель")
    origin = models.CharField(max_length=100, verbose_name="Откуда")
    destination = models.CharField(max_length=100, verbose_name="Куда")
    weight_kg = models.DecimalField(
        max_digits=5, decimal_places=2, verbose_name="Вес (кг)"
    )
    description = models.TextField(blank=True, verbose_name="Описание")
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="Цена",
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING,
        verbose_name="Статус",
    )
    date = models.DateField(verbose_name="Дата отправки")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Создано")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Обновлено")

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Посылка"
        verbose_name_plural = "Посылки"

    def __str__(self):
        return f"Посылка от {self.sender} для {self.recipient_name}" \
            f" ({self.get_status_display()})"

    def assign_to_trip(self, trip: "Trip") -> None:
        """Связывает посылку с поездкой и переводит ее в статус 'в пути'."""
        self.trip = trip
        self.status = self.ASSIGNED
        self.save()

    def mark_delivered(self) -> None:
        """Помечает посылку доставленной."""
        self.status = self.DELIVERED
        self.save()

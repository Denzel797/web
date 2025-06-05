from django.contrib import admin
from .models import User, Trip, Booking, Review, Notification, ChatMessage, Complaint, TripReport, Chat
from django.utils import timezone

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_verified', 'is_blocked')
    list_filter = ('is_verified', 'is_blocked', 'is_staff')
    search_fields = ('username', 'email', 'first_name', 'last_name')

@admin.register(Trip)
class TripAdmin(admin.ModelAdmin):
    list_display = ('departure_location', 'destination_location', 'date', 'time', 'driver', 'status', 'price', 'available_seats')
    list_filter = ('status', 'date', 'departure_location', 'destination_location')
    search_fields = ('departure_location', 'destination_location', 'driver__username', 'description')
    date_hierarchy = 'date'
    ordering = ('-date', '-time')

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display = ('passenger', 'trip', 'seats_booked', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('passenger__username', 'trip__departure_city', 'trip__destination_city')
    date_hierarchy = 'created_at'

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('reviewer', 'reviewed_user', 'trip', 'rating', 'created_at')
    list_filter = ('rating', 'created_at')
    search_fields = ('reviewer__username', 'reviewed_user__username', 'comment')
    date_hierarchy = 'created_at'

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'notification_type', 'title', 'is_read', 'created_at')
    list_filter = ('notification_type', 'is_read', 'created_at')
    search_fields = ('user__username', 'title', 'message')
    date_hierarchy = 'created_at'

@admin.register(Complaint)
class ComplaintAdmin(admin.ModelAdmin):
    list_display = ['id', 'complainant', 'reported_user', 'status', 'created_at', 'resolved_at']
    list_filter = ['status', 'created_at', 'resolved_at']
    search_fields = ['complainant__username', 'reported_user__username', 'description']
    readonly_fields = ['complainant', 'reported_user', 'created_at']
    list_per_page = 20

    def save_model(self, request, obj, form, change):
        if 'status' in form.changed_data and obj.status in ['resolved', 'rejected']:
            obj.resolved_at = timezone.now()
        super().save_model(request, obj, form, change)

@admin.register(TripReport)
class TripReportAdmin(admin.ModelAdmin):
    list_display = ('report_type', 'user', 'start_date', 'end_date', 'total_trips', 'total_earnings')
    list_filter = ('report_type', 'created_at')
    search_fields = ('user__username',)
    date_hierarchy = 'created_at'

@admin.register(Chat)
class ChatAdmin(admin.ModelAdmin):
    list_display = ('id', 'trip', 'created_at', 'updated_at')
    list_filter = ('created_at',)
    search_fields = ('trip__departure_city', 'trip__destination_city')
    date_hierarchy = 'created_at'

@admin.register(ChatMessage)
class ChatMessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'chat', 'content', 'is_read', 'created_at')
    list_filter = ('is_read', 'created_at')
    search_fields = ('sender__username', 'content')
    date_hierarchy = 'created_at'
    raw_id_fields = ('sender', 'chat')


admin.site.site_header = 'Администрирование RideShare'
admin.site.site_title = 'RideShare'
admin.site.index_title = 'Управление приложением'

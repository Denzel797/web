from django_filters import rest_framework as filters
from .models import Trip, Booking, Review

class TripFilter(filters.FilterSet):
    departure_city = filters.CharFilter(field_name='departure_city', lookup_expr='icontains')
    destination_city = filters.CharFilter(field_name='destination_city', lookup_expr='icontains')
    min_date = filters.DateFilter(field_name='date', lookup_expr='gte')
    max_date = filters.DateFilter(field_name='date', lookup_expr='lte')
    min_price = filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='price', lookup_expr='lte')
    min_seats = filters.NumberFilter(field_name='available_seats', lookup_expr='gte')
    min_driver_rating = filters.NumberFilter(field_name='driver__rating', lookup_expr='gte')
    status = filters.ChoiceFilter(choices=Trip.STATUS_CHOICES)

    class Meta:
        model = Trip
        fields = ['departure_city', 'destination_city', 'min_date', 'max_date', 
                 'min_price', 'max_price', 'min_seats', 'min_driver_rating', 'status']

class BookingFilter(filters.FilterSet):
    min_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    max_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    min_price = filters.NumberFilter(field_name='total_price', lookup_expr='gte')
    max_price = filters.NumberFilter(field_name='total_price', lookup_expr='lte')

    class Meta:
        model = Booking
        fields = ['status', 'passenger', 'trip']

class ReviewFilter(filters.FilterSet):
    min_rating = filters.NumberFilter(field_name='rating', lookup_expr='gte')
    max_rating = filters.NumberFilter(field_name='rating', lookup_expr='lte')
    min_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    max_date = filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')

    class Meta:
        model = Review
        fields = ['reviewer', 'reviewed_user', 'trip'] 
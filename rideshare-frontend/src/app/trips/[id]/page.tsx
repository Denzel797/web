'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Badge, Card, Avatar, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { message } from 'antd';

interface Trip {
  id: string;
  departure_location: string;
  destination_location: string;
  departure_coords: string;
  destination_coords: string;
  date: string;
  time: string;
  price: number;
  available_seats: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  description?: string;
  route_distance?: string;
  route_duration?: string;
  driver: {
    username: string;
    first_name?: string;
    last_name?: string;
    profile_picture?: string;
    driver_rating: number;
  };
  bookings?: {
    id: string;
    status: string;
    seats_booked: number;
    passenger: {
      id: string;
      username: string;
    };
  }[];
}

// Dynamically import the Map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div className="w-full h-[400px] bg-gray-100 rounded-lg animate-pulse" />
});

export default function TripDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const resolvedParams = use(params);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`http://localhost:8000/api/trips/${resolvedParams.id}/`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch trip details');
        }

        const data = await response.json();
        setTrip(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [resolvedParams.id, router]);

  const handleCancelBooking = async () => {
    try {
      setCancelling(true);
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Find the user's booking for this trip
      const userBooking = trip?.bookings?.find(booking => 
        booking.passenger.username === localStorage.getItem('username')
      );

      if (!userBooking) {
        throw new Error('Booking not found');
      }

      const response = await fetch(`http://localhost:8000/api/bookings/${userBooking.id}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to cancel booking');
      }

      // Refresh trip details
      const updatedTrip = await fetch(`http://localhost:8000/api/trips/${resolvedParams.id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(res => res.json());

      setTrip(updatedTrip);
      message.success('Бронирование успешно отменено');
    } catch (err) {
      message.error(err instanceof Error ? err.message : 'Ошибка при отмене бронирования');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-gray-500">Trip not found</div>
      </div>
    );
  }

  const formattedDate = format(new Date(trip.date), 'd MMMM yyyy', { locale: ru });
  const statusColor = {
    draft: 'default',
    active: 'processing',
    completed: 'success',
    cancelled: 'error'
  }[trip.status];

  const statusLabel = {
    draft: 'Черновик',
    active: 'Активная',
    completed: 'Завершена',
    cancelled: 'Отменена'
  }[trip.status];

  const departureCoords = trip.departure_coords?.split(',').map(Number) as [number, number];
  const destinationCoords = trip.destination_coords?.split(',').map(Number) as [number, number];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Детали поездки</h1>
        <Badge status={statusColor as any} text={statusLabel} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {/* Route Information */}
          <Card title="Маршрут" className="shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span>{trip.departure_location}</span>
              </div>
              <div className="ml-1 h-4 w-0.5 bg-gray-300" />
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span>{trip.destination_location}</span>
              </div>
            </div>
          </Card>

          {/* Driver Information */}
          <Card title="Водитель" className="shadow-sm">
            <div className="flex items-center space-x-4">
              <Avatar
                size={64}
                icon={<UserOutlined />}
                src={trip.driver.profile_picture}
              />
              <div>
                <h3 className="text-lg font-medium">
                  {trip.driver.first_name && trip.driver.last_name
                    ? `${trip.driver.first_name} ${trip.driver.last_name}`
                    : trip.driver.username}
                </h3>
                <div className="flex items-center space-x-1">
                  <span className="text-yellow-500">★</span>
                  <span>{trip.driver.driver_rating.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </Card>

          {/* Trip Details */}
          <Card title="Детали поездки" className="shadow-sm">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">Дата</span>
                <span>{formattedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Время</span>
                <span>{trip.time.slice(0, 5)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Цена</span>
                <span className="font-medium">{trip.price} ₽</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Свободных мест</span>
                <span>{trip.available_seats}</span>
              </div>
              {trip.route_distance && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Расстояние</span>
                  <span>{trip.route_distance}</span>
                </div>
              )}
              {trip.route_duration && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Время в пути</span>
                  <span>{trip.route_duration}</span>
                </div>
              )}
            </div>
          </Card>

          {trip.description && (
            <Card title="Описание" className="shadow-sm">
              <p className="text-gray-700">{trip.description}</p>
            </Card>
          )}

          {/* Booking Information */}
          {trip.bookings?.some(booking => booking.passenger.username === localStorage.getItem('username')) && (
            <Card title="Ваше бронирование" className="shadow-sm">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Статус</span>
                  <Badge status="processing" text="Подтверждено" />
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Забронировано мест</span>
                  <span>{trip.bookings.find(booking => 
                    booking.passenger.username === localStorage.getItem('username')
                  )?.seats_booked}</span>
                </div>
                <Button
                  type="primary"
                  danger
                  onClick={handleCancelBooking}
                  loading={cancelling}
                  block
                >
                  Отменить бронирование
                </Button>
              </div>
            </Card>
          )}
        </div>

        {/* Map */}
        <div className="h-[600px] rounded-lg overflow-hidden shadow-sm">
          <MapComponent
            departureCoords={departureCoords}
            destinationCoords={destinationCoords}
            onMapClick={() => {}}
            onMarkerDrag={() => {}}
          />
        </div>
      </div>
    </div>
  );
} 
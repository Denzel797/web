'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Spin, Card, Tabs, Button, Badge, Empty, Space, message } from 'antd';
import { PlusOutlined, ArrowRightOutlined } from '@ant-design/icons';

interface Trip {
  id: number;
  driver: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  departure_location: string;
  destination_location: string;
  departure_coords: string;
  destination_coords: string;
  date: string;
  time: string;
  price: number;
  available_seats: number;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export default function TripsPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'driver' | 'passenger'>('driver');

  useEffect(() => {
    fetchTrips();
  }, [activeTab]);

  const fetchTrips = async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem('access_token');

    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trips/${activeTab === 'driver' ? 'driver_trips' : 'passenger_trips'}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('access_token');
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch trips');
      }

      const data = await response.json();
      setTrips(data.results || data);
    } catch (err) {
      setError('Ошибка при загрузке поездок');
      console.error('Error fetching trips:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadgeColor = (status: Trip['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleCompleteTrip = async (tripId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trips/${tripId}/complete/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        message.error(data.error || 'Не удалось завершить поездку');
        return;
      }

      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === tripId 
            ? { ...trip, status: 'completed' } 
            : trip
        )
      );

      message.success('Поездка успешно завершена');
    } catch (error) {
      console.error('Error completing trip:', error);
      message.error('Произошла ошибка при завершении поездки');
    }
  };

  const handleCancelTrip = async (tripId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/trips/${tripId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        message.error(data.error || 'Не удалось отменить поездку');
        return;
      }

      setTrips(prevTrips => 
        prevTrips.map(trip => 
          trip.id === tripId 
            ? { ...trip, status: 'cancelled' } 
            : trip
        )
      );

      message.success('Поездка успешно отменена');
    } catch (error) {
      console.error('Error canceling trip:', error);
      message.error('Произошла ошибка при отмене поездки');
    }
  };

  const getStatusBadgeType = (status: string): "success" | "error" | "default" | "processing" | "warning" => {
    const statusMap: { [key: string]: "success" | "error" | "default" | "processing" | "warning" } = {
      'active': 'processing',
      'completed': 'success',
      'cancelled': 'error',
      'draft': 'default'
    };
    return statusMap[status] || 'default';
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'active': 'Активная',
      'completed': 'Завершена',
      'cancelled': 'Отменена',
      'draft': 'Черновик'
    };
    return statusMap[status] || status;
  };

  const renderTripActions = (trip: Trip) => {
    if (trip.status === 'active') {
      return (
        <Space onClick={(e) => e.stopPropagation()}>
          <Button type="primary" onClick={() => handleCompleteTrip(trip.id)}>
            Завершить
          </Button>
          <Button danger onClick={() => handleCancelTrip(trip.id)}>
            Отменить
          </Button>
        </Space>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card className="w-full max-w-2xl">
          <div className="text-red-500 text-center">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <Card
          title={
            <div className="flex justify-between items-center">
              <span className="text-xl">Мои поездки</span>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => router.push('/trips/create')}
              >
                Создать поездку
              </Button>
            </div>
          }
          className="shadow-lg"
        >
          <Tabs
            activeKey={activeTab}
            onChange={(key) => setActiveTab(key as 'driver' | 'passenger')}
            items={[
              {
                key: 'driver',
                label: 'Я водитель',
                children: (
                  <div className="space-y-4">
                    {trips.length === 0 ? (
                      <Empty
                        description="Поездок не найдено"
                        className="my-8"
                      />
                    ) : (
                      trips.map((trip) => (
                        <Card
                          key={trip.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-medium">
                                  {trip.departure_location}
                                </span>
                                <ArrowRightOutlined className="text-gray-400" />
                                <span className="text-lg font-medium">
                                  {trip.destination_location}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                <div>
                                  Водитель: {trip.driver.first_name} {trip.driver.last_name}
                                </div>
                                <div>Дата: {formatDate(trip.date)}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                status={getStatusBadgeType(trip.status)}
                                text={getStatusText(trip.status)}
                              />
                              <div className="text-lg font-semibold">
                                {trip.price} ₽
                              </div>
                              <div className="text-sm text-gray-500">
                                {trip.available_seats} мест свободно
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2" onClick={(e) => e.stopPropagation()}>
                              {renderTripActions(trip)}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                ),
              },
              {
                key: 'passenger',
                label: 'Я пассажир',
                children: (
                  <div className="space-y-4">
                    {trips.length === 0 ? (
                      <Empty
                        description="Поездок не найдено"
                        className="my-8"
                      />
                    ) : (
                      trips.map((trip) => (
                        <Card
                          key={trip.id}
                          className="hover:shadow-md transition-shadow cursor-pointer"
                          onClick={() => router.push(`/trips/${trip.id}`)}
                        >
                          <div className="flex flex-col sm:flex-row justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-lg font-medium">
                                  {trip.departure_location}
                                </span>
                                <ArrowRightOutlined className="text-gray-400" />
                                <span className="text-lg font-medium">
                                  {trip.destination_location}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                <div>
                                  Водитель: {trip.driver.first_name} {trip.driver.last_name}
                                </div>
                                <div>Дата: {formatDate(trip.date)}</div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                status={getStatusBadgeType(trip.status)}
                                text={getStatusText(trip.status)}
                              />
                              <div className="text-lg font-semibold">
                                {trip.price} ₽
                              </div>
                              <div className="text-sm text-gray-500">
                                {trip.available_seats} мест свободно
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                ),
              },
            ]}
          />
        </Card>
      </div>
    </div>
  );
} 
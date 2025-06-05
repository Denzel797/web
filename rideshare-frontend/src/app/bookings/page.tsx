'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Card, List, Button, message, Tabs, Tag, Empty, Space, Badge } from 'antd';
import { useRouter } from 'next/navigation';
import { Booking, Trip } from '@/types/trip';
import { MessageOutlined } from '@ant-design/icons';

/**
 * BookingsPage компонент для отображения и управления бронированиями пользователя.
 * Позволяет просматривать бронирования как в роли пассажира, так и в роли водителя.
 * Предоставляет функционал для подтверждения, отклонения и отмены бронирований.
 */
const BookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const router = useRouter();

  /**
   * Загружает список бронирований в зависимости от роли пользователя
   * @param role - Роль пользователя ('passenger' или 'driver')
   */
  const fetchBookings = useCallback(async (role: 'passenger' | 'driver') => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      setLoading(true);
      const response = await fetch(`http://localhost:8000/api/bookings/?role=${role}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log(`${role} bookings data:`, data);
        const bookingsData = data.results || data;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
      } else {
        throw new Error('Failed to fetch bookings');
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, [router]);

  /**
   * Обработчик смены вкладки между ролями пассажира и водителя
   * @param key - Ключ активной вкладки ('1' для пассажира, '2' для водителя)
   */
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    fetchBookings(key === '1' ? 'passenger' : 'driver');
  };

  useEffect(() => {
    // Загружаем данные для начальной вкладки
    fetchBookings('passenger');
  }, [fetchBookings]);

  /**
   * Подтверждает бронирование (доступно только для водителя)
   * @param bookingId - ID бронирования для подтверждения
   */
  const handleAcceptBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Accepting booking:', bookingId);

      const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/accept/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Accept booking response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to accept booking');
      }

      message.success('Бронирование подтверждено');
      fetchBookings('driver');
    } catch (error) {
      console.error('Error accepting booking:', error);
      message.error('Ошибка при подтверждении бронирования');
    }
  };

  /**
   * Отклоняет бронирование (доступно только для водителя)
   * @param bookingId - ID бронирования для отклонения
   */
  const handleRejectBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      console.log('Rejecting booking:', bookingId);

      const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/reject/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('Reject booking response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject booking');
      }

      message.success('Бронирование отклонено');
      fetchBookings('driver');
    } catch (error) {
      console.error('Error rejecting booking:', error);
      message.error('Ошибка при отклонении бронирования');
    }
  };

  /**
   * Отменяет бронирование (доступно для пассажира)
   * @param bookingId - ID бронирования для отмены
   */
  const handleCancelBooking = async (bookingId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/bookings/${bookingId}/cancel/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        message.success('Бронирование успешно отменено');
        fetchBookings('passenger');
      } else {
        const errorData = await response.json();
        message.error(errorData.error || 'Ошибка при отмене бронирования');
      }
    } catch (error) {
      message.error('Ошибка при отмене бронирования');
    }
  };

  /**
   * Открывает чат для обсуждения поездки
   * @param tripId - ID поездки для открытия чата
   */
  const handleOpenChat = async (tripId: number) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chats/trip_chat/?trip_id=${tripId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get chat');
      }

      const data = await response.json();
      router.push(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error opening chat:', error);
      message.error('Не удалось открыть чат');
    }
  };

  /**
   * Форматирует дату в локальный формат
   * @param dateStr - Строка с датой
   * @returns Отформатированная дата в формате локали ru-RU
   */
  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('ru-RU');
    } catch (error) {
      return dateStr;
    }
  };

  /**
   * Форматирует время, оставляя только часы и минуты
   * @param timeStr - Строка со временем в формате HH:MM:SS
   * @returns Отформатированное время в формате HH:MM
   */
  const formatTime = (timeStr: string) => {
    try {
      // Если время приходит в формате "HH:MM:SS", оставляем только часы и минуты
      return timeStr.split(':').slice(0, 2).join(':');
    } catch (error) {
      return timeStr;
    }
  };

  /**
   * Возвращает цвет для статуса бронирования
   * @param status - Статус бронирования
   * @returns Строка с названием цвета для компонента Tag
   */
  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'orange';
      case 'confirmed':
        return 'green';
      case 'cancelled':
        return 'red';
      case 'completed':
        return 'blue';
      default:
        return 'default';
    }
  };

  /**
   * Возвращает текстовое описание статуса на русском языке
   * @param status - Статус бронирования
   * @returns Локализованный текст статуса
   */
  const getStatusText = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'Ожидает подтверждения';
      case 'confirmed':
        return 'Подтверждено';
      case 'cancelled':
        return 'Отменено';
      case 'completed':
        return 'Завершено';
      default:
        return status;
    }
  };

  /**
   * Возвращает тип бейджа для статуса
   * @param status - Статус бронирования
   * @returns Тип бейджа для компонента Badge
   */
  const getStatusBadgeType = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'pending':
        return 'default';
      case 'confirmed':
        return 'success';
      case 'cancelled':
        return 'error';
      case 'completed':
        return 'success';
      default:
        return 'default';
    }
  };

  /**
   * Рендерит карточку отдельного бронирования
   * @param booking - Объект бронирования
   * @returns Компонент карточки бронирования
   */
  const renderBookingCard = (booking: Booking) => (
    <List.Item>
      <Card className="w-full">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">
              Поездка: {booking.trip?.departure_location || 'Не указано'} → {booking.trip?.destination_location || 'Не указано'}
            </h3>
            <p>Дата: {formatDate(booking.trip?.date || '')}</p>
            <p>Время: {formatTime(booking.trip?.time || '')}</p>
            <p>Мест: {booking.seats_booked}</p>
            <p>Цена: {booking.total_price} ₽</p>
            {activeTab === '1' ? (
              <p>Водитель: {booking.trip?.driver?.username || 'Неизвестно'}</p>
            ) : (
              <p>Пассажир: {booking.passenger?.username || 'Неизвестно'}</p>
            )}
            <Tag color={getStatusColor(booking.status)}>
              {getStatusText(booking.status)}
            </Tag>
          </div>
          <div className="flex gap-2">
            {booking.status.toLowerCase() === 'pending' && (
              activeTab === '1' ? (
                <Button danger onClick={() => handleCancelBooking(booking.id)}>
                  Отменить
                </Button>
              ) : (
                <>
                  <Button
                    type="primary"
                    onClick={() => handleAcceptBooking(booking.id)}
                    style={{ backgroundColor: '#52c41a' }}
                  >
                    Подтвердить
                  </Button>
                  <Button
                    danger
                    onClick={() => handleRejectBooking(booking.id)}
                  >
                    Отклонить
                  </Button>
                </>
              )
            )}
            <Button onClick={() => router.push(`/trips/${booking.trip.id}`)}>
              Посмотреть поездку
            </Button>
            {booking.status !== 'cancelled' && (
              <Button
                type="primary"
                icon={<MessageOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenChat(booking.trip.id);
                }}
              >
                Чат
              </Button>
            )}
          </div>
        </div>
      </Card>
    </List.Item>
  );

  const items = [
    {
      key: '1',
      label: 'Я пассажир',
      children: (
        <List
          loading={loading}
          dataSource={bookings}
          locale={{ emptyText: <Empty description="Нет бронирований" /> }}
          renderItem={renderBookingCard}
        />
      ),
    },
    {
      key: '2',
      label: 'Я водитель',
      children: (
        <List
          loading={loading}
          dataSource={bookings}
          locale={{ emptyText: <Empty description="Нет бронирований" /> }}
          renderItem={renderBookingCard}
        />
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-black">Мои бронирования</h1>
      <Tabs activeKey={activeTab} onChange={handleTabChange} items={items} />
    </div>
  );
};

export default BookingsPage; 
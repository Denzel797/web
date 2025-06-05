import React from 'react';
import { Card, Avatar, Badge, Button, Tooltip } from 'antd';
import { UserOutlined, ClockCircleOutlined, DollarOutlined, TeamOutlined, CarOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface Driver {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  driver_rating: number;
  profile_picture?: string;
}

interface Trip {
  id: number;
  driver: Driver;
  departure_location: string;
  destination_location: string;
  date: string;
  time: string;
  price: number;
  available_seats: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  route_distance?: string;
  route_duration?: string;
}

interface TripCardProps {
  trip: Trip;
  onBookClick?: (tripId: number) => void;
  onViewDetails?: (tripId: number) => void;
}

const statusColors = {
  draft: 'default',
  active: 'processing',
  completed: 'success',
  cancelled: 'error',
};

const statusLabels = {
  draft: 'Черновик',
  active: 'Активная',
  completed: 'Завершена',
  cancelled: 'Отменена',
};

export const TripCard: React.FC<TripCardProps> = ({ trip, onBookClick, onViewDetails }) => {
  const formattedDate = format(new Date(trip.date), 'd MMMM yyyy', { locale: ru });
  const formattedTime = trip.time.slice(0, 5); // Обрезаем до HH:mm

  const driverName = trip.driver.first_name && trip.driver.last_name
    ? `${trip.driver.first_name} ${trip.driver.last_name}`
    : trip.driver.username;

  return (
    <Card
      hoverable
      className="mb-4 shadow-sm hover:shadow-md transition-shadow"
      actions={[
        <Button 
          type="primary" 
          onClick={() => onBookClick?.(trip.id)}
          disabled={trip.status !== 'active' || trip.available_seats === 0}
        >
          Забронировать
        </Button>,
        <Button 
          type="link" 
          onClick={() => onViewDetails?.(trip.id)}
        >
          Подробнее
        </Button>
      ]}
    >
      <div className="flex flex-col space-y-4">
        {/* Статус поездки */}
        <div className="flex justify-between items-center">
          <Badge 
            status={statusColors[trip.status] as any} 
            text={statusLabels[trip.status]} 
          />
          <span className="text-lg font-semibold text-primary">
            {trip.price} ₽
          </span>
        </div>

        {/* Маршрут */}
        <div className="flex flex-col space-y-2">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-base">{trip.departure_location}</span>
          </div>
          <div className="ml-1 h-4 w-0.5 bg-gray-300" />
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-base">{trip.destination_location}</span>
          </div>
        </div>

        {/* Информация о поездке */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div className="flex items-center space-x-1">
            <ClockCircleOutlined />
            <span>{formattedDate} в {formattedTime}</span>
          </div>
          <div className="flex items-center space-x-1">
            <TeamOutlined />
            <span>{trip.available_seats} мест</span>
          </div>
        </div>

        {/* Дополнительная информация */}
        {(trip.route_distance || trip.route_duration) && (
          <div className="flex space-x-4 text-sm text-gray-600">
            {trip.route_distance && (
              <Tooltip title="Расстояние">
                <span className="flex items-center space-x-1">
                  <CarOutlined />
                  <span>{trip.route_distance}</span>
                </span>
              </Tooltip>
            )}
            {trip.route_duration && (
              <Tooltip title="Время в пути">
                <span className="flex items-center space-x-1">
                  <ClockCircleOutlined />
                  <span>{trip.route_duration}</span>
                </span>
              </Tooltip>
            )}
          </div>
        )}

        {/* Информация о водителе */}
        <div className="flex items-center space-x-2 mt-2">
          <Avatar 
            src={trip.driver.profile_picture} 
            icon={<UserOutlined />} 
            size="small"
          />
          <div className="flex flex-col">
            <span className="text-sm font-medium">{driverName}</span>
            <div className="flex items-center space-x-1">
              <span className="text-xs text-yellow-500">★</span>
              <span className="text-xs text-gray-600">{trip.driver.driver_rating.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TripCard; 
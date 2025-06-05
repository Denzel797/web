'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Form, Input, DatePicker, InputNumber, Select, Button, Space, List, Tag, Divider, Spin, message } from 'antd';
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import Map from '@/components/Map';
import BookingModal from '@/components/BookingModal';
import { Trip } from '@/types/trip';

// Default coordinates for Moscow center
const DEFAULT_COORDS: [number, number] = [55.7558, 37.6173];

interface Filters {
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
  seats: string;
  departure: string;
  destination: string;
}

const AllTripsPage = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    departure: '',
    destination: '',
    date_from: null,
    date_to: null,
    price_min: null,
    price_max: null,
    seats: null
  });
  const [sortField, setSortField] = useState('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const fetchTrips = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const params = new URLSearchParams();
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.priceMin) params.append('price_min', filters.priceMin);
      if (filters.priceMax) params.append('price_max', filters.priceMax);
      if (filters.seats) params.append('seats', filters.seats);
      if (filters.departure) params.append('departure', filters.departure);
      if (filters.destination) params.append('destination', filters.destination);

      const response = await fetch(`http://localhost:8000/api/trips/?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch trips');
      }

      const data = await response.json();
      console.log('Received data:', data); // Debug log

      // Handle paginated response
      if (data.results) {
        setTrips(data.results);
      } else {
        setTrips(data);
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching trips:', err); // Debug log
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [filters, sortField, sortOrder]);

  const handleFilterChange = (newFilters: Partial<Filters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setLoading(true);
    fetchTrips();
  };

  const handleSortChange = (value: string) => {
    if (value === sortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(value);
      setSortOrder('asc');
    }
  };

  const handleBookingSuccess = () => {
    setIsBookingModalOpen(false);
    setSelectedTrip(null);
    fetchTrips(); // Refresh the trips list
    message.success('Trip booked successfully!');
  };

  const renderTripCard = (trip: Trip) => {
    // Safely parse coordinates with validation
    const parseCoords = (coordsStr: string): [number, number] | null => {
      try {
        const [lat, lng] = coordsStr.split(',').map(Number);
        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates format:', coordsStr);
          return null;
        }
        return [lat, lng];
      } catch (error) {
        console.error('Error parsing coordinates:', error);
        return null;
      }
    };

    const departureCoords = parseCoords(trip.departure_coords) || DEFAULT_COORDS;
    const destinationCoords = parseCoords(trip.destination_coords) || DEFAULT_COORDS;

    return (
      <Card
        key={trip.id}
        className="mb-4 shadow-sm hover:shadow-md transition-shadow"
        title={
          <div className="flex justify-between items-center">
            <span>{trip.departure_location} → {trip.destination_location}</span>
            <Tag color={trip.status === 'active' ? 'green' : 'default'}>
              {trip.status}
            </Tag>
          </div>
        }
      >
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <div className="space-y-2">
              <p><strong>Водитель:</strong> {trip.driver.username}</p>
              <p><strong>Рейтинг водителя:</strong> {trip.driver.driver_rating}</p>
              <p><strong>Дата:</strong> {dayjs(trip.date).format('DD.MM.YYYY')}</p>
              <p><strong>Время:</strong> {trip.time}</p>
              <p><strong>Цена:</strong> {trip.price} ₽</p>
              <p><strong>Свободных мест:</strong> {trip.available_seats}</p>
              {trip.description && (
                <p><strong>Описание:</strong> {trip.description}</p>
              )}
            </div>
          </Col>
          <Col span={12}>
            <div className="h-[200px] rounded-lg overflow-hidden">
              <Map
                departureCoords={departureCoords as [number, number]}
                destinationCoords={destinationCoords as [number, number]}
                interactive={false}
              />
            </div>
          </Col>
          <Col span={24}>
            {trip.status === 'active' && trip.available_seats > 0 && (
              <Button
                type="primary"
                onClick={() => {
                  setSelectedTrip(trip);
                  setIsBookingModalOpen(true);
                }}
              >
                Забронировать
              </Button>
            )}
          </Col>
        </Row>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6 text-black">Все поездки</h1>
      
      <Card className="mb-6">
        <Form layout="vertical" onFinish={handleFilterChange}>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Form.Item label="Место отправления">
                <Input
                  value={filters.departure}
                  onChange={(e) => setFilters({ ...filters, departure: e.target.value })}
                  placeholder="Введите место отправления"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Место назначения">
                <Input
                  value={filters.destination}
                  onChange={(e) => setFilters({ ...filters, destination: e.target.value })}
                  placeholder="Введите место назначения"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Количество мест">
                <InputNumber
                  value={filters.seats ? Number(filters.seats) : undefined}
                  onChange={(value) => handleFilterChange({ seats: value?.toString() || '' })}
                  placeholder="Минимальное количество мест"
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Дата от">
                <DatePicker
                  value={filters.dateFrom ? dayjs(filters.dateFrom) : null}
                  onChange={(date) => handleFilterChange({ dateFrom: date?.format('YYYY-MM-DD') || '' })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Дата до">
                <DatePicker
                  value={filters.dateTo ? dayjs(filters.dateTo) : null}
                  onChange={(date) => handleFilterChange({ dateTo: date?.format('YYYY-MM-DD') || '' })}
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Диапазон цен">
                <Space>
                  <InputNumber
                    placeholder="От"
                    value={filters.priceMin ? Number(filters.priceMin) : undefined}
                    onChange={(value) => handleFilterChange({ priceMin: value?.toString() || '' })}
                  />
                  <InputNumber
                    placeholder="До"
                    value={filters.priceMax ? Number(filters.priceMax) : undefined}
                    onChange={(value) => handleFilterChange({ priceMax: value?.toString() || '' })}
                  />
                </Space>
              </Form.Item>
            </Col>
          </Row>
          <Row justify="end">
            <Space>
              <Button icon={<FilterOutlined />} type="primary" htmlType="submit">
                Применить фильтры
              </Button>
              <Select
                defaultValue="date"
                style={{ width: 200 }}
                onChange={handleSortChange}
                options={[
                  { label: 'По дате', value: 'date' },
                  { label: 'По цене', value: 'price' },
                  { label: 'По количеству мест', value: 'available_seats' },
                ]}
                prefix={<SortAscendingOutlined />}
              />
            </Space>
          </Row>
        </Form>
      </Card>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      ) : (
        <List
          dataSource={trips}
          renderItem={renderTripCard}
          pagination={{
            pageSize: 10,
            total: trips.length,
            showSizeChanger: false,
          }}
          locale={{ emptyText: 'Нет доступных поездок' }}
        />
      )}
      <BookingModal
        trip={selectedTrip}
        visible={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setSelectedTrip(null);
        }}
        onSuccess={handleBookingSuccess}
      />
    </div>
  );
};

export default AllTripsPage; 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

interface Location {
  address: string;
  coordinates: [number, number];
}

interface TripFormData {
  departure_location: string;
  destination_location: string;
  departure_coords: string;
  destination_coords: string;
  departure_time: string;
  available_seats: number;
  price: number;
  description: string;
}

// Dynamically import the Map component to avoid SSR issues
const MapComponent = dynamic(() => import('@/components/Map'), {
  ssr: false,
  loading: () => <div>Loading map...</div>
});

export default function CreateTripPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSelectingDeparture, setIsSelectingDeparture] = useState(false);
  const [isSelectingDestination, setIsSelectingDestination] = useState(false);
  const [formData, setFormData] = useState<TripFormData>({
    departure_location: '',
    destination_location: '',
    departure_coords: '',
    destination_coords: '',
    departure_time: '',
    available_seats: 1,
    price: 0,
    description: '',
  });

  const handleMapClick = async (coords: [number, number]) => {
    try {
      // Use Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`
      );

      if (!response.ok) {
        throw new Error('Failed to geocode coordinates');
      }

      const data = await response.json();
      const address = data.display_name;

      if (isSelectingDeparture) {
        setFormData(prev => ({
          ...prev,
          departure_location: address,
          departure_coords: coords.join(',')
        }));
        setIsSelectingDeparture(false);
      } else if (isSelectingDestination) {
        setFormData(prev => ({
          ...prev,
          destination_location: address,
          destination_coords: coords.join(',')
        }));
        setIsSelectingDestination(false);
      }
    } catch (err) {
      console.error('Error handling map click:', err);
      setError('Ошибка при определении адреса');
    }
  };

  const handleMarkerDrag = async (type: 'departure' | 'destination', coords: [number, number]) => {
    try {
      // Use Nominatim for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords[0]}&lon=${coords[1]}`
      );

      if (!response.ok) {
        throw new Error('Failed to geocode coordinates');
      }

      const data = await response.json();
      const address = data.display_name;

      if (type === 'departure') {
        setFormData(prev => ({
          ...prev,
          departure_location: address,
          departure_coords: coords.join(',')
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          destination_location: address,
          destination_coords: coords.join(',')
        }));
      }
    } catch (err) {
      console.error('Error handling marker drag:', err);
      setError('Ошибка при определении адреса');
    }
  };

  const handleAddressChange = (field: 'departure_location' | 'destination_location', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressSearch = async (field: 'departure_location' | 'destination_location') => {
    const address = formData[field];
    if (!address) return;

    try {
      setIsLoading(true);
      setError(null);
      // Use Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
      );

      if (!response.ok) {
        throw new Error('Failed to geocode address');
      }

      const data = await response.json();
      if (data.length > 0) {
        const location = {
          address: data[0].display_name,
          coordinates: [parseFloat(data[0].lat), parseFloat(data[0].lon)] as [number, number]
        };

        const coordsField = field === 'departure_location' ? 'departure_coords' : 'destination_coords';
        setFormData(prev => ({
          ...prev,
          [field]: location.address,
          [coordsField]: location.coordinates.join(','),
        }));
      } else {
        setError('Адрес не найден');
      }
    } catch (err) {
      console.error('Error geocoding address:', err);
      setError('Ошибка при поиске адреса');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/trips/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create trip');
      }

      router.push('/trips');
    } catch (err) {
      console.error('Error creating trip:', err);
      setError('Ошибка при создании поездки');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-6xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Создать поездку</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="w-full h-[500px] bg-gray-100 rounded-lg shadow-md overflow-hidden">
          <MapComponent
            onMapClick={handleMapClick}
            onMarkerDrag={handleMarkerDrag}
            departureCoords={formData.departure_coords ? formData.departure_coords.split(',').map(Number) as [number, number] : undefined}
            destinationCoords={formData.destination_coords ? formData.destination_coords.split(',').map(Number) as [number, number] : undefined}
          />
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg shadow-md">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Место отправления</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.departure_location}
                  onChange={(e) => handleAddressChange('departure_location', e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите адрес отправления"
                />
                <button
                  type="button"
                  onClick={() => handleAddressSearch('departure_location')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Найти
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Место назначения</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.destination_location}
                  onChange={(e) => handleAddressChange('destination_location', e.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Введите адрес назначения"
                />
                <button
                  type="button"
                  onClick={() => handleAddressSearch('destination_location')}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Найти
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Время отправления</label>
              <input
                type="datetime-local"
                value={formData.departure_time}
                onChange={(e) => setFormData(prev => ({ ...prev, departure_time: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Количество мест</label>
              <input
                type="number"
                min="1"
                value={formData.available_seats}
                onChange={(e) => setFormData(prev => ({ ...prev, available_seats: parseInt(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цена</label>
              <input
                type="number"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseInt(e.target.value) }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
                placeholder="Добавьте описание поездки"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm mt-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-medium"
          >
            {isLoading ? 'Создание...' : 'Создать поездку'}
          </button>
        </form>
      </div>
    </div>
  );
} 
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Trip } from '@/types/trip';
import { Package } from '@/types/package';

interface PackageForm {
  trip: string;
  recipient_name: string;
  origin: string;
  destination: string;
  weight_kg: string;
  description: string;
  date: string;
}

export default function SendPackagesPage() {
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [form, setForm] = useState<PackageForm>({
    trip: '',
    recipient_name: '',
    origin: '',
    destination: '',
    weight_kg: '',
    description: '',
    date: ''
  });
  const [loading, setLoading] = useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

  useEffect(() => {
    fetchTrips();
    fetchPackages();
  }, []);

  const fetchTrips = async () => {
    const res = await fetch('http://localhost:8000/api/trips/');
    if (res.ok) {
      const data = await res.json();
      setTrips(data.results || data);
    }
  };

  const fetchPackages = async () => {
    if (!token) return;
    const res = await fetch('http://localhost:8000/api/packages/', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      setPackages(data.results || data);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    const res = await fetch('http://localhost:8000/api/packages/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...form,
        weight_kg: parseFloat(form.weight_kg)
      })
    });
    setLoading(false);
    if (res.ok) {
      setForm({ trip: '', recipient_name: '', origin: '', destination: '', weight_kg: '', description: '', date: '' });
      fetchPackages();
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <h1 className="text-xl font-semibold">Отправить посылку</h1>
      <form onSubmit={handleSubmit} className="space-y-4 border p-4 rounded">
        <div>
          <label className="block mb-1 text-sm">Маршрут</label>
          <select name="trip" value={form.trip} onChange={handleChange} className="w-full border p-2 rounded">
            <option value="">Выберите поездку</option>
            {trips.map(trip => (
              <option key={trip.id} value={trip.id}>{trip.departure_location} → {trip.destination_location}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 text-sm">Получатель</label>
          <input name="recipient_name" value={form.recipient_name} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 text-sm">Откуда</label>
          <input name="origin" value={form.origin} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 text-sm">Куда</label>
          <input name="destination" value={form.destination} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 text-sm">Вес (кг)</label>
          <input name="weight_kg" type="number" step="0.1" value={form.weight_kg} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 text-sm">Описание</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="block mb-1 text-sm">Дата отправки</label>
          <input type="date" name="date" value={form.date} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <button disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Отправка...' : 'Отправить'}
        </button>
      </form>

      <div>
        <h2 className="text-lg font-semibold mt-8 mb-2">Мои посылки</h2>
        <ul className="space-y-2">
          {packages.map(p => (
            <li key={p.id} className="border p-3 rounded">
              <div className="font-medium">{p.origin} → {p.destination} ({p.status})</div>
              <div className="text-sm text-gray-500">Получатель: {p.recipient_name}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package } from '@/types/package';

export default function PackagesPage() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [tab, setTab] = useState<'list' | 'create'>('list');
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    recipient_name: '',
    origin: '',
    destination: '',
    weight_kg: '',
    description: '',
    price: '',
    date: ''
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const fetchPackages = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/api/packages/`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setPackages(data.results || data);
    } catch (err) {
      console.error('Failed to load packages', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    try {
      const res = await fetch(`${apiBase}/api/packages/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setFormData({ recipient_name: '', origin: '', destination: '', weight_kg: '', description: '', price: '', date: '' });
        fetchPackages();
        setTab('list');
      } else {
        const errData = await res.json();
        console.error('Failed to create package', errData);
      }
    } catch (err) {
      console.error('Failed to create package', err);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-center gap-8 border-b pb-3 text-sm font-medium">
        <button onClick={() => setTab('list')} className={tab === 'list' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}>Мои посылки</button>
        <button onClick={() => setTab('create')} className={tab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}>Отправить посылку</button>
      </div>

      <div className="mt-6 max-w-xl mx-auto">
        {tab === 'list' && (
          <div>
            {loading ? (
              <p>Загрузка...</p>
            ) : (
              <ul className="space-y-4">
                {packages.map(p => (
                  <li key={p.id} className="border rounded p-4 shadow-sm">
                    <p className="font-medium">{p.origin} → {p.destination}</p>
                    <p>Получатель: {p.recipient_name}</p>
                    <p>Статус: {p.status}</p>
                    <p>Вес: {p.weight_kg} кг</p>
                  </li>
                ))}
                {packages.length === 0 && <p>Посылок нет</p>}
              </ul>
            )}
          </div>
        )}

        {tab === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm">Получатель</label>
              <input name="recipient_name" value={formData.recipient_name} onChange={handleInput} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Откуда</label>
              <input name="origin" value={formData.origin} onChange={handleInput} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Куда</label>
              <input name="destination" value={formData.destination} onChange={handleInput} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Вес (кг)</label>
              <input name="weight_kg" value={formData.weight_kg} onChange={handleInput} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Цена (₽)</label>
              <input name="price" value={formData.price} onChange={handleInput} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Дата отправки</label>
              <input type="date" name="date" value={formData.date} onChange={handleInput} required className="w-full border p-2 rounded" />
            </div>
            <div>
              <label className="block text-sm">Описание</label>
              <textarea name="description" value={formData.description} onChange={handleInput} className="w-full border p-2 rounded" />
            </div>
            <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">Сохранить</button>
          </form>
        )}
      </div>
    </div>
  );
}

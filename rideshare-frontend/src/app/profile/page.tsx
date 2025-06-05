'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface User {
  id: number;
  username: string;
  email: string;
  phone_number: string;
  is_verified: boolean;
  first_name?: string;
  last_name?: string;
  bio?: string;
  avatar?: string;
  rating?: number;
}

interface ApiError {
  [key: string]: string[];
}

interface Complaint {
  id: number;
  complainant_username: string;
  reported_user_username: string;
  description: string;
  status: string;
  status_display: string;
  created_at: string;
  resolved_at: string | null;
  admin_comment: string | null;
}

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [formErrors, setFormErrors] = useState<ApiError>({});
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [complaintData, setComplaintData] = useState({
    reported_user_username: '',
    description: ''
  });
  const [complaintError, setComplaintError] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }
      fetchUserData();
      fetchComplaints();
    };

    checkAuth();
  }, [router]);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch user data');
      }

      const userData = await response.json();
      setUser(userData);
      setFormData(userData);
    } catch (err) {
      setError('Failed to load profile data');
      console.error('Error fetching user data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: [] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/update_me/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        const errorData = await response.json();
        setFormErrors(errorData);
        throw new Error('Failed to update profile');
      }

      const updatedUser = await response.json();
      setUser(updatedUser);
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error('Error updating profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/complaints/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch complaints');
      }

      const data: PaginatedResponse<Complaint> = await response.json();
      setComplaints(data.results || []);
    } catch (err) {
      console.error('Error fetching complaints:', err);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setComplaintError(null);

    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/complaints/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(complaintData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.reported_user_username?.[0] || errorData.description?.[0] || 'Failed to submit complaint');
      }

      await fetchComplaints();
      setShowComplaintForm(false);
      setComplaintData({ reported_user_username: '', description: '' });
    } catch (err: any) {
      setComplaintError(err.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Профиль пользователя</h1>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              {isEditing ? 'Отменить' : 'Редактировать'}
            </button>
          </div>

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-900">
                  Имя пользователя
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                />
                {formErrors.username && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.username[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-900">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                />
                {formErrors.email && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.email[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone_number" className="block text-sm font-medium text-gray-900">
                  Номер телефона
                </label>
                <input
                  type="tel"
                  id="phone_number"
                  name="phone_number"
                  value={formData.phone_number || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                />
                {formErrors.phone_number && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.phone_number[0]}</p>
                )}
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-900">
                  О себе
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleChange}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-black"
                />
                {formErrors.bio && (
                  <p className="mt-1 text-sm text-red-500">{formErrors.bio[0]}</p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Сохранение...' : 'Сохранить изменения'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.username}
                      width={80}
                      height={80}
                      className="rounded-full"
                    />
                  ) : (
                    <span className="text-2xl text-gray-500">{user.username[0].toUpperCase()}</span>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-black">{user.username}</h2>
                  {user.is_verified && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Проверенный пользователь
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Email</h3>
                  <p className="mt-1 text-black">{user.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Телефон</h3>
                  <p className="mt-1 text-black">{user.phone_number}</p>
                </div>
                {user.rating !== undefined && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900">Рейтинг</h3>
                    <p className="mt-1 text-black">{user.rating.toFixed(1)} / 5.0</p>
                  </div>
                )}
              </div>

              {user.bio && (
                <div>
                  <h3 className="text-sm font-medium text-gray-900">О себе</h3>
                  <p className="mt-1 text-black whitespace-pre-wrap">{user.bio}</p>
                </div>
              )}
            </div>
          )}

          {/* Complaints Section */}
          <div className="mt-8 bg-white rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Жалобы</h2>
                <button
                  onClick={() => setShowComplaintForm(!showComplaintForm)}
                  className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                >
                  {showComplaintForm ? 'Отменить' : 'Подать жалобу'}
                </button>
              </div>

              {showComplaintForm && (
                <form onSubmit={handleComplaintSubmit} className="mb-6 space-y-4">
                  <div>
                    <label htmlFor="reported_user_username" className="block text-sm font-medium text-gray-900">
                      Имя пользователя
                    </label>
                    <input
                      type="text"
                      id="reported_user_username"
                      value={complaintData.reported_user_username}
                      onChange={(e) => setComplaintData(prev => ({ ...prev, reported_user_username: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-black"
                      placeholder="Введите имя пользователя"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-900">
                      Описание жалобы
                    </label>
                    <textarea
                      id="description"
                      value={complaintData.description}
                      onChange={(e) => setComplaintData(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 text-black"
                      placeholder="Опишите причину жалобы"
                      required
                    />
                  </div>
                  {complaintError && (
                    <div className="text-red-500 text-sm">{complaintError}</div>
                  )}
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    Отправить жалобу
                  </button>
                </form>
              )}

              <div className="space-y-4">
                {complaints.map((complaint) => (
                  <div
                    key={complaint.id}
                    className="border rounded-lg p-4 space-y-2"
                  >
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-900">
                        Жалоба на пользователя: <strong>{complaint.reported_user_username}</strong>
                      </span>
                      <span className={`text-sm px-2 py-1 rounded ${
                        complaint.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        complaint.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {complaint.status_display}
                      </span>
                    </div>
                    <p className="text-black whitespace-pre-wrap">{complaint.description}</p>
                    <div className="text-sm text-gray-500">
                      Дата: {new Date(complaint.created_at).toLocaleDateString()}
                    </div>
                    {complaint.admin_comment && (
                      <div className="mt-2 p-2 bg-gray-50 rounded">
                        <p className="text-sm text-gray-900">
                          <strong>Комментарий администратора:</strong>
                        </p>
                        <p className="text-sm text-black">{complaint.admin_comment}</p>
                      </div>
                    )}
                  </div>
                ))}
                {complaints.length === 0 && (
                  <p className="text-gray-500 text-center">У вас пока нет жалоб</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
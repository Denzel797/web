'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAdminAccess = async () => {
      console.log('🔐 [AdminPage] Checking admin access...');
      const token = localStorage.getItem('access_token');
      
      if (!token) {
        console.log('🚫 [AdminPage] No token found, redirecting...');
        router.push('/auth/login');
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.log('👤 [AdminPage] User data:', userData);
        
        if (!userData.is_staff) {
          console.log('🚫 [AdminPage] User is not admin, redirecting...');
          router.push('/');
          return;
        }

        setIsAdmin(true);
      } catch (error) {
        console.error('❌ [AdminPage] Error:', error);
        router.push('/auth/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="p-8 flex justify-center items-center">
        <div className="text-xl">Загрузка...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Панель администратора</h1>
      
      <div className="grid gap-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Статус системы</h2>
          <div className="space-y-2">
            <p className="text-green-600">✅ Вы вошли как администратор</p>
            <p className="text-gray-600">Используйте разделы ниже для управления системой</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Доступные разделы</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link 
              href="/admin/reports" 
              className="block p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
            >
              <h3 className="font-medium text-blue-700">📊 Отчеты</h3>
              <p className="text-sm text-blue-600 mt-1">Просмотр и генерация отчетов по поездкам</p>
            </Link>

            <Link 
              href="/admin/users" 
              className="block p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors"
            >
              <h3 className="font-medium text-green-700">👥 Пользователи</h3>
              <p className="text-sm text-green-600 mt-1">Управление пользователями и ролями</p>
            </Link>

            <Link 
              href="/admin/complaints" 
              className="block p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg border border-yellow-200 transition-colors"
            >
              <h3 className="font-medium text-yellow-700">⚠️ Жалобы</h3>
              <p className="text-sm text-yellow-600 mt-1">Рассмотрение жалоб и обращений</p>
            </Link>

            <Link 
              href="/admin/settings" 
              className="block p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors"
            >
              <h3 className="font-medium text-purple-700">⚙️ Настройки</h3>
              <p className="text-sm text-purple-600 mt-1">Системные настройки и конфигурация</p>
            </Link>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Быстрая статистика</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Активных поездок</p>
              <h4 className="text-2xl font-semibold text-gray-900">--</h4>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Новых пользователей</p>
              <h4 className="text-2xl font-semibold text-gray-900">--</h4>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">Ожидают рассмотрения</p>
              <h4 className="text-2xl font-semibold text-gray-900">--</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
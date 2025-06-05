'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState('');
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      console.log('🔄 [Navbar] Starting auth check...');
      setIsLoading(true);
      const token = localStorage.getItem('access_token');
      
      console.log('🔑 [Navbar] Token exists:', !!token);
      
      if (!token) {
        console.log('❌ [Navbar] No token found, setting unauthorized state');
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUsername('');
        setIsLoading(false);
        return;
      }

      try {
        console.log('🔍 [Navbar] Fetching user data...');
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('📡 [Navbar] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            console.log('⚠️ [Navbar] Token expired or invalid, redirecting to login');
            localStorage.removeItem('access_token');
            setIsLoggedIn(false);
            setIsAdmin(false);
            setUsername('');
            router.push('/auth/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.log('👤 [Navbar] User data received:', {
          isStaff: userData.is_staff,
          username: userData.username
        });
        
        setIsLoggedIn(true);
        setIsAdmin(userData.is_staff === true);
        setUsername(userData.username);
      } catch (error) {
        console.error('❌ [Navbar] Error checking auth status:', error);
        setIsLoggedIn(false);
        setIsAdmin(false);
        setUsername('');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = () => {
    console.log('🚪 [Navbar] Logging out...');
    localStorage.removeItem('access_token');
    setIsLoggedIn(false);
    setIsAdmin(false);
    setUsername('');
    router.push('/auth/login');
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link href="/" className="text-xl font-bold text-blue-600">
                RideShare
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link href="/trips" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                Поездки
              </Link>
              {isLoggedIn && !isLoading && (
                <>
                  <Link href="/profile" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                    {username || 'Профиль'}
                  </Link>
                  <Link href="/bookings" className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500">
                    Бронирования
                  </Link>
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="text-gray-900 inline-flex items-center px-1 pt-1 border-b-2 border-transparent hover:border-blue-500"
                      onClick={() => {
                        console.warn('🔐 [Navbar] Admin link clicked');
                        console.warn('🔐 [Navbar] Current admin status:', { isAdmin, isLoading });
                      }}
                    >
                      Админ-панель
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {isLoggedIn ? (
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition-colors"
              >
                Выйти
              </button>
            ) : (
              <Link
                href="/auth/login"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition-colors"
              >
                Войти
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 
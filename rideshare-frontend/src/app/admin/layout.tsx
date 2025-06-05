'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    console.warn('🔥 [AdminLayout] Component mounted');

    const checkAdminStatus = async () => {
      console.warn('🔄 [AdminLayout] Starting admin status check...');
      setIsLoading(true);
      const token = localStorage.getItem('access_token');

      console.warn('🔑 [AdminLayout] Token exists:', !!token);

      if (!token) {
        console.error('❌ [AdminLayout] No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }

      try {
        console.warn('📡 [AdminLayout] Fetching user data...');
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/me/`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.warn('📥 [AdminLayout] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 401) {
            console.error('🚫 [AdminLayout] Token expired or invalid, redirecting to login');
            localStorage.removeItem('access_token');
            router.push('/auth/login');
            return;
          }
          throw new Error('Failed to fetch user data');
        }

        const userData = await response.json();
        console.warn('👤 [AdminLayout] User data received:', {
          isStaff: userData.is_staff,
          username: userData.username
        });

        if (!userData.is_staff) {
          console.error('⛔ [AdminLayout] User is not admin, redirecting to home');
          router.push('/');
          return;
        }
        console.warn('✅ [AdminLayout] User confirmed as admin');
        setIsAdmin(true);
      } catch (error) {
        console.error('💥 [AdminLayout] Error checking admin status:', error);
        router.push('/');
      } finally {
        console.warn('🏁 [AdminLayout] Admin check completed. isAdmin:', isAdmin);
        setIsLoading(false);
      }
    };

    checkAdminStatus();
  }, [router, isAdmin]);

  if (isLoading) {
    console.warn('⌛ [AdminLayout] Rendering loading state');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isAdmin) {
    console.warn('🚫 [AdminLayout] Rendering null due to non-admin status');
    return null;
  }

  console.warn('✨ [AdminLayout] Rendering admin layout');
  return <div className="container mx-auto px-4 py-8">{children}</div>;
} 
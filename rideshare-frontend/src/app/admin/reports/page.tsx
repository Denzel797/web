'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface Report {
  id: number;
  report_type: 'user' | 'trip' | 'financial';
  start_date: string;
  end_date: string;
  total_trips: number;
  completed_trips: number;
  cancelled_trips: number;
  total_earnings: number;
  total_passengers: number;
  average_rating: number;
  popular_routes: { [key: string]: number };
  created_at: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AdminReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportType, setReportType] = useState<'user' | 'trip' | 'financial'>('trip');
  const [dateRange, setDateRange] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0],
  });
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [users, setUsers] = useState<Array<{ id: number; username: string }>>([]);

  useEffect(() => {
    console.warn('🔥 [AdminReportsPage] Component mounted');
    const checkAuth = async () => {
      console.warn('🔄 [AdminReportsPage] Checking authentication...');
      const token = localStorage.getItem('access_token');
      if (!token) {
        console.error('❌ [AdminReportsPage] No token found, redirecting to login');
        router.push('/auth/login');
        return;
      }
      await fetchUsers();
      await fetchReports();
    };

    checkAuth();
  }, [router]);

  const fetchUsers = async () => {
    console.warn('👥 [AdminReportsPage] Fetching users...');
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/users/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.warn('📥 [AdminReportsPage] Users API response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      console.warn('✅ [AdminReportsPage] Users data received:', data);
      setUsers(data.results || []);
    } catch (err) {
      console.error('💥 [AdminReportsPage] Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  const fetchReports = async () => {
    console.warn('📊 [AdminReportsPage] Fetching reports...');
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.warn('📥 [AdminReportsPage] Reports API response status:', response.status);

      if (!response.ok) {
        throw new Error('Failed to fetch reports');
      }

      const data = await response.json();
      console.warn('✅ [AdminReportsPage] Reports data received:', data);
      setReports(data.results || []);
    } catch (err) {
      console.error('💥 [AdminReportsPage] Error fetching reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    console.warn('📝 [AdminReportsPage] Generating new report...');
    console.warn('📋 [AdminReportsPage] Report parameters:', {
      reportType,
      dateRange,
      selectedUserId
    });

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/reports/generate/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          report_type: reportType,
          start_date: dateRange.start_date,
          end_date: dateRange.end_date,
          user_id: selectedUserId || undefined,
        }),
      });

      console.warn('📥 [AdminReportsPage] Generate report API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ [AdminReportsPage] Generate report error:', errorData);
        throw new Error(errorData.error || 'Failed to generate report');
      }

      console.warn('✅ [AdminReportsPage] Report generated successfully');
      await fetchReports();
    } catch (err) {
      console.error('💥 [AdminReportsPage] Error generating report:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const renderTripStatusChart = (report: Report) => {
    const data = [
      { name: 'Завершенные', value: report.completed_trips },
      { name: 'Отмененные', value: report.cancelled_trips },
    ];

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: { name: string; percent: number }) => 
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderPopularRoutesChart = (report: Report) => {
    const data = Object.entries(report.popular_routes).map(([route, count]) => ({
      route,
      count,
    }));

    return (
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="route" angle={-45} textAnchor="end" height={100} />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Количество поездок" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Система отчетности</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Тип отчета</label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as 'user' | 'trip' | 'financial')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="trip">Отчет по поездкам</option>
                <option value="user">Отчет по пользователю</option>
                <option value="financial">Финансовый отчет</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Дата начала</label>
              <input
                type="date"
                value={dateRange.start_date}
                onChange={(e) => setDateRange({ ...dateRange, start_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Дата окончания</label>
              <input
                type="date"
                value={dateRange.end_date}
                onChange={(e) => setDateRange({ ...dateRange, end_date: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            {reportType === 'user' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Пользователь</label>
                <select
                  value={selectedUserId}
                  onChange={(e) => setSelectedUserId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Выберите пользователя</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className={`px-4 py-2 rounded-md text-white ${
                loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {loading ? 'Генерация...' : 'Сгенерировать отчет'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {reports.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Последние отчеты</h2>
              <div className="space-y-6">
                {reports.map((report) => (
                  <div key={report.id} className="bg-gray-50 p-6 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {report.report_type === 'user' && 'Отчет по пользователю'}
                      {report.report_type === 'trip' && 'Отчет по поездкам'}
                      {report.report_type === 'financial' && 'Финансовый отчет'}
                      {' '}({new Date(report.created_at).toLocaleDateString()})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Статистика поездок</h4>
                        {renderTripStatusChart(report)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-2">Популярные маршруты</h4>
                        {renderPopularRoutesChart(report)}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Всего поездок</p>
                        <p className="text-lg font-semibold">{report.total_trips}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Общий доход</p>
                        <p className="text-lg font-semibold">{report.total_earnings} ₽</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Всего пассажиров</p>
                        <p className="text-lg font-semibold">{report.total_passengers}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Средний рейтинг</p>
                        <p className="text-lg font-semibold">{report.average_rating.toFixed(1)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 
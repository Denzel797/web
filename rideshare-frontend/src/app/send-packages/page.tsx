'use client';

import React, { useState } from 'react';

export default function TripControlPage() {
  const [tab, setTab] = useState<'trips' | 'create' | 'requests' | 'mytrips'>('trips');

  return (
    <div className="p-4">
      {/* Меню вкладок */}
      <div className="flex justify-center gap-8 border-b pb-3 text-sm font-medium">
        <button
          onClick={() => setTab('trips')}
          className={tab === 'trips' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}
        >
          Доступные маршруты
        </button>
        <button
          onClick={() => setTab('create')}
          className={tab === 'create' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}
        >
          Создать поездку
        </button>
        <button
          onClick={() => setTab('requests')}
          className={tab === 'requests' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}
        >
          Заявки
        </button>
        <button
          onClick={() => setTab('mytrips')}
          className={tab === 'mytrips' ? 'text-blue-600 border-b-2 border-blue-600' : 'hover:text-blue-500'}
        >
          Мои поездки
        </button>
      </div>

      {/* Содержимое */}
      <div className="mt-6 max-w-2xl mx-auto">
        {tab === 'trips' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Доступные поездки</h2>
            <ul className="space-y-4">
              <li className="border rounded p-4 shadow-sm">
                <p className="font-medium">Казань → Москва · 05.06.2025</p>
                <p><strong>Водитель:</strong> Иван</p>
                <p><strong>Рейтинг:</strong> ★ 4.9</p>
                <p><strong>Цена:</strong> 700 ₽</p>
                <p><strong>Мест:</strong> 2</p>
                <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">Отправить посылку</button>
              </li>
              <li className="border rounded p-4 shadow-sm">
                <p className="font-medium">Москва → СПб · 06.06.2025</p>
                <p><strong>Водитель:</strong> Алексей</p>
                <p><strong>Рейтинг:</strong> ★ 5.0</p>
                <p><strong>Цена:</strong> 1200 ₽</p>
                <p><strong>Мест:</strong> 3</p>
                <button className="mt-2 bg-blue-500 text-white px-3 py-1 rounded">Отправить посылку</button>
              </li>
            </ul>
          </div>
        )}

        {tab === 'create' && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-center">Создать новую поездку</h2>
            <form className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border p-6 rounded-lg shadow-md">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Откуда</label>
                <input type="text" placeholder="Город отправления" className="w-full mt-1 p-2 border rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Куда</label>
                <input type="text" placeholder="Город назначения" className="w-full mt-1 p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Дата</label>
                <input type="date" className="w-full mt-1 p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Время</label>
                <input type="time" className="w-full mt-1 p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Свободные места</label>
                <input type="number" placeholder="Количество мест" className="w-full mt-1 p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Цена (₽)</label>
                <input type="number" placeholder="Стоимость" className="w-full mt-1 p-2 border rounded" />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700">Описание</label>
                <textarea placeholder="Комментарий к поездке..." className="w-full mt-1 p-2 border rounded"></textarea>
              </div>
              <div className="col-span-2 text-center">
                <button className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition">Создать поездку</button>
              </div>
            </form>
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4 text-center">Отправленные заявки</h2>
              <ul className="space-y-4">
                <li className="border p-4 rounded shadow-md">
                  <p className="font-medium">Вы подали заявку на поездку: СПб → Москва · 06.06.2025</p>
                  <p className="text-sm text-gray-500">Ожидает одобрения водителя</p>
                </li>
                <li className="border p-4 rounded shadow-md">
                  <p className="font-medium">Вы подали заявку на поездку: Казань → Москва · 07.06.2025</p>
                  <p className="text-green-600">✅ Заявка одобрена</p>
                  <div className="mt-3 border-t pt-3">
                    <h3 className="text-sm font-semibold mb-2">Чат с водителем</h3>
                    <div className="border p-3 rounded h-40 overflow-y-auto bg-gray-50 text-sm">
                      <p><strong>Вы:</strong> Добрый день! Можете забрать посылку?</p>
                      <p><strong>Водитель:</strong> Да, могу после 15:00</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Написать сообщение..."
                      className="mt-2 w-full border p-2 rounded"
                    />
                  </div>
                </li>
              </ul>
            </div>
          </div>
        )}

        {tab === 'mytrips' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Мои поездки</h2>
            <ul className="space-y-4">
              <li className="border p-4 rounded shadow">
                <p className="font-medium">Казань → Москва · 05.06.2025</p>
                <p><strong>Свободных мест:</strong> 2</p>
                <p><strong>Цена:</strong> 700 ₽</p>
                <p><strong>Описание:</strong> Готов взять багаж</p>
                <button className="mt-2 bg-red-500 text-white px-3 py-1 rounded">Удалить</button>
                <div className="mt-3">
                  <h4 className="font-semibold mb-1">Заявки пользователей</h4>
                  <ul className="space-y-2">
                    <li className="border p-2 rounded">
                      Алексей хочет присоединиться к поездке
                      <div className="flex gap-2 mt-2">
                        <button className="bg-blue-500 text-white px-3 py-1 rounded">Принять</button>
                        <button className="bg-gray-300 px-3 py-1 rounded">Отклонить</button>
                      </div>
                    </li>
                  </ul>
                </div>
              </li>
              <li className="border p-4 rounded shadow">
                <p className="font-medium">Москва → СПб · 06.06.2025</p>
                <p><strong>Свободных мест:</strong> 1</p>
                <p><strong>Цена:</strong> 1200 ₽</p>
                <p><strong>Описание:</strong> Без остановок</p>
                <button className="mt-2 bg-red-500 text-white px-3 py-1 rounded">Удалить</button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

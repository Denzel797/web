'use client';

import { useState, useEffect, useRef } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Input, Button, List, Avatar, message, Spin } from 'antd';
import { SendOutlined, ArrowLeftOutlined } from '@ant-design/icons';

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  };
  created_at: string;
  is_read: boolean;
}

interface Chat {
  id: number;
  trip: {
    id: number;
    departure_location: string;
    destination_location: string;
  };
  messages: Message[];
  participants: {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
  }[];
}

export default function ChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [chat, setChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    setUserId(user.id);
    fetchChat();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchChat = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chats/${id}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat');
      }

      const data = await response.json();
      setChat(data);
      fetchMessages();
    } catch (error) {
      console.error('Error fetching chat:', error);
      message.error('Не удалось загрузить чат');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chats/${id}/messages/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }

      const data = await response.json();
      setMessages(data.results || data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chats/${id}/send_message/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      setNewMessage('');
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      message.error('Не удалось отправить сообщение');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!chat) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Card>
          <p>Чат не найден</p>
          <Button onClick={() => router.back()}>Назад</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Card
          title={
            <div className="flex items-center gap-4">
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={() => router.back()}
              />
              <span>
                Чат поездки: {chat.trip.departure_location} → {chat.trip.destination_location}
              </span>
            </div>
          }
          className="shadow-lg"
        >
          <div className="h-[60vh] flex flex-col">
            <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 ${
                    msg.sender.id === userId ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <Avatar
                    style={{
                      backgroundColor: msg.sender.id === userId ? '#52c41a' : '#1890ff',
                      flexShrink: 0
                    }}
                  >
                    {msg.sender.first_name?.[0] || msg.sender.username[0]}
                  </Avatar>
                  <div
                    className={`
                      flex flex-col
                      ${msg.sender.id === userId ? 'items-end' : 'items-start'}
                      max-w-[60%]
                    `}
                  >
                    {msg.sender.id !== userId && (
                      <span className="text-xs text-gray-500 mb-1 px-2">
                        {msg.sender.first_name || msg.sender.username}
                      </span>
                    )}
                    <div
                      className={`
                        rounded-2xl px-4 py-2
                        ${msg.sender.id === userId
                          ? 'bg-blue-500 text-white rounded-tr-none'
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                        }
                      `}
                    >
                      <div className="break-words whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    </div>
                    <div
                      className={`
                        text-xs mt-1 px-2
                        ${msg.sender.id === userId ? 'text-gray-500' : 'text-gray-400'}
                      `}
                    >
                      {new Date(msg.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                      {msg.sender.id === userId && (
                        <span className="ml-2 text-gray-400">
                          {msg.is_read ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="flex gap-2 mt-4 border-t pt-4 px-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onPressEnter={handleSendMessage}
                placeholder="Введите сообщение..."
                className="flex-1"
                size="large"
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                size="large"
              >
                Отправить
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 
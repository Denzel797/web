import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.utils import timezone
from .models import Chat, ChatMessage, User

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.chat_id = self.scope['url_route']['kwargs']['chat_id']
        self.room_group_name = f'chat_{self.chat_id}'
        self.user = self.scope['user']

        # Проверка прав доступа к чату
        if not await self.can_access_chat():
            await self.close()
            return

        # Присоединение к группе чата
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Отметить все сообщения как прочитанные
        await self.mark_messages_as_read()

    async def disconnect(self, close_code):
        # Покинуть группу чата
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']

        # Сохранить сообщение в базе данных
        chat_message = await self.save_message(message)

        # Отправить сообщение в группу чата
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender_id': self.user.id,
                'sender_name': self.user.get_full_name() or self.user.username,
                'timestamp': chat_message.created_at.isoformat()
            }
        )

    async def chat_message(self, event):
        # Отправить сообщение клиенту WebSocket
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender_id': event['sender_id'],
            'sender_name': event['sender_name'],
            'timestamp': event['timestamp']
        }))

    @database_sync_to_async
    def can_access_chat(self):
        try:
            chat = Chat.objects.get(id=self.chat_id)
            return chat.participants.filter(id=self.user.id).exists()
        except Chat.DoesNotExist:
            return False

    @database_sync_to_async
    def save_message(self, content):
        chat = Chat.objects.get(id=self.chat_id)
        message = ChatMessage.objects.create(
            chat=chat,
            sender=self.user,
            content=content
        )
        chat.updated_at = timezone.now()
        chat.save()
        return message

    @database_sync_to_async
    def mark_messages_as_read(self):
        ChatMessage.objects.filter(
            chat_id=self.chat_id,
            is_read=False
        ).exclude(
            sender=self.user
        ).update(is_read=True) 
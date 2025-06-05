from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import viewsets
from django.utils import timezone
from rest_framework.exceptions import PermissionDenied

class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Chat.objects.filter(participants=self.request.user).order_by('-updated_at')

    def perform_create(self, serializer):
        chat = serializer.save()
        chat.participants.add(self.request.user)
        trip = chat.trip
        if trip.driver != self.request.user:
            chat.participants.add(trip.driver)
        return chat

    @action(detail=False, methods=['get'])
    def trip_chat(self, request):
        trip_id = request.query_params.get('trip_id')
        if not trip_id:
            return Response({'error': 'trip_id is required'}, status=400)

        try:
            trip = Trip.objects.get(id=trip_id)
            # Check if user is either the driver or a passenger with a booking
            is_participant = (
                trip.driver == request.user or 
                trip.bookings.filter(passenger=request.user).exists()
            )
            
            if not is_participant:
                return Response({'error': 'You are not a participant of this trip'}, status=403)

            # Get or create chat for this trip
            chat, created = Chat.objects.get_or_create(trip=trip)
            
            # Add participants if chat was just created
            if created:
                chat.participants.add(request.user)
                if trip.driver != request.user:
                    chat.participants.add(trip.driver)
                # Add passengers with confirmed bookings
                for booking in trip.bookings.filter(status='confirmed'):
                    chat.participants.add(booking.passenger)

            serializer = self.get_serializer(chat)
            return Response(serializer.data)

        except Trip.DoesNotExist:
            return Response({'error': 'Trip not found'}, status=404)


class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        chat_id = self.request.query_params.get('chat_id')
        if chat_id:
            return Message.objects.filter(chat_id=chat_id).order_by('-created_at')
        return Message.objects.none()

    def perform_create(self, serializer):
        chat = Chat.objects.get(id=self.request.data['chat'])
        if self.request.user not in chat.participants.all():
            raise PermissionDenied("Вы не являетесь участником этого чата")
        
        message = serializer.save(sender=self.request.user)
        chat.updated_at = timezone.now()
        chat.save()
        
        NotificationService.send_message_notification(message)
        return message

    @action(detail=True, methods=['post'])
    def mark_read(self, request, pk=None):
        message = self.get_object()
        if request.user != message.sender:
            message.is_read = True
            message.save()
        return Response({'status': 'success'}) 
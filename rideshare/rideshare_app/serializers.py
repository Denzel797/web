class MessageSerializer(serializers.ModelSerializer):
    sender_name = serializers.CharField(source='sender.username', read_only=True)
    sender_id = serializers.IntegerField(source='sender.id', read_only=True)

    class Meta:
        model = Message
        fields = ['id', 'chat', 'sender_id', 'sender_name', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'is_read']


class ChatSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()
    participants = UserSerializer(many=True, read_only=True)
    trip_details = TripSerializer(source='trip', read_only=True)
    unread_count = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ['id', 'trip', 'trip_details', 'participants', 'last_message', 'unread_count', 'created_at', 'updated_at']

    def get_last_message(self, obj):
        last_message = obj.messages.first()
        if last_message:
            return MessageSerializer(last_message).data
        return None

    def get_unread_count(self, obj):
        user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=user).count() 
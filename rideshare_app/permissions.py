from rest_framework import permissions

class IsDriverOrReadOnly(permissions.BasePermission):
    """
    Разрешение, которое позволяет только водителям создавать и редактировать поездки.
    """
    def has_permission(self, request, view):
        # Разрешаем GET, HEAD или OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Проверяем, что пользователь аутентифицирован
        return request.user and request.user.is_authenticated
        
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD или OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Проверяем, что пользователь является водителем поездки
        return obj.driver == request.user

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Разрешение, которое позволяет только владельцу объекта редактировать его.
    """
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD или OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Проверяем, что пользователь является владельцем объекта
        return obj.user == request.user

class IsAdminOrReadOnly(permissions.BasePermission):
    """
    Разрешение, которое позволяет только администраторам редактировать объекты.
    """
    def has_permission(self, request, view):
        # Разрешаем GET, HEAD или OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Проверяем, что пользователь является администратором
        return request.user and request.user.is_staff

class IsPassengerOrReadOnly(permissions.BasePermission):
    """
    Разрешение, которое позволяет только пассажирам создавать бронирования.
    """
    def has_permission(self, request, view):
        # Разрешаем GET, HEAD или OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Проверяем, что пользователь аутентифицирован
        return request.user and request.user.is_authenticated
        
    def has_object_permission(self, request, view, obj):
        # Разрешаем GET, HEAD или OPTIONS запросы
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Проверяем, что пользователь является пассажиром бронирования
        # или водителем поездки (для подтверждения/отклонения)
        return (obj.passenger == request.user or 
                obj.trip.driver == request.user) 
export interface Trip {
  id: number;
  driver: {
    id: number;
    username: string;
  };
  departure_location: string;
  destination_location: string;
  departure_coords: string;
  destination_coords: string;
  date: string;
  time: string;
  price: number;
  available_seats: number;
  status: 'active' | 'completed' | 'cancelled';
  description?: string;
  bookings?: Booking[];
}

export interface Booking {
  id: number;
  trip: Trip;
  passenger: {
    id: number;
    username: string;
  };
  seats_booked: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  total_price: number;
}

export interface BookingModalProps {
  trip: Trip | null;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
} 
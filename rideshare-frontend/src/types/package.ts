export interface Package {
  id: number;
  sender: {
    id: number;
    username: string;
  };
  trip: number | null;
  recipient_name: string;
  origin: string;
  destination: string;
  weight_kg: number;
  description?: string;
  price?: number;
  status: 'pending' | 'assigned' | 'delivered' | 'cancelled';
  date: string;
  created_at: string;
  updated_at: string;
}

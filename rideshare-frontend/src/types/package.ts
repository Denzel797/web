export interface Package {
  id: number;
  sender: { id: number; username: string };
  trip?: number;
  recipient_name: string;
  origin: string;
  destination: string;
  weight_kg: string;
  description?: string;
  price?: string;
  status: 'pending' | 'assigned' | 'delivered' | 'cancelled';
  date: string;
  created_at: string;
}

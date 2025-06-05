import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { BookingModalProps } from '@/types/trip';

const BookingModal: React.FC<BookingModalProps> = ({ trip, visible, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleBooking = async (values: { seats: number }) => {
    if (!trip) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await fetch(`http://localhost:8000/api/trips/${trip.id}/book/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ seats_booked: values.seats }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to book trip');
      }

      message.success('Trip booked successfully!');
      onSuccess();
    } catch (error) {
      if (error instanceof Error) {
        message.error(error.message);
      } else {
        message.error('Failed to book trip. Please try again.');
      }
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Book Trip"
      open={visible}
      onCancel={onClose}
      footer={null}
    >
      <Form
        form={form}
        onFinish={handleBooking}
        layout="vertical"
      >
        <Form.Item
          label="Number of Seats"
          name="seats"
          rules={[
            { required: true, message: 'Please enter number of seats' },
            { 
              validator: (_, value) => {
                const seats = Number(value);
                if (isNaN(seats)) {
                  return Promise.reject('Please enter a valid number');
                }
                if (seats < 1) {
                  return Promise.reject('Must be at least 1 seat');
                }
                if (trip && seats > trip.available_seats) {
                  return Promise.reject(`Maximum ${trip.available_seats} seats available`);
                }
                return Promise.resolve();
              }
            }
          ]}
        >
          <Input 
            type="number" 
            min={1} 
            max={trip?.available_seats || 1} 
            disabled={!trip || trip.available_seats <= 0}
            onChange={(e) => {
              const value = e.target.value;
              form.setFieldValue('seats', value ? parseInt(value, 10) : undefined);
            }}
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading} 
            block
            disabled={!trip || trip.available_seats <= 0}
          >
            Book Now
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BookingModal; 
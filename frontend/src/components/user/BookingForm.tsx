'use client';

import { useState } from 'react';

interface BookingFormProps {
  vendorId: string;
  vendorName: string;
  serviceCategory: string;
  serviceName: string;
  onBookingCreated?: (booking: any) => void;
  onClose?: () => void;
}

export function BookingForm({ 
  vendorId, 
  vendorName, 
  serviceCategory, 
  serviceName, 
  onBookingCreated,
  onClose 
}: BookingFormProps) {
  const [formData, setFormData] = useState({
    weddingDate: '',
    location: '',
    amount: '',
    notes: '',
    customerName: 'Sarah & John',
    customerEmail: 'sarah.john@email.com',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/user/bookings/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendorId,
          serviceCategory,
          serviceName,
          ...formData,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create booking');
      }

      setSuccess(true);
      if (onBookingCreated) {
        onBookingCreated(result.data);
      }
    } catch (error) {
      console.error('Failed to create booking:', error);
      setError(error.message || 'Failed to create booking. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  if (success) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Booking Created Successfully!</h3>
        <p className="text-gray-600 mb-6">
          Your booking request has been sent to {vendorName}. They will contact you soon to confirm the details.
        </p>
        <div className="flex space-x-4 justify-center">
          <button
            onClick={() => {
              setSuccess(false);
              setFormData({
                weddingDate: '',
                location: '',
                amount: '',
                notes: '',
                customerName: 'Sarah & John',
                customerEmail: 'sarah.john@email.com',
              });
            }}
            className="btn-outline"
          >
            Create Another Booking
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="btn-primary"
            >
              Close
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Book {serviceName}</h3>
        <p className="text-gray-600">with {vendorName}</p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <div className="text-red-600 mr-3">❌</div>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="weddingDate" className="block text-sm font-medium text-gray-700 mb-2">
              Wedding Date *
            </label>
            <input
              type="date"
              id="weddingDate"
              name="weddingDate"
              value={formData.weddingDate}
              onChange={handleInputChange}
              required
              className="form-input w-full"
            />
          </div>

          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
              Wedding Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              placeholder="e.g., New York, NY"
              required
              className="form-input w-full"
            />
          </div>

          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Budget *
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleInputChange}
              placeholder="e.g., 2500"
              required
              min="0"
              step="0.01"
              className="form-input w-full"
            />
          </div>

          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 mb-2">
              Couple Names
            </label>
            <input
              type="text"
              id="customerName"
              name="customerName"
              value={formData.customerName}
              onChange={handleInputChange}
              placeholder="e.g., Sarah & John"
              className="form-input w-full"
            />
          </div>
        </div>

        <div>
          <label htmlFor="customerEmail" className="block text-sm font-medium text-gray-700 mb-2">
            Contact Email
          </label>
          <input
            type="email"
            id="customerEmail"
            name="customerEmail"
            value={formData.customerEmail}
            onChange={handleInputChange}
            placeholder="e.g., sarah.john@email.com"
            className="form-input w-full"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
            Special Requirements or Notes
          </label>
          <textarea
            id="notes"
            name="notes"
            value={formData.notes}
            onChange={handleInputChange}
            rows={4}
            placeholder="Tell the vendor about your specific needs, preferences, or any special requirements..."
            className="form-textarea w-full"
          />
        </div>

        <div className="flex space-x-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex-1"
          >
            {loading ? 'Creating Booking...' : 'Create Booking Request'}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="btn-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}


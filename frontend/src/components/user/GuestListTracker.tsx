'use client';

import React, { useState } from 'react';
import { useUserData, Guest } from '@/hooks/useUserData';

interface GuestListTrackerProps {
  userData: ReturnType<typeof useUserData>;
}

export function GuestListTracker({ userData }: GuestListTrackerProps) {
  const { guests, addGuest, updateGuest, deleteGuest, updateRSVP } = userData;
  const [showForm, setShowForm] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [filter, setFilter] = useState<'all' | 'attending' | 'declined' | 'pending'>('all');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    relationship: '',
    dietaryNeeds: '',
    plusOne: false,
    plusOneName: ''
  });

  const relationships = [
    'Family',
    'Friend',
    'Colleague',
    'Neighbor',
    'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.relationship) {
      return;
    }

    try {
      if (editingGuest) {
        await updateGuest(editingGuest.id, {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          relationship: formData.relationship,
          dietaryNeeds: formData.dietaryNeeds || undefined,
          plusOne: formData.plusOne,
          plusOneName: formData.plusOneName || undefined
        });
      } else {
        await addGuest({
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          relationship: formData.relationship,
          rsvpStatus: 'pending',
          dietaryNeeds: formData.dietaryNeeds || undefined,
          plusOne: formData.plusOne,
          plusOneName: formData.plusOneName || undefined
        });
      }

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        relationship: '',
        dietaryNeeds: '',
        plusOne: false,
        plusOneName: ''
      });
      setShowForm(false);
      setEditingGuest(null);
    } catch (err) {
      console.error('Error saving guest:', err);
    }
  };

  const handleEdit = (guest: Guest) => {
    setFormData({
      name: guest.name,
      email: guest.email || '',
      phone: guest.phone || '',
      relationship: guest.relationship,
      dietaryNeeds: guest.dietaryNeeds || '',
      plusOne: guest.plusOne,
      plusOneName: guest.plusOneName || ''
    });
    setEditingGuest(guest);
    setShowForm(true);
  };

  const handleDelete = async (guestId: string) => {
    if (confirm('Are you sure you want to delete this guest?')) {
      try {
        await deleteGuest(guestId);
      } catch (err) {
        console.error('Error deleting guest:', err);
      }
    }
  };

  const handleRSVPUpdate = async (guestId: string, status: Guest['rsvpStatus']) => {
    try {
      await updateRSVP(guestId, status);
    } catch (err) {
      console.error('Error updating RSVP:', err);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const filteredGuests = guests.filter(guest => {
    if (filter === 'all') return true;
    return guest.rsvpStatus === filter;
  });

  const totalGuests = guests.length;
  const attendingGuests = guests.filter(g => g.rsvpStatus === 'attending').length;
  const declinedGuests = guests.filter(g => g.rsvpStatus === 'declined').length;
  const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Guest List Tracker</h2>
            <p className="text-gray-600">
              Manage your guest list, track RSVPs, and handle dietary requirements.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-lg"
          >
            {showForm ? 'Cancel' : 'Add Guest'}
          </button>
        </div>
      </div>

      {/* Guest Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">👥</div>
          <h3 className="font-semibold text-gray-900">Total Guests</h3>
          <p className="text-2xl font-bold text-primary-600">{totalGuests}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-gray-900">Attending</h3>
          <p className="text-2xl font-bold text-green-600">{attendingGuests}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">❌</div>
          <h3 className="font-semibold text-gray-900">Declined</h3>
          <p className="text-2xl font-bold text-red-600">{declinedGuests}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <h3 className="font-semibold text-gray-900">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{pendingGuests}</p>
        </div>
      </div>

      {/* Guest Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingGuest ? 'Edit Guest' : 'Add New Guest'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter guest's full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="relationship" className="block text-sm font-semibold text-gray-700 mb-2">
                  Relationship *
                </label>
                <select
                  id="relationship"
                  name="relationship"
                  value={formData.relationship}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="">Select relationship</option>
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="guest@example.com"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            <div>
              <label htmlFor="dietaryNeeds" className="block text-sm font-semibold text-gray-700 mb-2">
                Dietary Requirements
              </label>
              <textarea
                id="dietaryNeeds"
                name="dietaryNeeds"
                value={formData.dietaryNeeds}
                onChange={handleInputChange}
                className="input w-full h-20"
                placeholder="Any dietary restrictions or allergies..."
              />
            </div>

            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="plusOne"
                  name="plusOne"
                  checked={formData.plusOne}
                  onChange={handleInputChange}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="plusOne" className="ml-2 text-sm font-medium text-gray-700">
                  Plus One
                </label>
              </div>

              {formData.plusOne && (
                <div>
                  <label htmlFor="plusOneName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Plus One Name
                  </label>
                  <input
                    type="text"
                    id="plusOneName"
                    name="plusOneName"
                    value={formData.plusOneName}
                    onChange={handleInputChange}
                    className="input w-full"
                    placeholder="Enter plus one's name"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingGuest(null);
                }}
                className="btn-outline btn-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-lg"
              >
                {editingGuest ? 'Update Guest' : 'Add Guest'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter and Guest List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900">Guest List</h3>
          <div className="flex space-x-2">
            {(['all', 'attending', 'declined', 'pending'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  filter === filterOption
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">👥</div>
              <p className="text-gray-600">No guests found for the selected filter.</p>
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <div key={guest.id} className="border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="font-semibold text-gray-900">{guest.name}</h4>
                      <span className="text-sm text-gray-500">({guest.relationship})</span>
                      {guest.plusOne && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          +1: {guest.plusOneName}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      {guest.email && (
                        <div>
                          <span className="font-medium">Email:</span> {guest.email}
                        </div>
                      )}
                      {guest.phone && (
                        <div>
                          <span className="font-medium">Phone:</span> {guest.phone}
                        </div>
                      )}
                      {guest.dietaryNeeds && (
                        <div>
                          <span className="font-medium">Dietary:</span> {guest.dietaryNeeds}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3">
                    {/* RSVP Status */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleRSVPUpdate(guest.id, 'attending')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          guest.rsvpStatus === 'attending'
                            ? 'bg-green-100 text-green-800'
                            : 'text-gray-600 hover:bg-green-50'
                        }`}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => handleRSVPUpdate(guest.id, 'declined')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          guest.rsvpStatus === 'declined'
                            ? 'bg-red-100 text-red-800'
                            : 'text-gray-600 hover:bg-red-50'
                        }`}
                      >
                        ✗
                      </button>
                      <button
                        onClick={() => handleRSVPUpdate(guest.id, 'pending')}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                          guest.rsvpStatus === 'pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'text-gray-600 hover:bg-yellow-50'
                        }`}
                      >
                        ?
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(guest)}
                        className="btn-outline btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(guest.id)}
                        className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

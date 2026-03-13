'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import toast from 'react-hot-toast';

interface CalendarEvent {
  id: string;
  title: string;
  customerName: string;
  serviceName: string;
  start: string;
  end: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  location: string;
  notes: string;
  color: string;
}

interface AvailabilitySlot {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  isRecurring: boolean;
  recurringDays: string[];
}

export default function VendorCalendarPage() {
  const { user, isVendor, logout } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showAvailabilityModal, setShowAvailabilityModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    customerName: '',
    serviceName: '',
    startTime: '',
    endTime: '',
    location: '',
    notes: '',
  });
  const [newAvailability, setNewAvailability] = useState({
    startTime: '',
    endTime: '',
    isRecurring: false,
    recurringDays: [] as string[],
  });



  useEffect(() => {
    const fetchCalendarData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock calendar events
        const mockEvents: CalendarEvent[] = [
          {
            id: '1',
            title: 'Wedding Photography - Sarah & John',
            customerName: 'Sarah & John Smith',
            serviceName: 'Wedding Photography Package',
            start: '2024-12-15T14:00:00',
            end: '2024-12-15T22:00:00',
            status: 'confirmed',
            location: 'Grand Ballroom, New York',
            notes: 'Focus on candid moments and family photos',
            color: 'bg-blue-500',
          },
          {
            id: '2',
            title: 'Engagement Session - Emily & Michael',
            customerName: 'Emily & Michael Johnson',
            serviceName: 'Engagement Session',
            start: '2024-10-20T16:00:00',
            end: '2024-10-20T18:00:00',
            status: 'confirmed',
            location: 'Central Park, New York',
            notes: 'Sunset photos preferred',
            color: 'bg-green-500',
          },
          {
            id: '3',
            title: 'Event Videography - Jessica & David',
            customerName: 'Jessica & David Wilson',
            serviceName: 'Event Videography',
            start: '2024-11-10T18:00:00',
            end: '2024-11-10T00:00:00',
            status: 'pending',
            location: 'Riverside Venue, Brooklyn',
            notes: 'Highlight reel and full ceremony video',
            color: 'bg-yellow-500',
          },
          {
            id: '4',
            title: 'Portrait Session - Lisa & Mark',
            customerName: 'Lisa & Mark Davis',
            serviceName: 'Portrait Photography',
            start: '2024-10-05T14:00:00',
            end: '2024-10-05T15:00:00',
            status: 'completed',
            location: 'Studio Location',
            notes: 'Family portraits',
            color: 'bg-gray-500',
          },
        ];

        // Mock availability slots
        const mockAvailability: AvailabilitySlot[] = [
          {
            id: '1',
            date: '2024-10-01',
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
            isRecurring: false,
            recurringDays: [],
          },
          {
            id: '2',
            date: '2024-10-02',
            startTime: '09:00',
            endTime: '17:00',
            isAvailable: true,
            isRecurring: false,
            recurringDays: [],
          },
        ];

        setEvents(mockEvents);
        setAvailability(mockAvailability);
      } catch (error) {
        console.error('Failed to fetch calendar data:', error);
        toast.error('Failed to load calendar data');
      } finally {
        setLoading(false);
      }
    };

    if (isVendor) {
      fetchCalendarData();
    }
  }, [isVendor]);

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => event.start.startsWith(dateStr));
  };

  const getAvailabilityForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return availability.find(slot => slot.date === dateStr);
  };

  const handleAddEvent = async () => {
    if (!selectedDate || !newEvent.title || !newEvent.startTime || !newEvent.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const event: CalendarEvent = {
        id: Date.now().toString(),
        title: newEvent.title,
        customerName: newEvent.customerName,
        serviceName: newEvent.serviceName,
        start: `${selectedDate}T${newEvent.startTime}:00`,
        end: `${selectedDate}T${newEvent.endTime}:00`,
        status: 'confirmed',
        location: newEvent.location,
        notes: newEvent.notes,
        color: 'bg-blue-500',
      };

      setEvents(prev => [...prev, event]);
      setShowAddEventModal(false);
      setNewEvent({
        title: '',
        customerName: '',
        serviceName: '',
        startTime: '',
        endTime: '',
        location: '',
        notes: '',
      });
      toast.success('Event added successfully!');
    } catch (error) {
      toast.error('Failed to add event');
    }
  };

  const handleAddAvailability = async () => {
    if (!selectedDate || !newAvailability.startTime || !newAvailability.endTime) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const slot: AvailabilitySlot = {
        id: Date.now().toString(),
        date: selectedDate,
        startTime: newAvailability.startTime,
        endTime: newAvailability.endTime,
        isAvailable: true,
        isRecurring: newAvailability.isRecurring,
        recurringDays: newAvailability.recurringDays,
      };

      setAvailability(prev => [...prev, slot]);
      setShowAvailabilityModal(false);
      setNewAvailability({
        startTime: '',
        endTime: '',
        isRecurring: false,
        recurringDays: [],
      });
      toast.success('Availability added successfully!');
    } catch (error) {
      toast.error('Failed to add availability');
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };



  if (!isVendor) {
    return null; // Will redirect if not vendor
  }

  const days = getDaysInMonth(currentDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Calendar & Availability', href: '/vendor/calendar' }
        ]} />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Calendar & <span className="gradient-text">Availability</span></h1>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowAddEventModal(true)}
              className="btn-primary btn-md"
            >
              + Add Event
            </button>
            <button
              onClick={() => setShowAvailabilityModal(true)}
              className="btn-secondary btn-md"
            >
              + Set Availability
            </button>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {/* Calendar Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="btn-ghost btn-md"
              >
                ←
              </button>
              <h2 className="text-2xl font-bold text-gray-900">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                onClick={() => navigateMonth('next')}
                className="btn-ghost btn-md"
              >
                →
              </button>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setView('month')}
                className={`btn-sm ${view === 'month' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Month
              </button>
              <button
                onClick={() => setView('week')}
                className={`btn-sm ${view === 'week' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Week
              </button>
              <button
                onClick={() => setView('day')}
                className={`btn-sm ${view === 'day' ? 'btn-primary' : 'btn-ghost'}`}
              >
                Day
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day Headers */}
            {dayNames.map(day => (
              <div key={day} className="p-2 text-center font-semibold text-gray-700 bg-gray-100 rounded">
                {day}
              </div>
            ))}
            
            {/* Calendar Days */}
            {days.map((day, index) => {
              if (!day) {
                return <div key={index} className="p-2 h-24"></div>;
              }
              
              const dayEvents = getEventsForDate(day);
              const dayAvailability = getAvailabilityForDate(day);
              const isToday = day.toDateString() === new Date().toDateString();
              const isPast = day < new Date() && !isToday;
              
              return (
                <div
                  key={day.toISOString()}
                  className={`p-2 h-24 border border-gray-200 rounded cursor-pointer hover:bg-gray-50 ${
                    isToday ? 'bg-blue-50 border-blue-300' : ''
                  } ${isPast ? 'bg-gray-50' : ''}`}
                  onClick={() => setSelectedDate(day.toISOString().split('T')[0])}
                >
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-blue-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {day.getDate()}
                  </div>
                  
                  {/* Events */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 2).map(event => (
                      <div
                        key={event.id}
                        className={`text-xs p-1 rounded truncate ${event.color} text-white`}
                        title={`${event.title} - ${event.customerName}`}
                      >
                        {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                  
                  {/* Availability Indicator */}
                  {dayAvailability && (
                    <div className="absolute bottom-1 right-1 w-2 h-2 bg-green-400 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="mt-6 flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded"></div>
              <span className="text-sm text-gray-600">Confirmed Events</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded"></div>
              <span className="text-sm text-gray-600">Pending Events</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-sm text-gray-600">Completed Events</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">Available</span>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Add New Event</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Event Title</label>
                    <input
                      type="text"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                      className="form-input w-full"
                      placeholder="Enter event title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="form-input w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                    <input
                      type="text"
                      value={newEvent.customerName}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, customerName: e.target.value }))}
                      className="form-input w-full"
                      placeholder="Enter customer name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
                    <input
                      type="text"
                      value={newEvent.serviceName}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, serviceName: e.target.value }))}
                      className="form-input w-full"
                      placeholder="Enter service name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={newEvent.location}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      className="form-input w-full"
                      placeholder="Enter location"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                    <textarea
                      value={newEvent.notes}
                      onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                      className="form-input w-full"
                      rows={3}
                      placeholder="Enter any notes"
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleAddEvent}
                  className="btn-primary btn-md sm:ml-3"
                >
                  Add Event
                </button>
                <button
                  onClick={() => setShowAddEventModal(false)}
                  className="btn-secondary btn-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Availability Modal */}
      {showAvailabilityModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Set Availability</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="form-input w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <input
                        type="time"
                        value={newAvailability.startTime}
                        onChange={(e) => setNewAvailability(prev => ({ ...prev, startTime: e.target.value }))}
                        className="form-input w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <input
                        type="time"
                        value={newAvailability.endTime}
                        onChange={(e) => setNewAvailability(prev => ({ ...prev, endTime: e.target.value }))}
                        className="form-input w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={newAvailability.isRecurring}
                        onChange={(e) => setNewAvailability(prev => ({ ...prev, isRecurring: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span className="ml-2 text-sm text-gray-700">Make this recurring</span>
                    </label>
                  </div>
                  {newAvailability.isRecurring && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recurring Days</label>
                      <div className="grid grid-cols-7 gap-2">
                        {dayNames.map(day => (
                          <label key={day} className="flex items-center">
                            <input
                              type="checkbox"
                              checked={newAvailability.recurringDays.includes(day)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setNewAvailability(prev => ({
                                    ...prev,
                                    recurringDays: [...prev.recurringDays, day]
                                  }));
                                } else {
                                  setNewAvailability(prev => ({
                                    ...prev,
                                    recurringDays: prev.recurringDays.filter(d => d !== day)
                                  }));
                                }
                              }}
                              className="form-checkbox"
                            />
                            <span className="ml-1 text-xs text-gray-700">{day}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleAddAvailability}
                  className="btn-primary btn-md sm:ml-3"
                >
                  Set Availability
                </button>
                <button
                  onClick={() => setShowAvailabilityModal(false)}
                  className="btn-secondary btn-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

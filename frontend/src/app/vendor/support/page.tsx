'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import toast from 'react-hot-toast';

interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'technical' | 'billing' | 'account' | 'feature_request' | 'other';
  createdAt: string;
  updatedAt: string;
  response?: string;
  responseDate?: string;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export default function VendorSupportPage() {
  const { user,  isVendor, logout } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'technical' as SupportTicket['category'],
    priority: 'medium' as SupportTicket['priority'],
  });



  useEffect(() => {
    const fetchSupportData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock support tickets
        const mockTickets: SupportTicket[] = [
          {
            id: '1',
            subject: 'Payment processing issue',
            description: 'I\'m having trouble receiving payments from customers. The payment status shows as pending but the customer says they paid.',
            status: 'in_progress',
            priority: 'high',
            category: 'billing',
            createdAt: '2024-09-24',
            updatedAt: '2024-09-25',
            response: 'We\'re investigating this payment issue. Our team is working with the payment processor to resolve this.',
            responseDate: '2024-09-25',
          },
          {
            id: '2',
            subject: 'Calendar sync problem',
            description: 'My calendar is not syncing properly with my Google Calendar. Some bookings are not showing up.',
            status: 'open',
            priority: 'medium',
            category: 'technical',
            createdAt: '2024-09-23',
            updatedAt: '2024-09-23',
          },
          {
            id: '3',
            subject: 'Feature request: Bulk messaging',
            description: 'It would be great to have a feature to send bulk messages to multiple customers at once.',
            status: 'resolved',
            priority: 'low',
            category: 'feature_request',
            createdAt: '2024-09-20',
            updatedAt: '2024-09-22',
            response: 'Thank you for the suggestion! We\'ve added this feature to our roadmap and will notify you when it\'s available.',
            responseDate: '2024-09-22',
          },
        ];

        // Mock FAQs
        const mockFaqs: FAQ[] = [
          {
            id: '1',
            question: 'How do I update my business profile?',
            answer: 'Go to the Profile Management section in your vendor dashboard. You can update your business information, services, and contact details there.',
            category: 'account',
          },
          {
            id: '2',
            question: 'How do I respond to quote requests?',
            answer: 'Navigate to the Quote Management section. You can view pending quote requests and respond with your pricing and availability.',
            category: 'technical',
          },
          {
            id: '3',
            question: 'When do I receive payments?',
            answer: 'Payments are typically processed within 2-3 business days after service completion. You can track payment status in the Payments section.',
            category: 'billing',
          },
          {
            id: '4',
            question: 'How do I set my availability?',
            answer: 'Use the Calendar & Availability section to set your available time slots. You can also set recurring availability patterns.',
            category: 'technical',
          },
          {
            id: '5',
            question: 'Can I customize my service packages?',
            answer: 'Yes! In the Services & Portfolio section, you can create custom service packages with different pricing and duration options.',
            category: 'account',
          },
        ];

        setTickets(mockTickets);
        setFaqs(mockFaqs);
      } catch (error) {
        console.error('Failed to fetch support data:', error);
        toast.error('Failed to load support data');
      } finally {
        setLoading(false);
      }
    };

    if (isVendor) {
      fetchSupportData();
    }
  }, [isVendor]);

  const handleSubmitTicket = async () => {
    if (!newTicket.subject || !newTicket.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const ticket: SupportTicket = {
        id: Date.now().toString(),
        subject: newTicket.subject,
        description: newTicket.description,
        status: 'open',
        priority: newTicket.priority,
        category: newTicket.category,
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString().split('T')[0],
      };

      setTickets(prev => [ticket, ...prev]);
      setShowNewTicketModal(false);
      setNewTicket({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'medium',
      });
      toast.success('Support ticket submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit support ticket');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-100 text-yellow-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'urgent': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  if (!isVendor) {
    return null; // Will redirect if not vendor
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Support Center', href: '/vendor/support' }
        ]} />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Support <span className="gradient-text">Center</span></h1>
          <button
            onClick={() => setShowNewTicketModal(true)}
            className="btn-primary btn-lg"
          >
            + New Support Ticket
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Support Tickets */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Your Support Tickets</h2>
              
              {tickets.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">🎫</div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No support tickets yet</h3>
                  <p className="text-gray-600 mb-4">Need help? Create your first support ticket.</p>
                  <button
                    onClick={() => setShowNewTicketModal(true)}
                    className="btn-primary btn-md"
                  >
                    Create Ticket
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {tickets.map((ticket) => (
                    <div key={ticket.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900 mb-1">{ticket.subject}</h3>
                          <p className="text-sm text-gray-600 mb-2">{ticket.description}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                            {ticket.status.replace('_', ' ')}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <span>Category: {ticket.category.replace('_', ' ')}</span>
                        <span>Created: {new Date(ticket.createdAt).toLocaleDateString()}</span>
                      </div>
                      
                      {ticket.response && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <span className="text-sm font-medium text-gray-900">Support Response</span>
                            <span className="mx-2 text-gray-400">•</span>
                            <span className="text-sm text-gray-600">
                              {ticket.responseDate ? new Date(ticket.responseDate).toLocaleDateString() : 'Recently'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{ticket.response}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FAQ and Quick Help */}
          <div className="space-y-6">
            {/* Quick Help */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Help</h2>
              <div className="space-y-3">
                <a href="/help" className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">❓</span>
                    <div>
                      <div className="font-medium text-gray-900">Help Center</div>
                      <div className="text-sm text-gray-600">Browse all help articles</div>
                    </div>
                  </div>
                </a>
                
                <a href="/contact" className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">📞</span>
                    <div>
                      <div className="font-medium text-gray-900">Contact Support</div>
                      <div className="text-sm text-gray-600">Get in touch with our team</div>
                    </div>
                  </div>
                </a>
                
                <a href="/vendor/settings" className="block p-3 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">⚙️</span>
                    <div>
                      <div className="font-medium text-gray-900">Account Settings</div>
                      <div className="text-sm text-gray-600">Manage your account</div>
                    </div>
                  </div>
                </a>
              </div>
            </div>

            {/* FAQ */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-4">
                {faqs.map((faq) => (
                  <div key={faq.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                    <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                    <p className="text-sm text-gray-600">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-white rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📧</span>
                  <div>
                    <div className="font-medium text-gray-900">Email Support</div>
                    <div className="text-sm text-gray-600">support@idealweddings.com</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-2xl mr-3">📞</span>
                  <div>
                    <div className="font-medium text-gray-900">Phone Support</div>
                    <div className="text-sm text-gray-600">+1 (555) 123-4567</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <span className="text-2xl mr-3">⏰</span>
                  <div>
                    <div className="font-medium text-gray-900">Support Hours</div>
                    <div className="text-sm text-gray-600">Mon-Fri 9AM-6PM EST</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create Support Ticket</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                    <input
                      type="text"
                      value={newTicket.subject}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
                      className="form-input w-full"
                      placeholder="Brief description of your issue"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      value={newTicket.category}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, category: e.target.value as SupportTicket['category'] }))}
                      className="form-select w-full"
                    >
                      <option value="technical">Technical Issue</option>
                      <option value="billing">Billing & Payments</option>
                      <option value="account">Account Management</option>
                      <option value="feature_request">Feature Request</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select
                      value={newTicket.priority}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, priority: e.target.value as SupportTicket['priority'] }))}
                      className="form-select w-full"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={newTicket.description}
                      onChange={(e) => setNewTicket(prev => ({ ...prev, description: e.target.value }))}
                      className="form-input w-full"
                      rows={4}
                      placeholder="Please provide detailed information about your issue..."
                      required
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleSubmitTicket}
                  className="btn-primary btn-md sm:ml-3"
                >
                  Submit Ticket
                </button>
                <button
                  onClick={() => setShowNewTicketModal(false)}
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

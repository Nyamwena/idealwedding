'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminPagination } from '@/components/admin/AdminPagination';

interface SupportTicket {
  id: string;
  subject: string;
  userEmail: string;
  userName: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  createdAt: string;
  lastUpdated: string;
  message: string;
  assignedTo?: string | null;
  replies?: Array<{
    id: string;
    message: string;
    author: string;
    timestamp: string;
  }>;
}

export default function AdminSupportPage() {
  const { user,  isAdmin, logout } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);



  useEffect(() => {
    if (isAdmin) {
      loadSupportTickets();
    }
  }, [isAdmin]);

  const loadSupportTickets = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/admin/support');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load support tickets');
      }
      
      setTickets(result.data || []);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      setError(error instanceof Error ? error.message : 'Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleViewTicket = (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setShowTicketModal(true);
  };

  const handleTicketAction = async (ticketId: string, action: string, data: any = {}) => {
    try {
      setActionLoading(`${ticketId}-${action}`);
      
      const response = await fetch(`/api/admin/support/${ticketId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, ...data }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update ticket');
      }
      
      // Reload tickets to get updated data
      await loadSupportTickets();
      
      // Update selected ticket if it's the one being modified
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket(result.data);
      }
      
    } catch (error) {
      console.error('Error updating ticket:', error);
      setError(error instanceof Error ? error.message : 'Failed to update ticket');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAssignTicket = (ticket: SupportTicket) => {
    handleTicketAction(ticket.id, 'assign', { assignedTo: 'admin@idealweddings.com' });
  };

  const handleUpdateStatus = (ticket: SupportTicket, newStatus: string) => {
    handleTicketAction(ticket.id, 'update_status', { status: newStatus });
  };

  const handleUpdatePriority = (ticket: SupportTicket, newPriority: string) => {
    handleTicketAction(ticket.id, 'update_priority', { priority: newPriority });
  };

  const handleReplyToTicket = (ticket: SupportTicket, reply: string) => {
    handleTicketAction(ticket.id, 'reply', { reply });
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || ticket.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / itemsPerPage));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [filteredTickets, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  const getStatusBadge = (status: string) => {
    const styles = {
      open: 'bg-red-100 text-red-800',
      'in-progress': 'bg-yellow-100 text-yellow-800',
      resolved: 'bg-green-100 text-green-800',
      closed: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityBadge = (priority: string) => {
    const styles = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      urgent: 'bg-red-100 text-red-800'
    };
    return styles[priority as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      'Technical Issue': '🔧',
      'Account Issue': '👤',
      'Payment Issue': '💳',
      'Feature Request': '💡'
    };
    return icons[category as keyof typeof icons] || '📋';
  };



  if (!isAdmin) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Support Center</h1>
            <p className="text-gray-600">Manage support tickets and help requests</p>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={loadSupportTickets}
              disabled={loading}
              className={`btn-outline ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Refreshing...' : '🔄 Refresh'}
            </button>
            <Link href="/admin" className="btn-outline">
              ← Back to Admin Dashboard
            </Link>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">❌</div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search Tickets</label>
              <input
                type="text"
                placeholder="Search by subject, user, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in-progress">In Progress</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{ticket.id} {ticket.subject}
                        </div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {ticket.message}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {ticket.userName}
                        </div>
                        <div className="text-sm text-gray-500">{ticket.userEmail}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getCategoryIcon(ticket.category)}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {ticket.category}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityBadge(ticket.priority)}`}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(ticket.status)}`}>
                        {ticket.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {ticket.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleViewTicket(ticket)}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        {ticket.status === 'open' && (
                          <button 
                            onClick={() => handleAssignTicket(ticket)}
                            disabled={actionLoading === `${ticket.id}-assign`}
                            className={`text-green-600 hover:text-green-900 ${actionLoading === `${ticket.id}-assign` ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === `${ticket.id}-assign` ? 'Assigning...' : 'Assign'}
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setSelectedTicket(ticket);
                            setShowTicketModal(true);
                          }}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Reply
                        </button>
                        {ticket.status === 'in-progress' && (
                          <button 
                            onClick={() => handleUpdateStatus(ticket, 'resolved')}
                            disabled={actionLoading === `${ticket.id}-update_status`}
                            className={`text-blue-600 hover:text-blue-900 ${actionLoading === `${ticket.id}-update_status` ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {actionLoading === `${ticket.id}-update_status` ? 'Updating...' : 'Resolve'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <AdminPagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredTickets.length}
          itemsPerPage={itemsPerPage}
          onPageChange={(page) => {
            if (page < 1 || page > totalPages) return;
            setCurrentPage(page);
          }}
          onItemsPerPageChange={(items) => {
            setItemsPerPage(items);
            setCurrentPage(1);
          }}
        />

        {/* Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {tickets.filter(t => t.status === 'open').length}
            </div>
            <div className="text-gray-600">Open Tickets</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {tickets.filter(t => t.status === 'in-progress').length}
            </div>
            <div className="text-gray-600">In Progress</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {tickets.filter(t => t.priority === 'urgent').length}
            </div>
            <div className="text-gray-600">Urgent</div>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg text-center">
            <div className="text-2xl font-bold text-gray-900 mb-2">
              {tickets.length}
            </div>
            <div className="text-gray-600">Total Tickets</div>
          </div>
        </div>

        {/* Ticket Details Modal */}
        {showTicketModal && selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Ticket #{selectedTicket.id}
                  </h2>
                  <p className="text-lg text-gray-600">{selectedTicket.subject}</p>
                </div>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Ticket Details</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">User:</span> {selectedTicket.userName}</div>
                    <div><span className="font-medium">Email:</span> {selectedTicket.userEmail}</div>
                    <div><span className="font-medium">Category:</span> {selectedTicket.category}</div>
                    <div><span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getPriorityBadge(selectedTicket.priority)}`}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <div><span className="font-medium">Status:</span> 
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${getStatusBadge(selectedTicket.status)}`}>
                        {selectedTicket.status}
                      </span>
                    </div>
                    <div><span className="font-medium">Created:</span> {new Date(selectedTicket.createdAt).toLocaleString()}</div>
                    <div><span className="font-medium">Last Updated:</span> {new Date(selectedTicket.lastUpdated).toLocaleString()}</div>
                    {selectedTicket.assignedTo && (
                      <div><span className="font-medium">Assigned To:</span> {selectedTicket.assignedTo}</div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Actions</h3>
                  <div className="space-y-2">
                    {selectedTicket.status === 'open' && (
                      <button
                        onClick={() => handleAssignTicket(selectedTicket)}
                        disabled={actionLoading === `${selectedTicket.id}-assign`}
                        className={`w-full btn-outline ${actionLoading === `${selectedTicket.id}-assign` ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading === `${selectedTicket.id}-assign` ? 'Assigning...' : 'Assign to Me'}
                      </button>
                    )}
                    
                    {selectedTicket.status === 'in-progress' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedTicket, 'resolved')}
                        disabled={actionLoading === `${selectedTicket.id}-update_status`}
                        className={`w-full btn-primary ${actionLoading === `${selectedTicket.id}-update_status` ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading === `${selectedTicket.id}-update_status` ? 'Updating...' : 'Mark as Resolved'}
                      </button>
                    )}
                    
                    {selectedTicket.priority !== 'urgent' && (
                      <button
                        onClick={() => handleUpdatePriority(selectedTicket, 'urgent')}
                        disabled={actionLoading === `${selectedTicket.id}-update_priority`}
                        className={`w-full btn-outline ${actionLoading === `${selectedTicket.id}-update_priority` ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {actionLoading === `${selectedTicket.id}-update_priority` ? 'Updating...' : 'Mark as Urgent'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">Original Message</h3>
                <p className="text-gray-700">{selectedTicket.message}</p>
              </div>

              {/* Replies Section */}
              {selectedTicket.replies && selectedTicket.replies.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Replies ({selectedTicket.replies.length})</h3>
                  <div className="space-y-4">
                    {selectedTicket.replies.map((reply) => (
                      <div key={reply.id} className="bg-white p-3 rounded border-l-4 border-primary-500">
                        <div className="flex justify-between items-start mb-2">
                          <span className="font-medium text-gray-900">{reply.author}</span>
                          <span className="text-sm text-gray-500">{new Date(reply.timestamp).toLocaleString()}</span>
                        </div>
                        <p className="text-gray-700">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-4">Add Reply</h3>
                <textarea
                  id="replyMessage"
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-4"
                  placeholder="Type your reply here..."
                />
                <div className="flex space-x-4">
                  <button
                    onClick={() => {
                      const replyInput = document.getElementById('replyMessage') as HTMLTextAreaElement;
                      if (replyInput && replyInput.value.trim()) {
                        handleReplyToTicket(selectedTicket, replyInput.value);
                        replyInput.value = '';
                      }
                    }}
                    className="btn-primary"
                  >
                    Send Reply
                  </button>
                  <button
                    onClick={() => setShowTicketModal(false)}
                    className="btn-outline"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}

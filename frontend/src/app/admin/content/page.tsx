'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

interface Content {
  id: string;
  title: string;
  type: 'blog_post' | 'faq' | 'page' | 'announcement';
  status: 'published' | 'draft' | 'archived';
  author: string;
  publishDate: string;
  views: number;
  category: string;
  content: string;
  slug: string;
  tags: string[];
  featuredImage?: string;
  metaDescription: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminContentPage() {
  const { user, isAdmin, logout } = useAuth();
  const router = useRouter();
  const [content, setContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [showContentModal, setShowContentModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');



  useEffect(() => {
    loadContent();
  }, []);

  const loadContent = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/content');
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to load content');
      }
      
      setContent(result.data);
    } catch (error) {
      console.error('Error loading content:', error);
      setError(error instanceof Error ? error.message : 'Failed to load content');
      // Fallback to empty array if API fails
      setContent([]);
    } finally {
      setLoading(false);
    }
  };

  const handleContentAction = async (contentId: string, action: string) => {
    setActionLoading(contentId);
    setError(null);
    setSuccessMessage(null);

    try {
      let newStatus = '';
      switch (action) {
        case 'publish':
          newStatus = 'published';
          break;
        case 'draft':
          newStatus = 'draft';
          break;
        case 'archive':
          newStatus = 'archived';
          break;
        default:
          return;
      }

      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || `Failed to ${action} content`);
      }

      setSuccessMessage(`Content ${action}ed successfully!`);
      loadContent(); // Reload content to reflect changes
    } catch (error) {
      console.error(`Error ${action}ing content:`, error);
      setError(error instanceof Error ? error.message : `Failed to ${action} content`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewContent = (contentItem: Content) => {
    setSelectedContent(contentItem);
    setShowContentModal(true);
  };

  const handleEditContent = (contentId: string) => {
    router.push(`/admin/content/${contentId}/edit`);
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm('Are you sure you want to delete this content? This action cannot be undone.')) {
      return;
    }

    setActionLoading(contentId);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch(`/api/admin/content/${contentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete content');
      }

      setSuccessMessage('Content deleted successfully!');
      loadContent(); // Reload content to reflect changes
    } catch (error) {
      console.error('Error deleting content:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete content');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const filteredContent = content.filter(
    (c) =>
      (c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.category.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (typeFilter === 'all' || c.type === typeFilter) &&
      (statusFilter === 'all' || c.status === statusFilter)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog_post': return '📝';
      case 'faq': return '❓';
      case 'page': return '📄';
      case 'announcement': return '📢';
      default: return '📄';
    }
  };



  if (!isAdmin) {
    return null; // Will redirect if not admin
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-5xl">
            Content <span className="gradient-text">Management</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage blog posts, pages, FAQs, and platform announcements.
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-green-600 mr-3">✅</div>
              <p className="text-green-800">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">❌</div>
              <p className="text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link href="/admin/content/new" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="text-2xl mb-2">📝</div>
            <h3 className="font-semibold text-gray-900">New Blog Post</h3>
            <p className="text-sm text-gray-600">Create a new blog article</p>
          </Link>
          
          <Link href="/admin/content/new" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="text-2xl mb-2">❓</div>
            <h3 className="font-semibold text-gray-900">Add FAQ</h3>
            <p className="text-sm text-gray-600">Create new FAQ entry</p>
          </Link>
          
          <Link href="/admin/content/new" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="text-2xl mb-2">📄</div>
            <h3 className="font-semibold text-gray-900">New Page</h3>
            <p className="text-sm text-gray-600">Create static page</p>
          </Link>
          
          <Link href="/admin/content/new" className="bg-white rounded-xl p-4 shadow-lg hover:shadow-xl transition-shadow text-left">
            <div className="text-2xl mb-2">📢</div>
            <h3 className="font-semibold text-gray-900">Announcement</h3>
            <p className="text-sm text-gray-600">Post platform update</p>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0">
            <input
              type="text"
              placeholder="Search content..."
              className="form-input w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="flex space-x-4">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="blog_post">Blog Posts</option>
                <option value="faq">FAQs</option>
                <option value="page">Pages</option>
                <option value="announcement">Announcements</option>
              </select>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Author
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Views
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th scope="col" className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredContent.map((c) => (
                  <tr key={c.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{c.title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <span className="flex items-center">
                        <span className="mr-2">{getTypeIcon(c.type)}</span>
                        {c.type.replace('_', ' ').toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.author}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.views.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{c.publishDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewContent(c)}
                          className="text-blue-600 hover:text-blue-900"
                          disabled={actionLoading === c.id}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditContent(c.id)}
                          className="text-primary-600 hover:text-primary-900"
                          disabled={actionLoading === c.id}
                        >
                          Edit
                        </button>
                        {c.status !== 'published' && (
                          <button
                            onClick={() => handleContentAction(c.id, 'publish')}
                            className="text-green-600 hover:text-green-900"
                            disabled={actionLoading === c.id}
                          >
                            {actionLoading === c.id ? 'Processing...' : 'Publish'}
                          </button>
                        )}
                        {c.status !== 'draft' && (
                          <button
                            onClick={() => handleContentAction(c.id, 'draft')}
                            className="text-yellow-600 hover:text-yellow-900"
                            disabled={actionLoading === c.id}
                          >
                            {actionLoading === c.id ? 'Processing...' : 'Draft'}
                          </button>
                        )}
                        {c.status !== 'archived' && (
                          <button
                            onClick={() => handleContentAction(c.id, 'archive')}
                            className="text-gray-600 hover:text-gray-900"
                            disabled={actionLoading === c.id}
                          >
                            {actionLoading === c.id ? 'Processing...' : 'Archive'}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteContent(c.id)}
                          className="text-red-600 hover:text-red-900"
                          disabled={actionLoading === c.id}
                        >
                          {actionLoading === c.id ? 'Processing...' : 'Delete'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Content Details Modal */}
        {showContentModal && selectedContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Content Details</h2>
                <button
                  onClick={() => setShowContentModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Title</h3>
                    <p className="text-gray-700">{selectedContent.title}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Type</h3>
                    <p className="text-gray-700">{selectedContent.type.replace('_', ' ').toUpperCase()}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Status</h3>
                    <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(selectedContent.status)}`}>
                      {selectedContent.status}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Author</h3>
                    <p className="text-gray-700">{selectedContent.author}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Category</h3>
                    <p className="text-gray-700">{selectedContent.category}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Views</h3>
                    <p className="text-gray-700">{selectedContent.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Published</h3>
                    <p className="text-gray-700">{selectedContent.publishDate}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Created</h3>
                    <p className="text-gray-700">{new Date(selectedContent.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedContent.tags && selectedContent.tags.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedContent.tags.map((tag, index) => (
                        <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedContent.metaDescription && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Meta Description</h3>
                    <p className="text-gray-700">{selectedContent.metaDescription}</p>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Preview</h3>
                  <div className="bg-gray-50 p-4 rounded-lg max-h-60 overflow-y-auto">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedContent.content.substring(0, 500)}
                      {selectedContent.content.length > 500 && '...'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-8">
                <button
                  onClick={() => setShowContentModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setShowContentModal(false);
                    handleEditContent(selectedContent.id);
                  }}
                  className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                >
                  Edit Content
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

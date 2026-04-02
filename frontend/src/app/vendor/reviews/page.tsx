'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { AdminPagination } from '@/components/admin/AdminPagination';
import toast from 'react-hot-toast';

interface Review {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  rating: number;
  title: string;
  comment: string;
  response: string;
  responseDate: string;
  isPublic: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReviewStats {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    5: number;
    4: number;
    3: number;
    2: number;
    1: number;
  };
  responseRate: number;
  recentRating: number;
}

export default function VendorReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    responseRate: 0,
    recentRating: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [responseFilter, setResponseFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [showResponseModal, setShowResponseModal] = useState(false);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [responseText, setResponseText] = useState('');



  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/vendor/reviews', { credentials: 'include', cache: 'no-store' });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to load reviews');

        const list = (json.data || []) as Review[];
        setReviews(list);

        const totalReviews = list.length;
        const averageRating =
          totalReviews > 0 ? list.reduce((sum, review) => sum + review.rating, 0) / totalReviews : 0;
        const ratingDistribution = {
          5: list.filter((r) => r.rating === 5).length,
          4: list.filter((r) => r.rating === 4).length,
          3: list.filter((r) => r.rating === 3).length,
          2: list.filter((r) => r.rating === 2).length,
          1: list.filter((r) => r.rating === 1).length,
        };
        const respondedReviews = list.filter((r) => r.response).length;
        const responseRate = totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0;
        const recentList = list.filter((r) => {
          const reviewDate = new Date(r.createdAt);
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          return reviewDate >= thirtyDaysAgo;
        });
        const recentRating =
          recentList.length > 0
            ? recentList.reduce((sum, review) => sum + review.rating, 0) / recentList.length
            : 0;

        setStats({
          averageRating,
          totalReviews,
          ratingDistribution,
          responseRate,
          recentRating,
        });
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
        toast.error('Failed to load reviews');
        setReviews([]);
        setStats({
          averageRating: 0,
          totalReviews: 0,
          ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
          responseRate: 0,
          recentRating: 0,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.serviceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'all' || review.rating.toString() === ratingFilter;
    const matchesResponse = responseFilter === 'all' || 
                           (responseFilter === 'responded' && review.response) ||
                           (responseFilter === 'not_responded' && !review.response);
    
    return matchesSearch && matchesRating && matchesResponse;
  });

  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const paginatedReviews = filteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleResponseSubmit = async () => {
    if (!selectedReview || !responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }

    try {
      const res = await fetch('/api/vendor/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          testimonialId: selectedReview.id,
          vendorResponse: responseText.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Failed to save');
      }
      const updated = json.data as Review;
      setReviews((prev) => {
        const next = prev.map((review) => (review.id === selectedReview.id ? updated : review));
        const respondedCount = next.filter((r) => r.response).length;
        setStats((s) => ({
          ...s,
          responseRate: next.length > 0 ? (respondedCount / next.length) * 100 : 0,
        }));
        return next;
      });

      setShowResponseModal(false);
      setSelectedReview(null);
      setResponseText('');
      toast.success('Response submitted successfully!');
    } catch (error) {
      toast.error('Failed to submit response');
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span
        key={i}
        className={`text-lg ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        ★
      </span>
    ));
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Reviews & Ratings', href: '/vendor/reviews' }
        ]} />
        
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Reviews & <span className="gradient-text">Ratings</span></h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {filteredReviews.filter(r => !r.response).length} reviews need response
            </span>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageRating.toFixed(1)}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <span className="text-yellow-600 text-xl">⭐</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex">
                {renderStars(Math.round(stats.averageRating))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalReviews}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <span className="text-blue-600 text-xl">📝</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-blue-600">All time reviews</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-gray-900">{stats.responseRate.toFixed(0)}%</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <span className="text-green-600 text-xl">💬</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-green-600">Reviews responded to</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Rating</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentRating.toFixed(1)}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <span className="text-purple-600 text-xl">📊</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-sm text-purple-600">Last 30 days</span>
            </div>
          </div>
        </div>

        {/* Rating Distribution */}
        <div className="bg-white rounded-2xl p-6 shadow-lg mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Rating Distribution</h2>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center">
                  <div className="flex items-center w-16">
                    <span className="text-sm font-medium text-gray-700 mr-2">{rating}</span>
                    <span className="text-yellow-400">★</span>
                  </div>
                  <div className="flex-1 mx-4">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="w-12 text-right">
                    <span className="text-sm text-gray-600">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          {/* Filters */}
          <div className="flex flex-col md:flex-row justify-between items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
            <input
              type="text"
              placeholder="Search reviews..."
              className="form-input w-full md:w-1/3"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            />
            <div className="flex space-x-4 w-full md:w-auto">
              <select
                className="form-select flex-1"
                value={ratingFilter}
                onChange={(e) => { setRatingFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <select
                className="form-select flex-1"
                value={responseFilter}
                onChange={(e) => { setResponseFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">All Reviews</option>
                <option value="responded">Responded</option>
                <option value="not_responded">Not Responded</option>
              </select>
            </div>
          </div>

          {/* Reviews List */}
          <div className="space-y-6">
            {paginatedReviews.map((review) => (
              <div key={review.id} className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 mr-4">{review.title}</h3>
                      <div className="flex">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <span className="font-medium">{review.customerName}</span>
                      <span className="mx-2">•</span>
                      <span>{review.serviceName}</span>
                      <span className="mx-2">•</span>
                      <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      {review.isVerified && (
                        <>
                          <span className="mx-2">•</span>
                          <span className="text-green-600 font-medium">Verified</span>
                        </>
                      )}
                    </div>
                    <p className="text-gray-700 mb-4">{review.comment}</p>
                  </div>
                </div>

                {review.response ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium text-gray-900">Your Response</span>
                      <span className="mx-2 text-gray-400">•</span>
                      <span className="text-sm text-gray-600">
                        {new Date(review.responseDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700">{review.response}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">No response yet</span>
                    <button
                      onClick={() => {
                        setSelectedReview(review);
                        setResponseText('');
                        setShowResponseModal(true);
                      }}
                      className="btn-primary btn-sm"
                    >
                      Respond
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          <AdminPagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredReviews.length}
            onPageChange={setCurrentPage}
            itemsPerPage={itemsPerPage}
            onItemsPerPageChange={(itemsPerPage) => {
              setItemsPerPage(itemsPerPage);
              setCurrentPage(1);
            }}
          />
        </div>
      </main>
      
      <Footer />

      {/* Response Modal */}
      {showResponseModal && selectedReview && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Respond to Review</h3>
                
                {/* Review Details */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center mb-2">
                    <div className="flex">
                      {renderStars(selectedReview.rating)}
                    </div>
                    <span className="ml-2 text-sm text-gray-600">{selectedReview.customerName}</span>
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedReview.title}</h4>
                  <p className="text-gray-700 text-sm">{selectedReview.comment}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Your Response</label>
                  <textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    className="form-input w-full"
                    rows={4}
                    placeholder="Write your response to this review..."
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Your response will be visible to the customer and other potential clients.
                  </p>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  onClick={handleResponseSubmit}
                  className="btn-primary btn-md sm:ml-3"
                >
                  Submit Response
                </button>
                <button
                  onClick={() => setShowResponseModal(false)}
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

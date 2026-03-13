'use client';

import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const helpCategories = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      icon: '🚀',
      articles: [
        { title: 'How to create an account', description: 'Step-by-step guide to creating your Ideal Weddings account' },
        { title: 'Setting up your profile', description: 'Complete your profile to get the best matches' },
        { title: 'Finding vendors', description: 'Learn how to search and filter vendors' },
        { title: 'Making your first booking', description: 'How to book a vendor for your wedding' },
      ]
    },
    {
      id: 'account',
      title: 'Account & Profile',
      icon: '👤',
      articles: [
        { title: 'Updating your profile', description: 'How to edit your personal information' },
        { title: 'Changing your password', description: 'Secure your account with a new password' },
        { title: 'Account settings', description: 'Manage your account preferences' },
        { title: 'Deleting your account', description: 'How to permanently delete your account' },
      ]
    },
    {
      id: 'bookings',
      title: 'Bookings & Payments',
      icon: '💳',
      articles: [
        { title: 'How to make a booking', description: 'Complete guide to booking vendors' },
        { title: 'Payment methods', description: 'Accepted payment options and security' },
        { title: 'Canceling bookings', description: 'How to cancel or modify your bookings' },
        { title: 'Refund policy', description: 'Understanding our refund process' },
      ]
    },
    {
      id: 'vendors',
      title: 'Vendor Services',
      icon: '🏢',
      articles: [
        { title: 'Becoming a vendor', description: 'How to join as a wedding vendor' },
        { title: 'Vendor verification', description: 'Our verification process for vendors' },
        { title: 'Managing listings', description: 'How to update your vendor profile' },
        { title: 'Vendor dashboard', description: 'Using the vendor management tools' },
      ]
    },
    {
      id: 'technical',
      title: 'Technical Support',
      icon: '🛠️',
      articles: [
        { title: 'Browser compatibility', description: 'Supported browsers and devices' },
        { title: 'Mobile app issues', description: 'Troubleshooting mobile app problems' },
        { title: 'Upload problems', description: 'Issues with file uploads and images' },
        { title: 'Performance issues', description: 'Slow loading and performance problems' },
      ]
    }
  ];

  const filteredCategories = helpCategories.filter(category => 
    selectedCategory === 'all' || category.id === selectedCategory
  );

  const filteredArticles = filteredCategories.flatMap(category => 
    category.articles.filter(article =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-6xl">
            Help <span className="gradient-text">Center</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Find answers to your questions and get the support you need for your wedding planning journey.
          </p>
        </div>

        {/* Search */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="relative">
            <input
              type="text"
              placeholder="Search help articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input w-full pl-12 pr-4"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
              <span className="text-gray-400">🔍</span>
            </div>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full font-medium transition-colors ${
              selectedCategory === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-300'
            }`}
          >
            All Categories
          </button>
          {helpCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:border-primary-300'
              }`}
            >
              {category.icon} {category.title}
            </button>
          ))}
        </div>

        {/* Help Articles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
              <h3 className="text-lg font-bold text-gray-900 mb-3">{article.title}</h3>
              <p className="text-gray-600 mb-4">{article.description}</p>
              <button className="text-primary-600 hover:text-primary-700 font-medium">
                Read More →
              </button>
            </div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-600">Try adjusting your search terms or category filter.</p>
          </div>
        )}

        {/* Contact Support */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to help.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="btn-primary btn-lg">
                📞 Contact Support
              </a>
              <a href="/contact" className="btn-secondary btn-lg">
                💬 Live Chat
              </a>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
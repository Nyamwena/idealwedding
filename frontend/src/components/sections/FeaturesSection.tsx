'use client';

import React from 'react';
import Link from 'next/link';

export function FeaturesSection() {
  const features = [
    {
      title: 'Vendor Management',
      description: 'Connect with verified wedding vendors and manage your bookings efficiently.',
      icon: '🎭',
      color: 'from-pink-500 to-rose-500',
    },
    {
      title: 'Guest Management',
      description: 'Track RSVPs, manage guest lists, and organize seating arrangements.',
      icon: '👥',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      title: 'Budget Tracking',
      description: 'Keep track of your wedding budget with detailed expense management.',
      icon: '💰',
      color: 'from-green-500 to-emerald-500',
    },
    {
      title: 'Timeline Planning',
      description: 'Create and manage your wedding timeline with automated reminders.',
      icon: '📅',
      color: 'from-purple-500 to-violet-500',
    },
    {
      title: 'Wedding Website',
      description: 'Create a beautiful wedding website to share details with guests.',
      icon: '🌐',
      color: 'from-cyan-500 to-blue-500',
    },
  ];

  return (
    <section className="section-padding bg-white">
      <div className="container-modern">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 lg:text-5xl">
            Everything You Need for Your{' '}
            <span className="gradient-text">Perfect Wedding</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto lg:text-2xl">
            Our comprehensive platform provides all the tools and features you need to plan and execute your dream wedding.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="feature-card group hover-lift animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`text-5xl mb-6 bg-gradient-to-r ${feature.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {feature.description}
              </p>
              <Link
                href="/features"
                className="mt-6 inline-flex items-center text-primary-600 font-semibold group-hover:translate-x-2 transition-transform duration-300 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 rounded"
              >
                Learn more
                <span className="ml-2 text-xl" aria-hidden>
                  →
                </span>
              </Link>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="stat-card hover-lift">
            <div className="text-4xl font-bold mb-2">10,000+</div>
            <div className="text-primary-100">Happy Couples</div>
          </div>
          <div className="stat-card hover-lift" style={{ background: 'linear-gradient(135deg, #d946ef, #a855f7)' }}>
            <div className="text-4xl font-bold mb-2">500+</div>
            <div className="text-purple-100">Verified Vendors</div>
          </div>
          <div className="stat-card hover-lift" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
            <div className="text-4xl font-bold mb-2">4.9/5</div>
            <div className="text-green-100">User Rating</div>
          </div>
        </div>
      </div>
    </section>
  );
}

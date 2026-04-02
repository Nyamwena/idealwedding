'use client';

import React from 'react';
import Link from 'next/link';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Create Your Account',
      description: 'Sign up and create your personalized wedding planning profile.',
      icon: '👤',
      color: 'from-blue-500 to-indigo-500',
    },
    {
      number: '02',
      title: 'Set Your Preferences',
      description: 'Tell us about your dream wedding, budget, and preferences.',
      icon: '⚙️',
      color: 'from-purple-500 to-violet-500',
    },
    {
      number: '03',
      title: 'Connect with Vendors',
      description: 'Browse and connect with verified wedding vendors in your area.',
      icon: '🤝',
      color: 'from-green-500 to-emerald-500',
    },
    {
      number: '04',
      title: 'Plan & Organize',
      description: 'Use our tools to manage guests, budget, and timeline.',
      icon: '📋',
      color: 'from-orange-500 to-red-500',
    },
    {
      number: '05',
      title: 'Execute Your Wedding',
      description: 'Enjoy your special day with everything perfectly organized.',
      icon: '💒',
      color: 'from-pink-500 to-rose-500',
    },
  ];

  return (
    <section className="section-padding bg-gradient-to-br from-primary-50 via-white to-secondary-50 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-gentle"></div>
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-bounce-gentle" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="container-modern relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-6 lg:text-5xl">
            How It <span className="gradient-text">Works</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto lg:text-2xl">
            Planning your wedding has never been easier. Follow these simple steps to create your perfect day.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover-lift animate-fade-in group"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className={`absolute -top-4 -left-4 w-16 h-16 bg-gradient-to-r ${step.color} text-white rounded-2xl flex items-center justify-center font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                {step.number}
              </div>
              <div className={`text-5xl mb-6 mt-4 bg-gradient-to-r ${step.color} bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300`}>
                {step.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 group-hover:text-primary-600 transition-colors">
                {step.title}
              </h3>
              <p className="text-gray-600 leading-relaxed text-lg">
                {step.description}
              </p>
              
              {/* Connection line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary-300 to-secondary-300 transform -translate-y-1/2"></div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center mt-16">
          <Link href="/register" className="btn-primary btn-lg hover-lift animate-fade-in inline-flex">
            Get Started Today
            <span className="ml-2 text-xl">💒</span>
          </Link>
        </div>

        {/* Additional info cards */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover-lift">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Personalized Experience</h3>
            <p className="text-gray-600 text-lg">
              Every wedding is unique. Our platform adapts to your specific needs and preferences.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover-lift">
            <div className="text-4xl mb-4">🛡️</div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Vendors</h3>
            <p className="text-gray-600 text-lg">
              All vendors are carefully vetted and verified to ensure quality and reliability.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function PricingPage() {
  const [activeTab, setActiveTab] = useState<'couples' | 'vendors'>('couples');

  const couplePlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with wedding planning',
      features: [
        'Browse vendor profiles',
        'Basic search and filtering',
        'Save favorite vendors',
        'Basic wedding checklist',
        'Email support'
      ],
      popular: false,
      cta: 'Get Started Free'
    },
    {
      name: 'Premium',
      price: '$29',
      period: 'per month',
      description: 'Everything you need for comprehensive wedding planning',
      features: [
        'Everything in Free',
        'Unlimited vendor messaging',
        'Advanced search filters',
        'Wedding budget tracker',
        'Guest list management',
        'Wedding timeline planner',
        'Priority support',
        'Vendor reviews & ratings'
      ],
      popular: true,
      cta: 'Start Premium Trial'
    },
    {
      name: 'Ultimate',
      price: '$99',
      period: 'one-time',
      description: 'Complete wedding planning solution with concierge service',
      features: [
        'Everything in Premium',
        'Personal wedding planner',
        'Vendor negotiation support',
        'Custom wedding website',
        'RSVP management',
        'Wedding day coordination',
        'Post-wedding support',
        'Lifetime access to tools'
      ],
      popular: false,
      cta: 'Get Ultimate Plan'
    }
  ];

  const vendorPlans = [
    {
      name: 'Basic',
      price: '$19',
      period: 'per month',
      description: 'Perfect for new vendors starting their business',
      features: [
        'Basic profile listing',
        'Photo gallery (10 images)',
        'Contact form',
        'Basic analytics',
        'Email support'
      ],
      popular: false,
      cta: 'Start Basic Plan'
    },
    {
      name: 'Professional',
      price: '$49',
      period: 'per month',
      description: 'Everything you need to grow your wedding business',
      features: [
        'Everything in Basic',
        'Premium profile placement',
        'Unlimited photo gallery',
        'Portfolio showcase',
        'Lead management',
        'Advanced analytics',
        'Priority support',
        'Featured in search results'
      ],
      popular: true,
      cta: 'Start Professional'
    },
    {
      name: 'Enterprise',
      price: '$99',
      period: 'per month',
      description: 'For established vendors with multiple services',
      features: [
        'Everything in Professional',
        'Multiple service listings',
        'Team member accounts',
        'Custom branding',
        'API access',
        'Dedicated account manager',
        'White-label options',
        'Priority placement'
      ],
      popular: false,
      cta: 'Contact Sales'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 lg:text-6xl">
            Simple, Transparent <span className="gradient-text">Pricing</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your wedding planning journey. 
            Whether you're a couple planning your dream wedding or a vendor growing your business.
          </p>
        </div>

        {/* Plan Toggle */}
        <div className="text-center mb-12">
          <div className="inline-flex bg-white rounded-xl p-1 shadow-lg">
            <button 
              onClick={() => setActiveTab('couples')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'couples' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Couples
            </button>
            <button 
              onClick={() => setActiveTab('vendors')}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'vendors' 
                  ? 'bg-primary-500 text-white' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              For Vendors
            </button>
          </div>
        </div>

        {/* Couple Plans */}
        {activeTab === 'couples' && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Plans for Couples</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {couplePlans.map((plan, index) => (
                <div key={index} className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow ${plan.popular ? 'ring-2 ring-primary-500 relative' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="text-primary-500 mr-3">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                    plan.popular 
                      ? 'bg-primary-500 text-white hover:bg-primary-600' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vendor Plans */}
        {activeTab === 'vendors' && (
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Plans for Vendors</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {vendorPlans.map((plan, index) => (
                <div key={index} className={`bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow ${plan.popular ? 'ring-2 ring-primary-500 relative' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <span className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                        Most Popular
                      </span>
                    </div>
                  )}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-4xl font-bold text-gray-900">{plan.price}</span>
                      <span className="text-gray-600">/{plan.period}</span>
                    </div>
                    <p className="text-gray-600">{plan.description}</p>
                  </div>
                  <ul className="space-y-4 mb-8">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center">
                        <span className="text-primary-500 mr-3">✓</span>
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full py-3 px-6 rounded-xl font-semibold transition-colors ${
                    plan.popular 
                      ? 'bg-primary-500 text-white hover:bg-primary-600' 
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}>
                    {plan.cta}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Can I change my plan later?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Is there a free trial?</h3>
              <p className="text-gray-600">
                Yes, we offer a 14-day free trial for all premium plans. No credit card required to start.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major credit cards, PayPal, and bank transfers for annual plans.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Can I cancel anytime?</h3>
              <p className="text-gray-600">
                Absolutely! You can cancel your subscription at any time with no cancellation fees.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of happy couples and vendors who trust Ideal Weddings for their wedding planning needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <button className="btn-primary btn-lg hover-lift">
                Start Free Trial
              </button>
            </Link>
            <Link href="/contact">
              <button className="btn-outline btn-lg hover-lift">
                Contact Sales
              </button>
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

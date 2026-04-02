'use client';

import React from 'react';
import Link from 'next/link';

export function CTASection() {
  return (
    <section className="section-padding hero-gradient from-secondary-800 via-secondary-600 to-primary-600 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-0 w-full h-full opacity-20">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl animate-bounce-gentle"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full mix-blend-multiply filter blur-3xl animate-bounce-gentle" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>

      <div className="container-modern text-center relative z-10">
        <h2 className="text-4xl font-bold text-white mb-8 lg:text-6xl">
          Ready to Start Planning Your{' '}
          <span className="text-yellow-200">Dream Wedding?</span>
        </h2>
        <p className="text-xl text-white/90 mb-12 max-w-4xl mx-auto lg:text-2xl">
          Join thousands of couples who have successfully planned their perfect wedding with our platform. 
          Start your journey today and make your dream wedding a reality.
        </p>
        
        <div className="relative z-10 flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Link
            href="/register"
            className="inline-flex items-center justify-center bg-white text-primary-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover-lift shadow-lg hover:shadow-xl text-lg"
          >
            Get Started Free
            <span className="ml-2 text-xl">💒</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center border-2 border-white text-white hover:bg-white hover:text-primary-600 font-bold py-4 px-8 rounded-2xl transition-all duration-300 hover-lift text-lg"
          >
            Sign In
            <span className="ml-2">→</span>
          </Link>
        </div>

        {/* Stats with modern cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover-lift">
            <div className="text-4xl font-bold text-white mb-2">10,000+</div>
            <div className="text-white/80 text-lg">Happy Couples</div>
            <div className="text-yellow-200 text-sm mt-2">✨ Successfully planned</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover-lift">
            <div className="text-4xl font-bold text-white mb-2">500+</div>
            <div className="text-white/80 text-lg">Verified Vendors</div>
            <div className="text-yellow-200 text-sm mt-2">🛡️ Quality assured</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 hover-lift">
            <div className="text-4xl font-bold text-white mb-2">4.9/5</div>
            <div className="text-white/80 text-lg">User Rating</div>
            <div className="text-yellow-200 text-sm mt-2">⭐ Highly recommended</div>
          </div>
        </div>

        {/* Trust indicators */}
        <div className="mt-16 pt-8 border-t border-white/20">
          <p className="text-white/70 text-lg mb-6">Trusted by couples worldwide</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            <div className="text-white/50 text-sm">🔒 Secure & Private</div>
            <div className="text-white/50 text-sm">💳 No hidden fees</div>
            <div className="text-white/50 text-sm">📱 Mobile friendly</div>
            <div className="text-white/50 text-sm">🎯 Personalized</div>
          </div>
        </div>
      </div>
    </section>
  );
}

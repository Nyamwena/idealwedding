'use client';

import Link from 'next/link';

export function HeroSection() {
  return (
    <div className="relative isolate overflow-hidden hero-gradient">
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[max(50%,25rem)] top-0 h-[64rem] w-[128rem] -translate-x-1/2 stroke-gray-200 [mask-image:radial-gradient(64rem_64rem_at_top,white,transparent)]">
          <svg className="absolute inset-0 h-full w-full" aria-hidden="true">
            <defs>
              <pattern id="hero-pattern" width="200" height="200" x="50%" y="-1" patternUnits="userSpaceOnUse">
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y="-1" className="overflow-visible fill-gray-50">
              <path d="M-200.5 0h201v201h-201Z M599.5 0h201v201h-201Z M399.5 400h201v201h-201Z M-400.5 600h201v201h-201Z" strokeWidth="0" />
            </svg>
            <rect width="100%" height="100%" strokeWidth="0" fill="url(#hero-pattern)" />
          </svg>
        </div>
      </div>

      <div className="container-modern section-padding">
        <div className="mx-auto max-w-2xl flex-shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <div className="inline-flex items-center space-x-6 animate-fade-in">
              <span className="rounded-full bg-gradient-to-r from-primary-500/10 to-secondary-500/10 px-4 py-2 text-sm font-semibold leading-6 text-amber-50 ring-1 ring-inset ring-primary-500/20">
                ✨ What's new
              </span>
              <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-blue-50">
                <span>Just launched</span>
                <span className="h-5 w-5 text-primary-400 animate-bounce-gentle">→</span>
              </span>
            </div>
          </div>
          
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl animate-slide-up">
            Your Dream Wedding,{' '}
            <span className="text-amber-400">Made Perfect</span>
          </h1>
          
          <p className="mt-6 text-lg leading-8 text-amber-50 sm:text-xl animate-fade-in">
            Connect with the perfect vendors for your special day. Get instant quotes, 
            manage your guest list, and plan your dream wedding with ease. 
            Let us make your wedding planning journey magical.
          </p>
          
          <div className="mt-10 flex items-center gap-x-6 animate-fade-in">
            <Link href="/register">
              <button className="btn-primary btn-lg hover-lift">
                Start Planning
                <span className="ml-2 text-xl">💒</span>
              </button>
            </Link>
            <Link href="/how-it-works">
              <button className="btn-outline btn-lg hover-lift">
                Learn More
                <span className="ml-2">→</span>
              </button>
            </Link>
          </div>
        </div>

          <div className="mx-auto mt-12 w-full max-w-md px-4 sm:mt-16 lg:mt-0 lg:max-w-none lg:px-0">
              <div className="w-full">
                  <div className="relative rounded-2xl bg-gray-900/5 p-3 ring-1 ring-inset ring-gray-900/10 lg:rounded-3xl lg:p-4 hover-scale">
                      <div className="rounded-xl shadow-2xl ring-1 ring-gray-900/10 overflow-hidden">
                          <div className="flex items-center justify-center min-h-[300px] sm:min-h-[380px] bg-gradient-to-br from-primary-100 via-white to-secondary-100">
                              <div className="text-center px-6 py-10">
                                  <div className="mx-auto mb-6 text-5xl sm:text-6xl animate-bounce-gentle">
                                      💒
                                  </div>

                                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
                                      Wedding Planning Made Simple
                                  </h3>

                                  <p className="text-gray-600 text-base sm:text-lg max-w-sm mx-auto">
                                      Beautiful interface for managing your perfect wedding
                                  </p>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
      
      {/* Feature highlights */}
      <div className="container-modern py-16">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7">
            Everything you need
          </h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            Complete wedding planning platform
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl">
            From finding vendors to managing your guest list, we've got everything you need to plan your perfect wedding.
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
            {[
              {
                name: 'Find Perfect Vendors',
                description: 'Connect with verified wedding professionals in your area',
                icon: '🎭',
              },
              {
                name: 'Get Instant Quotes',
                description: 'Receive personalized quotes from multiple vendors',
                icon: '✨',
              },
              {
                name: 'Manage Your Wedding',
                description: 'Track guests, RSVPs, and all your wedding details',
                icon: '📅',
              },
            ].map((feature, index) => (
              <div key={feature.name} className="feature-card hover-lift animate-fade-in" style={{ animationDelay: `${index * 0.2}s` }}>
                <dt className="flex items-center gap-x-3 text-lg font-semibold leading-7 text-gray-900 mb-4">
                  <span className="text-3xl">{feature.icon}</span>
                  {feature.name}
                </dt>
                <dd className="text-base leading-7 text-gray-600">
                  {feature.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
} 
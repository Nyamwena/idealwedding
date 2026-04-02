import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />

      <main>
        <div className="container-modern pt-16 pb-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-6xl">
            How It <span className="gradient-text">Works</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto lg:text-2xl">
            A simple path from signup to your wedding day—browse vendors, plan details, and stay organized in one place.
          </p>
        </div>

        <HowItWorksSection />

        <div className="container-modern pb-20 text-center">
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Want the full picture of tools and features? Explore what the platform includes, then create your free account.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/features" className="btn-outline btn-lg hover-lift inline-flex justify-center">
              View features
            </Link>
            <Link href="/register" className="btn-primary btn-lg hover-lift inline-flex justify-center">
              Create account
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-6 lg:text-6xl">
            About <span className="gradient-text">Ideal Weddings</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We're passionate about making your dream wedding a reality. Our platform connects couples with the perfect vendors, 
            streamlines planning, and creates unforgettable moments.
          </p>
        </div>

        {/* Mission Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              At Ideal Weddings, we believe every couple deserves a perfect wedding day. Our mission is to simplify the wedding 
              planning process by connecting you with trusted vendors, providing innovative tools, and offering personalized 
              support throughout your journey.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed">
              We understand that planning a wedding can be overwhelming, which is why we've created a comprehensive platform 
              that puts everything you need at your fingertips.
            </p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <div className="text-center">
              <div className="text-6xl mb-4">💒</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Crafting Perfect Moments</h3>
              <p className="text-gray-600">
                Every wedding is unique, and we're here to help you create the perfect celebration of your love story.
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl mb-4">🤝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Trust & Reliability</h3>
              <p className="text-gray-600">
                We partner only with verified, professional vendors who share our commitment to excellence.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">✨</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Innovation</h3>
              <p className="text-gray-600">
                We continuously improve our platform to provide the best tools and experience for couples.
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-4">💝</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Personal Touch</h3>
              <p className="text-gray-600">
                Every couple is unique, and we provide personalized support to make your vision come to life.
              </p>
            </div>
          </div>
        </div>

        {/* Story Section */}
        <div className="bg-white rounded-2xl p-8 shadow-lg mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Story</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <p className="text-lg text-gray-600 leading-relaxed mb-4">
                Ideal Weddings was born from a simple idea: wedding planning should be joyful, not stressful. 
                Our founders experienced firsthand the challenges of coordinating vendors, managing budgets, 
                and keeping track of countless details.
              </p>
              <p className="text-lg text-gray-600 leading-relaxed">
                Today, we're proud to serve thousands of couples, helping them create beautiful, 
                memorable weddings while enjoying every moment of their planning journey.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">1</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Connect with Vendors</h4>
                  <p className="text-gray-600">Find and book trusted wedding professionals</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">2</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Plan with Ease</h4>
                  <p className="text-gray-600">Use our tools to organize every detail</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold">3</span>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Celebrate Love</h4>
                  <p className="text-gray-600">Enjoy your perfect wedding day</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Ready to Start Planning?</h2>
          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of happy couples who have created their dream weddings with Ideal Weddings.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary btn-lg hover-lift inline-flex justify-center">
              Get Started Today
            </Link>
            <Link href="/contact" className="btn-outline btn-lg hover-lift inline-flex justify-center">
              Contact Us
            </Link>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

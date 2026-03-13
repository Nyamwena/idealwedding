'use client';

import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function TimelinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 lg:text-6xl">
            Wedding <span className="gradient-text">Timeline</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Plan your perfect wedding day with our comprehensive timeline guide.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl p-8 shadow-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Wedding Day Timeline</h2>
            
            <div className="space-y-8">
              {/* Morning */}
              <div className="border-l-4 border-primary-500 pl-6">
                <div className="flex items-center mb-4">
                  <div className="bg-primary-100 rounded-full p-3 mr-4">
                    <span className="text-primary-600 text-xl">🌅</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Morning Preparation</h3>
                </div>
                <div className="space-y-3 ml-16">
                  <div className="flex items-center">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
                    <span className="text-gray-700">6:00 AM - Hair and makeup begins</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
                    <span className="text-gray-700">8:00 AM - Breakfast with bridal party</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-primary-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</span>
                    <span className="text-gray-700">10:00 AM - Getting dressed</span>
                  </div>
                </div>
              </div>

              {/* Ceremony */}
              <div className="border-l-4 border-green-500 pl-6">
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 rounded-full p-3 mr-4">
                    <span className="text-green-600 text-xl">💒</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Ceremony</h3>
                </div>
                <div className="space-y-3 ml-16">
                  <div className="flex items-center">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
                    <span className="text-gray-700">1:00 PM - Guests arrive</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
                    <span className="text-gray-700">1:30 PM - Ceremony begins</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-green-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</span>
                    <span className="text-gray-700">2:00 PM - Ceremony ends, congratulations!</span>
                  </div>
                </div>
              </div>

              {/* Reception */}
              <div className="border-l-4 border-purple-500 pl-6">
                <div className="flex items-center mb-4">
                  <div className="bg-purple-100 rounded-full p-3 mr-4">
                    <span className="text-purple-600 text-xl">🎉</span>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Reception</h3>
                </div>
                <div className="space-y-3 ml-16">
                  <div className="flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">1</span>
                    <span className="text-gray-700">3:00 PM - Cocktail hour</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">2</span>
                    <span className="text-gray-700">4:00 PM - Grand entrance</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">3</span>
                    <span className="text-gray-700">4:30 PM - First dance</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">4</span>
                    <span className="text-gray-700">5:00 PM - Dinner service</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">5</span>
                    <span className="text-gray-700">7:00 PM - Cake cutting</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">6</span>
                    <span className="text-gray-700">8:00 PM - Dancing and celebration</span>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3">7</span>
                    <span className="text-gray-700">11:00 PM - Last dance and send-off</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-bold text-gray-900 mb-4">💡 Pro Tips</h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Build in buffer time between events for unexpected delays</li>
                <li>• Assign a timeline coordinator to keep everything on track</li>
                <li>• Share the timeline with all vendors and key participants</li>
                <li>• Have a backup plan for outdoor ceremonies in case of weather</li>
                <li>• Consider your guests' comfort with meal timing</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useUserData } from '@/hooks/useUserData';
import { useQuoteGenerator } from '@/hooks/useQuoteGenerator';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { UserDashboardWidgets } from '@/components/user/UserDashboardWidgets';
import { InstantQuoteGenerator } from '@/components/user/InstantQuoteGenerator';
import { UserBookingsManager } from '@/components/user/UserBookingsManager';
import { GuestListTracker } from '@/components/user/GuestListTracker';
import { BudgetTracker } from '@/components/user/BudgetTracker';
import { VendorMap } from '@/components/user/VendorMap';
import { WeddingTimeline } from '@/components/user/WeddingTimeline';
import { NotificationCenter } from '@/components/user/NotificationCenter';
import { DocumentStorage } from '@/components/user/DocumentStorage';
import { SeatingChartPlanner } from '@/components/user/SeatingChartPlanner';

function coupleFirstNames(wd: { brideName?: string; groomName?: string } | null | undefined): string | null {
  const b = wd?.brideName?.trim();
  const g = wd?.groomName?.trim();
  if (b && g) return `${b} & ${g}`;
  if (b) return b;
  if (g) return g;
  return null;
}

export default function DashboardPage() {
  const { user,  logout } = useAuth();
  const router = useRouter();
  type WelcomeTone = 'returning' | 'registered' | 'firstLogin';
  const [welcomeTone, setWelcomeTone] = useState<WelcomeTone>('returning');
  const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'guests' | 'budget' | 'map' | 'timeline' | 'notifications' | 'documents' | 'seating' | 'bookings'>('overview');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') === '1') {
      setWelcomeTone('registered');
      window.history.replaceState(null, '', '/dashboard');
      return;
    }
    if (params.get('firstLogin') === '1') {
      setWelcomeTone('firstLogin');
      window.history.replaceState(null, '', '/dashboard');
    }
  }, []);
  
  // User data hooks
  const userData = useUserData();
  const quoteGenerator = useQuoteGenerator();
  const coupleLabel = coupleFirstNames(userData.weddingDetails);



  const handleLogout = () => {
    logout();
    router.push('/');
  };

  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
  //       <div className="text-center">
  //         <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
  //         <p className="text-gray-600">Loading your wedding dashboard...</p>
  //       </div>
  //     </div>
  //   );
  // }

  if (!user) {
    return null; // Will redirect to login
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'quotes', label: 'Get Quotes', icon: '💬' },
    { id: 'bookings', label: 'My Bookings', icon: '📅' },
    { id: 'guests', label: 'Guest List', icon: '👥' },
    { id: 'budget', label: 'Budget', icon: '💰' },
    { id: 'timeline', label: 'Timeline', icon: '📅' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' },
    { id: 'documents', label: 'Documents', icon: '📁' },
    { id: 'seating', label: 'Seating Chart', icon: '🪑' },
    { id: 'map', label: 'Vendor Map', icon: '🗺️' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        {/* Welcome Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 font-serif">
            {welcomeTone === 'registered'
              ? coupleLabel
                ? `Thank you for registering, ${coupleLabel}!`
                : 'Thank you for registering!'
              : welcomeTone === 'firstLogin'
                ? coupleLabel
                  ? `Welcome, ${coupleLabel}!`
                  : 'Welcome! Thank you for joining us.'
                : coupleLabel
                  ? `Welcome, ${coupleLabel}!`
                  : 'Welcome back!'}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {welcomeTone === 'registered' || welcomeTone === 'firstLogin'
              ? coupleLabel
                ? "We're glad you're here. Add your wedding details below anytime to make this space even more yours."
                : "We're glad you're here. Use the tools below to start planning your perfect wedding."
              : coupleLabel
                ? 'Your wedding hub—plan together with the tools and vendors below.'
                : 'Plan your perfect wedding with our comprehensive tools and vendor network.'}
          </p>
          {!coupleLabel && (
            <p className="mt-3 text-sm text-primary-700 max-w-xl mx-auto">
              Tip: open <span className="font-semibold">Overview → Wedding details</span> and add bride &amp; groom names for a personalized greeting.
            </p>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-lg p-2 mb-8">
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-700 shadow-md'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <span className="text-lg">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-8">
          {activeTab === 'overview' && (
            <UserDashboardWidgets 
              userData={userData}
              quoteGenerator={quoteGenerator}
            />
          )}
          
          {activeTab === 'quotes' && (
            <InstantQuoteGenerator 
              quoteGenerator={quoteGenerator}
            />
          )}
          
          {activeTab === 'bookings' && (
            <UserBookingsManager />
          )}
          
          {activeTab === 'guests' && (
            <GuestListTracker 
              userData={userData}
            />
          )}
          
          {activeTab === 'budget' && (
            <BudgetTracker 
              userData={userData}
            />
          )}
          
          {activeTab === 'timeline' && (
            <WeddingTimeline />
          )}
          
          {activeTab === 'notifications' && (
            <NotificationCenter />
          )}
          
          {activeTab === 'documents' && (
            <DocumentStorage />
          )}
          
          {activeTab === 'seating' && (
            <SeatingChartPlanner />
          )}
          
          {activeTab === 'map' && (
            <VendorMap />
          )}
        </div>

        {/* Account Info - Always visible */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-primary-600 font-bold text-lg">
                  {/*{user.firstName}{user.lastName}*/}
                </span>
              </div>
              <div>
                {/*<h3 className="font-semibold text-gray-900">{user.firstName} {user.lastName}</h3>*/}
                <p className="text-gray-600 text-sm">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/profile">
                <button className="btn-outline btn-sm">
                  Edit Profile
                </button>
              </Link>
              <Link href="/settings">
                <button className="btn-outline btn-sm">
                  Settings
                </button>
              </Link>
              <button 
                onClick={handleLogout}
                className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
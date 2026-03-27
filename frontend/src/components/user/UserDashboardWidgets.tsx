'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useUserData, WeddingDetails, BudgetItem, SelectedVendor, Guest } from '@/hooks/useUserData';
import { useQuoteGenerator, QuoteRequest, QuoteResponse } from '@/hooks/useQuoteGenerator';

interface UserDashboardWidgetsProps {
  userData: ReturnType<typeof useUserData>;
  quoteGenerator: ReturnType<typeof useQuoteGenerator>;
}

interface RankedAd {
  id: string;
  title: string;
  imageUrl?: string;
  targetUrl: string;
  advertiser: string;
  category: string;
  bidPerClick?: number;
  cost?: number;
}

export function UserDashboardWidgets({ userData, quoteGenerator }: UserDashboardWidgetsProps) {
  const { weddingDetails, budgetItems, selectedVendors, guests } = userData;
  const { quoteRequests, quoteResponses } = quoteGenerator;
  const [topAds, setTopAds] = useState<RankedAd[]>([]);

  // Calculate budget summary
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const remainingBudget = totalBudget - totalSpent;

  // Calculate guest summary
  const totalGuests = guests.length;
  const attendingGuests = guests.filter(g => g.rsvpStatus === 'attending').length;
  const pendingRSVPs = guests.filter(g => g.rsvpStatus === 'pending').length;

  // Calculate quote summary
  const pendingQuotes = quoteRequests.filter(q => q.status === 'pending').length;
  const newResponses = quoteResponses.filter(r => r.status === 'pending').length;

  useEffect(() => {
    const loadTopAds = async () => {
      try {
        // API already ranks by bidPerClick desc; client sort is a safety fallback.
        const response = await fetch('/api/advertisements?position=top&limit=4');
        const result = await response.json();
        if (!response.ok) {
          setTopAds([]);
          return;
        }
        const ads = Array.isArray(result.data) ? result.data : [];
        ads.sort(
          (a: RankedAd, b: RankedAd) =>
            Number(b.bidPerClick || b.cost || 0) - Number(a.bidPerClick || a.cost || 0)
        );
        setTopAds(ads);
      } catch {
        setTopAds([]);
      }
    };
    loadTopAds();
  }, []);

  const handleAdClick = async (ad: RankedAd) => {
    try {
      const response = await fetch(`/api/advertisements/${ad.id}/click`, { method: 'POST' });
      const result = await response.json();
      if (response.ok && result.data?.targetUrl) {
        window.open(result.data.targetUrl, '_blank', 'noopener,noreferrer');
        return;
      }
      console.warn('Ad click not opened because billing was not successful.');
    } catch {
      console.warn('Ad click not opened due to click tracking error.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Wedding Overview */}
      {weddingDetails && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Wedding Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <h3 className="font-semibold text-gray-900">Wedding Date</h3>
              <p className="text-gray-600">{new Date(weddingDetails.weddingDate).toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🏛️</div>
              <h3 className="font-semibold text-gray-900">Venue</h3>
              <p className="text-gray-600">{weddingDetails.venue}</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">👥</div>
              <h3 className="font-semibold text-gray-900">Guest Count</h3>
              <p className="text-gray-600">{weddingDetails.guestCount} guests</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🎨</div>
              <h3 className="font-semibold text-gray-900">Theme</h3>
              <p className="text-gray-600">{weddingDetails.theme}</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Budget Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">💰</div>
            <Link href="/dashboard?tab=budget" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              View Details
            </Link>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Budget</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Budget</span>
              <span className="font-medium">${totalBudget.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Spent</span>
              <span className="font-medium text-red-600">${totalSpent.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Remaining</span>
              <span className="font-medium text-green-600">${remainingBudget.toLocaleString()}</span>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(totalSpent / totalBudget) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Vendors Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">🏢</div>
            <Link href="/vendors" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Find More
            </Link>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Selected Vendors</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Selected</span>
              <span className="font-medium">{selectedVendors.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Booked</span>
              <span className="font-medium text-green-600">
                {selectedVendors.filter(v => v.status === 'booked' || v.status === 'paid').length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium text-yellow-600">
                {selectedVendors.filter(v => v.status === 'quoted').length}
              </span>
            </div>
          </div>
        </div>

        {/* Guests Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">👥</div>
            <Link href="/dashboard?tab=guests" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Manage
            </Link>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Guest List</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Guests</span>
              <span className="font-medium">{totalGuests}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Attending</span>
              <span className="font-medium text-green-600">{attendingGuests}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending RSVP</span>
              <span className="font-medium text-yellow-600">{pendingRSVPs}</span>
            </div>
          </div>
        </div>

        {/* Quotes Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="text-3xl">💬</div>
            <Link href="/dashboard?tab=quotes" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              Get Quotes
            </Link>
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">Quote Requests</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Requests</span>
              <span className="font-medium">{quoteRequests.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Pending</span>
              <span className="font-medium text-yellow-600">{pendingQuotes}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">New Responses</span>
              <span className="font-medium text-blue-600">{newResponses}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          {quoteResponses.slice(0, 3).map((response) => (
            <div key={response.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl">💬</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  New quote from {response.vendorName}
                </p>
                <p className="text-gray-600 text-sm">
                  ${response.price.toLocaleString()} - {response.description}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {new Date(response.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          
          {selectedVendors.slice(0, 2).map((vendor) => (
            <div key={vendor.id} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl">🏢</div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {vendor.name} - {vendor.status}
                </p>
                <p className="text-gray-600 text-sm">
                  {vendor.category} - ${vendor.price.toLocaleString()}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {vendor.status === 'paid' ? 'Completed' : 'In Progress'}
              </div>
            </div>
          ))}
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
            <div className="text-2xl">🎉</div>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Welcome to Ideal Weddings!</p>
              <p className="text-gray-600 text-sm">Your wedding planning journey begins now</p>
            </div>
            <div className="text-sm text-gray-500">Just now</div>
          </div>
        </div>
      </div>

      {/* Sponsored Ads (highest bidders first) */}
      {topAds.length > 0 && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Sponsored for You</h2>
            <span className="text-xs text-gray-500">Ranked by highest bid</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {topAds.map((ad, index) => (
              <button
                key={ad.id}
                type="button"
                onClick={() => handleAdClick(ad)}
                className="text-left border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-primary-200 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wide text-primary-600 font-semibold">
                    Sponsored #{index + 1}
                  </span>
                  <span className="text-xs text-gray-500">{ad.category}</span>
                </div>
                <h3 className="font-semibold text-gray-900">{ad.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{ad.advertiser}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl p-8 text-white">
        <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
        <p className="text-lg mb-6 opacity-90">
          Get started with these essential wedding planning tasks:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/dashboard?tab=quotes">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors cursor-pointer">
              <div className="text-3xl mb-4">💬</div>
              <h3 className="text-xl font-semibold mb-2">Get Quotes</h3>
              <p className="text-sm opacity-90">Request quotes from vendors for your wedding</p>
            </div>
          </Link>
          
          <Link href="/vendors">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors cursor-pointer">
              <div className="text-3xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold mb-2">Find Vendors</h3>
              <p className="text-sm opacity-90">Browse and discover wedding vendors</p>
            </div>
          </Link>
          
          <Link href="/dashboard?tab=guests">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-colors cursor-pointer">
              <div className="text-3xl mb-4">👥</div>
              <h3 className="text-xl font-semibold mb-2">Manage Guests</h3>
              <p className="text-sm opacity-90">Organize your guest list and RSVPs</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

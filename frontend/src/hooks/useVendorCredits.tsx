'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface CreditData {
  currentCredits: number;
  totalPurchased: number;
  totalUsed: number;
  lastTopUp: string;
  isLowBalance: boolean;
}

interface CreditTransaction {
  id: string;
  type: 'purchase' | 'usage' | 'refund';
  amount: number;
  description: string;
  timestamp: string;
  leadId?: string;
  coupleName?: string;
}

export function useVendorCredits() {
  const { user, isVendor } = useAuth();
  const [creditData, setCreditData] = useState<CreditData>({
    currentCredits: 0,
    totalPurchased: 0,
    totalUsed: 0,
    lastTopUp: new Date().toISOString(),
    isLowBalance: false,
  });
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isVendor && user) {
      fetchCreditData();
    }
  }, [isVendor, user]);

  const fetchCreditData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/vendor/credits', {
        credentials: 'include',
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch credit data');
      }

      setCreditData(result.data);
      setTransactions(result.transactions || []);
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async (amount: number) => {
    try {
      const response = await fetch('/api/vendor/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'purchase',
          amount,
          description: 'Credit package purchase',
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to purchase credits');
      }
      await fetchCreditData();
      return true;
    } catch (error) {
      console.error('Failed to purchase credits:', error);
      return false;
    }
  };

  const deductCredits = async (amount: number, description: string, leadId?: string, coupleName?: string) => {
    try {
      const response = await fetch('/api/vendor/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'deduct',
          amount,
          description,
          referenceId: leadId,
          coupleName,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        return false;
      }
      setCreditData(result.data);
      await fetchCreditData();
      return true;
    } catch (error) {
      console.error('Failed to deduct credits:', error);
      return false;
    }
  };

  const canReceiveLead = () => {
    return creditData.currentCredits >= 5;
  };

  const getCreditStatus = () => {
    if (creditData.currentCredits >= 100) {
      return { color: 'green', message: 'Excellent' };
    } else if (creditData.currentCredits >= 50) {
      return { color: 'yellow', message: 'Good' };
    } else {
      return { color: 'red', message: 'Low' };
    }
  };

  const getRecentTransactions = (limit: number = 10) => {
    return transactions
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  };

  return {
    creditData,
    transactions,
    loading,
    purchaseCredits,
    deductCredits,
    canReceiveLead,
    getCreditStatus,
    getRecentTransactions,
    refetch: fetchCreditData,
  };
}
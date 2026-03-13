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
    currentCredits: 150,
    totalPurchased: 500,
    totalUsed: 350,
    lastTopUp: '2024-09-15T00:00:00Z',
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
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock credit data
      const mockCreditData: CreditData = {
        currentCredits: 150,
        totalPurchased: 500,
        totalUsed: 350,
        lastTopUp: '2024-09-15T00:00:00Z',
        isLowBalance: false,
      };

      const mockTransactions: CreditTransaction[] = [
        {
          id: 'txn_001',
          type: 'purchase',
          amount: 100,
          description: 'Credit package purchase',
          timestamp: '2024-09-15T00:00:00Z',
        },
        {
          id: 'txn_002',
          type: 'usage',
          amount: -5,
          description: 'Lead received from Sarah & John - Photography',
          timestamp: '2024-09-24T10:30:00Z',
          leadId: 'lead_001',
          coupleName: 'Sarah & John',
        },
        {
          id: 'txn_003',
          type: 'usage',
          amount: -5,
          description: 'Lead received from Emily & Michael - Wedding Planning',
          timestamp: '2024-09-24T09:15:00Z',
          leadId: 'lead_002',
          coupleName: 'Emily & Michael',
        },
      ];

      setCreditData(mockCreditData);
      setTransactions(mockTransactions);
    } catch (error) {
      console.error('Failed to fetch credit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const purchaseCredits = async (amount: number) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newTransaction: CreditTransaction = {
        id: `txn_${Date.now()}`,
        type: 'purchase',
        amount: amount,
        description: `Credit package purchase`,
        timestamp: new Date().toISOString(),
      };

      setCreditData(prev => ({
        ...prev,
        currentCredits: prev.currentCredits + amount,
        totalPurchased: prev.totalPurchased + amount,
        lastTopUp: new Date().toISOString(),
        isLowBalance: (prev.currentCredits + amount) < 50,
      }));

      setTransactions(prev => [newTransaction, ...prev]);

      return true;
    } catch (error) {
      console.error('Failed to purchase credits:', error);
      return false;
    }
  };

  const deductCredits = async (amount: number, description: string, leadId?: string, coupleName?: string) => {
    try {
      if (creditData.currentCredits < amount) {
        return false;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const newTransaction: CreditTransaction = {
        id: `txn_${Date.now()}`,
        type: 'usage',
        amount: -amount,
        description: description,
        timestamp: new Date().toISOString(),
        leadId,
        coupleName,
      };

      setCreditData(prev => ({
        ...prev,
        currentCredits: prev.currentCredits - amount,
        totalUsed: prev.totalUsed + amount,
        isLowBalance: (prev.currentCredits - amount) < 50,
      }));

      setTransactions(prev => [newTransaction, ...prev]);

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
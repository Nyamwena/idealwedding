'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useVendorCredits } from '@/hooks/useVendorCredits';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AdminBreadcrumb } from '@/components/admin/AdminBreadcrumb';
import { VendorTopMenu } from '@/components/vendor/VendorTopMenu';

interface BillingHistory {
  id: string;
  type: 'credit_purchase' | 'subscription' | 'commission' | 'refund' | 'credit_usage';
  description: string;
  amount: number;
  date: string;
  status: 'completed' | 'pending' | 'failed';
  paymentMethod?: string;
}

function mapTransactionToBillingHistory(tx: {
  id: string;
  type: string;
  amount: number;
  description: string;
  timestamp: string;
}): BillingHistory {
  let type: BillingHistory['type'] = 'credit_purchase';
  if (tx.type === 'usage') type = 'credit_usage';
  else if (tx.type === 'refund') type = 'refund';
  else if (tx.type === 'purchase' || tx.type === 'admin_add') type = 'credit_purchase';

  return {
    id: tx.id,
    type,
    description: tx.description,
    amount: tx.amount,
    date: tx.timestamp,
    status: 'completed',
  };
}

export default function VendorBillingPage() {
  const { creditData, transactions, loading: creditsLoading, purchaseCredits, refetch } = useVendorCredits();
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<number | null>(null);

  const billingHistory = useMemo(() => {
    return [...transactions]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .map(mapTransactionToBillingHistory);
  }, [transactions]);

  const handlePurchaseCredits = async (amount: number) => {
    const success = await purchaseCredits(amount);
    if (success) {
      setShowCreditModal(false);
      setSelectedPackage(null);
      await refetch();
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'credit_purchase': return '💳';
      case 'subscription': return '🔄';
      case 'commission': return '💰';
      case 'credit_usage': return '📤';
      case 'refund': return '↩️';
      default: return '📄';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <Header />
      
      <main className="container-modern py-8">
        <AdminBreadcrumb items={[
          { label: 'Vendor Dashboard', href: '/vendor' },
          { label: 'Billing & Credits', href: '/vendor/billing' }
        ]} />
        
        <VendorTopMenu />
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Billing & <span className="gradient-text">Credits</span></h1>
            <p className="text-gray-600 mt-2">Manage your credits, billing, and payment history</p>
          </div>
          <Link href="/vendor">
            <button className="btn-outline btn-md hover-lift">
              ← Back to Dashboard
            </button>
          </Link>
        </div>

        {/* Credit Balance Card */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Credit Balance</h2>
              <p className="text-4xl font-bold mb-1">{creditData.currentCredits}</p>
              <p className="text-blue-100">Available Credits</p>
            </div>
            <div className="text-right">
              <div className="bg-white/20 rounded-lg p-4 mb-2">
                <p className="text-sm text-blue-100">Total Used</p>
                <p className="text-xl font-bold">{creditData.totalUsed}</p>
              </div>
              <button
                onClick={() => setShowCreditModal(true)}
                className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors"
              >
                Purchase Credits
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Recent Transactions */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Credit Transactions</h3>
            <div className="space-y-4">
              {transactions.slice(0, 5).map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {transaction.type === 'purchase' ? '💳' : '📤'}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(transaction.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                    </p>
                    <p className="text-sm text-gray-500">credits</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <Link href="/vendor/billing/history">
                <button className="btn-outline btn-sm">View All Transactions</button>
              </Link>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Purchased</span>
                <span className="font-semibold">{creditData.totalPurchased} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Used</span>
                <span className="font-semibold">{creditData.totalUsed} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Current Balance</span>
                <span className="font-semibold text-green-600">{creditData.currentCredits} credits</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Last Top Up</span>
                <span className="font-semibold">
                  {new Date(creditData.lastTopUp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Billing History */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Billing History</h3>
          </div>
          
          {creditsLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <span className="ml-3 text-gray-600">Loading billing history...</span>
            </div>
          ) : billingHistory.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {billingHistory.map((bill) => (
                <div key={bill.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-2xl">{getTypeIcon(bill.type)}</span>
                      <div>
                        <h4 className="font-medium text-gray-900">{bill.description}</h4>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <span>{new Date(bill.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className={`font-medium ${getStatusColor(bill.status)}`}>
                            {bill.status}
                          </span>
                          {bill.paymentMethod && (
                            <>
                              <span>•</span>
                              <span>{bill.paymentMethod}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${bill.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {bill.amount > 0 ? '+' : ''}{bill.amount} credits
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <span className="text-6xl mb-4 block">💳</span>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No billing history</h3>
              <p className="text-gray-600">Your billing history will appear here.</p>
            </div>
          )}
        </div>

        {/* Credit Purchase Modal */}
        {showCreditModal && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true"></div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
                      <span className="text-blue-600 text-xl">💳</span>
                    </div>
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Purchase Credits
                      </h3>
                      <div className="mt-2">
                        <p className="text-sm text-gray-500">
                          Choose a credit package to continue receiving leads. Each lead costs 5 credits.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-4 py-3 sm:px-6">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setSelectedPackage(25)}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedPackage === 25 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">25</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$25</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedPackage(50)}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedPackage === 50 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">50</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$45</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedPackage(100)}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedPackage === 100 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">100</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$80</div>
                      </div>
                    </button>
                    <button
                      onClick={() => setSelectedPackage(200)}
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedPackage === 200 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-300 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">200</div>
                        <div className="text-sm text-gray-600">Credits</div>
                        <div className="text-sm font-medium text-gray-900">$150</div>
                      </div>
                    </button>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:w-auto sm:text-sm"
                      onClick={() => setShowCreditModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                      onClick={() => selectedPackage && handlePurchaseCredits(selectedPackage)}
                      disabled={!selectedPackage}
                    >
                      Purchase Credits
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
'use client';

import React, { useState } from 'react';
import { useUserData, BudgetItem } from '@/hooks/useUserData';

interface BudgetTrackerProps {
  userData: ReturnType<typeof useUserData>;
}

export function BudgetTracker({ userData }: BudgetTrackerProps) {
  const { budgetItems, addBudgetItem, updateBudgetItem, deleteBudgetItem, weddingDetails } = userData;
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetItem | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    allocated: '',
    spent: '',
    vendor: '',
    status: 'planned' as BudgetItem['status']
  });

  const categories = [
    'Venue',
    'Photography',
    'Catering',
    'Flowers',
    'Entertainment',
    'Transportation',
    'Hair & Makeup',
    'Dress & Attire',
    'Decorations',
    'Invitations',
    'Wedding Rings',
    'Other'
  ];

  const statuses = [
    { value: 'planned', label: 'Planned', color: 'bg-gray-100 text-gray-800' },
    { value: 'booked', label: 'Booked', color: 'bg-blue-100 text-blue-800' },
    { value: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.category || !formData.allocated) {
      return;
    }

    try {
      if (editingItem) {
        await updateBudgetItem(editingItem.id, {
          category: formData.category,
          allocated: parseInt(formData.allocated),
          spent: parseInt(formData.spent) || 0,
          vendor: formData.vendor || undefined,
          status: formData.status
        });
      } else {
        await addBudgetItem({
          category: formData.category,
          allocated: parseInt(formData.allocated),
          spent: parseInt(formData.spent) || 0,
          vendor: formData.vendor || undefined,
          status: formData.status
        });
      }

      // Reset form
      setFormData({
        category: '',
        allocated: '',
        spent: '',
        vendor: '',
        status: 'planned'
      });
      setShowForm(false);
      setEditingItem(null);
    } catch (err) {
      console.error('Error saving budget item:', err);
    }
  };

  const handleEdit = (item: BudgetItem) => {
    setFormData({
      category: item.category,
      allocated: item.allocated.toString(),
      spent: item.spent.toString(),
      vendor: item.vendor || '',
      status: item.status
    });
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (itemId: string) => {
    if (confirm('Are you sure you want to delete this budget item?')) {
      try {
        await deleteBudgetItem(itemId);
      } catch (err) {
        console.error('Error deleting budget item:', err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Calculate budget summary
  const totalBudget = budgetItems.reduce((sum, item) => sum + item.allocated, 0);
  const totalSpent = budgetItems.reduce((sum, item) => sum + item.spent, 0);
  const remainingBudget = totalBudget - totalSpent;
  const budgetPercentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  // Calculate by status
  const plannedItems = budgetItems.filter(item => item.status === 'planned');
  const bookedItems = budgetItems.filter(item => item.status === 'booked');
  const paidItems = budgetItems.filter(item => item.status === 'paid');

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Budget Tracker</h2>
            <p className="text-gray-600">
              Track your wedding budget, manage expenses, and monitor spending across all categories.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-lg"
          >
            {showForm ? 'Cancel' : 'Add Item'}
          </button>
        </div>
      </div>

      {/* Budget Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💰</div>
          <h3 className="font-semibold text-gray-900">Total Budget</h3>
          <p className="text-2xl font-bold text-primary-600">${totalBudget.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💸</div>
          <h3 className="font-semibold text-gray-900">Total Spent</h3>
          <p className="text-2xl font-bold text-red-600">${totalSpent.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">💵</div>
          <h3 className="font-semibold text-gray-900">Remaining</h3>
          <p className="text-2xl font-bold text-green-600">${remainingBudget.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📊</div>
          <h3 className="font-semibold text-gray-900">Progress</h3>
          <p className="text-2xl font-bold text-blue-600">{budgetPercentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Budget Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>Spent: ${totalSpent.toLocaleString()}</span>
          <span>Budget: ${totalBudget.toLocaleString()}</span>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Planned</h3>
            <span className="text-2xl">📋</span>
          </div>
          <p className="text-3xl font-bold text-gray-600 mb-2">{plannedItems.length}</p>
          <p className="text-sm text-gray-500">
            ${plannedItems.reduce((sum, item) => sum + item.allocated, 0).toLocaleString()} allocated
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Booked</h3>
            <span className="text-2xl">📅</span>
          </div>
          <p className="text-3xl font-bold text-blue-600 mb-2">{bookedItems.length}</p>
          <p className="text-sm text-gray-500">
            ${bookedItems.reduce((sum, item) => sum + item.allocated, 0).toLocaleString()} allocated
          </p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Paid</h3>
            <span className="text-2xl">✅</span>
          </div>
          <p className="text-3xl font-bold text-green-600 mb-2">{paidItems.length}</p>
          <p className="text-sm text-gray-500">
            ${paidItems.reduce((sum, item) => sum + item.spent, 0).toLocaleString()} spent
          </p>
        </div>
      </div>

      {/* Budget Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="category" className="block text-sm font-semibold text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-semibold text-gray-700 mb-2">
                  Status
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="allocated" className="block text-sm font-semibold text-gray-700 mb-2">
                  Allocated Amount *
                </label>
                <input
                  type="number"
                  id="allocated"
                  name="allocated"
                  value={formData.allocated}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter allocated amount"
                  required
                />
              </div>

              <div>
                <label htmlFor="spent" className="block text-sm font-semibold text-gray-700 mb-2">
                  Spent Amount
                </label>
                <input
                  type="number"
                  id="spent"
                  name="spent"
                  value={formData.spent}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter spent amount"
                />
              </div>

              <div className="md:col-span-2">
                <label htmlFor="vendor" className="block text-sm font-semibold text-gray-700 mb-2">
                  Vendor
                </label>
                <input
                  type="text"
                  id="vendor"
                  name="vendor"
                  value={formData.vendor}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter vendor name"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingItem(null);
                }}
                className="btn-outline btn-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary btn-lg"
              >
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Items List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Budget Items</h3>
        
        {budgetItems.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">💰</div>
            <p className="text-gray-600">No budget items added yet.</p>
            <p className="text-gray-500 text-sm">Click "Add Item" to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {budgetItems.map((item) => {
              const spentPercentage = item.allocated > 0 ? (item.spent / item.allocated) * 100 : 0;
              const statusConfig = statuses.find(s => s.value === item.status);
              
              return (
                <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-gray-900">{item.category}</h4>
                      {item.vendor && (
                        <p className="text-gray-600 text-sm">{item.vendor}</p>
                      )}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig?.color}`}>
                        {statusConfig?.label}
                      </span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(item)}
                          className="btn-outline btn-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-600">Allocated</div>
                      <div className="font-semibold text-gray-900">${item.allocated.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Spent</div>
                      <div className="font-semibold text-red-600">${item.spent.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Remaining</div>
                      <div className={`font-semibold ${item.allocated - item.spent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${(item.allocated - item.spent).toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${
                        spentPercentage > 100 ? 'bg-red-500' : 
                        spentPercentage > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {spentPercentage.toFixed(1)}% of budget used
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

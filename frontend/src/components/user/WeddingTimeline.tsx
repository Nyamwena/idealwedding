'use client';

import React, { useState } from 'react';
import { useWeddingTimeline, TimelineTask } from '@/hooks/useWeddingTimeline';

export function WeddingTimeline() {
  const {
    tasks,
    categories,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    getTasksByCategory,
    getTasksByStatus,
    getOverdueTasks,
    getUpcomingTasks,
    getTaskStatistics,
    isLoading,
    error
  } = useWeddingTimeline();

  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingTask, setEditingTask] = useState<TimelineTask | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    dueDate: '',
    priority: 'medium' as TimelineTask['priority'],
    assignedTo: 'both' as TimelineTask['assignedTo'],
    vendor: '',
    notes: ''
  });

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-800' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ];

  const statuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' }
  ];

  const assignedToOptions = [
    { value: 'bride', label: 'Bride' },
    { value: 'groom', label: 'Groom' },
    { value: 'both', label: 'Both' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'family', label: 'Family' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.dueDate) {
      return;
    }

    try {
      if (editingTask) {
        await updateTask(editingTask.id, {
          title: formData.title,
          description: formData.description,
          category: formData.category,
          dueDate: formData.dueDate,
          priority: formData.priority,
          assignedTo: formData.assignedTo,
          vendor: formData.vendor || undefined,
          notes: formData.notes || undefined
        });
      } else {
        await addTask({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          dueDate: formData.dueDate,
          priority: formData.priority,
          assignedTo: formData.assignedTo,
          status: 'pending',
          vendor: formData.vendor || undefined,
          notes: formData.notes || undefined
        });
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        category: '',
        dueDate: '',
        priority: 'medium',
        assignedTo: 'both',
        vendor: '',
        notes: ''
      });
      setShowForm(false);
      setEditingTask(null);
    } catch (err) {
      console.error('Error saving task:', err);
    }
  };

  const handleEdit = (task: TimelineTask) => {
    setFormData({
      title: task.title,
      description: task.description,
      category: task.category,
      dueDate: task.dueDate,
      priority: task.priority,
      assignedTo: task.assignedTo,
      vendor: task.vendor || '',
      notes: task.notes || ''
    });
    setEditingTask(task);
    setShowForm(true);
  };

  const handleDelete = async (taskId: string) => {
    if (confirm('Are you sure you want to delete this task?')) {
      try {
        await deleteTask(taskId);
      } catch (err) {
        console.error('Error deleting task:', err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Filter tasks based on selected filters
  const filteredTasks = tasks.filter(task => {
    const categoryMatch = selectedCategory === 'all' || task.category === selectedCategory;
    const statusMatch = selectedStatus === 'all' || task.status === selectedStatus;
    return categoryMatch && statusMatch;
  });

  const statistics = getTaskStatistics();
  const overdueTasks = getOverdueTasks();
  const upcomingTasks = getUpcomingTasks(7);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Wedding Timeline & Checklist</h2>
            <p className="text-gray-600">
              Track your wedding planning progress with a comprehensive timeline and task checklist.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary btn-lg"
          >
            {showForm ? 'Cancel' : 'Add Task'}
          </button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-semibold text-gray-900">Total Tasks</h3>
          <p className="text-2xl font-bold text-primary-600">{statistics.total}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">✅</div>
          <h3 className="font-semibold text-gray-900">Completed</h3>
          <p className="text-2xl font-bold text-green-600">{statistics.completed}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">⏳</div>
          <h3 className="font-semibold text-gray-900">Pending</h3>
          <p className="text-2xl font-bold text-yellow-600">{statistics.pending}</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center">
          <div className="text-3xl mb-2">⚠️</div>
          <h3 className="font-semibold text-gray-900">Overdue</h3>
          <p className="text-2xl font-bold text-red-600">{statistics.overdue}</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Overall Progress</h3>
        <div className="w-full bg-gray-200 rounded-full h-4 mb-2">
          <div 
            className="bg-gradient-to-r from-primary-500 to-secondary-500 h-4 rounded-full transition-all duration-300"
            style={{ width: `${statistics.completionRate}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-sm text-gray-600">
          <span>{statistics.completed} of {statistics.total} tasks completed</span>
          <span>{statistics.completionRate.toFixed(1)}%</span>
        </div>
      </div>

      {/* Alerts */}
      {overdueTasks.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center">
            <div className="text-red-500 mr-3">⚠️</div>
            <div>
              <h4 className="font-semibold text-red-900">Overdue Tasks</h4>
              <p className="text-red-800 text-sm">
                You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''} that need attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Task Form */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingTask ? 'Edit Task' : 'Add New Task'}
          </h3>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Task Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="input w-full"
                  placeholder="Enter task title"
                  required
                />
              </div>

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
                    <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="dueDate" className="block text-sm font-semibold text-gray-700 mb-2">
                  Due Date *
                </label>
                <input
                  type="date"
                  id="dueDate"
                  name="dueDate"
                  value={formData.dueDate}
                  onChange={handleInputChange}
                  className="input w-full"
                  required
                />
              </div>

              <div>
                <label htmlFor="priority" className="block text-sm font-semibold text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  id="priority"
                  name="priority"
                  value={formData.priority}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  {priorities.map((priority) => (
                    <option key={priority.value} value={priority.value}>{priority.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="assignedTo" className="block text-sm font-semibold text-gray-700 mb-2">
                  Assigned To
                </label>
                <select
                  id="assignedTo"
                  name="assignedTo"
                  value={formData.assignedTo}
                  onChange={handleInputChange}
                  className="input w-full"
                >
                  {assignedToOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
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
                  placeholder="Vendor name (optional)"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="input w-full h-24"
                placeholder="Task description..."
              />
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="input w-full h-20"
                placeholder="Additional notes..."
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                }}
                className="btn-outline btn-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary btn-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter Tasks</h3>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.icon} {category.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="input"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Tasks ({filteredTasks.length})</h3>
        
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📋</div>
            <p className="text-gray-600">No tasks found for the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const category = categories.find(c => c.id === task.category);
              const priority = priorities.find(p => p.value === task.priority);
              const status = statuses.find(s => s.value === task.status);
              const isOverdue = new Date(task.dueDate) < new Date() && task.status !== 'completed';
              
              return (
                <div key={task.id} className={`border rounded-xl p-4 ${
                  isOverdue ? 'border-red-200 bg-red-50' : 'border-gray-200'
                }`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => completeTask(task.id)}
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          task.status === 'completed'
                            ? 'bg-green-500 border-green-500 text-white'
                            : 'border-gray-300 hover:border-green-500'
                        }`}
                      >
                        {task.status === 'completed' && '✓'}
                      </button>
                      <h4 className={`font-semibold ${
                        task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center space-x-2">
                      {category && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${category.color}`}>
                          {category.icon} {category.name}
                        </span>
                      )}
                      {priority && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${priority.color}`}>
                          {priority.label}
                        </span>
                      )}
                      {status && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.label}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-gray-600 text-sm mb-3">{task.description}</p>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                    <div>
                      <span className="font-medium">Due Date:</span> {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">Assigned To:</span> {task.assignedTo}
                    </div>
                    {task.vendor && (
                      <div>
                        <span className="font-medium">Vendor:</span> {task.vendor}
                      </div>
                    )}
                  </div>
                  
                  {task.notes && (
                    <div className="text-sm text-gray-600 mb-3">
                      <span className="font-medium">Notes:</span> {task.notes}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => handleEdit(task)}
                      className="btn-outline btn-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(task.id)}
                      className="btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                    >
                      Delete
                    </button>
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

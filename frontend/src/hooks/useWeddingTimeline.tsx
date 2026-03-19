'use client';

import { useState, useEffect } from 'react';

// Wedding Timeline Interfaces
export interface TimelineTask {
  id: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: 'bride' | 'groom' | 'both' | 'vendor' | 'family';
  vendor?: string;
  notes?: string;
  completedAt?: string;
  createdAt: string;
}

export interface TimelineCategory {
  id: string;
  name: string;
  color: string;
  icon: string;
  order: number;
}

interface UseWeddingTimelineReturn {
  // Timeline Tasks
  tasks: TimelineTask[];
  addTask: (task: Omit<TimelineTask, 'id' | 'createdAt'>) => Promise<void>;
  updateTask: (id: string, task: Partial<TimelineTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  completeTask: (id: string) => Promise<void>;
  
  // Categories
  categories: TimelineCategory[];
  
  // Filtering and Sorting
  getTasksByCategory: (category: string) => TimelineTask[];
  getTasksByStatus: (status: TimelineTask['status']) => TimelineTask[];
  getOverdueTasks: () => TimelineTask[];
  getUpcomingTasks: (days: number) => TimelineTask[];
  
  // Statistics
  getTaskStatistics: () => {
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    completionRate: number;
  };
  
  // Loading and Error States
  isLoading: boolean;
  error: string | null;
}

export function useWeddingTimeline(): UseWeddingTimelineReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TimelineTask[]>([]);

  // Timeline categories
  const categories: TimelineCategory[] = [
    { id: 'planning', name: 'Planning', color: 'bg-blue-100 text-blue-800', icon: '📋', order: 1 },
    { id: 'venue', name: 'Venue', color: 'bg-green-100 text-green-800', icon: '🏛️', order: 2 },
    { id: 'vendors', name: 'Vendors', color: 'bg-purple-100 text-purple-800', icon: '🏢', order: 3 },
    { id: 'attire', name: 'Attire', color: 'bg-pink-100 text-pink-800', icon: '👗', order: 4 },
    { id: 'ceremony', name: 'Ceremony', color: 'bg-yellow-100 text-yellow-800', icon: '💒', order: 5 },
    { id: 'reception', name: 'Reception', color: 'bg-orange-100 text-orange-800', icon: '🎉', order: 6 },
    { id: 'honeymoon', name: 'Honeymoon', color: 'bg-indigo-100 text-indigo-800', icon: '✈️', order: 7 },
    { id: 'legal', name: 'Legal', color: 'bg-red-100 text-red-800', icon: '📄', order: 8 }
  ];

  // Load timeline data on mount
  useEffect(() => {
    loadTimelineData();
  }, []);

  const loadTimelineData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock timeline tasks
      const mockTasks: TimelineTask[] = [
        {
          id: '1',
          title: 'Book Venue',
          description: 'Research and book the wedding venue',
          category: 'venue',
          dueDate: '2024-02-15',
          status: 'completed',
          priority: 'high',
          assignedTo: 'both',
          vendor: 'Garden Venue',
          notes: 'Deposit paid, contract signed',
          completedAt: '2024-01-20T10:00:00Z',
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: '2',
          title: 'Choose Wedding Dress',
          description: 'Find and order wedding dress',
          category: 'attire',
          dueDate: '2024-03-01',
          status: 'in_progress',
          priority: 'high',
          assignedTo: 'bride',
          notes: 'Appointment scheduled for next week',
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: '3',
          title: 'Book Photographer',
          description: 'Research and book wedding photographer',
          category: 'vendors',
          dueDate: '2024-02-28',
          status: 'pending',
          priority: 'medium',
          assignedTo: 'both',
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: '4',
          title: 'Send Save the Dates',
          description: 'Design and send save the date cards',
          category: 'planning',
          dueDate: '2024-01-31',
          status: 'overdue',
          priority: 'urgent',
          assignedTo: 'both',
          notes: 'Need to finalize guest list first',
          createdAt: '2024-01-01T10:00:00Z'
        },
        {
          id: '5',
          title: 'Plan Honeymoon',
          description: 'Research and book honeymoon destination',
          category: 'honeymoon',
          dueDate: '2024-04-01',
          status: 'pending',
          priority: 'low',
          assignedTo: 'both',
          createdAt: '2024-01-01T10:00:00Z'
        }
      ];
      
      setTasks(mockTasks);
      
    } catch (err) {
      setError('Failed to load timeline data');
      console.error('Error loading timeline data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Task Management Functions
  const addTask = async (task: Omit<TimelineTask, 'id' | 'createdAt'>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      const newTask: TimelineTask = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };
      setTasks(prev => [...prev, newTask]);
    } catch (err) {
      setError('Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (id: string, task: Partial<TimelineTask>) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTasks(prev => prev.map(t => 
        t.id === id ? { ...t, ...task } : t
      ));
    } catch (err) {
      setError('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setError('Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (id: string) => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setTasks(prev => prev.map(t => 
        t.id === id ? { 
          ...t, 
          status: 'completed' as const,
          completedAt: new Date().toISOString()
        } : t
      ));
    } catch (err) {
      setError('Failed to complete task');
    } finally {
      setIsLoading(false);
    }
  };

  // Filtering Functions
  const getTasksByCategory = (category: string) => {
    return tasks.filter(task => task.category === category);
  };

  const getTasksByStatus = (status: TimelineTask['status']) => {
    return tasks.filter(task => task.status === status);
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate < today && task.status !== 'completed';
    });
  };

  const getUpcomingTasks = (days: number) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + (days * 24 * 60 * 60 * 1000));
    return tasks.filter(task => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= futureDate && task.status !== 'completed';
    });
  };

  const getTaskStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    const overdue = getOverdueTasks().length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate
    };
  };

  return {
    // Timeline Tasks
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    
    // Categories
    categories,
    
    // Filtering and Sorting
    getTasksByCategory,
    getTasksByStatus,
    getOverdueTasks,
    getUpcomingTasks,
    
    // Statistics
    getTaskStatistics,
    
    // Loading and Error States
    isLoading,
    error
  };
}

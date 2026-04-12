'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePlanningHydration } from '@/hooks/PlanningHydrationContext';
import {
  loadUserJsonArray,
  saveUserJsonArray,
  PLANNING_PARTS,
} from '@/lib/userPlanningStorage';

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
  const { user } = useAuth();
  const planningHydration = usePlanningHydration();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tasks, setTasks] = useState<TimelineTask[]>([]);

  const categories: TimelineCategory[] = [
    { id: 'planning', name: 'Planning', color: 'bg-blue-100 text-blue-800', icon: '📋', order: 1 },
    { id: 'venue', name: 'Venue', color: 'bg-green-100 text-green-800', icon: '🏛️', order: 2 },
    { id: 'vendors', name: 'Vendors', color: 'bg-purple-100 text-purple-800', icon: '🏢', order: 3 },
    { id: 'attire', name: 'Attire', color: 'bg-pink-100 text-pink-800', icon: '👗', order: 4 },
    { id: 'ceremony', name: 'Ceremony', color: 'bg-yellow-100 text-yellow-800', icon: '💒', order: 5 },
    { id: 'reception', name: 'Reception', color: 'bg-orange-100 text-orange-800', icon: '🎉', order: 6 },
    { id: 'honeymoon', name: 'Honeymoon', color: 'bg-indigo-100 text-indigo-800', icon: '✈️', order: 7 },
    { id: 'legal', name: 'Legal', color: 'bg-red-100 text-red-800', icon: '📄', order: 8 },
  ];

  const persistTasks = useCallback((next: TimelineTask[]) => {
    if (!user) return;
    saveUserJsonArray(String(user.id), PLANNING_PARTS.timelineTasks, next);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      setError(null);
      return;
    }
    const uid = String(user.id);
    setIsLoading(true);
    setError(null);
    try {
      const loaded = loadUserJsonArray<TimelineTask>(uid, PLANNING_PARTS.timelineTasks);
      setTasks(Array.isArray(loaded) ? loaded : []);
    } catch (err) {
      setError('Failed to load timeline data');
      console.error('Error loading timeline data:', err);
      setTasks([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, planningHydration]);

  const addTask = async (task: Omit<TimelineTask, 'id' | 'createdAt'>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      const newTask: TimelineTask = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => {
        const next = [...prev, newTask];
        persistTasks(next);
        return next;
      });
    } catch (err) {
      setError('Failed to add task');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTask = async (id: string, task: Partial<TimelineTask>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setTasks((prev) => {
        const next = prev.map((t) => (t.id === id ? { ...t, ...task } : t));
        persistTasks(next);
        return next;
      });
    } catch (err) {
      setError('Failed to update task');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTask = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        persistTasks(next);
        return next;
      });
    } catch (err) {
      setError('Failed to delete task');
    } finally {
      setIsLoading(false);
    }
  };

  const completeTask = async (id: string) => {
    if (!user) return;
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 200));
      setTasks((prev) => {
        const next = prev.map((t) =>
          t.id === id
            ? {
                ...t,
                status: 'completed' as const,
                completedAt: new Date().toISOString(),
              }
            : t
        );
        persistTasks(next);
        return next;
      });
    } catch (err) {
      setError('Failed to complete task');
    } finally {
      setIsLoading(false);
    }
  };

  const getTasksByCategory = (category: string) => {
    return tasks.filter((task) => task.category === category);
  };

  const getTasksByStatus = (status: TimelineTask['status']) => {
    return tasks.filter((task) => task.status === status);
  };

  const getOverdueTasks = () => {
    const today = new Date();
    return tasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      return dueDate < today && task.status !== 'completed';
    });
  };

  const getUpcomingTasks = (days: number) => {
    const today = new Date();
    const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return tasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      return dueDate >= today && dueDate <= futureDate && task.status !== 'completed';
    });
  };

  const getTaskStatistics = () => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.status === 'completed').length;
    const pending = tasks.filter((t) => t.status === 'pending').length;
    const overdue = getOverdueTasks().length;
    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      pending,
      overdue,
      completionRate,
    };
  };

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    categories,
    getTasksByCategory,
    getTasksByStatus,
    getOverdueTasks,
    getUpcomingTasks,
    getTaskStatistics,
    isLoading,
    error,
  };
}

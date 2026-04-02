/**
 * Per-user wedding planning data in localStorage (until a real API backs it).
 */

export function userPlanningKey(userId: string | number, part: string): string {
  return `idealweddings_${part}_${userId}`;
}

export function loadUserJsonArray<T>(userId: string | number, part: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(userPlanningKey(userId, part));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export function saveUserJsonArray<T>(userId: string | number, part: string, data: T[]): void {
  try {
    localStorage.setItem(userPlanningKey(userId, part), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

export function loadUserJsonObject<T>(userId: string | number, part: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(userPlanningKey(userId, part));
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveUserJsonObject<T>(userId: string | number, part: string, data: T): void {
  try {
    localStorage.setItem(userPlanningKey(userId, part), JSON.stringify(data));
  } catch {
    /* ignore */
  }
}

/** Storage part names — keep stable so users keep data across deploys */
export const PLANNING_PARTS = {
  weddingDetails: 'wedding_details',
  budgetItems: 'budget_items',
  selectedVendors: 'selected_vendors',
  guests: 'guests',
  quoteRequestsLegacy: 'quote_requests',
  quoteGenRequests: 'quote_generator_requests',
  quoteGenResponses: 'quote_generator_responses',
  timelineTasks: 'timeline_tasks',
} as const;

'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { pullRemotePlanning } from '@/lib/planningRemoteSync';

const PlanningHydrationContext = createContext<number>(0);

/**
 * Loads planning data from the server into localStorage after login so the same account
 * sees the same data in every browser (including Incognito), not only on the original device.
 */
export function PlanningHydrationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [hydration, setHydration] = useState(0);

  useEffect(() => {
    if (!user?.id) {
      setHydration(0);
      return;
    }
    setHydration(0);
    let cancelled = false;
    void (async () => {
      await pullRemotePlanning(String(user.id));
      if (!cancelled) setHydration((h) => h + 1);
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  return (
    <PlanningHydrationContext.Provider value={hydration}>{children}</PlanningHydrationContext.Provider>
  );
}

export function usePlanningHydration(): number {
  return useContext(PlanningHydrationContext);
}

'use client';

import { AuthProvider } from '@/hooks/useAuth';
import { PlanningHydrationProvider } from '@/hooks/PlanningHydrationContext';

export function Providers({
                              children,
                          }: {
    children: React.ReactNode;
}) {
    return (
        <AuthProvider>
            <PlanningHydrationProvider>{children}</PlanningHydrationProvider>
        </AuthProvider>
    );
}
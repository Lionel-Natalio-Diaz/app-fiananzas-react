
"use client";

import { useAppContext } from '@/contexts/AppContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import AppShell from '@/components/layout/AppShell';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';

export function AuthLayoutDecider({ children }: { children: React.ReactNode }) {
  const { state } = useAppContext();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (state.isLoading) {
      return; // Wait until loading is complete
    }

    const isAuthFlowPage = pathname === '/login' || pathname === '/onboarding';

    if (!state.isAuthenticated && !isAuthFlowPage) {
      router.replace('/login');
    } else if (state.isAuthenticated && !state.isOnboardingComplete && pathname !== '/onboarding') {
      router.replace('/onboarding');
    } else if (state.isAuthenticated && state.isOnboardingComplete && isAuthFlowPage) {
      router.replace('/'); // User is fully set up, redirect from auth pages to dashboard
    }
  }, [state.isAuthenticated, state.isOnboardingComplete, state.isLoading, router, pathname]);

  if (state.isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // Allow rendering of login page if not authenticated
  if (!state.isAuthenticated && pathname === '/login') {
    return <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-background">{children}</main>;
  }

  // Allow rendering of onboarding page if authenticated but onboarding not complete
  if (state.isAuthenticated && !state.isOnboardingComplete && pathname === '/onboarding') {
    return <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-6 bg-background">{children}</main>;
  }

  // If fully authenticated and onboarded, and not on an auth page, render AppShell
  if (state.isAuthenticated && state.isOnboardingComplete && pathname !== '/login' && pathname !== '/onboarding') {
    return <AppShell>{children}</AppShell>;
  }
  
  // Fallback: if none of the above conditions are met (e.g., during redirection), show loader.
  // This covers cases like trying to access / while not authenticated, before useEffect redirects.
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}


"use client";

import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { AppContentWrapper } from '@/components/layout/AppContentWrapper';
import { DynamicToaster } from '@/components/layout/DynamicToaster';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <AppContentWrapper>
        {children}
      </AppContentWrapper>
      <DynamicToaster />
    </AppProvider>
  );
}

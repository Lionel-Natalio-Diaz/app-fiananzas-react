"use client";

import React from 'react';
import { MainHeader } from './MainHeader';
import { TooltipProvider } from '@/components/ui/tooltip'; // Import TooltipProvider

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider> {/* Added TooltipProvider here */}
      <div className="flex min-h-svh w-full flex-col bg-background">
        <MainHeader />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </TooltipProvider>
  );
}
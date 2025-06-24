"use client";

import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuccessNotificationModalProps {
  isOpen: boolean;
  message: string;
  onClose: () => void;
  duration?: number;
}

export function SuccessNotificationModal({
  isOpen,
  message,
  onClose,
  duration = 1500,
}: SuccessNotificationModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration, onClose]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className={cn(
            "bg-transparent border-none shadow-none",
            "flex flex-col items-center justify-center", 
            "p-0 w-full max-w-md",
            "[&>button]:hidden"
        )}
      >
        <DialogTitle className="sr-only">Confirmación</DialogTitle>
        <CheckCircle2 className="h-20 w-20 text-green-500 mb-4 animate-in zoom-in-75" />
        <DialogDescription className="text-lg font-medium text-white text-center">{message}</DialogDescription>
      </DialogContent>
    </Dialog>
  );
}

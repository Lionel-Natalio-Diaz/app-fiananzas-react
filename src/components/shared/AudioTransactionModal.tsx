"use client";

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TransactionForm } from '@/components/transactions/TransactionForm';
import type { TransactionFormValues } from '@/components/transactions/TransactionForm';

interface AudioTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Partial<TransactionFormValues>;
  onTransactionSaved: () => void;
  formKey: number; // Added formKey prop
}

export function AudioTransactionModal({ isOpen, onClose, initialData, onTransactionSaved, formKey }: AudioTransactionModalProps) {
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="h-[80vh] flex flex-col rounded-lg">
        <DialogHeader>
          <DialogTitle>Nueva Transacción</DialogTitle>
        </DialogHeader>
        <div className="pt-4 flex-grow min-h-0">
          <TransactionForm
            key={formKey} // Use the passed formKey
            initialData={initialData} 
            onSave={onTransactionSaved}
            onCancel={onClose} 
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

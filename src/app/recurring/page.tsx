
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, PlusCircle, MoreHorizontal, Repeat, TrendingUp, TrendingDown } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import type { RecurringTransaction } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { RecurringTransactionForm, type RecurringTransactionFormValues } from '@/components/recurring/RecurringTransactionForm';

const formatCurrency = (amount: number, currency: string) => {
  return `${currency}${Math.trunc(amount).toLocaleString('es-ES')}`;
};

const recurrenceMap = {
  weekly: 'Semanal',
  monthly: 'Mensual',
  yearly: 'Anual',
};

export default function RecurringPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { state, addRecurringTransaction, updateRecurringTransaction, deleteRecurringTransaction } = useAppContext();
  const { categories, userProfile, isLoading, recurringTransactions } = state;
  const currency = userProfile?.currency ? CURRENCY_SYMBOL[userProfile.currency as keyof typeof CURRENCY_SYMBOL] || CURRENCY_SYMBOL.USD : CURRENCY_SYMBOL.USD;
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<RecurringTransaction | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const categoryDetailsMap = useMemo(() => {
    return new Map(categories.map(c => [c.name, c]));
  }, [categories]);

  const handleOpenModal = (item: RecurringTransaction | null) => {
    setSelectedTransaction(item);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleOpenDeleteDialog = (item: RecurringTransaction) => {
    setSelectedTransaction(item);
    setIsDeleteAlertOpen(true);
  };
  
  const handleSave = async (data: RecurringTransactionFormValues) => {
    try {
        if (selectedTransaction) {
            await updateRecurringTransaction({ ...data, id: selectedTransaction.id });
            toast({ title: 'Pago Recurrente Actualizado' });
        } else {
            await addRecurringTransaction(data);
            toast({ title: 'Pago Recurrente Creado' });
        }
        handleCloseModal();
    } catch (error) {
        console.error("Error saving recurring transaction", error);
        toast({ title: 'Error', description: 'No se pudo guardar el pago recurrente.', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    try {
        await deleteRecurringTransaction(selectedTransaction.id);
        toast({ title: 'Pago Recurrente Eliminado' });
        setIsDeleteAlertOpen(false);
        setSelectedTransaction(null);
    } catch (error) {
        console.error("Error deleting recurring transaction", error);
        toast({ title: 'Error', description: 'No se pudo eliminar.', variant: 'destructive' });
    }
  };

  const PageHeader = () => (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="text-3xl font-bold">Pagos Recurrentes</h1>
            <p className="text-muted-foreground">Gestiona tus gastos e ingresos fijos.</p>
        </div>
        <Button onClick={() => handleOpenModal(null)}>
            <PlusCircle className="mr-2" />
            Crear Pago Recurrente
        </Button>
    </div>
  );

  const MobileHeader = () => (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 px-4 backdrop-blur-sm shrink-0">
        <div className='flex items-center gap-4'>
            <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Volver</span>
            </Button>
            <h1 className="text-xl font-semibold">Pagos Recurrentes</h1>
        </div>
        <Button size="sm" onClick={() => handleOpenModal(null)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Crear
        </Button>
    </header>
  );

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <LoadingSpinner size="lg" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {isMobile && <MobileHeader />}

      <main className="flex-grow space-y-6 p-4 md:p-6 overflow-y-auto">
        {!isMobile && <PageHeader />}
        
        {recurringTransactions.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {recurringTransactions.map((item) => {
                    const category = categoryDetailsMap.get(item.category);
                    const Icon = category ? Icons[category.icon as keyof typeof Icons] || MoreHorizontal : MoreHorizontal;
                    const TypeIcon = item.type === 'expense' ? TrendingDown : TrendingUp;
                    
                    return (
                        <Card key={item.id} className="shadow-md rounded-xl">
                            <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 flex items-center justify-center rounded-full" style={{ backgroundColor: `${category?.color}33` }}>
                                        <Icon className="h-6 w-6" style={{ color: category?.color }} />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg font-medium">{item.description}</CardTitle>
                                        <p className="text-sm text-muted-foreground">{item.category}</p>
                                    </div>
                                </div>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Opciones</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenModal(item)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(item)} className="text-destructive">Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="flex items-center justify-between pt-4">
                               <div className="flex items-center gap-2">
                                  <TypeIcon className={cn("h-5 w-5", item.type === 'expense' ? 'text-destructive' : 'text-accent')} />
                                   <span className={cn('text-xl font-bold', item.type === 'expense' ? 'text-destructive' : 'text-accent')}>
                                    {formatCurrency(item.amount, currency)}
                                  </span>
                               </div>
                               <div className="text-sm font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {recurrenceMap[item.recurrence]}
                               </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-xl mt-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Repeat className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Sin pagos recurrentes</h2>
              <p className="text-muted-foreground mt-2 max-w-sm">Crea pagos recurrentes para suscripciones, salarios o cualquier gasto o ingreso fijo.</p>
              <Button className="mt-6" onClick={() => handleOpenModal(null)}>
                <PlusCircle className="mr-2" />
                Crear mi primer pago recurrente
              </Button>
            </div>
        )}
      </main>
      
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader className="p-6 pb-2">
                <DialogTitle>{selectedTransaction ? 'Editar Pago Recurrente' : 'Crear Pago Recurrente'}</DialogTitle>
            </DialogHeader>
            <RecurringTransactionForm 
              key={selectedTransaction?.id || 'new'}
              initialData={selectedTransaction || undefined}
              onSave={handleSave}
              onCancel={handleCloseModal}
            />
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este pago recurrente?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará esta regla de pagos recurrentes.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

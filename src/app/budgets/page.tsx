
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Target, PlusCircle, MoreHorizontal } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAppContext } from '@/contexts/AppContext';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { startOfMonth, endOfMonth } from 'date-fns';
import type { Budget, UserCategory } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number, currency: string) => {
  return `${currency}${Math.trunc(amount).toLocaleString('es-ES')}`;
};

export default function BudgetsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { state, addBudget, updateBudget, deleteBudget } = useAppContext();
  const { categories, userProfile, isLoading, transactions, budgets } = state;
  const currency = userProfile?.currency ? CURRENCY_SYMBOL[userProfile.currency as keyof typeof CURRENCY_SYMBOL] || CURRENCY_SYMBOL.USD : CURRENCY_SYMBOL.USD;
  const { toast } = useToast();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  
  // Form state
  const [formCategory, setFormCategory] = useState('');
  const [formAmount, setFormAmount] = useState('');

  useEffect(() => {
    if (isModalOpen) {
      if (selectedBudget) {
        setFormCategory(selectedBudget.category);
        setFormAmount(String(selectedBudget.amount));
      } else {
        // Reset form for new budget, select first available category
        const firstAvailableCategory = availableCategoriesForSelect[0]?.name || '';
        setFormCategory(firstAvailableCategory);
        setFormAmount('');
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isModalOpen, selectedBudget]);

  const categoryDetailsMap = useMemo(() => {
    return new Map(categories.map(c => [c.name, c]));
  }, [categories]);
  
  const budgetsWithSpent = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthlyTransactions = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= start && tDate <= end;
    });

    const expensesByCategory = new Map<string, number>();
    monthlyTransactions.forEach(t => {
        expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + t.amount);
    });

    return budgets.map(budget => ({
        ...budget,
        spentAmount: expensesByCategory.get(budget.category) || 0,
    })).sort((a,b) => a.category.localeCompare(b.category));
  }, [budgets, transactions]);

  const availableCategoriesForSelect = useMemo(() => {
    if (selectedBudget) {
      return categories.filter(c => c.name === selectedBudget.category);
    }
    const budgetedCategoryNames = new Set(budgets.map(b => b.category));
    return categories.filter(c => c.type === 'expense' && !budgetedCategoryNames.has(c.name));
  }, [categories, budgets, selectedBudget]);

  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return 'hsl(var(--destructive))';
    if (percentage > 80) return 'hsl(var(--chart-3))';
    return 'hsl(var(--accent))';
  };
  
  const handleOpenModal = (budget: Budget | null) => {
    setSelectedBudget(budget);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBudget(null);
  };

  const handleOpenDeleteDialog = (budget: Budget) => {
    setSelectedBudget(budget);
    setIsDeleteAlertOpen(true);
  };
  
  const handleSaveBudget = async () => {
    if (!formCategory || !formAmount || Number(formAmount) <= 0) {
        toast({
            title: 'Error de validación',
            description: 'Por favor, elige una categoría y un monto válido y mayor a cero.',
            variant: 'destructive',
        });
        return;
    }

    const budgetData = {
        category: formCategory,
        amount: Number(formAmount),
        period: 'monthly' as const,
    };

    try {
        if (selectedBudget) {
            await updateBudget({ ...budgetData, id: selectedBudget.id });
            toast({ title: 'Presupuesto Actualizado' });
        } else {
            await addBudget(budgetData);
            toast({ title: 'Presupuesto Creado' });
        }
        handleCloseModal();
    } catch (error) {
        console.error("Error saving budget", error);
        toast({ title: 'Error', description: 'No se pudo guardar el presupuesto.', variant: 'destructive' });
    }
  };

  const handleDeleteBudget = async () => {
    if (!selectedBudget) return;
    try {
        await deleteBudget(selectedBudget.id);
        toast({ title: 'Presupuesto Eliminado' });
        setIsDeleteAlertOpen(false);
        setSelectedBudget(null);
    } catch (error) {
        console.error("Error deleting budget", error);
        toast({ title: 'Error', description: 'No se pudo eliminar el presupuesto.', variant: 'destructive' });
    }
  };

  const PageHeader = () => (
    <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
            <h1 className="text-3xl font-bold">Presupuestos Mensuales</h1>
            <p className="text-muted-foreground">Controla tus gastos estableciendo límites por categoría.</p>
        </div>
        <Button onClick={() => handleOpenModal(null)}>
            <PlusCircle className="mr-2" />
            Crear Presupuesto
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
            <h1 className="text-xl font-semibold">Presupuestos</h1>
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
        
        {budgetsWithSpent.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {budgetsWithSpent.map((budget) => {
                    const category = categoryDetailsMap.get(budget.category);
                    const Icon = category ? Icons[category.icon as keyof typeof Icons] || MoreHorizontal : MoreHorizontal;
                    const spent = budget.spentAmount || 0;
                    const percentage = (spent / budget.amount) * 100;
                    const remaining = budget.amount - spent;

                    return (
                        <Card key={budget.id} className="shadow-md rounded-xl">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-lg font-medium flex items-center gap-2">
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${category?.color}33` }}>
                                        <Icon className="h-5 w-5" style={{ color: category?.color }} />
                                    </div>
                                    {budget.category}
                                </CardTitle>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreHorizontal className="h-4 w-4" />
                                            <span className="sr-only">Opciones</span>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => handleOpenModal(budget)}>Editar</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleOpenDeleteDialog(budget)} className="text-destructive">Eliminar</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Gastado</span>
                                        <span>Presupuestado</span>
                                    </div>
                                    <div className="flex justify-between font-semibold">
                                        <span className={cn(percentage > 100 && 'text-destructive')}>{formatCurrency(spent, currency)}</span>
                                        <span>{formatCurrency(budget.amount, currency)}</span>
                                    </div>
                                </div>
                                <Progress value={Math.min(percentage, 100)} indicatorColor={getProgressColor(percentage)} className="h-3" />
                                <p className={cn("text-sm text-center font-medium", remaining < 0 ? 'text-destructive' : 'text-muted-foreground')}>
                                  {remaining >= 0 
                                      ? `${formatCurrency(remaining, currency)} restante` 
                                      : `${formatCurrency(Math.abs(remaining), currency)} de más`}
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        ) : (
            <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed rounded-xl mt-8">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-xl font-semibold">Aún no tienes presupuestos</h2>
              <p className="text-muted-foreground mt-2 max-w-sm">Crea tu primer presupuesto para empezar a tener un mayor control sobre tus gastos.</p>
              <Button className="mt-6" onClick={() => handleOpenModal(null)}>
                <PlusCircle className="mr-2" />
                Crear mi primer presupuesto
              </Button>
            </div>
        )}
      </main>
      
      <Dialog open={isModalOpen} onOpenChange={handleCloseModal}>
        <DialogContent className="sm:max-w-md">
            <DialogHeader className="p-6 pb-0">
                <DialogTitle>{selectedBudget ? 'Editar Presupuesto' : 'Crear Nuevo Presupuesto'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 p-6">
                <div className="grid gap-2">
                    <Label htmlFor="category">Categoría</Label>
                    <Select value={formCategory} onValueChange={setFormCategory} disabled={!!selectedBudget}>
                        <SelectTrigger id="category">
                            <SelectValue placeholder="Elige una categoría" />
                        </SelectTrigger>
                        <SelectContent>
                            {availableCategoriesForSelect.length > 0 ? (
                                availableCategoriesForSelect.map(cat => (
                                    <SelectItem key={cat.id} value={cat.name}>
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: cat.color }}
                                            >
                                                {React.createElement(Icons[cat.icon as keyof typeof Icons] || MoreHorizontal, { className: 'h-3 w-3 text-white' })}
                                            </div>
                                            <span>{cat.name}</span>
                                        </div>
                                    </SelectItem>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-muted-foreground">No hay más categorías disponibles para presupuestar.</div>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Monto</Label>
                    <Input id="amount" type="number" placeholder="ej: 50000" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} />
                </div>
            </div>
            <DialogFooter className="p-6 pt-0">
                <Button variant="ghost" onClick={handleCloseModal}>Cancelar</Button>
                <Button onClick={handleSaveBudget} disabled={!formCategory}>Guardar Presupuesto</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de que quieres eliminar este presupuesto?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el límite de gasto para esta categoría.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteBudget}>Eliminar</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}

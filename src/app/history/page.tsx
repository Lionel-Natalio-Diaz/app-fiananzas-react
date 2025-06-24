
'use client';

import { useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useMemo, useState, useEffect } from 'react';
import { ArrowLeft, MoreHorizontal, Calendar as CalendarIcon, Filter, Trash2 } from 'lucide-react';
import * as Icons from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { format, startOfDay, endOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import type { UserCategory, Transaction } from '@/lib/types';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { useToast } from '@/hooks/use-toast';

const formatCurrency = (amount: number, currency: string) => {
  return `${currency}${Math.trunc(amount).toLocaleString('es-ES')}`;
};

export default function HistoryPage() {
  const router = useRouter();
  const { state, deleteTransaction } = useAppContext();
  const { transactions, userProfile, categories } = state;
  const isMobile = useIsMobile();
  const { toast } = useToast();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);
  
  // Filter states
  const [filterType, setFilterType] = useState<'all' | 'expense' | 'income'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  
  // Edit/Delete state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);


  const categoryMap = useMemo(() => {
    return new Map<string, UserCategory>(categories.map(c => [c.name, c]));
  }, [categories]);
  
  const currency = userProfile?.currency
    ? CURRENCY_SYMBOL[userProfile.currency as keyof typeof CURRENCY_SYMBOL] || CURRENCY_SYMBOL.USD
    : CURRENCY_SYMBOL.USD;

  const filteredCategoriesForSelect = useMemo(() => {
    if (filterType === 'all') {
      return categories.sort((a, b) => a.name.localeCompare(b.name));
    }
    return categories.filter(c => c.type === filterType).sort((a, b) => a.name.localeCompare(b.name));
  }, [categories, filterType]);

  useEffect(() => {
      const isCategoryValid = filteredCategoriesForSelect.some(c => c.name === filterCategory);
      if (filterCategory !== 'all' && !isCategoryValid) {
          setFilterCategory('all');
      }
  }, [filterType, filteredCategoriesForSelect, filterCategory]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const typeMatch = filterType === 'all' || t.type === filterType;
      const categoryMatch = filterCategory === 'all' || t.category === filterCategory;
      
      let dateMatch = true;
      if (dateRange?.from) {
        const transactionDate = new Date(t.date);
        const from = startOfDay(dateRange.from);
        const to = dateRange.to ? endOfDay(dateRange.to) : endOfDay(dateRange.from);
        dateMatch = transactionDate >= from && transactionDate <= to;
      }
      
      return typeMatch && categoryMatch && dateMatch;
    });
  }, [transactions, filterType, filterCategory, dateRange]);

  const handleOpenEditModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedTransaction(null);
  };

  const handleDeleteTransaction = async () => {
    if (!selectedTransaction) return;
    try {
      await deleteTransaction(selectedTransaction.id);
      toast({ title: "Eliminado", description: "La transacción ha sido eliminada." });
      setIsDeleteAlertOpen(false);
      handleCloseEditModal();
    } catch (error) {
      console.error("Error deleting transaction", error);
      toast({ title: "Error", description: "No se pudo eliminar la transacción.", variant: "destructive" });
    }
  };


  if (!isClient || state.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  
  const selectedCategoryDetails = categories.find(c => c.name === filterCategory);

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {isMobile && (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Button>
          <h1 className="text-xl font-semibold">Historial de Transacciones</h1>
        </header>
      )}

      <main className="flex-grow space-y-4 p-4 md:p-6 overflow-y-auto">
        {!isMobile && (
           <div className="flex items-center gap-4 mb-4">
             <Button variant="outline" asChild className="h-9 w-9 p-0">
               <Link href="/">
                 <ArrowLeft className="h-5 w-5" />
                 <span className="sr-only">Volver</span>
               </Link>
             </Button>
             <h1 className="text-3xl font-bold">Historial de Transacciones</h1>
           </div>
        )}

        <Accordion type="single" collapsible className="w-full" defaultValue="filters">
            <AccordionItem value="filters" className="border-b-0">
                <AccordionTrigger className="px-4 py-3 bg-card rounded-lg shadow-sm border font-semibold text-base hover:no-underline">
                   <div className="flex items-center gap-2">
                       <Filter className="h-5 w-5" />
                       Filtros de Búsqueda
                   </div>
                </AccordionTrigger>
                <AccordionContent className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-card rounded-lg shadow-sm border border-t-0 rounded-t-none">
                      <div className="grid gap-2">
                          <Label htmlFor="filter-type">Tipo</Label>
                          <Select value={filterType} onValueChange={(value) => setFilterType(value as any)}>
                              <SelectTrigger id="filter-type">
                                  <SelectValue placeholder="Filtrar por tipo" />
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="all">Todos</SelectItem>
                                  <SelectItem value="expense">Gastos</SelectItem>
                                  <SelectItem value="income">Ingresos</SelectItem>
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="filter-category">Categoría</Label>
                          <Select value={filterCategory} onValueChange={setFilterCategory}>
                              <SelectTrigger id="filter-category">
                                  <SelectValue placeholder="Todas las categorías">
                                    <div className="flex items-center gap-2">
                                        {selectedCategoryDetails ? (
                                            <div 
                                                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                                                style={{ backgroundColor: selectedCategoryDetails.color }}
                                            >
                                                {React.createElement(Icons[selectedCategoryDetails.icon as keyof typeof Icons] || MoreHorizontal, { className: 'h-3 w-3 text-white' })}
                                            </div>
                                        ) : null}
                                        <span>{selectedCategoryDetails?.name || 'Todas las categorías'}</span>
                                    </div>
                                  </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                  <SelectItem value="all">Todas las categorías</SelectItem>
                                  {filteredCategoriesForSelect.map(cat => (
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
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      <div className="grid gap-2">
                          <Label htmlFor="date-range">Rango de Fechas</Label>
                          <Popover>
                              <PopoverTrigger asChild>
                                  <Button
                                      id="date-range"
                                      variant={"outline"}
                                      className={cn(
                                          "w-full justify-start text-left font-normal",
                                          !dateRange && "text-muted-foreground"
                                      )}
                                  >
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      {dateRange?.from ? (
                                          dateRange.to ? (
                                              <>
                                                  {format(dateRange.from, "d LLL, y", { locale: es })} -{" "}
                                                  {format(dateRange.to, "d LLL, y", { locale: es })}
                                              </>
                                          ) : (
                                              format(dateRange.from, "d LLL, y", { locale: es })
                                          )
                                      ) : (
                                          <span>Selecciona un rango</span>
                                      )}
                                  </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                      initialFocus
                                      mode="range"
                                      defaultMonth={dateRange?.from}
                                      selected={dateRange}
                                      onSelect={setDateRange}
                                      numberOfMonths={isMobile ? 1 : 2}
                                      locale={es}
                                  />
                              </PopoverContent>
                          </Popover>
                      </div>
                  </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-3 pt-4">
            {filteredTransactions.map((transaction) => {
              const categoryDetails = categoryMap.get(transaction.category);
              const CategoryIcon = categoryDetails ? Icons[categoryDetails.icon as keyof typeof Icons] || MoreHorizontal : MoreHorizontal;
              
              return (
                <button
                  key={transaction.id}
                  onClick={() => handleOpenEditModal(transaction)}
                  className="flex w-full items-center justify-between text-left text-sm p-3 rounded-lg bg-card shadow-sm border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {categoryDetails && (
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: categoryDetails.color }}
                      >
                        <CategoryIcon className="h-5 w-5 text-white" />
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-base">{transaction.description}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                      </span>
                    </div>
                  </div>
                  <span
                    className={cn(
                      'font-bold text-lg',
                      transaction.type === 'expense' ? 'text-destructive' : 'text-accent'
                    )}
                  >
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount, currency)}
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-8 rounded-lg bg-card shadow-sm border mt-8">
            <p className="text-muted-foreground text-sm">
              No se encontraron transacciones que coincidan con los filtros.
            </p>
          </div>
        )}
      </main>

       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="w-[calc(100vw-2rem)] h-[80vh] flex flex-col rounded-lg">
                <DialogHeader className="p-4 border-b">
                    <DialogTitle>Editar Transacción</DialogTitle>
                </DialogHeader>
                <div className="flex-grow min-h-0">
                    {selectedTransaction && (
                        <TransactionForm
                            initialData={selectedTransaction}
                            onSave={handleCloseEditModal}
                            onCancel={handleCloseEditModal}
                            onDelete={() => setIsDeleteAlertOpen(true)}
                        />
                    )}
                </div>
            </DialogContent>
        </Dialog>

        <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar esta transacción?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDeleteTransaction}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

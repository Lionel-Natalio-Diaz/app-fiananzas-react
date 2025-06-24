
'use client';

import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/AppContext';
import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  MoreHorizontal,
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';

const formatCurrency = (amount: number, currency: string) => {
  return `${currency}${Math.trunc(amount).toLocaleString('es-ES')}`;
};

export default function CategoryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { state } = useAppContext();
  const { transactions, userProfile, categories } = state;
  const isMobile = useIsMobile();

  const [isClient, setIsClient] = useState(false);
  useEffect(() => setIsClient(true), []);

  const categoryName = useMemo(() => {
    const cat = params.category;
    if (typeof cat === 'string') {
      return decodeURIComponent(cat);
    }
    return null;
  }, [params.category]);
  
  const categoryDetails = useMemo(() => {
    return categories.find(c => c.name === categoryName);
  }, [categories, categoryName]);

  const currency = userProfile?.currency
    ? CURRENCY_SYMBOL[userProfile.currency as keyof typeof CURRENCY_SYMBOL] || CURRENCY_SYMBOL.USD
    : CURRENCY_SYMBOL.USD;

  const filteredTransactions = useMemo(() => {
    if (!categoryName) return [];
    return transactions.filter((t) => t.category === categoryName);
  }, [transactions, categoryName]);

  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredTransactions]);
  
  const transactionType = useMemo(() => {
    if (filteredTransactions.length > 0) {
      return filteredTransactions[0].type;
    }
    return 'expense'; // Default
  }, [filteredTransactions]);


  const CategoryIcon = categoryDetails ? Icons[categoryDetails.icon as keyof typeof Icons] || MoreHorizontal : MoreHorizontal;
  
  if (!isClient || state.isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!categoryName) {
    return (
      <div className="p-4 text-center">
        <p>Categoría no encontrada.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Volver
        </Button>
      </div>
    );
  }

  const PageHeader = () => (
      <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: categoryDetails?.color }}
          >
            <CategoryIcon className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold">{categoryName}</h1>
      </div>
  );

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {isMobile && (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Button>
          <div className="flex items-center gap-3">
             <div 
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: categoryDetails?.color }}
            >
              <CategoryIcon className="h-5 w-5 text-white" />
            </div>
             <h1 className="text-xl font-semibold">{categoryName}</h1>
          </div>
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
             <PageHeader />
           </div>
        )}

        <Card className="shadow-lg rounded-xl">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de {transactionType === 'expense' ? 'gastos' : 'ingresos'}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{formatCurrency(totalAmount, currency)}</p>
          </CardContent>
        </Card>

        <h2 className="text-lg font-semibold text-muted-foreground pt-4">
          Historial de Transacciones
        </h2>

        {filteredTransactions.length > 0 ? (
          <div className="space-y-3">
            {filteredTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between text-sm p-4 rounded-lg bg-card shadow-sm border"
              >
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-base">{transaction.description}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(transaction.date), 'dd MMM yyyy', { locale: es })}
                  </span>
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
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-8 rounded-lg bg-card shadow-sm border">
            <p className="text-muted-foreground text-sm">
              No hay transacciones en esta categoría.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

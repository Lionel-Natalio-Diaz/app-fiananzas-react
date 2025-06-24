
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MoreHorizontal, Bot, Target } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppContext } from '@/contexts/AppContext';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { format, subMonths, startOfMonth, endOfMonth, startOfYear, startOfToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { Progress } from '@/components/ui/progress';
// import { generateFinancialSummary, type GenerateFinancialSummaryOutput } from '@/ai/flows/generate-financial-summary';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const formatCurrency = (amount: number, currency: string) => {
  return `${currency}${Math.trunc(amount).toLocaleString('es-ES')}`;
};

type Period = '6m' | '12m' | 'ytd';

export default function ReportsPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { state } = useAppContext();
  const { transactions, userProfile, isLoading, categories, budgets } = state;
  const [period, setPeriod] = useState<Period>('6m');

  // const [aiSummary, setAiSummary] = useState<GenerateFinancialSummaryOutput | null>(null);
  // const [isSummaryLoading, setIsSummaryLoading] = useState(true);

  const currency = userProfile?.currency
    ? CURRENCY_SYMBOL[userProfile.currency as keyof typeof CURRENCY_SYMBOL] || CURRENCY_SYMBOL.USD
    : CURRENCY_SYMBOL.USD;

  // useEffect(() => {
  //   const fetchFinancialSummary = async () => {
  //       if (!userProfile || transactions.length === 0) {
  //           setIsSummaryLoading(false);
  //           return;
  //       }

  //       setIsSummaryLoading(true);

  //       const now = startOfToday();
  //       const currentMonthStart = startOfMonth(now);
  //       const currentMonthEnd = endOfMonth(now);
        
  //       const prevMonth = subMonths(now, 1);
  //       const prevMonthStart = startOfMonth(prevMonth);
  //       const prevMonthEnd = endOfMonth(prevMonth);

  //       const currentMonthTransactions = transactions.filter(t => {
  //           const tDate = new Date(t.date);
  //           return tDate >= currentMonthStart && tDate <= currentMonthEnd;
  //       });

  //       const prevMonthTransactions = transactions.filter(t => {
  //           const tDate = new Date(t.date);
  //           return tDate >= prevMonthStart && tDate <= prevMonthEnd;
  //       });

  //       const calculateSummary = (trans: typeof transactions) => {
  //           const income = trans.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  //           const expenses = trans.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  //           return { income, expenses };
  //       };

  //       const currentPeriodSummary = { ...calculateSummary(currentMonthTransactions), periodName: format(now, "MMMM", { locale: es }) };
  //       const previousPeriodSummary = { ...calculateSummary(prevMonthTransactions), periodName: format(prevMonth, "MMMM", { locale: es }) };

  //       const spendingByCategory = new Map<string, number>();
  //       currentMonthTransactions
  //           .filter(t => t.type === 'expense')
  //           .forEach(t => {
  //               spendingByCategory.set(t.category, (spendingByCategory.get(t.category) || 0) + t.amount);
  //           });
        
  //       const topSpendingCategories = Array.from(spendingByCategory.entries())
  //           .map(([name, amount]) => ({ name, amount }))
  //           .sort((a, b) => b.amount - a.amount)
  //           .slice(0, 3);
        
  //       const budgetPerformance = budgets
  //           .map(budget => ({
  //               category: budget.category,
  //               budgeted: budget.amount,
  //               spent: spendingByCategory.get(budget.category) || 0,
  //           }))
  //           .filter(b => b.budgeted > 0);

  //       const sixMonthsAgo = startOfMonth(subMonths(now, 6));
  //       const historicalExpenses = transactions.filter(t => {
  //           const tDate = new Date(t.date);
  //           return t.type === 'expense' && tDate >= sixMonthsAgo && tDate < currentMonthStart;
  //       });

  //       const categorySpending = new Map<string, number>();
  //       historicalExpenses.forEach(t => {
  //           categorySpending.set(t.category, (categorySpending.get(t.category) || 0) + t.amount);
  //       });

  //       const historicalCategoryAverages = Array.from(categorySpending.entries()).map(([category, total]) => ({
  //           category,
  //           average: Math.trunc(total / 6),
  //       })).filter(avg => avg.average > 0);

  //       try {
  //           const result = await generateFinancialSummary({
  //               userName: userProfile.name.split(' ')[0],
  //               currency: currency,
  //               currentPeriodSummary,
  //               previousPeriodSummary,
  //               topSpendingCategories,
  //               budgetPerformance,
  //               historicalCategoryAverages,
  //           });
  //           setAiSummary(result);
  //       } catch (error) {
  //           console.error("Error generating financial summary:", error);
  //           setAiSummary(null);
  //       } finally {
  //           setIsSummaryLoading(false);
  //       }
  //   };

  //   if (!isLoading) {
  //     fetchFinancialSummary();
  //   }
  // }, [transactions, userProfile, currency, budgets, isLoading]);

  const monthlySummary = useMemo(() => {
    const data = [];
    const now = new Date();
    
    let monthsToProcess = 0;

    if (period === '6m') {
      monthsToProcess = 6;
    } else if (period === '12m') {
      monthsToProcess = 12;
    } else if (period === 'ytd') {
      monthsToProcess = now.getMonth() + 1;
    }

    for (let i = 0; i < monthsToProcess; i++) {
      const targetMonth = period === 'ytd' ? new Date(now.getFullYear(), i, 1) : subMonths(now, (monthsToProcess - 1) - i);

      const monthStart = startOfMonth(targetMonth);
      const monthEnd = endOfMonth(targetMonth);

      const monthTransactions = transactions.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= monthStart && tDate <= monthEnd;
      });

      const income = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const expense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      const net = income - expense;

      data.push({
        name: format(targetMonth, 'MMM', { locale: es }),
        Ingresos: income,
        Gastos: expense,
        Balance: net,
      });
    }

    return data;
  }, [transactions, period]);

  const categoryBreakdown = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    if (period === '6m') {
      startDate = startOfMonth(subMonths(now, 5));
    } else if (period === '12m') {
      startDate = startOfMonth(subMonths(now, 11));
    } else { // 'ytd'
      startDate = startOfYear(now);
    }
    const endDate = endOfMonth(now);

    const periodExpenses = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= startDate && tDate <= endDate;
    });

    const totalExpenses = periodExpenses.reduce((sum, t) => sum + t.amount, 0);

    if (totalExpenses === 0) {
      return { topCategories: [], totalExpenses: 0 };
    }

    const spendingByCategory = new Map<string, number>();
    periodExpenses.forEach(t => {
      spendingByCategory.set(t.category, (spendingByCategory.get(t.category) || 0) + t.amount);
    });

    const categoryDetailsMap = new Map(categories.map(c => [c.name, c]));

    const detailedCategories = Array.from(spendingByCategory.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: (amount / totalExpenses) * 100,
      details: categoryDetailsMap.get(name) || { name: 'Otros', icon: 'MoreHorizontal', color: '#9AA5B5', type: 'expense', id: 'otros' }
    }));

    const topCategories = detailedCategories.sort((a, b) => b.amount - a.amount).slice(0, 5);

    return { topCategories, totalExpenses };
  }, [transactions, categories, period]);
  
  const budgetPerformance = useMemo(() => {
    if (!budgets.length) return [];

    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthlyExpenses = transactions.filter(t => {
      const tDate = new Date(t.date);
      return t.type === 'expense' && tDate >= start && tDate <= end;
    });

    const expensesByCategory = new Map<string, number>();
    monthlyExpenses.forEach(t => {
        expensesByCategory.set(t.category, (expensesByCategory.get(t.category) || 0) + t.amount);
    });

    const categoryDetailsMap = new Map(categories.map(c => [c.name, c]));

    return budgets.map(budget => {
        const spent = expensesByCategory.get(budget.category) || 0;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;
        return {
            ...budget,
            spent,
            percentage,
            details: categoryDetailsMap.get(budget.category)
        }
    }).sort((a,b) => b.percentage - a.percentage);
  }, [budgets, transactions, categories]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background p-2 shadow-sm">
          <p className="text-sm font-bold text-foreground">{label}</p>
          {payload.map((p: any) => (
             <p key={p.dataKey} style={{ color: p.color }} className="text-xs">
                {`${p.dataKey}: ${formatCurrency(p.value, currency)}`}
             </p>
          ))}
        </div>
      );
    }
    return null;
  };
  
  const getProgressColor = (percentage: number) => {
    if (percentage > 100) return 'hsl(var(--destructive))';
    if (percentage > 80) return 'hsl(var(--chart-3))';
    return 'hsl(var(--accent))';
  };
  
  const hasData = useMemo(() => monthlySummary.some(d => d.Ingresos > 0 || d.Gastos > 0), [monthlySummary]);

  if (isLoading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <LoadingSpinner size="lg" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background text-foreground">
      {isMobile && (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 px-4 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" onClick={() => router.push('/')}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Volver</span>
          </Button>
          <h1 className="text-xl font-semibold">Análisis y Resúmenes</h1>
        </header>
      )}

      <main className="flex-grow space-y-6 p-4 md:p-6 overflow-y-auto">
        {!isMobile && (
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" asChild className="h-9 w-9 p-0">
              <Link href="/">
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">Volver</span>
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Análisis y Resúmenes</h1>
          </div>
        )}

        {/* <Card className="shadow-lg rounded-xl bg-surfaceVariant">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Bot className="h-6 w-6 text-primary" />
                    Análisis Inteligente del Mes
                </CardTitle>
                <CardDescription>Un resumen de tu actividad financiera generado por IA.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 {isSummaryLoading ? (
                    <div className="space-y-3">
                        <div className="flex items-start gap-4 rounded-lg border p-4 bg-muted/50">
                            <Skeleton className="h-6 w-6 mt-1 rounded-full" />
                            <div className="w-full space-y-2">
                                <Skeleton className="h-4 w-1/3 rounded-md" />
                                <Skeleton className="h-4 w-full rounded-md" />
                            </div>
                        </div>
                         <div className="flex items-start gap-4 rounded-lg border p-4 bg-muted/50">
                            <Skeleton className="h-6 w-6 mt-1 rounded-full" />
                            <div className="w-full space-y-2">
                                <Skeleton className="h-4 w-1/4 rounded-md" />
                                <Skeleton className="h-4 w-[90%] rounded-md" />
                            </div>
                        </div>
                    </div>
                ) : aiSummary && aiSummary.insights.length > 0 ? (
                   <div className="space-y-3">
                    {aiSummary.insights.map((insight, index) => {
                      const InsightIcon = Icons[insight.icon as keyof typeof Icons] || Icons.Info;
                      const insightColors = {
                        positive: 'border-accent/20 bg-accent/10',
                        warning: 'border-yellow-500/20 bg-yellow-500/10 dark:border-yellow-400/20 dark:bg-yellow-400/10',
                        alert: 'border-destructive/20 bg-destructive/10',
                        info: 'border-primary/20 bg-primary/10',
                      };
                       const iconColors = {
                        positive: 'text-accent',
                        warning: 'text-yellow-500 dark:text-yellow-400',
                        alert: 'text-destructive',
                        info: 'text-primary',
                      };
                      return (
                        <div key={index} className={cn('flex items-start gap-4 rounded-lg border p-4', insightColors[insight.type])}>
                          <InsightIcon className={cn('h-6 w-6 mt-1 flex-shrink-0', iconColors[insight.type])} />
                          <div>
                            <p className="font-bold text-foreground">{insight.title}</p>
                            <p className="text-sm text-foreground/80">{insight.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                    <div className="flex h-24 w-full flex-col items-center justify-center text-center text-muted-foreground">
                        <p>No hay suficientes datos este mes para generar un análisis.</p>
                    </div>
                )}
            </CardContent>
        </Card> */}
        
        <Card className="shadow-lg rounded-xl bg-surfaceVariant">
          <CardHeader className="flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <CardTitle>Evolución Financiera</CardTitle>
                <CardDescription>Ingresos vs Gastos y Balance neto a lo largo del tiempo.</CardDescription>
            </div>
            <div className="flex items-center gap-1 rounded-md bg-muted p-1 self-end sm:self-center">
                {(['6m', '12m', 'ytd'] as Period[]).map(p => (
                    <Button 
                        key={p} 
                        size="sm" 
                        variant={period === p ? 'secondary' : 'ghost'} 
                        onClick={() => setPeriod(p)}
                        className="px-3"
                    >
                        {p === '6m' ? '6M' : p === '12m' ? '12M' : 'Año Actual'}
                    </Button>
                ))}
            </div>
          </CardHeader>
          <CardContent className="h-[400px] w-full p-2">
            {hasData ? (
                 <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={monthlySummary}
                        margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
                        <XAxis 
                            dataKey="name" 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                        />
                        <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            stroke="hsl(var(--muted-foreground))"
                            fontSize={12}
                            tickFormatter={(value) => `${currency}${Number(value) / 1000}k`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted))' }} />
                        <Legend iconSize={10} wrapperStyle={{fontSize: "12px", paddingTop: "20px"}}/>
                        <Bar dataKey="Ingresos" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Gastos" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                        <Line type="monotone" dataKey="Balance" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                    </ComposedChart>
                </ResponsiveContainer>
            ) : (
                <div className="flex h-full w-full flex-col items-center justify-center text-center text-muted-foreground">
                    <p className="text-lg font-medium text-foreground">
                        No hay suficientes datos.
                    </p>
                    <p>
                        Registra algunas transacciones para ver tus análisis.
                    </p>
                </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-lg rounded-xl bg-surfaceVariant">
          <CardHeader>
              <CardTitle>Resumen de Presupuestos</CardTitle>
              <CardDescription>Tu progreso de gastos del mes actual.</CardDescription>
          </CardHeader>
          <CardContent>
              {budgetPerformance.length > 0 ? (
                  <div className="space-y-6">
                      {budgetPerformance.map(budget => {
                          if (!budget.details) return null;
                          const Icon = Icons[budget.details.icon as keyof typeof Icons] || MoreHorizontal;
                          return (
                              <div key={budget.id} className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                                  <div className="flex items-center justify-between text-sm">
                                      <div className="flex items-center gap-3 font-medium text-foreground">
                                          <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${budget.details.color}33` }}>
                                              <Icon className="h-5 w-5" style={{ color: budget.details.color }} />
                                          </div>
                                          <span>{budget.category}</span>
                                      </div>
                                      <div className="font-semibold text-right">
                                          <span className={cn(budget.spent > budget.amount && "text-destructive")}>
                                              {formatCurrency(budget.spent, currency)}
                                          </span>
                                          <span className="text-muted-foreground"> / {formatCurrency(budget.amount, currency)}</span>
                                      </div>
                                  </div>
                                  <Progress value={Math.min(budget.percentage, 100)} indicatorColor={getProgressColor(budget.percentage)} className="h-2" />
                              </div>
                          )
                      })}
                  </div>
              ) : (
                  <div className="flex h-24 w-full flex-col items-center justify-center text-center text-muted-foreground">
                      <Target className="h-8 w-8 mb-2"/>
                      <p>No has creado ningún presupuesto.</p>
                      <Button variant="link" asChild><Link href="/budgets">Crear uno ahora</Link></Button>
                  </div>
              )}
          </CardContent>
        </Card>
        
        <Card className="shadow-lg rounded-xl bg-surfaceVariant">
            <CardHeader>
                <CardTitle>Mayores Categorías de Gasto</CardTitle>
                <CardDescription>
                    Un vistazo a dónde se fue tu dinero en {period === '6m' ? 'los últimos 6 meses' : period === '12m' ? 'el último año' : 'este año'}.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {categoryBreakdown.topCategories.length > 0 ? (
                    categoryBreakdown.topCategories.map(cat => {
                        const Icon = Icons[cat.details.icon as keyof typeof Icons] || MoreHorizontal;
                        return (
                            <div key={cat.name} className="flex flex-col gap-2 animate-in fade-in-0 slide-in-from-bottom-2 duration-500">
                                <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 flex items-center justify-center rounded-full" style={{ backgroundColor: `${cat.details.color}33` }}>
                                            <Icon className="h-5 w-5" style={{ color: cat.details.color }} />
                                        </div>
                                        <span className="font-medium text-foreground">{cat.name}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-semibold text-foreground text-right">
                                            {formatCurrency(cat.amount, currency)}
                                        </span>
                                        <span className="text-muted-foreground w-10 text-right">{Math.round(cat.percentage)}%</span>
                                    </div>
                                </div>
                                <Progress value={cat.percentage} indicatorColor={cat.details.color} className="h-2" />
                            </div>
                        )
                    })
                ) : (
                    <div className="flex h-24 w-full flex-col items-center justify-center text-center text-muted-foreground">
                        <p>No hay gastos registrados en este período.</p>
                    </div>
                )}
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

    
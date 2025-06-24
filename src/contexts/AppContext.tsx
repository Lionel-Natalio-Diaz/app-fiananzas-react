
"use client";

import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import type { Transaction, Budget, UserProfile, UserCategory, RecurringTransaction } from '@/lib/types';
import { auth, db } from '@/lib/firebase';
import { 
  signOut, 
  onAuthStateChanged, 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  AuthError
} from 'firebase/auth';
import { doc, collection, onSnapshot, setDoc, getDoc, addDoc, updateDoc, deleteDoc, query, orderBy, Timestamp, writeBatch, getDocs, where } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { DEFAULT_CATEGORIES } from '@/lib/constants';

interface AppState {
  user: User | null;
  userProfile: UserProfile | null;
  transactions: Transaction[];
  categories: UserCategory[];
  budgets: Budget[];
  recurringTransactions: RecurringTransaction[];
  isAuthenticated: boolean;
  isOnboardingComplete: boolean;
  isLoading: boolean;
  successMessage: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_AUTH_STATE'; payload: { user: User | null; profile: UserProfile | null } }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'SET_CATEGORIES'; payload: UserCategory[] }
  | { type: 'SET_BUDGETS'; payload: Budget[] }
  | { type: 'SET_RECURRING_TRANSACTIONS'; payload: RecurringTransaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SHOW_SUCCESS_MESSAGE'; payload: string }
  | { type: 'HIDE_SUCCESS_MESSAGE' };

const initialState: AppState = {
  user: null,
  userProfile: null,
  transactions: [],
  categories: [],
  budgets: [],
  recurringTransactions: [],
  isAuthenticated: false,
  isOnboardingComplete: false,
  isLoading: true,
  successMessage: null,
};

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_AUTH_STATE':
      return {
        ...state,
        user: action.payload.user,
        userProfile: action.payload.profile,
        isAuthenticated: !!action.payload.user,
        isOnboardingComplete: !!action.payload.profile?.name,
        isLoading: false,
      };
    case 'SET_TRANSACTIONS':
      return { ...state, transactions: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'SET_BUDGETS':
      return { ...state, budgets: action.payload };
    case 'SET_RECURRING_TRANSACTIONS':
      return { ...state, recurringTransactions: action.payload };
    case 'LOGOUT':
      return { ...initialState, isLoading: false };
    case 'ADD_TRANSACTION':
      return { ...state, transactions: [...state.transactions, action.payload].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) };
    case 'UPDATE_TRANSACTION':
      return { ...state, transactions: state.transactions.map(t => t.id === action.payload.id ? action.payload : t).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())};
    case 'DELETE_TRANSACTION':
      return { ...state, transactions: state.transactions.filter(t => t.id !== action.payload) };
    case 'SHOW_SUCCESS_MESSAGE':
      return { ...state, successMessage: action.payload };
    case 'HIDE_SUCCESS_MESSAGE':
      return { ...state, successMessage: null };
    default:
      return state;
  }
};

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  signUpWithEmailPassword: (email: string, pass: string) => Promise<void>;
  signInWithEmailPassword: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (profile: UserProfile) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'|'date'> & {date:Date}) => Promise<void>;
  updateTransaction: (transaction: Omit<Transaction, 'date'> & {date: string}) => Promise<void>;
  deleteTransaction: (transactionId: string) => Promise<void>;
  addCategory: (category: Omit<UserCategory, 'id' | 'isDefault'>) => Promise<void>;
  updateCategory: (category: UserCategory) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addBudget: (budget: Omit<Budget, 'id'>) => Promise<void>;
  updateBudget: (budget: Omit<Budget, 'id'> & { id: string }) => Promise<void>;
  deleteBudget: (budgetId: string) => Promise<void>;
  addRecurringTransaction: (transaction: Omit<RecurringTransaction, 'id'>) => Promise<void>;
  updateRecurringTransaction: (transaction: RecurringTransaction) => Promise<void>;
  deleteRecurringTransaction: (transactionId: string) => Promise<void>;
} | undefined>(undefined);

const seedDefaultCategories = async (userId: string) => {
    if (!db) return;
    const batch = writeBatch(db);
    const categoriesRef = collection(db, 'users', userId, 'categories');
    
    DEFAULT_CATEGORIES.forEach(category => {
        const docRef = doc(categoriesRef);
        batch.set(docRef, { ...category, isDefault: true });
    });

    try {
        await batch.commit();
    } catch (error) {
        console.error("Error seeding default categories: ", error);
        toast({ title: "Error de Sincronización", description: "No se pudieron crear las categorías iniciales.", variant: "destructive" });
    }
}


export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    if (!auth || !db) {
      console.warn("Firebase not configured. Authentication will be disabled.");
      dispatch({ type: 'SET_LOADING', payload: false });
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userDocRef, (docSnap) => {
          const userProfile = docSnap.exists() ? docSnap.data() as UserProfile : null;
          dispatch({ type: 'SET_AUTH_STATE', payload: { user, profile: userProfile } });
        }, (error) => {
            console.error("Error listening to profile:", error);
            dispatch({ type: 'LOGOUT' });
        });

        const transactionsQuery = query(collection(db, 'users', user.uid, 'transactions'), orderBy('date', 'desc'));
        const unsubscribeTransactions = onSnapshot(transactionsQuery, (querySnapshot) => {
          const transactions: Transaction[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              date: (data.date as Timestamp).toDate().toISOString(),
            } as Transaction
          });
          dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
        }, (error) => {
            console.error("Error listening to transactions:", error);
        });

        const categoriesQuery = query(collection(db, 'users', user.uid, 'categories'), orderBy('name'));
        const unsubscribeCategories = onSnapshot(categoriesQuery, async (querySnapshot) => {
            if (querySnapshot.empty) {
                await seedDefaultCategories(user.uid);
            } else {
                const categories: UserCategory[] = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                } as UserCategory));
                dispatch({ type: 'SET_CATEGORIES', payload: categories });
            }
        }, (error) => {
            console.error("Error listening to categories:", error);
        });
        
        const budgetsQuery = query(collection(db, 'users', user.uid, 'budgets'));
        const unsubscribeBudgets = onSnapshot(budgetsQuery, (querySnapshot) => {
          const budgets: Budget[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as Budget));
          dispatch({ type: 'SET_BUDGETS', payload: budgets });
        }, (error) => {
            console.error("Error listening to budgets:", error);
        });

        const recurringQuery = query(collection(db, 'users', user.uid, 'recurringTransactions'), orderBy('description'));
        const unsubscribeRecurring = onSnapshot(recurringQuery, (querySnapshot) => {
          const recurring: RecurringTransaction[] = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
          } as RecurringTransaction));
          dispatch({ type: 'SET_RECURRING_TRANSACTIONS', payload: recurring });
        }, (error) => {
            console.error("Error listening to recurring transactions:", error);
        });

        return () => {
          unsubscribeProfile();
          unsubscribeTransactions();
          unsubscribeCategories();
          unsubscribeBudgets();
          unsubscribeRecurring();
        };
      } else {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  const signUpWithEmailPassword = useCallback(async (email: string, pass: string) => {
    if (!auth) {
        toast({ title: 'Error de Configuración', description: 'Firebase no está inicializado.', variant: 'destructive' });
        return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        await createUserWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        const authError = error as AuthError;
        let message = 'No se pudo crear la cuenta.';
        if (authError.code === 'auth/email-already-in-use') {
            message = 'Este correo electrónico ya está en uso.';
        } else if (authError.code === 'auth/weak-password') {
            message = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
        }
        toast({ title: 'Error de Registro', description: message, variant: 'destructive' });
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const signInWithEmailPassword = useCallback(async (email: string, pass: string) => {
    if (!auth) {
        toast({ title: 'Error de Configuración', description: 'Firebase no está inicializado.', variant: 'destructive' });
        return;
    }
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
        await signInWithEmailAndPassword(auth, email, pass);
    } catch (error) {
        const authError = error as AuthError;
        let message = 'No se pudo iniciar sesión.';
        if (authError.code === 'auth/user-not-found' || authError.code === 'auth/wrong-password' || authError.code === 'auth/invalid-credential') {
            message = 'El correo electrónico o la contraseña son incorrectos.';
        }
        toast({ title: 'Error de Inicio de Sesión', description: message, variant: 'destructive' });
        dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const logout = useCallback(async () => {
    if (!auth) return;
    try {
        await signOut(auth);
    } catch (error: any) {
        console.error("Error signing out:", error);
        toast({ variant: 'destructive', title: 'Error al Cerrar Sesión', description: 'No se pudo cerrar la sesión.' });
    }
  }, []);
  
  const updateUserProfile = useCallback(async (profile: UserProfile) => {
    if (!state.user || !db) return;
    const userDocRef = doc(db, 'users', state.user.uid);
    try {
        await setDoc(userDocRef, profile, { merge: true });
    } catch (error) {
        console.error("Error updating profile:", error);
        toast({
            variant: 'destructive',
            title: 'Error al Actualizar Perfil',
            description: 'No se pudo guardar la información del perfil.'
        });
    }
  }, [state.user]);

  const addTransaction = useCallback(async (transactionData: Omit<Transaction, 'id'|'date'> & {date: Date}) => {
    if (!state.user || !db) return;
    const fullTransactionData = { ...transactionData, date: Timestamp.fromDate(transactionData.date) };
    await addDoc(collection(db, 'users', state.user.uid, 'transactions'), fullTransactionData);
  }, [state.user]);

  const updateTransaction = useCallback(async (transaction: Omit<Transaction, 'date'> & {date: string}) => {
    if (!state.user || !db) return;
    const { id, ...dataToUpdate } = transaction;
    const transactionDocRef = doc(db, 'users', state.user.uid, 'transactions', id);
    await updateDoc(transactionDocRef, { ...dataToUpdate, date: Timestamp.fromDate(new Date(dataToUpdate.date)) });
  }, [state.user]);

  const deleteTransaction = useCallback(async (transactionId: string) => {
    if (!state.user || !db) return;
    const transactionDocRef = doc(db, 'users', state.user.uid, 'transactions', transactionId);
    await deleteDoc(transactionDocRef);
  }, [state.user]);

  const addCategory = useCallback(async (category: Omit<UserCategory, 'id' | 'isDefault'>) => {
    if (!state.user || !db) return;
    const categoryData = { ...category, isDefault: false };
    await addDoc(collection(db, 'users', state.user.uid, 'categories'), categoryData);
  }, [state.user]);

  const updateCategory = useCallback(async (category: UserCategory) => {
    if (!state.user || !db) return;
    const { id, ...data } = category;
    const categoryDocRef = doc(db, 'users', state.user.uid, 'categories', id);
    await updateDoc(categoryDocRef, data);
  }, [state.user]);
  
  const deleteCategory = useCallback(async (categoryId: string) => {
    if (!state.user || !db) return;
    
    const categoryDocRef = doc(db, 'users', state.user.uid, 'categories', categoryId);
    const categoryDoc = await getDoc(categoryDocRef);
    if (!categoryDoc.exists()) return;
    const categoryName = categoryDoc.data().name;

    const batch = writeBatch(db);

    batch.delete(categoryDocRef);

    const budgetsQuery = query(collection(db, 'users', state.user.uid, 'budgets'), where('category', '==', categoryName));
    const budgetSnapshots = await getDocs(budgetsQuery);
    budgetSnapshots.forEach(doc => {
        batch.delete(doc.ref);
    });

    await batch.commit();
  }, [state.user]);

  const addBudget = useCallback(async (budgetData: Omit<Budget, 'id'>) => {
    if (!state.user || !db) return;
    const { spentAmount, remainingAmount, progressPercentage, transactions, ...dataToSave } = budgetData as any;
    await addDoc(collection(db, 'users', state.user.uid, 'budgets'), dataToSave);
  }, [state.user]);

  const updateBudget = useCallback(async (budget: Omit<Budget, 'id'> & { id: string }) => {
    if (!state.user || !db) return;
    const { id, spentAmount, remainingAmount, progressPercentage, transactions, ...dataToUpdate } = budget as any;
    const budgetDocRef = doc(db, 'users', state.user.uid, 'budgets', id);
    await updateDoc(budgetDocRef, dataToUpdate);
  }, [state.user]);

  const deleteBudget = useCallback(async (budgetId: string) => {
    if (!state.user || !db) return;
    const budgetDocRef = doc(db, 'users', state.user.uid, 'budgets', budgetId);
    await deleteDoc(budgetDocRef);
  }, [state.user]);

  const addRecurringTransaction = useCallback(async (transactionData: Omit<RecurringTransaction, 'id'>) => {
    if (!state.user || !db) return;
    await addDoc(collection(db, 'users', state.user.uid, 'recurringTransactions'), transactionData);
  }, [state.user]);

  const updateRecurringTransaction = useCallback(async (transaction: RecurringTransaction) => {
    if (!state.user || !db) return;
    const { id, ...dataToUpdate } = transaction;
    const transactionDocRef = doc(db, 'users', state.user.uid, 'recurringTransactions', id);
    await updateDoc(transactionDocRef, dataToUpdate);
  }, [state.user]);

  const deleteRecurringTransaction = useCallback(async (transactionId: string) => {
    if (!state.user || !db) return;
    const transactionDocRef = doc(db, 'users', state.user.uid, 'recurringTransactions', transactionId);
    await deleteDoc(transactionDocRef);
  }, [state.user]);


  return (
    <AppContext.Provider value={{ 
        state, 
        dispatch,
        signUpWithEmailPassword,
        signInWithEmailPassword,
        logout,
        updateUserProfile,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        addRecurringTransaction,
        updateRecurringTransaction,
        deleteRecurringTransaction,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

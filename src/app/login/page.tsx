
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppContext } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { APP_NAME } from "@/lib/constants";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const formSchema = z.object({
  email: z.string().email({ message: "Por favor, introduce un correo electrónico válido." }),
  password: z.string().min(6, { message: "La contraseña debe tener al menos 6 caracteres." }),
});

type LoginFormValues = z.infer<typeof formSchema>;

export default function LoginPage() {
  const { state, signUpWithEmailPassword, signInWithEmailPassword } = useAppContext();
  const router = useRouter();
  const [isSignUp, setIsSignUp] = useState(false);

  // This effect will run when authentication state changes
  useEffect(() => {
    if (state.isAuthenticated) {
      if (state.isOnboardingComplete) {
        router.push("/");
      } else {
        router.push("/onboarding");
      }
    }
  }, [state.isAuthenticated, state.isOnboardingComplete, router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    if (isSignUp) {
      await signUpWithEmailPassword(data.email, data.password);
    } else {
      await signInWithEmailPassword(data.email, data.password);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
           <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 16c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/><path d="M12 6v6l3 3"/></svg>
          </div>
          <CardTitle className="text-3xl font-headline">
            {isSignUp ? `Crea tu Cuenta en ${APP_NAME}` : `Bienvenido a ${APP_NAME}`}
          </CardTitle>
          <CardDescription className="text-lg">
            {isSignUp ? "Regístrate para empezar a gestionar tus finanzas." : "Inicia sesión para continuar."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="email">Correo Electrónico</Label>
                    <FormControl>
                      <Input id="email" type="email" placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <Label htmlFor="password">Contraseña</Label>
                    <FormControl>
                      <Input id="password" type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg" disabled={state.isLoading}>
                {state.isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : null}
                {isSignUp ? "Registrarse" : "Iniciar Sesión"}
              </Button>
            </form>
          </Form>
          <div className="text-center text-sm">
            {isSignUp ? "¿Ya tienes una cuenta?" : "¿No tienes una cuenta?"}{" "}
            <Button variant="link" className="p-0 h-auto" onClick={() => { form.reset(); setIsSignUp(!isSignUp); }}>
              {isSignUp ? "Inicia sesión" : "Regístrate"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

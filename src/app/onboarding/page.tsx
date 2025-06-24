
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAppContext } from "@/contexts/AppContext";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/types";
import { APP_NAME } from "@/lib/constants";
import { Smile, Languages, DollarSignIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";

const onboardingSchema = z.object({
  name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres." }),
  language: z.string({ required_error: "Por favor selecciona un idioma." }),
  currency: z.string({ required_error: "Por favor selecciona una moneda." }),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const supportedLanguages = [
  { value: "es", label: "Español" },
  { value: "en", label: "English" },
];

const supportedCurrencies = [
  { value: "USD", label: "USD ($) - Dólar estadounidense" },
  { value: "EUR", label: "EUR (€) - Euro" },
  { value: "ARS", label: "ARS ($) - Peso argentino" },
  { value: "GBP", label: "GBP (£) - Libra esterlina" },
];

export default function OnboardingPage() {
  const { updateUserProfile } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: "",
      language: "es", // Default language
      currency: "USD", // Default currency
    },
  });

  async function onSubmit(data: OnboardingFormValues) {
    const userProfile: UserProfile = {
      name: data.name,
      language: data.language,
      currency: data.currency,
    };
    try {
      await updateUserProfile(userProfile);
      toast({
        title: "¡Bienvenido!",
        description: "Tu perfil ha sido configurado.",
      });
      router.push("/"); // Redirect to dashboard or main app page
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar tu perfil. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-headline">¡Casi Listo, {form.watch("name") || "Usuario"}!</CardTitle>
          <CardDescription className="text-lg">
            Solo unos detalles más para personalizar tu experiencia en {APP_NAME}.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center"><Smile className="mr-2 h-5 w-5 text-primary"/>¿Cómo te llamas?</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: Juan Pérez" {...field} className="h-12 text-base" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center"><Languages className="mr-2 h-5 w-5 text-primary"/>Idioma de Preferencia</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Selecciona un idioma" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supportedLanguages.map(lang => (
                          <SelectItem key={lang.value} value={lang.value} className="text-base">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base flex items-center"><DollarSignIcon className="mr-2 h-5 w-5 text-primary"/>Moneda Principal</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="h-12 text-base">
                          <SelectValue placeholder="Selecciona una moneda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {supportedCurrencies.map(curr => (
                          <SelectItem key={curr.value} value={curr.value} className="text-base">
                            {curr.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-12 text-lg" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                Completar Configuración y Entrar
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

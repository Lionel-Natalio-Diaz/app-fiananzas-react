"use client";

import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";

export function DynamicToaster() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Render the Toaster only on the client side after the component has mounted.
  // This avoids any potential SSR-related issues with the toast state.
  return isClient ? <Toaster /> : null;
}

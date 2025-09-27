"use client";

import { useState, useCallback } from "react";

interface ToastOptions {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
}

interface Toast extends ToastOptions {
  id: string;
  timestamp: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback(({ title, description, variant = "default", duration = 3000 }: ToastOptions) => {
    const id = Date.now().toString();
    const newToast: Toast = {
      id,
      title,
      description,
      variant,
      duration,
      timestamp: Date.now()
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-dismiss after duration
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);

    // For test mode, also log to console
    console.log(`[TOAST ${variant.toUpperCase()}] ${title}${description ? ` - ${description}` : ''}`);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return {
    toast,
    dismiss,
    toasts
  };
}
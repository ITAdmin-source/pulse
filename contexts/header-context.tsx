"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type HeaderVariant = "default" | "voting" | "management" | "minimal" | "admin" | "hidden";

export interface HeaderConfig {
  variant?: HeaderVariant;
  title?: string;
  subtitle?: string;
  backUrl?: string;
  backLabel?: string;
  actions?: ReactNode;
  hideOnScroll?: boolean;
  customContent?: ReactNode;
  showLogo?: boolean;
  showMobileMenu?: boolean;
}

interface HeaderContextValue {
  config: HeaderConfig;
  setConfig: (config: HeaderConfig) => void;
  resetConfig: () => void;
}

const HeaderContext = createContext<HeaderContextValue | undefined>(undefined);

const DEFAULT_CONFIG: HeaderConfig = {
  variant: "default",
  showLogo: true,
  showMobileMenu: true,
};

export function HeaderProvider({ children }: { children: ReactNode }) {
  const [config, setConfigState] = useState<HeaderConfig>(DEFAULT_CONFIG);

  const setConfig = useCallback((newConfig: HeaderConfig) => {
    setConfigState((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const resetConfig = useCallback(() => {
    setConfigState(DEFAULT_CONFIG);
  }, []);

  return (
    <HeaderContext.Provider value={{ config, setConfig, resetConfig }}>
      {children}
    </HeaderContext.Provider>
  );
}

export function useHeader() {
  const context = useContext(HeaderContext);
  if (!context) {
    throw new Error("useHeader must be used within HeaderProvider");
  }
  return context;
}

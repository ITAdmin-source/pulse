"use client";

import { useEffect } from "react";
import { useHeader } from "@/contexts/header-context";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  const { setConfig, resetConfig } = useHeader();

  useEffect(() => {
    // Configure header for auth pages
    setConfig({
      variant: "minimal",
      backUrl: "/polls",
      backLabel: "Back to Polls",
      showLogo: true,
    });

    // Reset on unmount
    return () => resetConfig();
  }, [setConfig, resetConfig]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Auth Content - Header is handled by AdaptiveHeader */}
      <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-8">
        <div className="w-full max-w-md">
          {/* Clerk Component */}
          {children}
        </div>
      </div>
    </div>
  );
}
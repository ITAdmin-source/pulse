"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function LoginPage() {
  const { theme } = useTheme();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  // Redirect authenticated users to home page
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  // Show loading while checking auth status
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-white-80">Loading...</div>
      </div>
    );
  }

  // Don't render auth component if already signed in
  if (isSignedIn) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Welcome Back!</h1>
        <p className="text-white-80">Sign in to continue your participation</p>
      </div>

      <SignIn
        fallbackRedirectUrl="/polls"
        appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
      />

      <div className="text-center text-sm text-white-80">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-primary-300 hover-text-primary-700">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
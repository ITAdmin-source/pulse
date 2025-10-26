"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function SignUpPage() {
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
        <h1 className="text-3xl font-bold text-white">Join Pulse</h1>
        <p className="text-white-80">Create an account to save your progress</p>
      </div>

      <SignUp
        fallbackRedirectUrl="/"
        appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
      />

      <div className="text-center text-sm text-white-80">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary-300 hover-text-primary-700">
          Sign In
        </Link>
      </div>
    </div>
  );
}
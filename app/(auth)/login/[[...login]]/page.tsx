"use client";

import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function LoginPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Welcome Back!</h1>
        <p className="text-gray-600">Sign in to continue your participation</p>
      </div>

      <SignIn
        fallbackRedirectUrl="/polls"
        appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
      />

      <div className="text-center text-sm text-gray-600">
        Don&apos;t have an account?{" "}
        <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
          Sign Up
        </Link>
      </div>
    </div>
  );
}
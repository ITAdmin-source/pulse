"use client";

import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function SignUpPage() {
  const { theme } = useTheme();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Join Pulse</h1>
        <p className="text-gray-600">Create an account to save your progress</p>
      </div>

      <SignUp
        fallbackRedirectUrl="/"
        appearance={{ baseTheme: theme === "dark" ? dark : undefined }}
      />

      <div className="text-center text-sm text-gray-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-blue-600 hover:text-blue-700">
          Sign In
        </Link>
      </div>
    </div>
  );
}
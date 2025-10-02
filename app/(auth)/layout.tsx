import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default async function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header with Back Button */}
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/polls">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Polls
            </Link>
          </Button>
        </div>
      </header>

      {/* Auth Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-72px)] px-4 py-8">
        <div className="w-full max-w-md space-y-6">
          {/* Logo/Branding */}
          <div className="text-center">
            <Link href="/" className="text-4xl font-bold text-gray-900">
              Pulse
            </Link>
          </div>

          {/* Clerk Component */}
          {children}
        </div>
      </div>
    </div>
  );
}
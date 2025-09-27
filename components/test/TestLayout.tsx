"use client";

import { TestNavigation } from "./TestNavigation";
import { TestAuthStatus } from "./TestAuthStatus";

interface TestLayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
}

export function TestLayout({ children, title, description }: TestLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <TestNavigation />
            <TestAuthStatus />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {title && (
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                {description && (
                  <p className="text-gray-600">{description}</p>
                )}
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
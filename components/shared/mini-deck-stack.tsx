"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface MiniDeckStackProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  variant?: "default" | "closed";
}

export function MiniDeckStack({
  title,
  subtitle,
  children,
  variant = "default",
}: MiniDeckStackProps) {
  const isClosedVariant = variant === "closed";

  return (
    <div className="relative w-full max-w-xs mx-auto">
      {/* Card deck stack effect - smaller than main deck */}
      <div className={`absolute inset-0 rounded-3xl shadow-sm transform translate-y-3 translate-x-2 opacity-30 pointer-events-none -z-20 ${
        isClosedVariant ? "bg-gray-200" : "bg-amber-50"
      }`} />
      <div className={`absolute inset-0 rounded-3xl shadow-sm transform translate-y-1.5 translate-x-1 opacity-60 pointer-events-none -z-10 ${
        isClosedVariant ? "bg-gray-200" : "bg-amber-50"
      }`} />

      {/* Main mini deck */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <Card className={`relative w-full shadow-xl rounded-3xl border-0 overflow-hidden ${
          isClosedVariant
            ? "bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100"
            : "bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50"
        }`}>
          <CardContent className="p-6 space-y-4">
            {/* Title */}
            <div className="text-center">
              <h2 className={`text-xl font-bold leading-tight ${
                isClosedVariant ? "text-gray-700" : "text-gray-900"
              }`}>
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
              )}
            </div>

            {/* Content */}
            {children}
          </CardContent>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          {/* Closed seal/ribbon if closed variant */}
          {isClosedVariant && (
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 -rotate-12">
              <div className="bg-red-600 text-white px-8 py-2 font-bold text-lg tracking-wider shadow-lg">
                CLOSED
              </div>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}

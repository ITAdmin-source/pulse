"use client";

import { Check, X, Minus } from "lucide-react";

interface DeckStatsProps {
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  className?: string;
}

export function DeckStats({
  agreeCount,
  disagreeCount,
  unsureCount,
  className = "",
}: DeckStatsProps) {
  return (
    <div className={`flex items-center justify-center gap-4 ${className}`}>
      {/* Agree */}
      <div className="flex items-center gap-1.5">
        <Check className="h-4 w-4 text-green-600" />
        <span className="text-sm font-semibold text-gray-900">{agreeCount}</span>
      </div>

      {/* Disagree */}
      <div className="flex items-center gap-1.5">
        <X className="h-4 w-4 text-red-600" />
        <span className="text-sm font-semibold text-gray-900">{disagreeCount}</span>
      </div>

      {/* Unsure */}
      <div className="flex items-center gap-1.5">
        <Minus className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-semibold text-gray-900">{unsureCount}</span>
      </div>
    </div>
  );
}

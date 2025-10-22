"use client";

/**
 * Connect Coming Soon Component
 *
 * Stub component for the "Connect to People" tab in Results view.
 * Displays a simple message indicating this feature is coming soon.
 *
 * Design:
 * - Simple white card with centered text
 * - Matches existing card aesthetic
 * - Minimal styling
 */

import { results } from "@/lib/strings/he";

export function ConnectComingSoon() {
  return (
    <div className="bg-white rounded-2xl p-8 sm:p-12 shadow-xl text-center">
      <div className="max-w-md mx-auto">
        <div className="text-5xl sm:text-6xl mb-4">🔗</div>
        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
          {results.connectComingSoon}
        </h3>
        <p className="text-gray-600 text-sm sm:text-base">
          בקרוב תוכלו להתחבר לאנשים עם השקפות דומות
        </p>
      </div>
    </div>
  );
}

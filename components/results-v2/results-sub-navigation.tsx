"use client";

/**
 * Results Sub-Navigation Component
 *
 * 3-tab navigation for Results view:
 * - "תובנה" (Insight): Personal insight card
 * - "תוצאות" (Results): Aggregate stats + heatmap
 * - "קהילה" (Community): Connect to people (coming soon)
 *
 * Design:
 * - Shortened Hebrew labels (4-6 characters) for mobile compatibility
 * - Sticky positioning below header
 * - Same styling as main TabNavigation (purple gradient background)
 * - RTL support with logical properties
 */

import { results } from "@/lib/strings/he";

export type ResultsTabType = "insight" | "results" | "connect";

interface ResultsSubNavigationProps {
  activeTab: ResultsTabType;
  onTabChange: (tab: ResultsTabType) => void;
}

export function ResultsSubNavigation({
  activeTab,
  onTabChange,
}: ResultsSubNavigationProps) {
  const tabs: { id: ResultsTabType; label: string }[] = [
    { id: "insight", label: results.tabInsight },
    { id: "results", label: results.tabResults },
    { id: "connect", label: results.tabConnect },
  ];

  return (
    <div className="sticky top-[64px] z-40 bg-gradient-page pb-4 pt-2">
      <div className="flex gap-2 bg-white-20 backdrop-blur-sm p-1.5 rounded-xl border border-white-20">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex-1
              flex items-center justify-center
              py-3 px-4
              min-h-[48px]
              rounded-lg
              font-semibold
              text-sm sm:text-base
              transition-colors
              ${
                activeTab === tab.id
                  ? "bg-white text-primary-900 shadow-sm"
                  : "text-white hover:text-white-80"
              }
            `}
            aria-label={tab.label}
            aria-current={activeTab === tab.id ? "page" : undefined}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}

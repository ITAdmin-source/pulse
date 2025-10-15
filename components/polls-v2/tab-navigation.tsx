"use client";

import { motion } from "framer-motion";
import { components } from "@/lib/design-tokens-v2";
import { pollPage } from "@/lib/strings/he";

type TabType = "vote" | "results";

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  resultsLocked: boolean;
  votesCompleted: number;
  votesRequired: number;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  resultsLocked,
  votesCompleted,
  votesRequired
}: TabNavigationProps) {
  return (
    <div className="flex gap-2 bg-white/20 backdrop-blur-sm p-1.5 rounded-xl border border-white/30">
      {/* Vote Tab */}
      <button
        onClick={() => onTabChange("vote")}
        className={`relative flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-colors ${
          activeTab === "vote"
            ? "text-purple-900"
            : "text-white hover:text-white/90"
        }`}
        disabled={false}
      >
        {activeTab === "vote" && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-white rounded-lg shadow-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">{pollPage.tabVote}</span>
      </button>

      {/* Results Tab */}
      <button
        onClick={() => !resultsLocked && onTabChange("results")}
        className={`relative flex-1 px-6 py-3 rounded-lg font-bold text-sm transition-colors ${
          resultsLocked
            ? "text-white/60 cursor-not-allowed"
            : activeTab === "results"
            ? "text-purple-900"
            : "text-white hover:text-white/90"
        }`}
        disabled={resultsLocked}
      >
        {activeTab === "results" && !resultsLocked && (
          <motion.div
            layoutId="activeTab"
            className="absolute inset-0 bg-white rounded-lg shadow-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <span className="relative z-10">
          {pollPage.tabResults}
          {resultsLocked && (
            <span className="ms-1 text-xs">({votesCompleted}/{votesRequired})</span>
          )}
        </span>
      </button>
    </div>
  );
}

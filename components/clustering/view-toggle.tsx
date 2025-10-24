"use client";

/**
 * View Toggle Component
 * Switches between PCA User Clustering view and Statement Agreement Heatmap view
 */

import { motion } from "framer-motion";
import { Users, FileText } from "lucide-react";
import { opinionMap } from "@/lib/strings/he";

export type OpinionMapView = "map" | "statements";

interface ViewToggleProps {
  currentView: OpinionMapView;
  onViewChange: (view: OpinionMapView) => void;
  className?: string;
}

export function ViewToggle({ currentView, onViewChange, className = "" }: ViewToggleProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-1 inline-flex gap-1 ${className}`}>
      {/* Map View Button */}
      <button
        onClick={() => onViewChange("map")}
        className={`relative px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px] flex items-center gap-2 ${
          currentView === "map"
            ? "text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
        aria-pressed={currentView === "map"}
        aria-label={opinionMap.viewToggleMap}
      >
        {/* Background for active state */}
        {currentView === "map" && (
          <motion.div
            layoutId="activeViewTab"
            className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}

        <Users className="w-5 h-5 relative z-10" />
        <span className="relative z-10 hidden sm:inline">{opinionMap.viewToggleMap}</span>
      </button>

      {/* Statements View Button */}
      <button
        onClick={() => onViewChange("statements")}
        className={`relative px-4 py-2.5 rounded-lg font-semibold text-sm transition-colors min-h-[44px] flex items-center gap-2 ${
          currentView === "statements"
            ? "text-white"
            : "text-gray-600 hover:text-gray-900"
        }`}
        aria-pressed={currentView === "statements"}
        aria-label={opinionMap.viewToggleStatements}
      >
        {/* Background for active state */}
        {currentView === "statements" && (
          <motion.div
            layoutId="activeViewTab"
            className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}

        <FileText className="w-5 h-5 relative z-10" />
        <span className="relative z-10 hidden sm:inline">{opinionMap.viewToggleStatements}</span>
      </button>
    </div>
  );
}

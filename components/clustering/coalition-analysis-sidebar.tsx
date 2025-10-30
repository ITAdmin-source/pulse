"use client";

/**
 * Coalition Analysis Sidebar Component
 * Shows pairwise group alignments and polarization level
 */

import { ArrowLeftRight, TrendingDown } from "lucide-react";
import { opinionMap } from "@/lib/strings/he";
import type { CoalitionAnalysis } from "@/lib/clustering/coalition-analyzer";
import { GROUP_COLORS } from "@/components/clustering/types";

interface CoalitionAnalysisSidebarProps {
  coalitionAnalysis: CoalitionAnalysis;
  className?: string;
}

export function CoalitionAnalysisSidebar({
  coalitionAnalysis,
  className = "",
}: CoalitionAnalysisSidebarProps) {
  const { strongestCoalitions, pairwiseAlignment } = coalitionAnalysis;

  // Calculate polarization level
  const totalDisagreements = pairwiseAlignment.reduce(
    (sum, a) => sum + a.disagreementCount,
    0
  );
  const totalPairs = pairwiseAlignment.length;
  const avgStatementsPerPair =
    pairwiseAlignment[0]?.agreementCount +
    pairwiseAlignment[0]?.disagreementCount +
    pairwiseAlignment[0]?.neutralCount || 1;

  const polarizationScore =
    (totalDisagreements / (totalPairs * avgStatementsPerPair)) * 100;

  const polarizationLevel: "high" | "medium" | "low" =
    polarizationScore >= 30 ? "high" : polarizationScore >= 15 ? "medium" : "low";

  const polarizationLabel =
    polarizationLevel === "high"
      ? opinionMap.polarizationHigh
      : polarizationLevel === "medium"
      ? opinionMap.polarizationMedium
      : opinionMap.polarizationLow;

  const polarizationColor =
    polarizationLevel === "high"
      ? "bg-red-100 text-red-800"
      : polarizationLevel === "medium"
      ? "bg-yellow-100 text-yellow-800"
      : "bg-green-100 text-green-800";

  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 ${className}`}>
      <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
        <ArrowLeftRight className="w-5 h-5 text-gray-600" />
        {opinionMap.coalitionTitle}
      </h3>

      <p className="text-sm text-gray-600 mb-4">{opinionMap.coalitionDescription}</p>

      {/* Polarization Level */}
      <div className="mb-4 p-3 border border-gray-200 rounded-lg">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-semibold text-gray-700 flex items-center gap-1">
            <TrendingDown className="w-4 h-4" />
            {opinionMap.polarizationLevel}
          </span>
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${polarizationColor}`}>
            {polarizationLabel}
          </span>
        </div>
        <div className="text-xs text-gray-600">
          {Math.round(polarizationScore)}% disagreement rate
        </div>
      </div>

      {/* Strongest Coalitions */}
      <div className="space-y-2">
        <div className="text-sm font-semibold text-gray-700 mb-2">
          {opinionMap.strongestCoalition}
        </div>

        {strongestCoalitions.length === 0 && (
          <div className="text-sm text-gray-500 italic">
            No strong coalitions detected
          </div>
        )}

        {strongestCoalitions.map((coalition) => {
          const [group1Id, group2Id] = coalition.groupIds;
          const [label1, label2] = coalition.groupLabels;
          const color1 = GROUP_COLORS[group1Id % GROUP_COLORS.length];
          const color2 = GROUP_COLORS[group2Id % GROUP_COLORS.length];

          return (
            <div
              key={`${group1Id}-${group2Id}`}
              className="p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
            >
              {/* Coalition Pair */}
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: color1.primary }}
                  aria-label={label1}
                />
                <span className="text-sm font-medium text-gray-900">{label1}</span>
                <ArrowLeftRight className="w-3 h-3 text-gray-400" />
                <div
                  className="w-3 h-3 rounded-full border border-gray-300 shadow-sm"
                  style={{ backgroundColor: color2.primary }}
                  aria-label={label2}
                />
                <span className="text-sm font-medium text-gray-900">{label2}</span>
              </div>

              {/* Alignment Percentage */}
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-gray-600">
                  {opinionMap.coalitionAlignment(coalition.alignmentPercentage)}
                </span>
                <span className="text-gray-500">
                  {coalition.agreementCount} / {coalition.agreementCount + coalition.disagreementCount + coalition.neutralCount} statements
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gray-600 rounded-full transition-all"
                  style={{ width: `${coalition.alignmentPercentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Show hint if there are more coalitions */}
      {pairwiseAlignment.length > 3 && (
        <div className="mt-3 text-xs text-gray-500 italic">
          Showing top 3 of {pairwiseAlignment.length} possible coalitions
        </div>
      )}
    </div>
  );
}

"use client";

/**
 * Statement Agreement Heatmap Component
 * Color-coded table showing how each group voted on each statement
 */

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { opinionMap } from "@/lib/strings/he";
import type { StatementGroupAgreement } from "@/lib/services/clustering-service";
import type { CoarseGroup } from "@/components/clustering/types";
import { GROUP_COLORS } from "@/components/clustering/types";

interface StatementAgreementHeatmapProps {
  statements: StatementGroupAgreement[];
  groups: CoarseGroup[];
  className?: string;
}

export function StatementAgreementHeatmap({
  statements,
  groups,
  className = "",
}: StatementAgreementHeatmapProps) {
  const [sortBy, setSortBy] = useState<"classification" | "averageAgreement">(
    "classification"
  );
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  // Sort statements
  const sortedStatements = [...statements].sort((a, b) => {
    if (sortBy === "classification") {
      const typeOrder = {
        full_consensus: 0,
        partial_consensus: 1,
        split_decision: 2,
        bridge: 3,
        divisive: 4,
        normal: 5,
      };
      const diff =
        typeOrder[a.classification.type] - typeOrder[b.classification.type];
      return sortDirection === "asc" ? diff : -diff;
    } else {
      // averageAgreement
      const diff = Math.abs(b.classification.averageAgreement) - Math.abs(a.classification.averageAgreement);
      return sortDirection === "asc" ? -diff : diff;
    }
  });

  const toggleSort = (column: "classification" | "averageAgreement") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("desc");
    }
  };

  // Helper function to get cell color based on agreement percentage
  const getCellColor = (agreementPercentage: number): string => {
    const abs = Math.abs(agreementPercentage);

    if (agreementPercentage > 60) {
      // Strong agreement - green shades
      if (abs > 80) return "bg-green-600 text-white";
      if (abs > 60) return "bg-green-500 text-white";
    } else if (agreementPercentage < -60) {
      // Strong disagreement - red shades
      if (abs > 80) return "bg-red-600 text-white";
      if (abs > 60) return "bg-red-500 text-white";
    } else {
      // Neutral - gray shades
      if (abs < 20) return "bg-gray-100 text-gray-600";
      if (agreementPercentage > 0) return "bg-green-200 text-green-900";
      return "bg-red-200 text-red-900";
    }
    return "bg-gray-200 text-gray-700";
  };

  // Get classification badge
  const getClassificationBadge = (type: string) => {
    const badges = {
      full_consensus: { label: opinionMap.fullConsensusTitle, color: "bg-green-100 text-green-800" },
      partial_consensus: { label: opinionMap.partialConsensusTitle, color: "bg-blue-100 text-blue-800" },
      split_decision: { label: opinionMap.splitDecisionTitle, color: "bg-yellow-100 text-yellow-800" },
      divisive: { label: opinionMap.divisiveEnhancedTitle, color: "bg-red-100 text-red-800" },
      bridge: { label: opinionMap.bridgeEnhancedTitle, color: "bg-purple-100 text-purple-800" },
      normal: { label: "רגיל", color: "bg-gray-100 text-gray-800" },
    };
    return badges[type as keyof typeof badges] || badges.normal;
  };

  if (statements.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 text-center">
        <p className="text-gray-500">{opinionMap.heatmapNoData}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Legend */}
      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="text-sm text-gray-700 font-medium mb-2">מקרא:</div>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-600 rounded"></div>
            <span>הסכמה חזקה (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-500 rounded"></div>
            <span>הסכמה (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-100 rounded border border-gray-300"></div>
            <span>נייטרלי</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-500 rounded"></div>
            <span>אי-הסכמה (60-80%)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-red-600 rounded"></div>
            <span>אי-הסכמה חזקה (&gt;80%)</span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
            <tr>
              <th className="p-3 text-right text-sm font-semibold sticky right-0 bg-purple-600 z-10">
                <button
                  onClick={() => toggleSort("classification")}
                  className="flex items-center gap-1 hover:underline"
                >
                  סוג עמדה
                  {sortBy === "classification" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    ))}
                </button>
              </th>
              <th className="p-3 text-right text-sm font-semibold min-w-[200px]">
                <button
                  onClick={() => toggleSort("averageAgreement")}
                  className="flex items-center gap-1 hover:underline"
                >
                  נוסח העמדה
                  {sortBy === "averageAgreement" &&
                    (sortDirection === "asc" ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    ))}
                </button>
              </th>
              {groups.map((group) => {
                const color = GROUP_COLORS[group.id % GROUP_COLORS.length];
                return (
                  <th
                    key={group.id}
                    className="p-3 text-center text-sm font-semibold min-w-[80px]"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                        style={{ backgroundColor: color.primary }}
                      />
                      <span>{group.label}</span>
                      <span className="text-xs font-normal opacity-75">
                        ({group.userCount})
                      </span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sortedStatements.map((stmt, idx) => {
              const badge = getClassificationBadge(stmt.classification.type);
              return (
                <tr
                  key={stmt.statementId}
                  className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                >
                  {/* Classification Badge */}
                  <td className="p-3 sticky right-0 bg-inherit z-10">
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full whitespace-nowrap ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  </td>

                  {/* Statement Text */}
                  <td className="p-3 text-sm text-gray-900">
                    <div className="line-clamp-2">{stmt.statementText}</div>
                  </td>

                  {/* Group Cells */}
                  {stmt.groupAgreements.map((groupAgreement) => {
                    const cellColor = getCellColor(groupAgreement.agreementPercentage);
                    return (
                      <td
                        key={groupAgreement.groupId}
                        className={`p-3 text-center font-semibold text-sm ${cellColor}`}
                        title={opinionMap.heatmapCellLabel(
                          groupAgreement.groupLabel,
                          stmt.statementText,
                          groupAgreement.agreementPercentage
                        )}
                      >
                        {groupAgreement.agreementPercentage > 0 ? "+" : ""}
                        {groupAgreement.agreementPercentage}%
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

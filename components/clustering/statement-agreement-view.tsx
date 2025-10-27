"use client";

/**
 * Statement Agreement View Component
 * Container for the statement agreement heatmap visualization
 * Shows how each opinion group voted on each statement
 */

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { opinionMap } from "@/lib/strings/he";
import { StatementStatsCards } from "./statement-stats-cards";
import { StatementAgreementHeatmap } from "./statement-agreement-heatmap";
import { CoalitionAnalysisSidebar } from "./coalition-analysis-sidebar";
import type { StatementGroupAgreement } from "@/lib/services/clustering-service";
import type { CoalitionAnalysis } from "@/lib/clustering/coalition-analyzer";
import type { CoarseGroup } from "./types";

interface StatementAgreementViewProps {
  pollId: string;
  groups: CoarseGroup[];
  currentUserGroupId?: number;
}

export function StatementAgreementView({ pollId, groups, currentUserGroupId }: StatementAgreementViewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statementData, setStatementData] = useState<StatementGroupAgreement[] | null>(null);
  const [coalitionData, setCoalitionData] = useState<CoalitionAnalysis | null>(null);

  useEffect(() => {
    async function fetchStatementData() {
      setIsLoading(true);
      setError(null);

      try {
        // Import the action dynamically to avoid server/client issues
        const { getCompleteClusteringDataAction } = await import("@/actions/clustering-actions");

        const result = await getCompleteClusteringDataAction(pollId, {
          includeGroupAgreements: true,
          includeCoalitionAnalysis: true,
        });

        if (!result.success || !result.data) {
          throw new Error(result.error || "Failed to fetch statement data");
        }

        setStatementData(result.data.groupAgreementMatrix || null);
        setCoalitionData(result.data.coalitionAnalysis || null);
      } catch (err) {
        console.error("[StatementAgreementView] Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchStatementData();
  }, [pollId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 bg-white rounded-xl shadow-lg">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600 mb-3" />
        <p className="text-gray-600">{opinionMap.heatmapLoading}</p>
      </div>
    );
  }

  if (error || !statementData) {
    return (
      <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 text-center">
        <div className="text-red-800 font-semibold mb-2">{opinionMap.errorTitle}</div>
        <div className="text-red-600 text-sm">{error || opinionMap.heatmapNoData}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          {opinionMap.statementAgreementTitle}
        </h2>
        <p className="text-primary-200 text-sm">
          {opinionMap.statementAgreementDescription}
        </p>
      </div>

      {/* Stats Cards */}
      <StatementStatsCards statements={statementData} />

      {/* Main Grid: Heatmap + Coalition Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap (2/3 width on large screens) */}
        <div className="lg:col-span-2">
          <StatementAgreementHeatmap
            statements={statementData}
            groups={groups}
            currentUserGroupId={currentUserGroupId}
          />
        </div>

        {/* Coalition Analysis Sidebar (1/3 width on large screens) */}
        {coalitionData && (
          <div className="lg:col-span-1">
            <CoalitionAnalysisSidebar coalitionAnalysis={coalitionData} />
          </div>
        )}
      </div>
    </div>
  );
}

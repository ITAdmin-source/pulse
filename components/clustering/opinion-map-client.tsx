"use client";

/**
 * Opinion Map Client Component - Interactive Clustering Visualization
 * Handles all client-side interactivity for the opinion map
 */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle, AlertCircle } from "lucide-react";

// Clustering Components
import { OpinionMapCanvas } from "@/components/clustering/opinion-map-canvas";
import { OpinionMapCanvasMobile } from "@/components/clustering/opinion-map-canvas-mobile";
import { OpinionMapLegend } from "@/components/clustering/opinion-map-legend";
import { ClusteringLoadingSkeleton } from "@/components/clustering/clustering-loading-skeleton";
import { ClusteringErrorState } from "@/components/clustering/clustering-error-state";
import { ClusteringNotEligible } from "@/components/clustering/clustering-not-eligible";
import { ViewToggle, type OpinionMapView } from "@/components/clustering/view-toggle";
import { StatementAgreementView } from "@/components/clustering/statement-agreement-view";

// Hooks
import { useClusteringData } from "@/lib/hooks/use-clustering-data";

// Utils & Strings
import { colors } from "@/lib/design-tokens-v2";
import { opinionMap } from "@/lib/strings/he";

interface OpinionMapClientProps {
  poll: {
    id: string;
    slug: string;
    question: string;
    emoji?: string | null;
  };
  eligibility: {
    eligible: boolean;
    reason?: string;
    userCount?: number;
    statementCount?: number;
  };
}

export function OpinionMapClient({ poll, eligibility }: OpinionMapClientProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user: dbUser, isLoading: isUserLoading } = useCurrentUser();

  // View state (map or statements)
  const [currentView, setCurrentView] = useState<OpinionMapView>("map");

  // Expanded groups state (for showing demographics)
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

  // Handler for toggling group expansion (called from legend or map clicks)
  const handleGroupToggle = (groupId: number) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  };

  // Fetch clustering data (only if poll is loaded and eligible)
  const {
    data: clusteringData,
    isLoading: isLoadingClustering,
    error: clusteringError,
    refetch,
  } = useClusteringData(poll.id);

  // Not eligible for clustering
  if (!eligibility.eligible) {
    return (
      <div className={`min-h-screen ${colors.background.page.className}`}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-header border-b border-primary-500/20">
          <div className="container mx-auto px-4 py-4 sm:py-3">
            <Button
              variant="ghost"
              size="default"
              onClick={() => router.push(`/polls/${poll.slug}`)}
              className="text-white hover:bg-primary-700 hover:text-white flex items-center gap-2 min-h-[44px] px-4"
            >
              <ArrowRight className="w-5 h-5" />
              {opinionMap.backToResults}
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <ClusteringNotEligible
            reason={eligibility.reason || "דיון לא זכאי למפת דעות"}
            userCount={eligibility.userCount}
            statementCount={eligibility.statementCount}
          />
        </main>
      </div>
    );
  }

  // Error state
  if (clusteringError) {
    return (
      <div className={`min-h-screen ${colors.background.page.className}`}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-header border-b border-primary-500/20">
          <div className="container mx-auto px-4 py-4 sm:py-3">
            <Button
              variant="ghost"
              size="default"
              onClick={() => router.push(`/polls/${poll.slug}`)}
              className="text-white hover:bg-primary-700 hover:text-white flex items-center gap-2 min-h-[44px] px-4"
            >
              <ArrowRight className="w-5 h-5" />
              {opinionMap.backToResults}
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <ClusteringErrorState
            error={clusteringError instanceof Error ? clusteringError.message : "Unknown error"}
            onRetry={() => refetch()}
          />
        </main>
      </div>
    );
  }

  // Loading clustering data or user data
  if (isLoadingClustering || isUserLoading) {
    return (
      <div className={`min-h-screen ${colors.background.page.className}`}>
        {/* Header */}
        <header className="sticky top-0 z-50 bg-gradient-header border-b border-primary-500/20">
          <div className="container mx-auto px-4 py-4 sm:py-3">
            <Button
              variant="ghost"
              size="default"
              onClick={() => router.push(`/polls/${poll.slug}`)}
              className="text-white hover:bg-primary-700 hover:text-white flex items-center gap-2 min-h-[44px] px-4"
            >
              <ArrowRight className="w-5 h-5" />
              {opinionMap.backToResults}
            </Button>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <ClusteringLoadingSkeleton />
        </main>
      </div>
    );
  }

  // Main visualization view
  return (
    <div className={`min-h-screen ${colors.background.page.className}`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-gradient-header border-b border-primary-500/20">
        <div className="container mx-auto px-4 py-4 sm:py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="default"
              onClick={() => router.push(`/polls/${poll.slug}`)}
              className="text-white hover:bg-primary-700 hover:text-white flex items-center gap-2 min-h-[44px] px-4"
            >
              <ArrowRight className="w-5 h-5" />
              {opinionMap.backToResults}
            </Button>

            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-primary-700"
              aria-label="עזרה"
            >
              <HelpCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Page Title */}
        <div className="text-center mb-8">
          <div className="text-4xl sm:text-5xl mb-3">{poll.emoji || "📊"}</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
            {opinionMap.pageTitle}
          </h1>
          <p className="text-primary-200 text-sm sm:text-base">
            {poll.question}
          </p>
        </div>

        {/* View Toggle */}
        {clusteringData && (
          <div className="flex justify-center mb-6">
            <ViewToggle currentView={currentView} onViewChange={setCurrentView} />
          </div>
        )}

        {/* Visualization Content */}
        {clusteringData && currentView === "map" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Visualization (Desktop/Mobile Adaptive) */}
            <div className="lg:col-span-2 space-y-4">
              {/* Quality Indicator Banner */}
              {clusteringData.metadata.qualityTier === "low" && (
                <div className="bg-amber-50 border-r-4 border-amber-500 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-amber-600 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-amber-900 mb-1">
                        {opinionMap.qualityIndicatorTitle}
                      </h4>
                      <p className="text-sm text-amber-800">
                        {clusteringData.metadata.consensusLevel === "high"
                          ? opinionMap.qualityIndicatorLowWithConsensus
                          : opinionMap.qualityIndicatorLowWithoutConsensus}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isMobile ? (
                <OpinionMapCanvasMobile
                  userPositions={clusteringData.userPositions}
                  groups={clusteringData.coarseGroups}
                  currentUserId={dbUser?.id}
                  onGroupClick={handleGroupToggle}
                />
              ) : (
                <OpinionMapCanvas
                  userPositions={clusteringData.userPositions}
                  groups={clusteringData.coarseGroups}
                  currentUserId={dbUser?.id}
                  onGroupClick={handleGroupToggle}
                />
              )}
            </div>

            {/* Legend & Info Sidebar */}
            <div className="space-y-6">
              <OpinionMapLegend
                groups={clusteringData.coarseGroups}
                currentUserGroupId={
                  clusteringData.userPositions.find((p) => p.userId === dbUser?.id)
                    ?.coarseGroupId
                }
                expandedGroups={expandedGroups}
                onGroupToggle={handleGroupToggle}
              />

              {/* Quality Metrics Card */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {opinionMap.qualityTitle}
                </h3>
                <div className="space-y-3 text-sm">
                  {/* Quality Tier Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">איכות ניתוח:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        clusteringData.metadata.qualityTier === "high"
                          ? "bg-green-100 text-green-800"
                          : clusteringData.metadata.qualityTier === "medium"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {clusteringData.metadata.qualityTier === "high"
                        ? opinionMap.qualityTierHigh
                        : clusteringData.metadata.qualityTier === "medium"
                        ? opinionMap.qualityTierMedium
                        : opinionMap.qualityTierLow}
                    </span>
                  </div>

                  {/* Consensus Level Badge */}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">רמת הסכמה:</span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        clusteringData.metadata.consensusLevel === "high"
                          ? "bg-primary-100 text-primary-800"
                          : clusteringData.metadata.consensusLevel === "medium"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-secondary-100 text-secondary-800"
                      }`}
                    >
                      {clusteringData.metadata.consensusLevel === "high"
                        ? opinionMap.consensusLevelHigh
                        : clusteringData.metadata.consensusLevel === "medium"
                        ? opinionMap.consensusLevelMedium
                        : opinionMap.consensusLevelLow}
                    </span>
                  </div>

                  <div className="border-t border-gray-200 pt-3 mt-3"></div>

                  <div className="flex justify-between">
                    <span className="text-gray-600">משתתפים:</span>
                    <span className="font-semibold">{clusteringData.metadata.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">עמדות:</span>
                    <span className="font-semibold">{clusteringData.metadata.totalStatements}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">קבוצות:</span>
                    <span className="font-semibold">{clusteringData.metadata.numCoarseGroups}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{opinionMap.varianceExplained}:</span>
                    <span className="font-semibold">
                      {(clusteringData.metadata.totalVarianceExplained * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{opinionMap.silhouetteScore}:</span>
                    <span className="font-semibold">
                      {(clusteringData.metadata.silhouetteScore * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statement Agreement View */}
        {clusteringData && currentView === "statements" && (
          <StatementAgreementView
            pollId={poll.id}
            groups={clusteringData.coarseGroups}
            currentUserGroupId={
              clusteringData.userPositions.find((p) => p.userId === dbUser?.id)
                ?.coarseGroupId
            }
          />
        )}
      </main>
    </div>
  );
}

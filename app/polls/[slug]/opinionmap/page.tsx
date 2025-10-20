"use client";

/**
 * Opinion Map Page - Privacy-Preserving Clustering Visualization
 * Route: /polls/[slug]/opinionmap
 *
 * Shows group boundaries, centroids, and current user's position ONLY
 * Does NOT show individual positions of other users (privacy protection)
 */

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowRight, HelpCircle } from "lucide-react";
import { toast } from "sonner";

// Clustering Components
import { OpinionMapCanvas } from "@/components/clustering/opinion-map-canvas";
import { OpinionMapLegend } from "@/components/clustering/opinion-map-legend";
import { MobileClusteringView } from "@/components/clustering/mobile-clustering-view";
import { ClusteringLoadingSkeleton } from "@/components/clustering/clustering-loading-skeleton";
import { ClusteringErrorState } from "@/components/clustering/clustering-error-state";
import { ClusteringNotEligible } from "@/components/clustering/clustering-not-eligible";

// Actions & Hooks
import { getPollBySlugAction } from "@/actions/polls-actions";
import { checkClusteringEligibilityAction } from "@/actions/clustering-actions";
import { useClusteringData } from "@/lib/hooks/use-clustering-data";

// Utils & Strings
import { colors } from "@/lib/design-tokens-v2";
import { opinionMap } from "@/lib/strings/he";

interface OpinionMapPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default function OpinionMapPage({ params }: OpinionMapPageProps) {
  const router = useRouter();
  const isMobile = useIsMobile();
  const { user: dbUser, isLoading: isUserLoading } = useCurrentUser();

  const [poll, setPoll] = useState<{
    id: string;
    slug: string;
    question: string;
    emoji?: string | null;
  } | null>(null);
  const [isLoadingPoll, setIsLoadingPoll] = useState(true);
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    reason?: string;
    userCount?: number;
    statementCount?: number;
  } | null>(null);

  // Load poll data
  use(
    (async () => {
      if (!isLoadingPoll) return;

      try {
        const resolvedParams = await params;
        const pollResult = await getPollBySlugAction(resolvedParams.slug);

        if (!pollResult.success || !pollResult.data) {
          toast.error("דיון לא נמצא");
          router.push("/polls");
          return;
        }

        setPoll(pollResult.data);

        // Check clustering eligibility
        const eligibilityResult = await checkClusteringEligibilityAction(pollResult.data.id);

        if (eligibilityResult.success && eligibilityResult.data) {
          setEligibility(eligibilityResult.data);
        }
      } catch (error) {
        console.error("Error loading poll:", error);
        toast.error("שגיאה בטעינת הדיון");
      } finally {
        setIsLoadingPoll(false);
      }
    })()
  );

  // Fetch clustering data (only if poll is loaded and eligible)
  const {
    data: clusteringData,
    isLoading: isLoadingClustering,
    error: clusteringError,
    refetch,
  } = useClusteringData(poll?.id || "");

  // Loading state
  if (isLoadingPoll || isUserLoading) {
    return (
      <div className={`min-h-screen ${colors.background.page.className}`}>
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <ClusteringLoadingSkeleton />
        </div>
      </div>
    );
  }

  // Poll not found
  if (!poll) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colors.background.page.className}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">דיון לא נמצא</h1>
          <Button asChild className="bg-white text-primary-900 hover:bg-white/90">
            <Link href="/polls">חזרה לכל הדיונים</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Not eligible for clustering
  if (eligibility && !eligibility.eligible) {
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
            reason={eligibility?.reason || "דיון לא זכאי למפת דעות"}
            userCount={eligibility?.userCount}
            statementCount={eligibility?.statementCount}
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

  // Loading clustering data
  if (isLoadingClustering) {
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

        {/* Visualization Content */}
        {clusteringData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Visualization (Desktop/Mobile Adaptive) */}
            <div className="lg:col-span-2">
              {isMobile ? (
                <MobileClusteringView
                  userPositions={clusteringData.userPositions}
                  groups={clusteringData.coarseGroups}
                  currentUserId={dbUser?.id}
                  totalUsers={clusteringData.metadata.totalUsers}
                />
              ) : (
                <OpinionMapCanvas
                  userPositions={clusteringData.userPositions}
                  groups={clusteringData.coarseGroups}
                  currentUserId={dbUser?.id}
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
              />

              {/* Quality Metrics Card */}
              <div className="bg-white rounded-xl shadow-lg p-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3">
                  {opinionMap.qualityTitle}
                </h3>
                <div className="space-y-2 text-sm">
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
      </main>
    </div>
  );
}

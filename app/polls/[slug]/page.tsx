"use client";

/**
 * Combined Poll Page v2.0 - Single Page Architecture
 *
 * This page combines Vote and Results views with tab navigation.
 * - Vote tab: Statement voting with split-screen buttons
 * - Results tab: Personal insights + aggregate results (locked until 10 votes)
 * - Demographics modal: Appears AFTER 10 votes, BEFORE results access
 *
 * Key features:
 * - Tab navigation (no separate routes)
 * - Results unlocking at 10 votes
 * - Demographics gating
 * - Dark purple/pink gradient theme
 * - Hebrew strings from lib/strings/he.ts
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useClerk } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import confetti from "canvas-confetti";

// v2.0 Components - Core (always loaded)
import { TabNavigation } from "@/components/polls-v2/tab-navigation";
import { SplitVoteCard } from "@/components/voting-v2/split-vote-card";
import { ProgressSegments } from "@/components/voting-v2/progress-segments";
import { ResultsLockedBanner } from "@/components/banners/results-locked-banner";
import { ClosedPollBanner } from "@/components/banners/closed-poll-banner";
import { PartialParticipationBanner } from "@/components/banners/partial-participation-banner";
import { DemographicsModal, type DemographicsData } from "@/components/modals/demographics-modal";
import { EncouragementToast } from "@/components/gamification/encouragement-toast";
import { StatementSubmissionModal } from "@/components/modals/statement-submission-modal";

// v2.0 Components - Lazy Loaded (Results tab only) with loading fallbacks
const InsightCard = dynamic(() => import("@/components/results-v2/insight-card").then(mod => ({ default: mod.InsightCard })), {
  loading: () => (
    <div className="bg-gradient-insight rounded-2xl p-6 sm:p-8 shadow-2xl text-white text-center">
      <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
      <p className="text-lg font-medium">טוען תובנה...</p>
    </div>
  ),
  ssr: false
});

const AggregateStats = dynamic(() => import("@/components/results-v2/aggregate-stats").then(mod => ({ default: mod.AggregateStats })), {
  loading: () => (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-600" />
      <p className="text-gray-600 text-sm">טוען סטטיסטיקות...</p>
    </div>
  ),
  ssr: false
});

const DemographicHeatmap = dynamic(() => import("@/components/results-v2/demographic-heatmap").then(mod => ({ default: mod.DemographicHeatmap })), {
  loading: () => (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-600" />
      <p className="text-gray-600 text-sm">טוען מפת חום דמוגרפית...</p>
    </div>
  ),
  ssr: false
});

const MoreStatementsPrompt = dynamic(() => import("@/components/results-v2/more-statements-prompt").then(mod => ({ default: mod.MoreStatementsPrompt })), {
  loading: () => (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-600" />
      <p className="text-gray-600 text-sm">טוען...</p>
    </div>
  ),
  ssr: false
});

const VotingCompleteBanner = dynamic(() => import("@/components/results-v2/voting-complete-banner").then(mod => ({ default: mod.VotingCompleteBanner })), {
  loading: () => (
    <div className="bg-white rounded-3xl shadow-xl p-6 text-center">
      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary-600" />
      <p className="text-gray-600 text-sm">טוען...</p>
    </div>
  ),
  ssr: false
});

// Actions
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getStatementBatchAction, getVotingProgressAction, getUserVotesForPollAction, createVoteAction, getStatementVoteDistributionAction } from "@/actions/votes-actions";
import { getApprovedStatementsByPollIdAction } from "@/actions/statements-actions";
import { saveDemographicsAction, getUserDemographicsByIdAction } from "@/actions/user-demographics-actions";
import { ensureUserExistsAction } from "@/actions/users-actions";
import { getUserPollInsightAction, generateAndSaveInsightAction, getUserArtifactCollectionAction, markArtifactAsSeenAction } from "@/actions/user-poll-insights-actions";
import { getPollResultsAction } from "@/actions/poll-results-actions";
import { getAllHeatmapDataAction } from "@/actions/heatmap-actions";
import type { HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";
import type { ArtifactSlot } from "@/components/results-v2/minimal-collection-footer";

// Services & Utils
import { StatementManager } from "@/lib/services/statement-manager";
import { colors } from "@/lib/design-tokens-v2";
import { pollPage, results, voting } from "@/lib/strings/he";
import { getInsightFromStorage, saveInsightToStorage } from "@/lib/utils/insight-storage";

interface Statement {
  id: string;
  text: string;
  pollId: string | null;
}

interface Poll {
  id: string;
  slug: string;
  question: string;
  description?: string | null;
  status: string;
  startTime?: Date | null;
  endTime?: Date | null;
  supportButtonLabel?: string | null;
  opposeButtonLabel?: string | null;
  unsureButtonLabel?: string | null;
  allowUserStatements: boolean;
  autoApproveStatements: boolean;
  emoji?: string | null;
}

interface CombinedPollPageProps {
  params: Promise<{
    slug: string;
  }>;
}

type TabType = "vote" | "results";

const BATCH_SIZE = 10;

// Vote distribution cache for optimistic updates
// Fix #1: Add TTL and LRU eviction to prevent memory leaks
const VOTE_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 100; // Prevent unbounded growth

const voteDistributionCache = new Map<string, {
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  totalVotes: number;
  timestamp: number;
}>();

// Fix #1: Helper to get valid cached distribution with TTL check
function getValidCachedDistribution(statementId: string) {
  const cached = voteDistributionCache.get(statementId);
  if (cached && Date.now() - cached.timestamp < VOTE_CACHE_TTL) {
    return cached;
  }

  // Evict stale entry
  if (cached) {
    voteDistributionCache.delete(statementId);
  }

  // LRU eviction if cache too large
  if (voteDistributionCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = voteDistributionCache.keys().next().value;
    if (oldestKey) {
      voteDistributionCache.delete(oldestKey);
    }
  }

  return null;
}

function calculateOptimisticDistribution(
  statementId: string,
  userVote: 1 | 0 | -1
): {
  agreePercent: number;
  disagreePercent: number;
  passPercent: number;
} {
  const cached = getValidCachedDistribution(statementId);
  const baseStats = cached || {
    agreeCount: 0,
    disagreeCount: 0,
    unsureCount: 0,
    totalVotes: 0,
  };

  const agreeCount = baseStats.agreeCount + (userVote === 1 ? 1 : 0);
  const disagreeCount = baseStats.disagreeCount + (userVote === -1 ? 1 : 0);
  const unsureCount = baseStats.unsureCount + (userVote === 0 ? 1 : 0);
  const totalVotes = baseStats.totalVotes + 1;

  const agreePercent = totalVotes > 0 ? (agreeCount / totalVotes) * 100 : 0;
  const disagreePercent = totalVotes > 0 ? (disagreeCount / totalVotes) * 100 : 0;
  const passPercent = totalVotes > 0 ? (unsureCount / totalVotes) * 100 : 0;

  voteDistributionCache.set(statementId, {
    agreeCount,
    disagreeCount,
    unsureCount,
    totalVotes,
    timestamp: Date.now(),
  });

  return { agreePercent, disagreePercent, passPercent };
}

export default function CombinedPollPage({ params }: CombinedPollPageProps) {
  const router = useRouter();
  const { openSignUp } = useClerk();
  const { user: dbUser, sessionId: contextSessionId, isLoading: isUserLoading } = useCurrentUser();

  // Core state
  const [activeTab, setActiveTab] = useState<TabType>("vote");
  const [poll, setPoll] = useState<Poll | null>(null);
  const [statementManager, setStatementManager] = useState<StatementManager | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [isPollClosed, setIsPollClosed] = useState(false);
  const [inGracePeriod, setInGracePeriod] = useState(false);

  // Voting state
  const [currentStatement, setCurrentStatement] = useState<Statement | null>(null);
  const [showVoteStats, setShowVoteStats] = useState(false);
  const [voteStats, setVoteStats] = useState<{ agreePercent: number; disagreePercent: number; passPercent: number } | null>(null);

  // Gamification state
  const [encouragementMessage, setEncouragementMessage] = useState<string>("");
  const [showEncouragement, setShowEncouragement] = useState(false);
  const [showAddButtonPulse, setShowAddButtonPulse] = useState(false);
  const [triggeredMilestones, setTriggeredMilestones] = useState<Set<number>>(new Set());

  // Demographics state
  const [hasDemographics, setHasDemographics] = useState(false);
  const [showDemographicsModal, setShowDemographicsModal] = useState(false);

  // Statement submission modal state
  const [showStatementModal, setShowStatementModal] = useState(false);

  // Results state
  const [resultsData, setResultsData] = useState<{
    insight: { profile: string; emoji: string; description: string } | null;
    stats: { participantCount: number; statementCount: number; totalVotes: number } | null;
    heatmapData: Record<"gender" | "ageGroup" | "ethnicity" | "politicalParty", HeatmapStatementData[]> | null;
    hasMoreStatements: boolean;
  }>({
    insight: null,
    stats: null,
    heatmapData: null,
    hasMoreStatements: false
  });
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  // Artifact collection state
  const [userArtifacts, setUserArtifacts] = useState<ArtifactSlot[]>([]);
  const [newlyEarnedArtifact, setNewlyEarnedArtifact] = useState<{ emoji: string; profile: string } | null>(null);

  // Locks
  const isVotingRef = useRef(false);
  const hasInitializedRef = useRef(false);

  // Fix #2: Ref-based results cache with vote count invalidation
  const resultsCacheRef = useRef<{
    pollId: string;
    votedCount: number;
    data: typeof resultsData;
    timestamp: number;
  } | null>(null);
  const RESULTS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

  // Optimization #6: Client-side heatmap cache
  const heatmapCacheRef = useRef<{
    pollId: string;
    data: Record<"gender" | "ageGroup" | "ethnicity" | "politicalParty", HeatmapStatementData[]>;
    timestamp: number;
  } | null>(null);
  const HEATMAP_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Progress tracking - single source of truth from statementManager
  const progress = statementManager?.getProgress();
  const votedCount = progress?.totalVoted ?? 0;
  const totalStatements = progress?.totalStatementsInPoll ?? 0;

  // Dynamic threshold: 10 votes OR all statements if poll has fewer than 10
  const votesRequiredForResults = Math.min(10, totalStatements);

  const resultsLocked = votedCount < votesRequiredForResults;
  const hasMoreStatements = votedCount < totalStatements;

  // Prefetch vote distribution when statement appears (for optimistic updates)
  useEffect(() => {
    if (!currentStatement) return;

    const statementId = currentStatement.id;

    // Skip if already cached with valid TTL
    if (getValidCachedDistribution(statementId)) {
      return;
    }

    // Prefetch in background while user reads the card
    // By the time they vote (~2-4 seconds), distribution will be cached
    getStatementVoteDistributionAction(statementId).then((result) => {
      if (result.success && result.data) {
        voteDistributionCache.set(statementId, {
          agreeCount: result.data.agreeCount,
          disagreeCount: result.data.disagreeCount,
          unsureCount: result.data.unsureCount,
          totalVotes: result.data.totalVotes,
          timestamp: Date.now(),
        });
      }
    }).catch((error) => {
      // Log errors for debugging but don't block UX
      console.warn("Prefetch failed for statement", statementId, error);
    });
  }, [currentStatement]);

  // Auto-open demographics modal when Results tab is accessed without demographics
  // Skip this for closed polls (no demographics required)
  useEffect(() => {
    if (activeTab === "results" && !resultsLocked && !hasDemographics && !isPollClosed) {
      setShowDemographicsModal(true);
    }
  }, [activeTab, resultsLocked, hasDemographics, isPollClosed]);

  // Auto-load next batch when Vote tab becomes active with no current statement
  useEffect(() => {
    // Skip if poll is closed and past grace period
    if (isPollClosed && !inGracePeriod) return;

    // Only trigger if:
    // 1. Vote tab is active
    // 2. No current statement showing
    // 3. User has more statements to vote on
    // 4. StatementManager exists
    if (activeTab === "vote" && !currentStatement && hasMoreStatements && statementManager) {
      const loadNextBatchForVoting = async () => {
        try {
          // First, check if batch already loaded (from background preload)
          const nextStmt = statementManager.getNextStatement();

          if (nextStmt) {
            // ✅ Batch already loaded in background! Just set statement (instant)
            setCurrentStatement(nextStmt);
            return;
          }

          // Batch not loaded yet (preload still running or failed), load it now
          const hasMore = await statementManager.loadNextBatch();

          if (hasMore) {
            const stmt = statementManager.getNextStatement();
            if (stmt) {
              setCurrentStatement(stmt);
            } else {
              console.error("[VoteTab] Batch loaded but no statement found");
            }
          } else {
            console.log("[VoteTab] No more batches available");
          }
        } catch (error) {
          console.error("[VoteTab] Error loading batch:", error);
          toast.error("שגיאה בטעינת עמדות");
        }
      };

      loadNextBatchForVoting();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, currentStatement, hasMoreStatements, isPollClosed, inGracePeriod]);

  // Gamification: Calculate dynamic milestones based on poll size
  const calculateMilestones = () => {
    const threshold = votesRequiredForResults;

    // Calculate percentage-based milestones
    const milestone30 = Math.max(2, Math.round(threshold * 0.3));
    const milestone50 = Math.max(3, Math.round(threshold * 0.5));
    const milestone70 = Math.max(4, Math.round(threshold * 0.7));
    const milestoneAddButton = 4; // Fixed at vote 4
    const milestoneInsightTeaser = Math.max(threshold - 2, milestone70 + 1);
    const milestoneAlmostThere = threshold > 6 ? threshold - 1 : null; // Only for larger polls
    const milestoneFinal = threshold;

    return {
      milestone30,
      milestone50,
      milestone70,
      milestoneAddButton,
      milestoneInsightTeaser,
      milestoneAlmostThere,
      milestoneFinal,
    };
  };

  // Gamification: Check if vote count hits a milestone
  const checkMilestone = (voteCount: number): string | null => {
    // Only trigger each milestone once
    if (triggeredMilestones.has(voteCount)) return null;

    const milestones = calculateMilestones();

    if (voteCount === milestones.milestone30) return '30percent';
    if (voteCount === milestones.milestoneAddButton) return 'addButton';
    if (voteCount === milestones.milestone50) return '50percent';
    if (voteCount === milestones.milestone70) return '70percent';
    if (voteCount === milestones.milestoneInsightTeaser) return 'insightTeaser';
    if (milestones.milestoneAlmostThere && voteCount === milestones.milestoneAlmostThere) return 'almostThere';
    if (voteCount === milestones.milestoneFinal) return 'final';

    return null;
  };

  // Gamification: Handle milestone effects
  const handleMilestone = (milestoneType: string, voteCount: number) => {
    // Mark milestone as triggered
    setTriggeredMilestones((prev) => new Set(prev).add(voteCount));

    const threshold = votesRequiredForResults;
    const remainingVotes = threshold - voteCount;

    switch (milestoneType) {
      case '30percent':
        setEncouragementMessage(voting.milestone30Percent);
        setShowEncouragement(true);
        break;

      case 'addButton':
        // Trigger add button pulse animation
        if (poll?.allowUserStatements) {
          setShowAddButtonPulse(true);
          // Stop pulse after 3 seconds
          setTimeout(() => setShowAddButtonPulse(false), 3000);
        }
        break;

      case '50percent':
        setEncouragementMessage(voting.milestone50Percent);
        setShowEncouragement(true);
        break;

      case '70percent':
        setEncouragementMessage(voting.milestone70Percent);
        setShowEncouragement(true);
        break;

      case 'insightTeaser':
        setEncouragementMessage(voting.milestoneInsightTeaser(remainingVotes));
        setShowEncouragement(true);
        break;

      case 'almostThere':
        setEncouragementMessage(voting.milestoneAlmostThere);
        setShowEncouragement(true);
        break;

      case 'final':
        // Big celebration with confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: [
            getComputedStyle(document.documentElement).getPropertyValue('--confetti-purple-600').trim() || '#9333ea',
            getComputedStyle(document.documentElement).getPropertyValue('--confetti-pink-600').trim() || '#db2777',
            getComputedStyle(document.documentElement).getPropertyValue('--confetti-pink-500').trim() || '#ec4899',
            getComputedStyle(document.documentElement).getPropertyValue('--confetti-purple-500').trim() || '#a855f7',
          ],
        });
        setEncouragementMessage(voting.milestoneThresholdReached);
        setShowEncouragement(true);
        break;
    }
  };

  // Initialize poll and user data
  useEffect(() => {
    if (hasInitializedRef.current || isUserLoading) return;

    const loadData = async () => {
      try {
        const resolvedParams = await params;
        const pollResult = await getPollBySlugAction(resolvedParams.slug);

        if (!pollResult.success || !pollResult.data) {
          toast.error(pollPage.pollNotFound);
          router.push("/polls");
          return;
        }

        const fetchedPoll = pollResult.data;

        // Allow both published and closed polls to be viewed
        if (fetchedPoll.status !== "published" && fetchedPoll.status !== "closed") {
          toast.error(pollPage.pollNotActive);
          router.push("/polls");
          return;
        }

        // Detect if poll is closed (either by status or endTime)
        const isPollClosedByStatus = fetchedPoll.status === "closed";
        const isPollClosedByTime = fetchedPoll.endTime && new Date() > new Date(fetchedPoll.endTime);

        if (isPollClosedByStatus || isPollClosedByTime) {
          // Poll is closed - determine if within grace period
          if (fetchedPoll.endTime) {
            const endTime = new Date(fetchedPoll.endTime);
            const now = new Date();
            const gracePeriodMs = 10 * 60 * 1000; // 10 minutes
            const graceEndTime = new Date(endTime.getTime() + gracePeriodMs);

            if (now <= graceEndTime && now > endTime) {
              // Within grace period - allow finishing current vote session
              setIsPollClosed(true);
              setInGracePeriod(true);
              toast.warning("הסקר נסגר, אך תוכלו לסיים את ההצבעה הנוכחית");
            } else {
              // Past grace period or closed by status
              setIsPollClosed(true);
              setInGracePeriod(false);
              setActiveTab("results");
              toast.info("הסקר נסגר");
            }
          } else {
            // Closed by status but no endTime specified
            setIsPollClosed(true);
            setInGracePeriod(false);
            setActiveTab("results");
            toast.info("הסקר נסגר");
          }
        }

        setPoll(fetchedPoll);

        // Handle user - authenticated or anonymous
        if (dbUser?.id) {
          setUserId(dbUser.id);
          setSessionId(contextSessionId);

          // Fix #2: Parallelize ALL data fetches (votes, progress, demographics, batch)
          // Load user's votes, progress, and demographics in parallel
          const [votesResult, progressResult, demographicsResult] = await Promise.all([
            getUserVotesForPollAction(dbUser.id, fetchedPoll.id),
            getVotingProgressAction(fetchedPoll.id, dbUser.id),
            getUserDemographicsByIdAction(dbUser.id)
          ]);

          const userVotesLookup = votesResult.success ? votesResult.data || {} : {};
          setHasDemographics(demographicsResult.success && !!demographicsResult.data);

          if (progressResult.success && progressResult.data) {
            const { totalStatements, currentBatch } = progressResult.data;

            // Check if user has voted on ALL statements BEFORE loading batch
            // This handles the case where getStatementBatchAction returns empty array
            const totalVoted = Object.keys(userVotesLookup).length;
            const hasVotedOnAll = totalVoted >= totalStatements;

            if (hasVotedOnAll) {
              // User completed all voting - create manager with empty batch for progress calculations
              const manager = new StatementManager(
                [], // Empty batch since all voted
                userVotesLookup,
                fetchedPoll.id,
                dbUser.id,
                totalStatements
              );

              setStatementManager(manager);
              setCurrentStatement(null);

              // Auto-switch to results tab if they have demographics
              if (demographicsResult.success && demographicsResult.data) {
                setActiveTab("results");
              }
            } else {
              // Fix #2: Fetch statement batch (was sequential, now remains separate due to conditional logic)
              // Note: Can't parallelize with votes/progress because we need totalVoted check first
              const batchResult = await getStatementBatchAction(fetchedPoll.id, dbUser.id, currentBatch);

              if (batchResult.success && batchResult.data && batchResult.data.length > 0) {
                const manager = new StatementManager(
                  batchResult.data,
                  userVotesLookup,
                  fetchedPoll.id,
                  dbUser.id,
                  totalStatements
                );

                setStatementManager(manager);
                const nextStmt = manager.getNextStatement();
                setCurrentStatement(nextStmt);
              }
            }
          }
        } else if (contextSessionId) {
          // Anonymous user - load all approved statements for first visit
          setSessionId(contextSessionId);

          // Load all approved statements
          const statementsResult = await getApprovedStatementsByPollIdAction(fetchedPoll.id);

          if (statementsResult.success && statementsResult.data && statementsResult.data.length > 0) {
            // Take first batch of 10 statements
            const firstBatch = statementsResult.data.slice(0, BATCH_SIZE);

            // Create StatementManager with empty votes (anonymous user hasn't voted yet)
            const manager = new StatementManager(
              firstBatch,
              {}, // Empty votes
              fetchedPoll.id,
              '', // No userId yet - will be created on first vote
              statementsResult.data.length
            );

            setStatementManager(manager);
            setCurrentStatement(manager.getNextStatement());
          } else {
            // No statements available
            toast.error("אין עמדות זמינות להצבעה");
          }
        }

      } catch (error) {
        console.error("Error loading poll data:", error);
        toast.error(pollPage.loadError);
      } finally {
        setIsLoading(false);
        hasInitializedRef.current = true;
      }
    };

    loadData();
  }, [params, router, dbUser, contextSessionId, isUserLoading]);

  // Advance to next statement
  const handleNextStatement = useCallback(async () => {
    if (!statementManager) return;

    setShowVoteStats(false);
    setVoteStats(null);

    statementManager.advanceIndex();
    const newProgress = statementManager.getProgress();

    // Check if batch is complete
    const isBatchComplete = newProgress.positionInBatch >= newProgress.statementsInCurrentBatch;

    if (isBatchComplete) {
      // Batch complete - ALWAYS switch to Results tab
      setCurrentStatement(null);

      // Preload next batch in background for smoother UX (fire and forget)
      if (!statementManager.hasVotedOnAll()) {
        statementManager.loadNextBatch().catch(() => {
          // Silent fail - batch will load when user clicks continue
        });
      }

      // Switch to Results tab immediately
      setActiveTab("results");
      toast.success("סיימת סבב! צפה בתוצאות");
    } else {
      // More statements in current batch
      const nextStmt = statementManager.getNextStatement();
      setCurrentStatement(nextStmt);
    }
  }, [statementManager]);

  // Handle vote
  const handleVote = useCallback(async (value: 1 | -1 | 0) => {
    if (isVotingRef.current || !currentStatement || !poll) return;

    // Check for duplicate vote (prevent accidental double-votes)
    if (statementManager && statementManager.hasVotedOn(currentStatement.id)) {
      // User already voted on this statement, skip
      isVotingRef.current = false;
      return;
    }

    // Check if poll is past grace period
    if (poll.endTime) {
      const endTime = new Date(poll.endTime);
      const now = new Date();
      const gracePeriodMs = 10 * 60 * 1000; // 10 minutes
      const graceEndTime = new Date(endTime.getTime() + gracePeriodMs);

      if (now > graceEndTime) {
        toast.error("הסקר נסגר ולא ניתן להצביע יותר");
        setActiveTab("results");
        return;
      }
    }

    isVotingRef.current = true;
    setIsSavingVote(true);

    try {
      // Ensure user exists
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const userResult = await ensureUserExistsAction({
          clerkUserId: dbUser?.clerkUserId || undefined,
          sessionId: sessionId || undefined,
        });

        if (!userResult.success || !userResult.data) {
          toast.error(pollPage.userCreateError);
          return;
        }

        effectiveUserId = userResult.data.id;
        setUserId(effectiveUserId);

        if (statementManager) {
          statementManager.userId = effectiveUserId;
        }
      }

      // Save vote
      const result = await createVoteAction({
        userId: effectiveUserId,
        statementId: currentStatement.id,
        value,
      });

      if (result.success && statementManager) {
        statementManager.recordVote(currentStatement.id, value);

        // Calculate optimistic distribution
        const distribution = calculateOptimisticDistribution(currentStatement.id, value);
        setVoteStats(distribution);
        setShowVoteStats(true);

        // Capture statement ID for async callback
        const statementIdForCache = currentStatement.id;

        // Fix #4: Background fetch actual distribution to update cache for next user
        // Wait for animation to complete before updating cache to prevent flickering
        setTimeout(() => {
          getStatementVoteDistributionAction(statementIdForCache).then(
            (distributionResult) => {
              // Only update if user has moved on (prevents flickering during animation)
              if (currentStatement?.id !== statementIdForCache && distributionResult.success && distributionResult.data) {
                voteDistributionCache.set(statementIdForCache, {
                  agreeCount: distributionResult.data.agreeCount,
                  disagreeCount: distributionResult.data.disagreeCount,
                  unsureCount: distributionResult.data.unsureCount,
                  totalVotes: distributionResult.data.totalVotes,
                  timestamp: Date.now(),
                });
              }
            }
          ).catch((error) => {
            // Log for debugging but don't block UX
            console.warn("Background cache update failed for statement", statementIdForCache, error);
          });
        }, 2000); // Wait for animation + advance delay

        // Gamification: Check for milestones
        const newVotedCount = votedCount + 1;
        const milestoneType = checkMilestone(newVotedCount);

        if (milestoneType) {
          handleMilestone(milestoneType, newVotedCount);
        }

        // Show stats for 1.5 seconds, then advance
        setTimeout(() => {
          handleNextStatement();
        }, 1500);
      } else {
        // Check if statement was deleted/rejected by admin
        if (result.error?.includes("Statement") || result.error?.includes("not found")) {
          toast.error("עמדה זו הוסרה על ידי מנהל הסקר. מדלג לעמדה הבאה...");
          // Skip to next statement
          setTimeout(() => {
            handleNextStatement();
          }, 1500);
        } else {
          toast.error(result.error || pollPage.voteError);
        }
      }
    } catch (error) {
      console.error("Error saving vote:", error);
      toast.error(pollPage.voteError);
    } finally {
      isVotingRef.current = false;
      setIsSavingVote(false);
    }
  }, [currentStatement, poll, statementManager, userId, dbUser?.clerkUserId, sessionId, votedCount, votesRequiredForResults, checkMilestone, handleMilestone, handleNextStatement]);

  // Continue to next batch (called from Results tab "More Statements" prompt)
  // Just switches to Vote tab - useEffect handles retrieving/loading batch
  const handleContinueBatch = useCallback(async () => {
    // Fix #2: Invalidate ref-based cache instead of clearing state
    // This ensures fresh results load after voting more
    resultsCacheRef.current = null;

    // Switch to vote tab - useEffect will handle getting statement from preloaded batch
    setActiveTab("vote");
    toast.success("ממשיך לעמדות נוספות");
  }, []);

  // Load user artifact collection (authenticated users only)
  const loadUserArtifacts = useCallback(async () => {
    if (!userId || !dbUser?.clerkUserId) return [];

    try {
      const result = await getUserArtifactCollectionAction(userId);
      if (result.success && result.data) {
        // Transform database insights into artifact slots
        const artifacts: ArtifactSlot[] = result.data.map((insight) => {
          // Extract emoji from title (client-side regex)
          const emojiMatch = insight.title.match(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{27BF}]/u);
          const emoji = emojiMatch ? emojiMatch[0] : "🌟";
          const profile = insight.title.replace(emoji, "").trim();

          return {
            id: insight.pollId,
            emoji,
            profile,
            rarity: insight.artifactRarity || 'common'
          };
        });

        return artifacts;
      }
      return [];
    } catch (error) {
      console.error("Error loading user artifacts:", error);
      return [];
    }
  }, [userId, dbUser?.clerkUserId]);

  // Load results data
  const loadResultsData = useCallback(async (forceRefresh = false) => {
    console.log("[Results] ===== LOAD RESULTS DATA CALLED =====");
    console.log("[Results] poll:", poll?.id, poll?.slug);
    console.log("[Results] userId:", userId);
    console.log("[Results] isPollClosed:", isPollClosed);
    console.log("[Results] votedCount:", votedCount);
    console.log("[Results] totalStatements:", totalStatements);
    console.log("[Results] forceRefresh:", forceRefresh);

    // For closed polls, allow loading without userId (anonymous users without DB entry)
    if (!poll) {
      console.log("[Results] EARLY EXIT: No poll");
      return;
    }
    if (!isPollClosed && !userId) {
      console.log("[Results] EARLY EXIT: Not closed and no userId");
      return;
    }

    // Fix #2: Check ref-based cache validity
    const cache = resultsCacheRef.current;
    const cacheValid = cache
      && cache.pollId === poll.id
      && cache.votedCount === votedCount
      && Date.now() - cache.timestamp < RESULTS_CACHE_TTL;

    if (cacheValid && !forceRefresh) {
      console.log("[Results] Using ref-based cached data");
      setResultsData(cache.data);
      setIsLoadingResults(false);
      return;
    }

    console.log("[Results] Starting fresh data load...");
    setIsLoadingResults(true);
    try {
      // Check if user is anonymous (no Clerk ID)
      const isAnonymous = !dbUser?.clerkUserId;
      console.log("[Results] isAnonymous:", isAnonymous);
      console.log("[Results] dbUser:", dbUser ? { id: dbUser.id, clerkUserId: dbUser.clerkUserId } : null);

      // Check if user has reached the threshold for insight generation
      // Threshold is 10 votes OR all statements if poll has fewer than 10
      // Also require at least 1 vote (prevent edge case where totalStatements = 0)
      const insightThreshold = Math.min(10, totalStatements);
      const hasReachedInsightThreshold = votedCount > 0 && votedCount >= insightThreshold;
      console.log("[Results] insightThreshold:", insightThreshold);
      console.log("[Results] hasReachedInsightThreshold:", hasReachedInsightThreshold);

      // For anonymous users, check localStorage first (synchronous)
      let insightFromStorage = null;
      if (isAnonymous && hasReachedInsightThreshold) {
        insightFromStorage = getInsightFromStorage(poll.id);
        console.log("[Results] insightFromStorage:", insightFromStorage ? "Found" : "Not found");
      }

      // Quick check: Do we need to generate insight?
      // Set generating state BEFORE waiting for async calls
      // Only generate if user has reached threshold
      if (!insightFromStorage && hasReachedInsightThreshold) {
        console.log("[Results] Will need to generate insight - setting isGeneratingInsight to true");
        // Optimistically assume we'll need to generate
        // Will be corrected if DB has cached version
        setIsGeneratingInsight(true);
      }

      // PROGRESSIVE LOADING: Split into fast and slow data fetches
      // Fast data: ONLY stats (load first, show immediately - <1 second)
      // Slow data: heatmap + insight (load in background - may take 10-300 seconds)

      console.log("[Results] ===== PHASE 1: LOADING FAST DATA (stats only) =====");
      const pollResultsResult = await getPollResultsAction(poll.id);

      console.log("[Results] Fast data loaded!");
      console.log("[Results] pollResultsResult:", pollResultsResult.success ? "Success" : "Failed");

      // Process aggregate stats (so we can show them immediately)
      let stats = null;
      if (pollResultsResult.success && pollResultsResult.data) {
        const resultsData = pollResultsResult.data;
        stats = {
          participantCount: resultsData.totalVoters || 0,
          statementCount: resultsData.statements?.length || 0,
          totalVotes: resultsData.totalVotes || 0
        };
      }

      // SHOW RESULTS IMMEDIATELY (without heatmap or insight)
      console.log("[Results] Setting initial results data (stats only - heatmap loading in background)");
      const initialData = {
        insight: null, // Will be loaded in background
        stats,
        heatmapData: null, // Will be loaded in background
        hasMoreStatements
      };
      setResultsData(initialData);
      setIsLoadingResults(false); // Stop main loading spinner

      // Update cache with initial data
      resultsCacheRef.current = {
        pollId: poll.id,
        votedCount,
        data: initialData,
        timestamp: Date.now()
      };

      // LOAD HEATMAP IN BACKGROUND (with 10-second timeout)
      console.log("[Results] ===== PHASE 1B: LOADING HEATMAP IN BACKGROUND =====");
      (async () => {
        try {
          // Race between heatmap fetch and 10-second timeout
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error("Heatmap timeout")), 10000)
          );

          const heatmapPromise = getAllHeatmapDataAction(poll.id, 3);

          const allHeatmapData = await Promise.race([heatmapPromise, timeoutPromise]) as Awaited<ReturnType<typeof getAllHeatmapDataAction>>;

          console.log("[Results] Heatmap loaded successfully!");

          // Process heatmap data
          const heatmapData = allHeatmapData.success && allHeatmapData.data
            ? allHeatmapData.data
            : { gender: [], ageGroup: [], ethnicity: [], politicalParty: [] };

          // Update results with heatmap
          setResultsData(prev => prev ? { ...prev, heatmapData } : prev);
          if (resultsCacheRef.current) {
            resultsCacheRef.current.data.heatmapData = heatmapData;
          }
        } catch (error) {
          console.warn("[Results] Heatmap failed to load (timeout or error):", error);
          // Set empty heatmap data so UI knows it failed
          const emptyHeatmap = { gender: [], ageGroup: [], ethnicity: [], politicalParty: [] };
          setResultsData(prev => prev ? { ...prev, heatmapData: emptyHeatmap } : prev);
          if (resultsCacheRef.current) {
            resultsCacheRef.current.data.heatmapData = emptyHeatmap;
          }
        }
      })();

      console.log("[Results] ===== PHASE 2: LOADING INSIGHT IN BACKGROUND =====");

      // Process insight (check localStorage for anonymous, DB for authenticated, then generate if needed)
      let insight: { emoji: string; profile: string; description: string } | null = null;

      // Load insight in background (don't wait for it)
      if (insightFromStorage) {
        console.log("[Results] Using localStorage insight");
        // ✅ Anonymous user with localStorage insight
        const emojiMatch = insightFromStorage.title.match(/^([^\s]+)\s+(.+)$/);
        insight = {
          emoji: emojiMatch ? emojiMatch[1] : "🌟",
          profile: emojiMatch ? emojiMatch[2] : insightFromStorage.title,
          description: insightFromStorage.body
        };
        setIsGeneratingInsight(false);

        // Update results data with insight
        setResultsData(prev => ({ ...prev, insight }));
        if (resultsCacheRef.current) {
          resultsCacheRef.current.data.insight = insight;
        }

        console.log("[Results] Insight from localStorage loaded");
      } else if (hasReachedInsightThreshold && userId) {
        // Load insight asynchronously (in background)
        console.log("[Results] Loading insight in background...");

        // Start background load (don't await)
        (async () => {
          try {
            // OPTIMIZATION: Anonymous users don't have insights in DB
            // Skip the DB check for anonymous users to avoid auth error and delay
            if (isAnonymous) {
              console.log("[Results] Anonymous user - skipping DB check, generating new insight...");
              // Generate new insight directly
              setInsightError(null);

              const generateStartTime = Date.now();
              const generateResult = await generateAndSaveInsightAction(userId, poll.id);
              const generateDuration = Date.now() - generateStartTime;
              console.log("[Results] generateAndSaveInsightAction completed in", generateDuration, "ms");

              if (generateResult.success && 'data' in generateResult) {
                console.log("[Results] ✅ Insight generated successfully!");
                const emojiMatch = generateResult.data.title.match(/^([^\s]+)\s+(.+)$/);

                const generatedInsight = {
                  emoji: emojiMatch ? emojiMatch[1] : "💡",
                  profile: emojiMatch ? emojiMatch[2] : generateResult.data.title,
                  description: generateResult.data.body
                };

                setResultsData(prev => ({ ...prev, insight: generatedInsight }));
                if (resultsCacheRef.current) {
                  resultsCacheRef.current.data.insight = generatedInsight;
                }

                // Save to localStorage for anonymous users
                saveInsightToStorage(poll.id, poll.question, generateResult.data.title, generateResult.data.body);
              } else {
                const errorMsg = 'error' in generateResult ? generateResult.error : "Failed to generate insight";
                console.error("[Results] ❌ Generation failed:", errorMsg);
                setInsightError(errorMsg);
              }

              setIsGeneratingInsight(false);
              return; // Exit early for anonymous users
            }

            // AUTHENTICATED USERS: First try to fetch existing insight from DB
            console.log("[Results] Authenticated user - checking for existing insight in DB...");
            const insightResult = await getUserPollInsightAction(userId, poll.id);

            if (insightResult.success && insightResult.data) {
              console.log("[Results] ✅ Found existing insight in DB");
              const { title, body } = insightResult.data;
              const dbIsNew = insightResult.data.isNewArtifact as boolean | undefined;
              const emojiMatch = title.match(/^([^\s]+)\s+(.+)$/);

              const loadedInsight = {
                emoji: emojiMatch ? emojiMatch[1] : "🌟",
                profile: emojiMatch ? emojiMatch[2] : title,
                description: body
              };

              setIsGeneratingInsight(false);
              setResultsData(prev => ({ ...prev, insight: loadedInsight }));
              if (resultsCacheRef.current) {
                resultsCacheRef.current.data.insight = loadedInsight;
              }

              // Set artifact badge if it's new
              if (!isAnonymous && dbIsNew) {
                setNewlyEarnedArtifact({
                  emoji: loadedInsight.emoji,
                  profile: loadedInsight.profile
                });
              }
            } else {
              // No existing insight - generate new one
              console.log("[Results] No existing insight - generating new one...");
              setInsightError(null);

              const generateStartTime = Date.now();
              const generateResult = await generateAndSaveInsightAction(userId, poll.id);
              const generateDuration = Date.now() - generateStartTime;
              console.log("[Results] generateAndSaveInsightAction completed in", generateDuration, "ms");

              if (generateResult.success && 'data' in generateResult) {
                console.log("[Results] ✅ Insight generated successfully!");
                const emojiMatch = generateResult.data.title.match(/^([^\s]+)\s+(.+)$/);

                const generatedInsight = {
                  emoji: emojiMatch ? emojiMatch[1] : "💡",
                  profile: emojiMatch ? emojiMatch[2] : generateResult.data.title,
                  description: generateResult.data.body
                };

                setResultsData(prev => ({ ...prev, insight: generatedInsight }));
                if (resultsCacheRef.current) {
                  resultsCacheRef.current.data.insight = generatedInsight;
                }

                // Save to localStorage for anonymous users
                if (isAnonymous) {
                  saveInsightToStorage(poll.id, poll.question, generateResult.data.title, generateResult.data.body);
                }

                // Set artifact badge for authenticated users
                if (!isAnonymous) {
                  setNewlyEarnedArtifact({
                    emoji: generatedInsight.emoji,
                    profile: generatedInsight.profile
                  });
                }
              } else {
                const errorMsg = 'error' in generateResult ? generateResult.error : "Failed to generate insight";
                console.error("[Results] ❌ Generation failed:", errorMsg);
                setInsightError(errorMsg);
              }
            }
          } catch (error) {
            console.error("[Results] ❌ ERROR loading insight:", error);
            const errorMessage = error instanceof Error ? error.message : "לא הצלחנו ליצור תובנה אישית";
            setInsightError(errorMessage);
          } finally {
            setIsGeneratingInsight(false);
          }
        })();
      } else {
        console.log("[Results] No insight needed (threshold not reached or no userId)");
        setIsGeneratingInsight(false);
      }

      // Load artifacts in background (don't block)
      if (userId) {
        loadUserArtifacts().then(artifacts => {
          setUserArtifacts(artifacts);
        }).catch(error => {
          console.error("[Results] Error loading artifacts:", error);
        });
      }

      console.log("[Results] ===== RESULTS LOADED SUCCESSFULLY (stats & heatmap shown, insight loading in background) =====");
    } catch (error) {
      console.error("[Results] ❌ FATAL ERROR in loadResultsData:", error);
      console.error("[Results] Error stack:", error instanceof Error ? error.stack : "No stack");
      toast.error("שגיאה בטעינת תוצאות");
      setIsLoadingResults(false);
    }
  }, [poll?.id, userId, hasMoreStatements, dbUser?.clerkUserId, loadUserArtifacts, votedCount, totalStatements, isPollClosed]);

  // Auto-load results when Results tab becomes active
  // For closed polls, skip the results locked and demographics checks
  // Also allow results loading without userId for closed polls (anonymous users without DB entry)
  useEffect(() => {
    const canLoadResults = isPollClosed
      ? (activeTab === "results" && poll) // Remove userId requirement for closed polls
      : (activeTab === "results" && !resultsLocked && hasDemographics && poll && userId);

    if (canLoadResults) {
      // Load results data when switching to results tab
      loadResultsData().catch((error) => {
        console.error("Error loading results:", error);
        toast.error("שגיאה בטעינת תוצאות");
      });
    }
  }, [activeTab, resultsLocked, hasDemographics, poll, userId, isPollClosed, loadResultsData]);

  // Handle tab change
  const handleTabChange = useCallback((tab: TabType) => {
    if (tab === "results") {
      // For closed polls, always allow viewing results
      if (!isPollClosed && resultsLocked) {
        toast.warning(pollPage.resultsLockedToast);
        return;
      }

      // Allow switch to results tab even without demographics
      // useEffect will automatically open the demographics modal (unless closed)
      setActiveTab("results");
      return;
    }

    // Prevent switching to vote tab if poll is closed (after grace period)
    if (tab === "vote" && isPollClosed && !inGracePeriod) {
      toast.error("הסקר נסגר ולא ניתן להצביע יותר");
      return;
    }

    // Switch tab (useEffect will handle loading results data)
    setActiveTab(tab);
  }, [isPollClosed, resultsLocked, inGracePeriod]);

  // Handle demographics submission
  const handleDemographicsSubmit = useCallback(async (demographics: DemographicsData) => {
    try {
      const result = await saveDemographicsAction({
        clerkUserId: dbUser?.clerkUserId || undefined,
        sessionId: sessionId || undefined,
        demographics,
      });

      if (result.success && result.data) {
        if (!userId) {
          setUserId(result.data.id);
        }
        setHasDemographics(true);
        setShowDemographicsModal(false);
        toast.success(pollPage.demographicsSaved);

        // Switch to results tab
        setActiveTab("results");
      } else {
        toast.error(result.error || pollPage.demographicsError);
      }
    } catch (error) {
      console.error("Error submitting demographics:", error);
      toast.error(pollPage.demographicsError);
    }
  }, [dbUser?.clerkUserId, sessionId, userId]);

  // Handle artifact badge dismissal
  const handleDismissNewBadge = useCallback(async () => {
    setNewlyEarnedArtifact(null);

    // Mark artifact as seen in database (fire and forget)
    if (userId && poll) {
      markArtifactAsSeenAction(userId, poll.id).catch((error) => {
        console.error("Error marking artifact as seen:", error);
      });
    }
  }, [userId, poll]);

  // Handle "Sign Up" button in collection footer (anonymous users)
  const handleSignUpFromCollection = useCallback(() => {
    openSignUp();
  }, [openSignUp]);

  // Handle "Earn More" button in collection footer (authenticated users)
  const handleEarnMore = useCallback(() => {
    router.push("/polls");
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colors.background.page.className}`}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-white" />
          <p className="text-white">{pollPage.loading}</p>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${colors.background.page.className}`}>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">{pollPage.pollNotFound}</h1>
          <Button asChild className="bg-white text-primary-900 hover:bg-white-90">
            <Link href="/polls">{pollPage.backToPolls}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background.page.className}`}>
      {/* Gamification: Encouragement Toast */}
      <EncouragementToast
        message={encouragementMessage}
        isVisible={showEncouragement}
        onDismiss={() => setShowEncouragement(false)}
      />

      {/* Sticky Back Button Header */}
      <header className="sticky top-0 z-50 bg-gradient-header border-b border-primary-500-20">
        <div className="container mx-auto px-4 py-4 sm:py-3">
          <Button
            variant="ghost"
            size="default"
            onClick={() => router.push("/polls")}
            className="text-white hover-bg-primary-700 hover:text-white flex items-center gap-2 min-h-[44px] px-4"
          >
            <ArrowRight className="w-5 h-5" />
            חזרה לכל הסקרים
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Poll Header - Question and Description */}
        <div className="text-center mb-4 sm:mb-6 px-4">
          <div className="text-5xl sm:text-5xl mb-2 sm:mb-3">{poll.emoji || '📊'}</div>
          <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{poll.question}</h1>
            {isPollClosed && (
              <span className="bg-status-error text-white text-xs font-bold px-2 py-1 rounded">סגור</span>
            )}
          </div>
          {poll.description && (
            <p className="text-primary-200 text-sm sm:text-base">{poll.description}</p>
          )}
        </div>

        {/* Tab Navigation - show during grace period, hide after */}
        {(!isPollClosed || inGracePeriod) && (
          <div className="mb-8">
            <TabNavigation
              activeTab={activeTab}
              onTabChange={handleTabChange}
              resultsLocked={resultsLocked}
              votesCompleted={votedCount}
              votesRequired={votesRequiredForResults}
            />
          </div>
        )}

        {/* Vote Tab */}
        {activeTab === "vote" && (
          <div className="space-y-6">
            {/* Progress Segments */}
            {progress && (
              <ProgressSegments
                total={progress.statementsInCurrentBatch}
                current={progress.positionInBatch}
                showStats={showVoteStats}
              />
            )}

            {/* Voting Interface */}
            <AnimatePresence mode="wait">
              {showStatementModal ? (
                <StatementSubmissionModal
                  key="statement-submission"
                  open={showStatementModal}
                  onOpenChange={setShowStatementModal}
                  pollId={poll.id}
                  pollTitle={poll.question}
                  userId={userId}
                  autoApprove={poll.autoApproveStatements}
                  onUserCreated={(newUserId) => {
                    setUserId(newUserId);
                    if (statementManager) {
                      statementManager.userId = newUserId;
                    }
                  }}
                />
              ) : currentStatement ? (
                <div className="relative" key={currentStatement.id}>
                  {/* Static visual glow for prominence - uses design token colors */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary-purple-500/5 via-primary-pink-500/5 to-primary-purple-500/5 rounded-2xl blur-xl -z-10"
                       style={{
                         background: 'radial-gradient(circle at 50% 50%, rgba(147, 51, 234, 0.08), rgba(219, 39, 119, 0.08), transparent)'
                       }}
                  />
                  <SplitVoteCard
                    statementText={currentStatement.text}
                    onVote={handleVote}
                    onAddStatement={() => setShowStatementModal(true)}
                    showStats={showVoteStats}
                    agreePercent={voteStats?.agreePercent}
                    disagreePercent={voteStats?.disagreePercent}
                    passPercent={voteStats?.passPercent}
                    disabled={isSavingVote}
                    allowAddStatement={poll?.allowUserStatements || false}
                    showAddButtonPulse={showAddButtonPulse}
                  />
                </div>
              ) : !hasMoreStatements ? (
                <div key="voting-finished" className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-completion rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">הצבעת על הכל!</h3>
                  <p className="text-gray-600 mb-6">תודה על השתתפותך המלאה</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => handleTabChange("results")}
                      className="px-6 py-3 bg-gradient-poll-header text-white font-bold rounded-xl hover:shadow-xl transition-shadow"
                    >
                      צפו בתוצאות
                    </button>
                    {poll.allowUserStatements && (
                      <button
                        onClick={() => setShowStatementModal(true)}
                        className="px-6 py-3 btn-primary text-white font-bold rounded-xl hover:shadow-xl transition-all"
                      >
                        {results.addStatementButton}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div key="loading-next" className="bg-white rounded-3xl shadow-xl p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
                  <p className="text-gray-600">טוען עמדות...</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Results Tab */}
        {activeTab === "results" && (
          <div className="space-y-6">
            {/* Closed Poll Banner - show first if poll is closed */}
            {isPollClosed && (
              <ClosedPollBanner closedDate={poll.endTime?.toString()} />
            )}

            {/* Partial Participation Banner - show if user voted on some but not all statements */}
            {isPollClosed && votedCount > 0 && votedCount < totalStatements && (
              <PartialParticipationBanner
                votedCount={votedCount}
                totalStatements={totalStatements}
              />
            )}

            {/* Results locked banner - skip if poll is closed */}
            {!isPollClosed && resultsLocked ? (
              <ResultsLockedBanner
                votesCompleted={votedCount}
                votesRequired={votesRequiredForResults}
                onGoToVote={() => setActiveTab("vote")}
              />
            ) : !isPollClosed && !hasDemographics ? (
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
                <p className="text-gray-600">אנא מלא פרטים דמוגרפיים...</p>
              </div>
            ) : isLoadingResults ? (
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary-600" />
                <p className="text-gray-600">טוען תוצאות...</p>
              </div>
            ) : (
              <>
                {/* Personal Insight Card - with loading and error states */}
                {isGeneratingInsight ? (
                  <div className="bg-gradient-insight rounded-2xl p-6 sm:p-8 shadow-2xl text-white text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium">מייצר לך תובנה אישית...</p>
                    <p className="text-sm text-primary-200 mt-2">זה יכול לקחת כמה שניות</p>
                  </div>
                ) : insightError ? (
                  <div className="bg-gradient-error rounded-2xl p-6 sm:p-8 shadow-2xl text-white text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold mb-2">שגיאה ביצירת תובנה</h3>
                    <p className="text-white-80 mb-6">{insightError}</p>
                    <button
                      onClick={() => loadResultsData()}
                      className="bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:bg-white-95 transition-colors shadow-lg"
                    >
                      נסה שוב
                    </button>
                  </div>
                ) : resultsData.insight ? (
                  <InsightCard
                    profile={resultsData.insight.profile}
                    emoji={resultsData.insight.emoji}
                    description={resultsData.insight.description}
                    pollSlug={poll.slug}
                    pollQuestion={poll.question}
                    showSignUpPrompt={!dbUser?.clerkUserId}
                    isAuthenticated={!!dbUser?.clerkUserId}
                    artifacts={userArtifacts}
                    userId={userId || undefined}
                    currentPollId={poll.id}
                    newlyEarned={newlyEarnedArtifact || undefined}
                    onDismissNewBadge={handleDismissNewBadge}
                    onSignUp={handleSignUpFromCollection}
                    onEarnMore={handleEarnMore}
                  />
                ) : null}

                {/* More Statements or Voting Complete - hide for closed polls */}
                {!isPollClosed && (
                  <>
                    {hasMoreStatements ? (
                      <MoreStatementsPrompt
                        remainingStatements={totalStatements - votedCount}
                        onContinue={handleContinueBatch}
                      />
                    ) : (
                      <VotingCompleteBanner
                        pollSlug={poll.slug}
                        pollQuestion={poll.question}
                      />
                    )}
                  </>
                )}

                {/* Aggregate Stats */}
                {resultsData.stats && (
                  <AggregateStats
                    participantCount={resultsData.stats.participantCount}
                    statementCount={resultsData.stats.statementCount}
                    totalVotes={resultsData.stats.totalVotes}
                  />
                )}

                {/* Demographic Heatmap */}
                {resultsData.heatmapData ? (
                  <DemographicHeatmap
                    pollId={poll.id}
                    data={resultsData.heatmapData}
                    isLoading={false}
                  />
                ) : (
                  <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
                    <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">
                      {results.heatmapTitle}
                    </h3>
                    <div className="text-center py-12 text-gray-500">
                      <p>טוען נתוני חום דמוגרפיים...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Demographics Modal */}
      <DemographicsModal
        open={showDemographicsModal}
        onSubmit={handleDemographicsSubmit}
      />
    </div>
  );
}

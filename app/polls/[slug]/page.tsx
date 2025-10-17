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
import { useClerk } from "@clerk/nextjs";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowRight } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";

// v2.0 Components
import { TabNavigation } from "@/components/polls-v2/tab-navigation";
import { SplitVoteCard } from "@/components/voting-v2/split-vote-card";
import { ProgressSegments } from "@/components/voting-v2/progress-segments";
import { ResultsLockedBanner } from "@/components/banners/results-locked-banner";
import { ClosedPollBanner } from "@/components/banners/closed-poll-banner";
import { PartialParticipationBanner } from "@/components/banners/partial-participation-banner";
import { DemographicsModal, type DemographicsData } from "@/components/polls/demographics-modal";
import { InsightCard } from "@/components/results-v2/insight-card";
import { AggregateStats } from "@/components/results-v2/aggregate-stats";
import { DemographicHeatmap } from "@/components/results-v2/demographic-heatmap";
import { MoreStatementsPrompt } from "@/components/results-v2/more-statements-prompt";
import { VotingCompleteBanner } from "@/components/results-v2/voting-complete-banner";
import { StatementSubmissionModal } from "@/components/voting/statement-submission-modal";
// Note: NextBatchPrompt removed - using MoreStatementsPrompt in Results tab instead

// Actions
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getStatementBatchAction, getVotingProgressAction, getUserVotesForPollAction, createVoteAction, getStatementVoteDistributionAction } from "@/actions/votes-actions";
import { getApprovedStatementsByPollIdAction } from "@/actions/statements-actions";
import { saveDemographicsAction, getUserDemographicsByIdAction } from "@/actions/user-demographics-actions";
import { ensureUserExistsAction } from "@/actions/users-actions";
import { getUserPollInsightAction, generateAndSaveInsightAction, getUserArtifactCollectionAction, markArtifactAsSeenAction } from "@/actions/user-poll-insights-actions";
import { getPollResultsAction } from "@/actions/poll-results-actions";
import { getHeatmapDataAction } from "@/actions/heatmap-actions";
import type { HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";
import type { ArtifactSlot } from "@/components/results-v2/minimal-collection-footer";

// Services & Utils
import { StatementManager } from "@/lib/services/statement-manager";
import { colors } from "@/lib/design-tokens-v2";
import { pollPage, results } from "@/lib/strings/he";
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
}

interface CombinedPollPageProps {
  params: Promise<{
    slug: string;
  }>;
}

type TabType = "vote" | "results";

const BATCH_SIZE = 10;

// Vote distribution cache for optimistic updates
const voteDistributionCache = new Map<string, {
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  totalVotes: number;
  timestamp: number;
}>();

function calculateOptimisticDistribution(
  statementId: string,
  userVote: 1 | 0 | -1
): {
  agreePercent: number;
  disagreePercent: number;
  passPercent: number;
} {
  const cached = voteDistributionCache.get(statementId);
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

  // Demographics state
  const [hasDemographics, setHasDemographics] = useState(false);
  const [showDemographicsModal, setShowDemographicsModal] = useState(false);

  // Statement submission modal state
  const [showStatementModal, setShowStatementModal] = useState(false);

  // Results state
  const [resultsData, setResultsData] = useState<{
    insight: { profile: string; emoji: string; description: string } | null;
    stats: { participantCount: number; statementCount: number; totalVotes: number } | null;
    heatmapData: Record<"gender" | "ageGroup" | "ethnicity" | "politicalParty", HeatmapStatementData[]>;
    hasMoreStatements: boolean;
  }>({
    insight: null,
    stats: null,
    heatmapData: {
      gender: [],
      ageGroup: [],
      ethnicity: [],
      politicalParty: []
    },
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
    if (currentStatement) {
      const statementId = currentStatement.id;

      // Check if already cached
      if (!voteDistributionCache.has(statementId)) {
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
        }).catch(() => {
          // Silent fail - cache will start from zero if needed
        });
      }
    }
  }, [currentStatement]);

  // Auto-open demographics modal when Results tab is accessed without demographics
  // Skip this for closed polls (no demographics required)
  useEffect(() => {
    if (activeTab === "results" && !resultsLocked && !hasDemographics && !isPollClosed) {
      setShowDemographicsModal(true);
    }
  }, [activeTab, resultsLocked, hasDemographics, isPollClosed]);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, resultsLocked, hasDemographics, poll?.id, userId, isPollClosed]);

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

          // Load user's votes and progress
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
              // User has more statements to vote on - load batch normally
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

  // Handle vote
  const handleVote = async (value: 1 | -1 | 0) => {
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

        // Background fetch actual distribution to update cache for next user
        // (fire-and-forget, doesn't block UI)
        getStatementVoteDistributionAction(statementIdForCache).then(
          (distributionResult) => {
            if (distributionResult.success && distributionResult.data) {
              // Update cache with real data for next time
              voteDistributionCache.set(statementIdForCache, {
                agreeCount: distributionResult.data.agreeCount,
                disagreeCount: distributionResult.data.disagreeCount,
                unsureCount: distributionResult.data.unsureCount,
                totalVotes: distributionResult.data.totalVotes,
                timestamp: Date.now(),
              });
            }
          }
        ).catch(() => {
          // Silent fail - cache update is not critical
        });

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
  };

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

  // Continue to next batch (called from Results tab "More Statements" prompt)
  // Just switches to Vote tab - useEffect handles retrieving/loading batch
  const handleContinueBatch = async () => {
    // Reset results cache to force fresh load after user votes more
    setResultsData({
      insight: null,
      stats: null,
      heatmapData: {
        gender: [],
        ageGroup: [],
        ethnicity: [],
        politicalParty: []
      },
      hasMoreStatements: false
    });

    // Switch to vote tab - useEffect will handle getting statement from preloaded batch
    setActiveTab("vote");
    toast.success("ממשיך לעמדות נוספות");
  };

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
    // For closed polls, allow loading without userId (anonymous users without DB entry)
    if (!poll) return;
    if (!isPollClosed && !userId) return;

    // Skip if already loaded and not forcing refresh (caching)
    if (resultsData.insight && !forceRefresh) {
      console.log("[Results] Using cached data");
      return;
    }

    setIsLoadingResults(true);
    try {
      // Check if user is anonymous (no Clerk ID)
      const isAnonymous = !dbUser?.clerkUserId;

      // Check if user has reached the threshold for insight generation
      // Threshold is 10 votes OR all statements if poll has fewer than 10
      // Also require at least 1 vote (prevent edge case where totalStatements = 0)
      const insightThreshold = Math.min(10, totalStatements);
      const hasReachedInsightThreshold = votedCount > 0 && votedCount >= insightThreshold;

      // For anonymous users, check localStorage first (synchronous)
      let insightFromStorage = null;
      if (isAnonymous && hasReachedInsightThreshold) {
        insightFromStorage = getInsightFromStorage(poll.id);
      }

      // Quick check: Do we need to generate insight?
      // Set generating state BEFORE waiting for async calls
      // Only generate if user has reached threshold
      if (!insightFromStorage && hasReachedInsightThreshold) {
        // Optimistically assume we'll need to generate
        // Will be corrected if DB has cached version
        setIsGeneratingInsight(true);
      }

      // For users below threshold, don't fetch insight (but still fetch aggregate stats for closed polls)
      // For closed polls, always fetch aggregate stats/heatmap regardless of vote count
      const shouldFetchInsight = hasReachedInsightThreshold && userId;
      const [insightResult, pollResultsResult, genderHeatmap, ageHeatmap, ethnicityHeatmap, politicsHeatmap, artifacts] = await Promise.all([
        shouldFetchInsight ? getUserPollInsightAction(userId, poll.id) : Promise.resolve({ success: false, data: null }),
        getPollResultsAction(poll.id),
        getHeatmapDataAction(poll.id, "gender", 3),
        getHeatmapDataAction(poll.id, "ageGroup", 3),
        getHeatmapDataAction(poll.id, "ethnicity", 3),
        getHeatmapDataAction(poll.id, "politicalParty", 3),
        userId ? loadUserArtifacts() : Promise.resolve([])
      ]);

      // Update artifacts state
      setUserArtifacts(artifacts);

      // Process insight (check localStorage for anonymous, DB for authenticated, then generate if needed)
      let insight = null;
      let isNewArtifact = false;
      if (insightFromStorage) {
        // ✅ Anonymous user with localStorage insight
        const emojiMatch = insightFromStorage.title.match(/^([^\s]+)\s+(.+)$/);
        insight = {
          emoji: emojiMatch ? emojiMatch[1] : "🌟",
          profile: emojiMatch ? emojiMatch[2] : insightFromStorage.title,
          description: insightFromStorage.body
        };
        setIsGeneratingInsight(false); // Turn off since we have cached version
      } else if (insightResult.success && insightResult.data) {
        // ✅ Insight exists in DB - use cached version
        const { title, body } = insightResult.data;
        const dbIsNew = insightResult.data.isNewArtifact as boolean | undefined;

        // Extract emoji from title using regex: "🌟 משתנה חברתי" -> emoji: "🌟", profile: "משתנה חברתי"
        const emojiMatch = title.match(/^([^\s]+)\s+(.+)$/);

        insight = {
          emoji: emojiMatch ? emojiMatch[1] : "🌟",
          profile: emojiMatch ? emojiMatch[2] : title,
          description: body
        };
        isNewArtifact = dbIsNew || false;
        setIsGeneratingInsight(false); // Turn off since we have cached version
      } else if (userId && hasReachedInsightThreshold) {
        // ❌ No insight in DB/localStorage - generate using AIService and save
        // Only attempt if user has userId (skip for anonymous without DB entry)
        // isGeneratingInsight already set to true above
        setInsightError(null);

        try {
          const generateResult = await generateAndSaveInsightAction(userId, poll.id);

          if (generateResult.success && generateResult.data) {
            // Extract emoji from generated title
            const emojiMatch = generateResult.data.title.match(/^([^\s]+)\s+(.+)$/);

            insight = {
              emoji: emojiMatch ? emojiMatch[1] : "💡",
              profile: emojiMatch ? emojiMatch[2] : generateResult.data.title,
              description: generateResult.data.body
            };

            // Newly generated insights are always "new" for authenticated users
            isNewArtifact = !isAnonymous;

            // Save to localStorage for anonymous users
            if (isAnonymous) {
              saveInsightToStorage(
                poll.id,
                poll.question,
                generateResult.data.title,
                generateResult.data.body
              );
              console.log("[PollPage] Saved insight to localStorage for anonymous user");
            }
          } else {
            throw new Error(generateResult.error || "Failed to generate insight");
          }
        } catch (error) {
          console.error("Error generating insight:", error);
          const errorMessage = error instanceof Error ? error.message : "לא הצלחנו ליצור תובנה אישית";
          setInsightError(errorMessage);
          // Don't set insight - will show error state in UI
        } finally {
          setIsGeneratingInsight(false);
        }
      }

      // Set newly earned artifact badge for authenticated users (first view only)
      if (!isAnonymous && isNewArtifact && insight) {
        setNewlyEarnedArtifact({
          emoji: insight.emoji,
          profile: insight.profile
        });
      }

      // Process aggregate stats
      let stats = null;
      if (pollResultsResult.success && pollResultsResult.data) {
        const resultsData = pollResultsResult.data;
        stats = {
          participantCount: resultsData.totalVoters || 0,
          statementCount: resultsData.statements?.length || 0,
          totalVotes: resultsData.totalVotes || 0
        };
      }

      // Process heatmap data
      const heatmapData = {
        gender: genderHeatmap.success && genderHeatmap.data ? genderHeatmap.data : [],
        ageGroup: ageHeatmap.success && ageHeatmap.data ? ageHeatmap.data : [],
        ethnicity: ethnicityHeatmap.success && ethnicityHeatmap.data ? ethnicityHeatmap.data : [],
        politicalParty: politicsHeatmap.success && politicsHeatmap.data ? politicsHeatmap.data : []
      };

      setResultsData({
        insight,
        stats,
        heatmapData,
        hasMoreStatements
      });
    } catch (error) {
      console.error("Error loading results:", error);
      toast.error("שגיאה בטעינת תוצאות");
    } finally {
      setIsLoadingResults(false);
    }
  }, [poll, userId, hasMoreStatements, dbUser?.clerkUserId, resultsData.insight, loadUserArtifacts, votedCount, totalStatements, isPollClosed]);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
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
  };

  // Handle demographics submission
  const handleDemographicsSubmit = async (demographics: DemographicsData) => {
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
  };

  // Handle artifact badge dismissal
  const handleDismissNewBadge = async () => {
    setNewlyEarnedArtifact(null);

    // Mark artifact as seen in database (fire and forget)
    if (userId && poll) {
      markArtifactAsSeenAction(userId, poll.id).catch((error) => {
        console.error("Error marking artifact as seen:", error);
      });
    }
  };

  // Handle "Sign Up" button in collection footer (anonymous users)
  const handleSignUpFromCollection = () => {
    openSignUp();
  };

  // Handle "Earn More" button in collection footer (authenticated users)
  const handleEarnMore = () => {
    router.push("/polls");
  };

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
          <Button asChild className="bg-white text-purple-900 hover:bg-white/90">
            <Link href="/polls">{pollPage.backToPolls}</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${colors.background.page.className}`}>
      {/* Sticky Back Button Header */}
      <header className="sticky top-0 z-50 bg-gradient-to-r from-purple-900/80 via-purple-800/60 to-purple-900/80 backdrop-blur-md border-b border-purple-500/20">
        <div className="container mx-auto px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/polls")}
            className="text-white hover:bg-purple-700/50 hover:text-white flex items-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה לכל הסקרים
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Poll Header - Question and Description */}
        <div className="text-center mb-6">
          <div className="text-4xl sm:text-5xl mb-2 sm:mb-3">📊</div>
          <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{poll.question}</h1>
            {isPollClosed && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">סגור</span>
            )}
          </div>
          {poll.description && (
            <p className="text-purple-200 text-sm sm:text-base">{poll.description}</p>
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
                current={progress.positionInBatch - 1}
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
                <SplitVoteCard
                  key={currentStatement.id}
                  statementText={currentStatement.text}
                  onVote={handleVote}
                  onAddStatement={() => setShowStatementModal(true)}
                  showStats={showVoteStats}
                  agreePercent={voteStats?.agreePercent}
                  disagreePercent={voteStats?.disagreePercent}
                  passPercent={voteStats?.passPercent}
                  disabled={isSavingVote}
                  allowAddStatement={poll?.allowUserStatements || false}
                />
              ) : !hasMoreStatements ? (
                <div key="voting-finished" className="bg-white rounded-3xl shadow-2xl p-8 text-center">
                  <div className="w-16 h-16 mx-auto bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">הצבעת על הכל!</h3>
                  <p className="text-gray-600 mb-6">תודה על השתתפותך המלאה</p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => handleTabChange("results")}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold rounded-xl hover:shadow-xl transition-shadow"
                    >
                      צפו בתוצאות
                    </button>
                    {poll.allowUserStatements && (
                      <button
                        onClick={() => setShowStatementModal(true)}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl hover:shadow-xl transition-all"
                      >
                        {results.addStatementButton}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div key="loading-next" className="bg-white rounded-3xl shadow-xl p-8 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
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
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">אנא מלא פרטים דמוגרפיים...</p>
              </div>
            ) : isLoadingResults ? (
              <div className="bg-white rounded-3xl shadow-xl p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                <p className="text-gray-600">טוען תוצאות...</p>
              </div>
            ) : (
              <>
                {/* Personal Insight Card - with loading and error states */}
                {isGeneratingInsight ? (
                  <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 shadow-2xl text-white text-center">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium">מייצר לך תובנה אישית...</p>
                    <p className="text-sm text-purple-200 mt-2">זה יכול לקחת כמה שניות</p>
                  </div>
                ) : insightError ? (
                  <div className="bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 rounded-2xl p-6 sm:p-8 shadow-2xl text-white text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h3 className="text-xl font-bold mb-2">שגיאה ביצירת תובנה</h3>
                    <p className="text-purple-100 mb-6">{insightError}</p>
                    <button
                      onClick={() => loadResultsData()}
                      className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors shadow-lg"
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
                <DemographicHeatmap
                  pollId={poll.id}
                  data={resultsData.heatmapData}
                  isLoading={false}
                />
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

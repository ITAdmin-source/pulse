"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2, Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useHeader } from "@/contexts/header-context";
import {
  StatementCard,
  ProgressBar,
  VoteResultOverlay,
  ContinuationPage,
  StatementSubmissionModal,
} from "@/components/voting";
import { DemographicsModal, type DemographicsData } from "@/components/polls/demographics-modal";
import { getPollBySlugAction } from "@/actions/polls-actions";
import { getApprovedStatementsByPollIdAction } from "@/actions/statements-actions";
import { createVoteAction, getStatementVoteDistributionAction, getVoteByUserAndStatementAction, getStatementBatchAction, getVotingProgressAction, getUserVotesForPollAction } from "@/actions/votes-actions";
import { saveDemographicsAction, getUserDemographicsByIdAction } from "@/actions/user-demographics-actions";
import { ensureUserExistsAction } from "@/actions/users-actions";
import { toast } from "sonner";
import { StatementManager } from "@/lib/services/statement-manager";
import { OfflineVoteQueue } from "@/lib/utils/offline-queue";

interface Statement {
  id: string;
  text: string;
  pollId: string | null;
  voteDistribution?: {
    agreeCount: number;
    disagreeCount: number;
    unsureCount: number;
    totalVotes: number;
    agreePercent: number;
    disagreePercent: number;
    unsurePercent: number;
  };
}

interface VotingPageProps {
  params: Promise<{
    slug: string;
  }>;
}

const BATCH_SIZE = 10;

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

export default function VotingPage({ params }: VotingPageProps) {
  const router = useRouter();
  const { user: dbUser, sessionId: contextSessionId, isLoading: isUserLoading } = useCurrentUser();
  const { setConfig, resetConfig } = useHeader();

  // Core app state
  const [poll, setPoll] = useState<Poll | null>(null);
  const [statementManager, setStatementManager] = useState<StatementManager | null>(null);
  const [totalStatementsInPoll, setTotalStatementsInPoll] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [isPreloading, setIsPreloading] = useState(false);

  // Modal states
  const [showDemographicsModal, setShowDemographicsModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [batchLoadError, setBatchLoadError] = useState<string | null>(null);

  // Voting lock - prevents concurrent vote processing
  const isVotingRef = useRef(false);

  // Initialization flag - prevents loadData from re-running during voting
  const hasInitializedRef = useRef(false);

  // Voting state machine - single source of truth for voting flow
  type VotingPhase = 'viewing' | 'results' | 'continuation' | 'finished';
  const [votingState, _setVotingState] = useState<{
    phase: VotingPhase;
    currentStatement: Statement | null;
    votedStatement?: Statement;
    voteDistribution?: {
      agreeCount: number;
      disagreeCount: number;
      unsureCount: number;
      totalVotes: number;
      agreePercent: number;
      disagreePercent: number;
      unsurePercent: number;
    };
  }>({
    phase: 'viewing',
    currentStatement: null,
  });

  // Wrapped setState for clean state management
  const setVotingState = _setVotingState;

  // Auto-advance disabled - users must click "Next" button on results overlay
  // This provides better UX control and avoids timing issues

  // Preload next batch when user reaches 8th statement of current batch
  useEffect(() => {
    if (!statementManager || !poll || !userId || isPreloading || votingState.phase !== 'viewing') return;

    const progress = statementManager.getProgress();

    // When on 8th statement of batch, preload next batch
    if (progress.positionInBatch === 8) {
      setIsPreloading(true);

      const nextBatchNumber = progress.currentBatch + 1;
      getStatementBatchAction(poll.id, userId, nextBatchNumber)
        .catch((err) => {
          console.error('Preload failed:', err);
        })
        .finally(() => {
          setIsPreloading(false);
        });
    }
  }, [votingState.phase, votingState.currentStatement, statementManager, poll, userId]);

  // Load poll data and statements
  useEffect(() => {
    // Only run on initial mount, not during voting
    if (hasInitializedRef.current) return;

    const loadData = async () => {
      try {
        const resolvedParams = await params;

        // Fetch poll by slug
        const pollResult = await getPollBySlugAction(resolvedParams.slug);
        if (!pollResult.success || !pollResult.data) {
          toast.error("סקר לא נמצא");
          router.push("/polls");
          return;
        }

        const fetchedPoll = pollResult.data;

        // Check poll status - only published polls can be voted on
        if (fetchedPoll.status !== "published") {
          toast.error("סקר זה אינו פעיל כרגע");
          router.push(`/polls/${resolvedParams.slug}`);
          return;
        }

        // Check if poll is closed (past end time)
        if (fetchedPoll.endTime && new Date(fetchedPoll.endTime) < new Date()) {
          // Check if within grace period (10 minutes)
          const minutesSinceClosed = (Date.now() - new Date(fetchedPoll.endTime).getTime()) / (1000 * 60);
          if (minutesSinceClosed <= 10) {
            toast.warning(
              "סקר זה נסגר, אך תוכל לסיים את ההצבעה בהפעלה הנוכחית. " +
              "ההצבעות שלך עדיין ייספרו בתוצאות.",
              { duration: 6000 }
            );
          } else {
            toast.error("סקר זה נסגר");
            router.push(`/polls/${resolvedParams.slug}/closed`);
            return;
          }
        }

        setPoll(fetchedPoll);

        // Handle user ID - use database user from context
        if (dbUser?.id) {
          // User exists in database (authenticated or anonymous with history)
          setUserId(dbUser.id);
          setSessionId(contextSessionId);

          // Load user's votes for THIS poll only
          const votesResult = await getUserVotesForPollAction(dbUser.id, fetchedPoll.id);
          const userVotesLookup = votesResult.success ? votesResult.data || {} : {};

          // Load user's voting progress to restore their position
          const progressResult = await getVotingProgressAction(fetchedPoll.id, dbUser.id);
          if (progressResult.success && progressResult.data) {
            const { totalVoted, totalStatements, currentBatch, thresholdReached } = progressResult.data;

            setTotalStatementsInPoll(totalStatements);

            // Only show demographics modal if user has NO demographics AND no votes
            if (totalVoted === 0) {
              const demographicsResult = await getUserDemographicsByIdAction(dbUser.id);
              if (!demographicsResult.success || !demographicsResult.data) {
                setShowDemographicsModal(true);
                // Don't load statements yet - wait for demographics modal to be handled
                // This ensures modal appears BEFORE first statement card
                setIsLoading(false);
                hasInitializedRef.current = true;
                return;
              }
            }

            // Load the current batch of unvoted statements
            const batchResult = await getStatementBatchAction(fetchedPoll.id, dbUser.id, currentBatch);

            if (batchResult.success && batchResult.data && batchResult.data.length > 0) {
              // Create StatementManager instance
              const manager = new StatementManager(
                batchResult.data,
                userVotesLookup,
                fetchedPoll.id,
                dbUser.id,
                totalStatements
              );

              setStatementManager(manager);

              // Get first unvoted statement and set initial voting state
              const firstStatement = manager.getNextStatement();
              setVotingState({
                phase: 'viewing',
                currentStatement: firstStatement,
              });
            } else {
              // No more unvoted statements - user has completed voting
              if (thresholdReached) {
                toast.success("השלמת את ההצבעה בסקר זה!");
                router.push(`/polls/${resolvedParams.slug}/insights`);
              } else {
                toast.error("אין הצהרות זמינות להצבעה");
                router.push(`/polls/${resolvedParams.slug}`);
              }
              return;
            }
          }
        } else if (contextSessionId) {
          // Anonymous user without DB record yet
          // Will be created on first action (vote or demographics save)
          setSessionId(contextSessionId);
          setShowDemographicsModal(true);

          // Load first batch of statements (all approved, since user has no votes yet)
          const statementsResult = await getApprovedStatementsByPollIdAction(fetchedPoll.id);
          if (statementsResult.success && statementsResult.data) {
            const firstBatch = statementsResult.data.slice(0, BATCH_SIZE);

            // Create StatementManager with empty votes
            const manager = new StatementManager(
              firstBatch,
              {},
              fetchedPoll.id,
              '', // No userId yet
              statementsResult.data.length
            );

            setStatementManager(manager);
            setTotalStatementsInPoll(statementsResult.data.length);

            // Set initial voting state for new users
            setVotingState({
              phase: 'viewing',
              currentStatement: manager.getNextStatement(),
            });
          }
        }
      } catch (error) {
        console.error("Error loading poll data:", error);
        toast.error("Failed to load poll data");
      } finally {
        setIsLoading(false);
        hasInitializedRef.current = true; // Mark as initialized
      }
    };

    if (!isUserLoading) {
      loadData();
    }
  }, [params, router, dbUser, contextSessionId, isUserLoading]);

  // Sync offline votes when user ID is available
  useEffect(() => {
    const syncOfflineVotes = async () => {
      if (!userId || typeof window === 'undefined') return;
      if (!OfflineVoteQueue.hasQueuedVotes()) return;

      const { synced, failed, errors } = await OfflineVoteQueue.syncAll(userId);

      if (synced > 0) {
        toast.success(`${synced} הצבע${synced > 1 ? 'ות' : 'ה'} מצב לא מקוון סונכרנ${synced > 1 ? 'ו' : 'ה'} בהצלחה`);

        // Reload voting progress to update UI with synced votes
        if (poll && statementManager) {
          const votesResult = await getUserVotesForPollAction(userId, poll.id);
          if (votesResult.success && votesResult.data) {
            // Update statement manager with synced votes
            const updatedVotes = votesResult.data;
            Object.entries(updatedVotes).forEach(([stmtId, value]) => {
              statementManager.recordVote(stmtId, value as -1 | 0 | 1);
            });

            // Trigger re-render to show updated progress
            setVotingState(prev => ({ ...prev }));
          }
        }
      }

      if (failed > 0) {
        toast.error(`נכשל לסנכרן ${failed} הצבע${failed > 1 ? 'ות' : 'ה'}`);

        // Retry failed syncs after 30 seconds
        setTimeout(() => {
          syncOfflineVotes();
        }, 30000);
      }
    };

    syncOfflineVotes();
  }, [userId, poll, statementManager]);

  // Listen for online/offline events to sync immediately when connection restored
  useEffect(() => {
    const handleOnline = async () => {
      if (!userId || typeof window === 'undefined') return;
      if (!OfflineVoteQueue.hasQueuedVotes()) return;

      toast.info("החיבור שוחזר, מסנכרן הצבעות לא מקוונות...");

      const { synced, failed } = await OfflineVoteQueue.syncAll(userId);

      if (synced > 0) {
        toast.success(`${synced} הצבע${synced > 1 ? 'ות' : 'ה'} סונכרנ${synced > 1 ? 'ו' : 'ה'}`);

        // Reload votes to update UI
        if (poll && statementManager) {
          const votesResult = await getUserVotesForPollAction(userId, poll.id);
          if (votesResult.success && votesResult.data) {
            Object.entries(votesResult.data).forEach(([stmtId, value]) => {
              statementManager.recordVote(stmtId, value as -1 | 0 | 1);
            });
            setVotingState(prev => ({ ...prev }));
          }
        }
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [userId, poll, statementManager]);

  // Get progress from StatementManager
  const progress = statementManager?.getProgress();
  const voteDistribution = statementManager?.getVoteDistribution();

  const votedCount = progress?.totalVoted || 0;
  const threshold = progress?.threshold || 10;
  const canFinish = progress?.canFinish || false;

  const agreeCount = voteDistribution?.agreeCount || 0;
  const disagreeCount = voteDistribution?.disagreeCount || 0;
  const unsureCount = voteDistribution?.unsureCount || 0;

  // Handle finishing voting session
  const handleFinish = useCallback(async () => {
    if (!canFinish || !statementManager) {
      const progress = statementManager?.getProgress();
      const message = progress && progress.threshold === progress.totalStatementsInPoll
        ? `Please vote on all ${progress.totalStatementsInPoll} statements`
        : `Please complete the first 10 statements`;
      toast.error(message);
      return;
    }

    setVotingState({
      phase: 'finished',
      currentStatement: null,
    });

    // Navigate to insights immediately - insights page will handle loading state
    if (poll?.slug) {
      router.push(`/polls/${poll.slug}/insights`);
    }
  }, [canFinish, statementManager, poll, router]);

  // Configure header with poll context
  useEffect(() => {
    if (!poll || !statementManager) return;

    const progress = statementManager.getProgress();

    setConfig({
      variant: "voting",
      title: poll.question,
      subtitle: poll.endTime
        ? `Ends ${new Date(poll.endTime).toLocaleDateString()} at ${new Date(poll.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
        : undefined,
      actions: (
        <>
          {poll.allowUserStatements && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStatementModal(true)}
                  disabled={isSavingVote}
                  className="gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">הוספת כרטיס</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>הוסף כרטיס חדש כדי לשתף נקודת מבט חסרה</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={progress.canFinish ? "default" : "ghost"}
                disabled={!progress.canFinish || isSavingVote}
                onClick={handleFinish}
              >
                סיום
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {progress.canFinish
                ? "השלם הצבעה וצפה בתובנות שלך"
                : progress.threshold === progress.totalStatementsInPoll
                ? `הצבע על כל ${progress.totalStatementsInPoll} ההצהרות לסיום`
                : `השלם את 10 ההצהרות הראשונות לסיום`}
            </TooltipContent>
          </Tooltip>
        </>
      ),
      customContent: (
        <ProgressBar
          totalSegments={progress.statementsInCurrentBatch}
          currentSegment={progress.positionInBatch}
          showingResults={votingState.phase === 'results'}
        />
      ),
    });

    return () => resetConfig();
  }, [poll, statementManager, isSavingVote, votingState.phase, setConfig, resetConfig, handleFinish]);

  const handleVote = async (value: 1 | 0 | -1) => {
    // Check ref-based lock FIRST and set immediately (atomic operation)
    if (isVotingRef.current) return;
    isVotingRef.current = true;

    // Now perform all validation checks - unlock if any check fails
    if (!statementManager || !votingState.currentStatement) {
      isVotingRef.current = false;
      return;
    }

    // Check if we've already voted on this statement locally (prevents duplicate votes)
    if (statementManager.hasVotedOn(votingState.currentStatement.id)) {
      isVotingRef.current = false;
      return;
    }

    // Prevent voting if already saving or not in viewing phase
    if (isSavingVote || votingState.phase !== 'viewing') {
      isVotingRef.current = false;
      return;
    }

    // Check if poll has closed during voting session (grace period logic)
    if (poll?.endTime && new Date(poll.endTime) < new Date()) {
      const minutesSinceClosed = (Date.now() - new Date(poll.endTime).getTime()) / (1000 * 60);
      if (minutesSinceClosed > 10) {
        toast.error("סקר זה נסגר. ההצבעות הקודמות שלך נשמרו.");
        router.push(`/polls/${poll.slug}/closed`);
        isVotingRef.current = false;
        return;
      } else {
        // Within grace period - allow vote but warn user
        toast.warning("סקר זה נסגר, אך ההצבעה שלך עדיין תיספר.", { duration: 3000 });
      }
    }

    // Set UI lock state (ref lock already set at top)
    setIsSavingVote(true);

    try {
      // Ensure user exists (create if first action)
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        // User doesn't exist yet - create them now
        const userResult = await ensureUserExistsAction({
          clerkUserId: dbUser?.clerkUserId || undefined,
          sessionId: sessionId || undefined,
        });

        if (!userResult.success || !userResult.data) {
          toast.error("נכשל ליצור הפעלת משתמש");
          return;
        }

        effectiveUserId = userResult.data.id;
        setUserId(effectiveUserId);

        // Update manager with userId
        statementManager.userId = effectiveUserId;
      }

      // Check if user has already voted on this statement (votes are final)
      const existingVote = await getVoteByUserAndStatementAction(effectiveUserId, votingState.currentStatement.id);

      if (existingVote.success && existingVote.data) {
        toast.error("כבר הצבעת על הצהרה זו. ההצבעות סופיות ולא ניתנות לשינוי.");
        // Skip to next statement since vote already exists
        statementManager.advanceIndex();
        const nextStmt = statementManager.getNextStatement();
        setVotingState({
          phase: nextStmt ? 'viewing' : 'continuation',
          currentStatement: nextStmt,
        });
        setIsSavingVote(false);
        return;
      }

      // Save vote to database (no updates allowed - votes are final)
      try {
        const result = await createVoteAction({
          userId: effectiveUserId,
          statementId: votingState.currentStatement.id,
          value,
        });

        if (result.success) {
          // Update StatementManager
          statementManager.recordVote(votingState.currentStatement.id, value);

          // Fetch actual vote distribution for this statement
          const distributionResult = await getStatementVoteDistributionAction(votingState.currentStatement.id);

          // Transition to results phase
          setVotingState({
            phase: 'results',
            currentStatement: votingState.currentStatement,
            votedStatement: votingState.currentStatement,
            voteDistribution: distributionResult.success && distributionResult.data
              ? distributionResult.data
              : undefined,
          });
        } else {
          // Server returned error - check error type
          if (result.error?.includes("Statement not found")) {
            // Statement was deleted by admin - skip gracefully
            toast.error(
              "הצהרה זו הוסרה על ידי בעל הסקר. מדלג להצהרה הבאה...",
              { duration: 5000 }
            );

            // Skip to next statement without recording vote
            statementManager.advanceIndex();
            const nextStmt = statementManager.getNextStatement();
            setVotingState({
              phase: nextStmt ? 'viewing' : 'continuation',
              currentStatement: nextStmt,
            });
          } else if (result.error?.includes("fetch") || result.error?.includes("network")) {
            // Network error - queue for offline sync
            if (poll) {
              OfflineVoteQueue.add({
                pollId: poll.id,
                statementId: votingState.currentStatement.id,
                value,
              });
            }

            // Optimistically update UI
            statementManager.recordVote(votingState.currentStatement.id, value);
            toast.warning("הצבעה נשמרה במצב לא מקוון - תסונכרן כשהחיבור ישוחזר");

            // Continue to results phase with offline indicator
            setVotingState({
              phase: 'results',
              currentStatement: votingState.currentStatement,
              votedStatement: votingState.currentStatement,
              voteDistribution: undefined, // No distribution available offline
            });
          } else {
            // Other error - show retry option
            const retry = confirm(`נכשל לשמור הצבעה: ${result.error || "שגיאה לא ידועה"}.\n\nהאם תרצה לנסות שוב?`);
            if (retry) {
              isVotingRef.current = false; // Unlock before retry
              setIsSavingVote(false);
              handleVote(value); // Recursive retry
              return;
            }
          }
        }
      } catch (networkError) {
        // Network exception - queue for offline sync
        console.error("Network error saving vote:", networkError);

        if (poll) {
          OfflineVoteQueue.add({
            pollId: poll.id,
            statementId: votingState.currentStatement.id,
            value,
          });
        }

        // Optimistically update UI
        statementManager.recordVote(votingState.currentStatement.id, value);
        toast.warning("החיבור אבד - הצבעה נשמרה במצב לא מקוון ותסונכרן אוטומטית");

        // Continue to results phase with offline indicator
        setVotingState({
          phase: 'results',
          currentStatement: votingState.currentStatement,
          votedStatement: votingState.currentStatement,
          voteDistribution: undefined, // No distribution available offline
        });
      }
    } catch (error) {
      console.error("Error saving vote:", error);
      const retry = confirm("שגיאת רשת בשמירת הצבעה. האם תרצה לנסות שוב?");
      if (retry) {
        isVotingRef.current = false; // Unlock before retry
        setIsSavingVote(false);
        handleVote(value); // Recursive retry
        return;
      }
      toast.error("נכשל לשמור הצבעה");
    } finally {
      isVotingRef.current = false; // Always unlock
      setIsSavingVote(false);
    }
  };

  // Manual advance to next statement (called by "Next" button on results overlay)
  const handleManualNext = useCallback(() => {
    if (!statementManager) return;

    // Check if poll has closed during voting session
    if (poll?.endTime && new Date(poll.endTime) < new Date()) {
      const minutesSinceClosed = (Date.now() - new Date(poll.endTime).getTime()) / (1000 * 60);
      if (minutesSinceClosed > 10) {
        toast.error("סקר זה נסגר. ההצבעות שלך נשמרו.");
        router.push(`/polls/${poll.slug}/closed`);
        return;
      }
    }

    // Advance the statement manager index
    statementManager.advanceIndex();

    const progress = statementManager.getProgress();

    // Check if batch is complete based on position
    // We show continuation when position reaches the end of the batch (10 statements)
    const isBatchComplete = progress.positionInBatch >= progress.statementsInCurrentBatch;

    if (isBatchComplete) {
      // Batch complete - transition to continuation page
      setVotingState({
        phase: 'continuation',
        currentStatement: null,
      });
    } else {
      // More statements in current batch - get next and continue voting
      const nextStmt = statementManager.getNextStatement();

      if (nextStmt) {
        setVotingState({
          phase: 'viewing',
          currentStatement: nextStmt,
        });
      } else {
        // No next statement but batch not complete - go to continuation
        setVotingState({
          phase: 'continuation',
          currentStatement: null,
        });
      }
    }
  }, [statementManager]);

  const handleContinue = async () => {
    if (!statementManager) return;

    setBatchLoadError(null);

    // Check if user has voted on all statements
    if (statementManager.hasVotedOnAll()) {
      handleFinish();
      return;
    }

    try {
      // Load next batch
      const hasMore = await statementManager.loadNextBatch();

      if (hasMore) {
        const nextStmt = statementManager.getNextStatement();
        setVotingState({
          phase: 'viewing',
          currentStatement: nextStmt,
        });
      } else {
        // No more statements - finish voting
        handleFinish();
      }
    } catch (error) {
      console.error("Error loading next batch:", error);
      setBatchLoadError("נכשל לטעון את הקבוצה הבאה של הצהרות. אנא נסה שוב.");
      // Stay in continuation phase to show error
    }
  };

  const handleDemographicsSubmit = async (demographics: DemographicsData) => {
    try {
      // Save demographics and create user if doesn't exist
      const result = await saveDemographicsAction({
        clerkUserId: dbUser?.clerkUserId || undefined,
        sessionId: sessionId || undefined,
        demographics,
      });

      if (result.success && result.data) {
        // Set user ID if not already set
        if (!userId) {
          setUserId(result.data.id);
        }
        setShowDemographicsModal(false);
        toast.success("תודה על השיתוף!");

        // Now load statements after demographics is handled
        await loadInitialStatements(result.data.id);
      } else {
        toast.error(result.error || "נכשל לשמור נתונים דמוגרפיים");
      }
    } catch (error) {
      console.error("Error submitting demographics:", error);
      toast.error("נכשל לשמור נתונים דמוגרפיים");
    }
  };

  const handleDemographicsSkip = async () => {
    setShowDemographicsModal(false);

    // Create user if needed, then load statements
    let effectiveUserId = userId;
    if (!effectiveUserId) {
      const userResult = await ensureUserExistsAction({
        clerkUserId: dbUser?.clerkUserId || undefined,
        sessionId: sessionId || undefined,
      });
      if (userResult.success && userResult.data) {
        effectiveUserId = userResult.data.id;
        setUserId(effectiveUserId);
      }
    }

    if (effectiveUserId && poll) {
      await loadInitialStatements(effectiveUserId);
    }
  };

  // Helper function to load initial statements (called after demographics modal)
  const loadInitialStatements = async (effectiveUserId: string) => {
    if (!poll) return;

    try {
      setIsLoading(true);

      // Load user's votes for this poll
      const votesResult = await getUserVotesForPollAction(effectiveUserId, poll.id);
      const userVotesLookup = votesResult.success ? votesResult.data || {} : {};

      // Load voting progress
      const progressResult = await getVotingProgressAction(poll.id, effectiveUserId);
      if (progressResult.success && progressResult.data) {
        const { totalStatements, currentBatch } = progressResult.data;

        // Load first batch
        const batchResult = await getStatementBatchAction(poll.id, effectiveUserId, currentBatch);

        if (batchResult.success && batchResult.data && batchResult.data.length > 0) {
          const manager = new StatementManager(
            batchResult.data,
            userVotesLookup,
            poll.id,
            effectiveUserId,
            totalStatements
          );

          setStatementManager(manager);
          setVotingState({
            phase: 'viewing',
            currentStatement: manager.getNextStatement(),
          });
        }
      }
    } catch (error) {
      console.error("Error loading initial statements:", error);
      toast.error("נכשל לטעון הצהרות");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">טוען סקר...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!poll || !votingState.currentStatement && votingState.phase === 'viewing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">אין הצהרות זמינות</p>
          <Button asChild>
            <Link href="/polls">חזרה לסקרים</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (votingState.phase === 'continuation') {
    // Check if there are more statements to vote on
    const hasMoreStatements = statementManager ? !statementManager.hasVotedOnAll() : false;

    return (
      <ContinuationPage
        statementsVoted={votedCount}
        agreeCount={agreeCount}
        disagreeCount={disagreeCount}
        unsureCount={unsureCount}
        minStatementsRequired={threshold}
        hasMoreStatements={hasMoreStatements}
        onContinue={handleContinue}
        onFinish={handleFinish}
        error={batchLoadError}
        onRetry={batchLoadError ? handleContinue : undefined}
      />
    );
  }

  if (votingState.phase === 'finished') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <h1 className="text-3xl font-bold">מייצר את התובנות שלך...</h1>
          <p className="text-gray-600">אנא המתן בעוד אנו מנתחים את התשובות שלך</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Voting Interface - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md space-y-6">
          <AnimatePresence mode="wait">
            {votingState.phase === 'viewing' && votingState.currentStatement ? (
              <StatementCard
                key={`statement-${votingState.currentStatement.id}`}
                statement={votingState.currentStatement.text}
                agreeLabel={poll?.supportButtonLabel || "Agree"}
                disagreeLabel={poll?.opposeButtonLabel || "Disagree"}
                passLabel={poll?.unsureButtonLabel || "Pass"}
                onVote={handleVote}
                disabled={isSavingVote}
              />
            ) : votingState.phase === 'results' && votingState.votedStatement && votingState.voteDistribution ? (
              <VoteResultOverlay
                key={`results-${votingState.votedStatement.id}`}
                statement={votingState.votedStatement.text}
                userVote={statementManager?.getUserVote(votingState.votedStatement.id) || 0}
                agreePercent={votingState.voteDistribution.agreePercent}
                disagreePercent={votingState.voteDistribution.disagreePercent}
                unsurePercent={votingState.voteDistribution.unsurePercent}
                totalVotes={votingState.voteDistribution.totalVotes}
                agreeLabel={poll?.supportButtonLabel || "Agree"}
                disagreeLabel={poll?.opposeButtonLabel || "Disagree"}
                unsureLabel={poll?.unsureButtonLabel || "Unsure"}
                onNext={handleManualNext}
              />
            ) : (
              // Transitioning between states
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">טוען...</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Demographics Modal */}
      <DemographicsModal
        open={showDemographicsModal}
        onOpenChange={(open) => {
          if (!open) {
            // When modal is closed via X button, treat it as skip
            handleDemographicsSkip();
          }
          setShowDemographicsModal(open);
        }}
        onSubmit={handleDemographicsSubmit}
        onSkip={handleDemographicsSkip}
      />

      {/* Statement Submission Modal */}
      <StatementSubmissionModal
        open={showStatementModal}
        onOpenChange={setShowStatementModal}
        pollId={poll.id}
        userId={userId}
        autoApprove={poll.autoApproveStatements || false}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Loader2 } from "lucide-react";
import { useHeader } from "@/contexts/header-context";
import {
  StatementCard,
  ProgressBar,
  StatementCounter,
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

  // Timer ref for auto-advance cleanup
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Voting state machine - single source of truth for voting flow
  type VotingPhase = 'viewing' | 'results' | 'continuation' | 'finished';
  const [votingState, setVotingState] = useState<{
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

  // Auto-advance timer - transitions from 'results' to next phase
  useEffect(() => {
    if (votingState.phase !== 'results' || !statementManager) return;

    const timer = setTimeout(() => {
      // Advance the statement manager index
      statementManager.advanceIndex();

      // Get next statement
      const nextStmt = statementManager.getNextStatement();

      if (nextStmt) {
        // More statements in current batch - transition to viewing next statement
        setVotingState({
          phase: 'viewing',
          currentStatement: nextStmt,
        });
      } else {
        // Batch complete - transition to continuation page
        setVotingState({
          phase: 'continuation',
          currentStatement: null,
        });
      }
    }, 5000);

    // Store timer ref for manual cleanup
    autoAdvanceTimerRef.current = timer;

    // Cleanup timer on unmount or when phase changes
    return () => {
      clearTimeout(timer);
      autoAdvanceTimerRef.current = null;
    };
  }, [votingState.phase, statementManager]);

  // Preload next batch when user reaches 8th statement of current batch
  useEffect(() => {
    if (!statementManager || !poll || !userId || isPreloading || votingState.phase !== 'viewing') return;

    const progress = statementManager.getProgress();

    // When on 8th statement of batch, preload next batch
    if (progress.positionInBatch === 8) {
      setIsPreloading(true);

      const nextBatchNumber = progress.currentBatch + 1;
      getStatementBatchAction(poll.id, userId, nextBatchNumber)
        .then(() => {
          console.log('Next batch preloaded successfully');
        })
        .catch((err) => {
          console.error('Preload failed:', err);
        })
        .finally(() => {
          setIsPreloading(false);
        });
    }
  }, [votingState.phase, votingState.currentStatement, statementManager, poll, userId, isPreloading]);

  // Load poll data and statements
  useEffect(() => {
    const loadData = async () => {
      try {
        const resolvedParams = await params;

        // Fetch poll by slug
        const pollResult = await getPollBySlugAction(resolvedParams.slug);
        if (!pollResult.success || !pollResult.data) {
          toast.error("Poll not found");
          router.push("/polls");
          return;
        }

        const fetchedPoll = pollResult.data;

        // Check poll status - only published polls can be voted on
        if (fetchedPoll.status !== "published") {
          toast.error("This poll is not currently active");
          router.push(`/polls/${resolvedParams.slug}`);
          return;
        }

        // Check if poll is closed (past end time)
        if (fetchedPoll.endTime && new Date(fetchedPoll.endTime) < new Date()) {
          // Check if within grace period (10 minutes)
          const minutesSinceClosed = (Date.now() - new Date(fetchedPoll.endTime).getTime()) / (1000 * 60);
          if (minutesSinceClosed <= 10) {
            toast.warning(
              "This poll has closed, but you can finish voting on your current session. " +
              "Your votes will still be counted in the results.",
              { duration: 6000 }
            );
          } else {
            toast.error("This poll has closed");
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
                toast.success("You've completed voting on this poll!");
                router.push(`/polls/${resolvedParams.slug}/insights`);
              } else {
                toast.error("No statements available to vote on");
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
      }
    };

    if (!isUserLoading) {
      loadData();
    }
  }, [params, router, dbUser, contextSessionId, isUserLoading]);

  // Sync offline votes when user ID is available
  useEffect(() => {
    if (userId && typeof window !== 'undefined') {
      if (OfflineVoteQueue.hasQueuedVotes()) {
        OfflineVoteQueue.syncAll(userId).then(({ synced, failed, errors }) => {
          if (synced > 0) {
            toast.success(`${synced} offline vote${synced > 1 ? 's' : ''} synced successfully`);
          }
          if (failed > 0) {
            toast.error(`Failed to sync ${failed} vote${failed > 1 ? 's' : ''}`);
          }
        });
      }
    }
  }, [userId]);

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

    // Navigate to insights page after ensuring database writes are complete
    // Longer delay to avoid race conditions with database writes
    setTimeout(() => {
      if (poll?.slug) {
        router.push(`/polls/${poll.slug}/insights`);
      }
    }, 3000);
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
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStatementModal(true)}
              disabled={isSavingVote}
            >
              Submit Statement
            </Button>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant={progress.canFinish ? "default" : "ghost"}
                disabled={!progress.canFinish || isSavingVote}
                onClick={handleFinish}
              >
                Finish
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {progress.canFinish
                ? "Complete voting and view your insights"
                : progress.threshold === progress.totalStatementsInPoll
                ? `Vote on all ${progress.totalStatementsInPoll} statements to finish`
                : `Complete the first 10 statements to finish`}
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
    if (!statementManager || !votingState.currentStatement) return;

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
          toast.error("Failed to create user session");
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
        toast.error("You've already voted on this statement. Votes are final and cannot be changed.");
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
              "This statement was removed by the poll owner. Skipping to next statement...",
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
            toast.warning("Vote saved offline - will sync when connection restored");

            // Continue to results phase with offline indicator
            setVotingState({
              phase: 'results',
              currentStatement: votingState.currentStatement,
              votedStatement: votingState.currentStatement,
              voteDistribution: undefined, // No distribution available offline
            });
          } else {
            // Other error - show retry option
            const retry = confirm(`Failed to save vote: ${result.error || "Unknown error"}.\n\nWould you like to retry?`);
            if (retry) {
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
        toast.warning("Connection lost - vote saved offline and will sync automatically");

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
      const retry = confirm("Network error saving vote. Would you like to retry?");
      if (retry) {
        handleVote(value); // Recursive retry
        return;
      }
      toast.error("Failed to save vote");
    } finally {
      setIsSavingVote(false);
    }
  };

  // Manual advance to next statement - bypasses auto-advance timer
  const handleManualNext = useCallback(() => {
    if (!statementManager) return;

    // Clear the auto-advance timer if it's running
    if (autoAdvanceTimerRef.current) {
      clearTimeout(autoAdvanceTimerRef.current);
      autoAdvanceTimerRef.current = null;
    }

    // Advance the statement manager index
    statementManager.advanceIndex();

    // Get next statement
    const nextStmt = statementManager.getNextStatement();

    if (nextStmt) {
      // More statements in current batch - transition to viewing next statement
      setVotingState({
        phase: 'viewing',
        currentStatement: nextStmt,
      });
    } else {
      // Batch complete - transition to continuation page
      setVotingState({
        phase: 'continuation',
        currentStatement: null,
      });
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
      setBatchLoadError("Failed to load next batch of statements. Please try again.");
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
        toast.success("Thank you for sharing!");
      } else {
        toast.error(result.error || "Failed to save demographics");
      }
    } catch (error) {
      console.error("Error submitting demographics:", error);
      toast.error("Failed to save demographics");
    }
  };

  const handleDemographicsSkip = () => {
    setShowDemographicsModal(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading poll...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (!poll || !votingState.currentStatement && votingState.phase === 'viewing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-xl text-gray-900 mb-4">No statements available</p>
          <Button asChild>
            <Link href="/polls">Back to Polls</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (votingState.phase === 'continuation') {
    return (
      <ContinuationPage
        statementsVoted={votedCount}
        agreeCount={agreeCount}
        disagreeCount={disagreeCount}
        unsureCount={unsureCount}
        minStatementsRequired={threshold}
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
          <h1 className="text-3xl font-bold">Generating Your Insights...</h1>
          <p className="text-gray-600">Please wait while we analyze your responses</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Voting Interface - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md space-y-6">
          {votingState.phase === 'viewing' && votingState.currentStatement ? (
            <>
              <StatementCard
                statement={votingState.currentStatement.text}
                agreeLabel={poll?.supportButtonLabel || "Agree"}
                disagreeLabel={poll?.opposeButtonLabel || "Disagree"}
                passLabel={poll?.unsureButtonLabel || "Pass"}
                onVote={handleVote}
                disabled={isSavingVote}
              />
              <StatementCounter
                currentStatement={progress?.totalVoted ? progress.totalVoted + 1 : 1}
                totalInBatch={Math.min(
                  (progress?.currentBatch || 1) * 10,
                  progress?.totalStatementsInPoll || totalStatementsInPoll
                )}
                className="text-center text-sm text-gray-600"
              />
            </>
          ) : votingState.phase === 'results' && votingState.votedStatement && votingState.voteDistribution ? (
            <VoteResultOverlay
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
              <p className="text-gray-600">Loading...</p>
            </div>
          )}
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

"use client";

import { useState, useEffect } from "react";
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
import { createVoteAction, getVotesByUserIdAction, getStatementVoteDistributionAction, getVoteByUserAndStatementAction } from "@/actions/votes-actions";
import { saveDemographicsAction, getUserDemographicsByIdAction } from "@/actions/user-demographics-actions";
import { ensureUserExistsAction } from "@/actions/users-actions";
import { toast } from "sonner";

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
const MIN_THRESHOLD = 5;

interface Poll {
  id: string;
  slug: string;
  question: string;
  description?: string | null;
  status: string;
  startTime?: Date | null;
  endTime?: Date | null;
  minStatementsVotedToEnd: number;
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

  const [poll, setPoll] = useState<Poll | null>(null);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStatementIndex, setCurrentStatementIndex] = useState(0);
  const [votes, setVotes] = useState<Record<string, 1 | 0 | -1>>({});
  const [showResults, setShowResults] = useState(false);
  const [showContinuation, setShowContinuation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isSavingVote, setIsSavingVote] = useState(false);
  const [showDemographicsModal, setShowDemographicsModal] = useState(false);
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentVoteDistribution, setCurrentVoteDistribution] = useState<{
    agreeCount: number;
    disagreeCount: number;
    unsureCount: number;
    totalVotes: number;
    agreePercent: number;
    disagreePercent: number;
    unsurePercent: number;
  } | null>(null);

  // Auto-advance timer with cleanup after showing results
  
  useEffect(() => {
    if (!showResults) return;

    const timer = setTimeout(() => {
      setShowResults(false);
      setCurrentVoteDistribution(null); // Clear stored distribution
      advanceToNext();
    }, 5000);

    // Cleanup timer on unmount or when showResults changes
    return () => clearTimeout(timer);
  }, [showResults]);

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
          toast.error("This poll has closed");
          router.push(`/polls/${resolvedParams.slug}/closed`);
          return;
        }

        setPoll(fetchedPoll);

        // Fetch approved statements for this poll
        const statementsResult = await getApprovedStatementsByPollIdAction(fetchedPoll.id);
        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data);
        }

        // Handle user ID - use database user from context
        if (dbUser?.id) {
          // User exists in database (authenticated or anonymous with history)
          setUserId(dbUser.id);
          setSessionId(contextSessionId);

          // Load existing votes for this user
          const votesResult = await getVotesByUserIdAction(dbUser.id);
          if (votesResult.success && votesResult.data) {
            const existingVotes: Record<string, 1 | 0 | -1> = {};
            votesResult.data.forEach((vote) => {
              existingVotes[vote.statementId] = vote.value as 1 | 0 | -1;
            });
            setVotes(existingVotes);

            // Only show demographics modal if user has NO demographics AND no votes
            if (votesResult.data.length === 0) {
              // Check if user already has demographics
              const demographicsResult = await getUserDemographicsByIdAction(dbUser.id);
              if (!demographicsResult.success || !demographicsResult.data) {
                // User has no demographics - show modal
                setShowDemographicsModal(true);
              }
            }
          } else {
            // User exists but has no votes - check demographics
            const demographicsResult = await getUserDemographicsByIdAction(dbUser.id);
            if (!demographicsResult.success || !demographicsResult.data) {
              setShowDemographicsModal(true);
            }
          }
        } else if (contextSessionId) {
          // Anonymous user without DB record yet
          // Will be created on first action (vote or demographics save)
          setSessionId(contextSessionId);
          // Show demographics modal for new users
          setShowDemographicsModal(true);
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

  const currentBatchStart = Math.floor(currentStatementIndex / BATCH_SIZE) * BATCH_SIZE;
  const currentBatchEnd = Math.min(currentBatchStart + BATCH_SIZE, statements.length);
  const currentBatch = statements.slice(currentBatchStart, currentBatchEnd);
  const positionInBatch = currentStatementIndex - currentBatchStart;

  const currentStatement = statements[currentStatementIndex];
  const votedCount = Object.keys(votes).length;
  const canFinish = votedCount >= (poll?.minStatementsVotedToEnd || MIN_THRESHOLD);

  const agreeCount = Object.values(votes).filter((v) => v === 1).length;
  const disagreeCount = Object.values(votes).filter((v) => v === -1).length;
  const unsureCount = Object.values(votes).filter((v) => v === 0).length;

  // Configure header with poll context (placed after variable calculations)
  useEffect(() => {
    if (!poll) return;

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
                variant={canFinish ? "default" : "ghost"}
                disabled={!canFinish || isSavingVote}
                onClick={handleFinish}
              >
                Finish
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {canFinish
                ? "Complete voting and view your insights"
                : `Vote on ${(poll?.minStatementsVotedToEnd || MIN_THRESHOLD) - votedCount} more statement${((poll?.minStatementsVotedToEnd || MIN_THRESHOLD) - votedCount) > 1 ? 's' : ''} to finish`}
            </TooltipContent>
          </Tooltip>
        </>
      ),
      customContent: (
        <ProgressBar
          totalSegments={Math.min(BATCH_SIZE, currentBatch.length)}
          currentSegment={positionInBatch}
        />
      ),
    });

    return () => resetConfig();
  }, [poll, canFinish, votedCount, isSavingVote, setConfig, resetConfig, currentBatch.length, positionInBatch]);

  const handleVote = async (value: 1 | 0 | -1) => {
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
      }

      // Check if user has already voted on this statement (votes are final)
      const existingVote = await getVoteByUserAndStatementAction(effectiveUserId, currentStatement.id);
      if (existingVote.success && existingVote.data) {
        toast.error("You've already voted on this statement");
        // Skip to next statement since vote already exists
        advanceToNext();
        setIsSavingVote(false);
        return;
      }

      // Save vote to database (no updates allowed - votes are final)
      const result = await createVoteAction({
        userId: effectiveUserId,
        statementId: currentStatement.id,
        value,
      });

      if (result.success) {
        // Update local state on success
        setVotes((prev) => ({ ...prev, [currentStatement.id]: value }));

        // Fetch actual vote distribution for this statement
        const distributionResult = await getStatementVoteDistributionAction(currentStatement.id);
        if (distributionResult.success && distributionResult.data) {
          setStatements((prev) =>
            prev.map((s) =>
              s.id === currentStatement.id
                ? { ...s, voteDistribution: distributionResult.data }
                : s
            )
          );
          // Store distribution separately so it doesn't get lost when currentStatement changes
          setCurrentVoteDistribution(distributionResult.data);
        }

        // Show results overlay
        setShowResults(true);
      } else {
        // Show error with retry option
        const retry = confirm(`Failed to save vote: ${result.error || "Unknown error"}.\n\nWould you like to retry?`);
        if (retry) {
          handleVote(value); // Recursive retry
          return;
        }
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

  const advanceToNext = () => {
    const nextIndex = currentStatementIndex + 1;

    // Check if we've reached the end of a batch (every 10 statements)
    if (nextIndex % BATCH_SIZE === 0 && nextIndex < statements.length) {
      setShowContinuation(true);
    } else if (nextIndex >= statements.length) {
      // Reached end of all statements
      handleFinish();
    } else {
      setCurrentStatementIndex(nextIndex);
    }
  };

  const handleContinue = () => {
    setShowContinuation(false);
    setCurrentStatementIndex(currentStatementIndex + 1);
  };

  const handleFinish = async () => {
    if (!canFinish) {
      toast.error(`Please vote on at least ${poll?.minStatementsVotedToEnd || MIN_THRESHOLD} statements`);
      return;
    }

    setIsFinished(true);

    // Navigate to insights page after ensuring database writes are complete
    // Longer delay to avoid race conditions with database writes
    setTimeout(() => {
      if (poll?.slug) {
        router.push(`/polls/${poll.slug}/insights`);
      }
    }, 3000);
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
  if (!poll || statements.length === 0) {
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

  if (showContinuation) {
    return (
      <ContinuationPage
        statementsVoted={votedCount}
        agreeCount={agreeCount}
        disagreeCount={disagreeCount}
        unsureCount={unsureCount}
        minStatementsRequired={poll?.minStatementsVotedToEnd || MIN_THRESHOLD}
        onContinue={handleContinue}
        onFinish={handleFinish}
      />
    );
  }

  if (isFinished) {
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

  // Use stored vote distribution (doesn't change when currentStatement changes)
  const agreePercent = currentVoteDistribution?.agreePercent || 0;
  const disagreePercent = currentVoteDistribution?.disagreePercent || 0;
  const unsurePercent = currentVoteDistribution?.unsurePercent || 0;
  const totalVotes = currentVoteDistribution?.totalVotes || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Voting Interface - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-8 flex flex-col items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-md space-y-6">
          {!showResults ? (
            <>
              <StatementCard
                statement={currentStatement.text}
                agreeLabel={poll?.supportButtonLabel || "Agree"}
                disagreeLabel={poll?.opposeButtonLabel || "Disagree"}
                passLabel={poll?.unsureButtonLabel || "Pass"}
                onVote={handleVote}
                disabled={isSavingVote}
              />
              <StatementCounter
                currentStatement={currentStatementIndex + 1}
                totalInBatch={currentBatchEnd}
                className="text-center text-sm text-gray-600"
              />
            </>
          ) : (
            <VoteResultOverlay
              statement={currentStatement.text}
              userVote={votes[currentStatement.id]}
              agreePercent={agreePercent}
              disagreePercent={disagreePercent}
              unsurePercent={unsurePercent}
              totalVotes={totalVotes}
              agreeLabel={poll?.supportButtonLabel || "Agree"}
              disagreeLabel={poll?.opposeButtonLabel || "Disagree"}
              unsureLabel={poll?.unsureButtonLabel || "Unsure"}
              onNext={advanceToNext}
            />
          )}
        </div>
      </main>

      {/* Demographics Modal */}
      <DemographicsModal
        open={showDemographicsModal}
        onOpenChange={setShowDemographicsModal}
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

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { TestLayout } from "@/components/test/TestLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Plus,
  CheckCircle,
  AlertCircle,
  BarChart3,
  MessageSquarePlus,
  Eye
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Statement {
  id: string;
  content: string;
  user_vote: -1 | 0 | 1 | null; // null = not voted
  vote_distribution: {
    agree: number;
    neutral: number;
    disagree: number;
    total: number;
  };
}

interface PollData {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  min_statements_voted_to_end: number;
  allow_user_statements: boolean;
  auto_approve_statements: boolean;
  agree_button_label?: string;
  disagree_button_label?: string;
  unsure_button_label?: string;
  user_progress: {
    voted_count: number;
    can_view_insights: boolean;
  };
  statements: Statement[];
}

export default function TestPollVotingPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [poll, setPoll] = useState<PollData | null>(null);
  const [loading, setLoading] = useState(false);
  const [newStatementContent, setNewStatementContent] = useState("");
  const { toast } = useToast();

  const loadPoll = async () => {
    setLoading(true);
    try {
      // This would call PollService.getPollBySlug and VotingService.getUserVotes
      const mockPoll: PollData = {
        id: "1",
        slug: slug,
        title: slug.split('-').map(word =>
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' '),
        description: "Test poll for comprehensive voting functionality",
        status: "published",
        min_statements_voted_to_end: 5,
        allow_user_statements: true,
        auto_approve_statements: false,
        agree_button_label: slug === 'budget-priorities' ? 'Support' : undefined,
        disagree_button_label: slug === 'budget-priorities' ? 'Oppose' : undefined,
        unsure_button_label: slug === 'budget-priorities' ? 'Neutral' : undefined,
        user_progress: {
          voted_count: 2,
          can_view_insights: false
        },
        statements: [
          {
            id: "1",
            content: "The city should invest more in renewable energy infrastructure",
            user_vote: 1, // user agreed
            vote_distribution: { agree: 45, neutral: 12, disagree: 8, total: 65 }
          },
          {
            id: "2",
            content: "Public transportation should be free to reduce carbon emissions",
            user_vote: 0, // user neutral
            vote_distribution: { agree: 32, neutral: 18, disagree: 15, total: 65 }
          },
          {
            id: "3",
            content: "Electric vehicle charging stations should be installed citywide",
            user_vote: null, // not voted yet
            vote_distribution: { agree: 38, neutral: 8, disagree: 19, total: 65 }
          },
          {
            id: "4",
            content: "Carbon taxes should be implemented for large businesses",
            user_vote: null,
            vote_distribution: { agree: 28, neutral: 15, disagree: 22, total: 65 }
          },
          {
            id: "5",
            content: "Green building standards should be mandatory for new construction",
            user_vote: null,
            vote_distribution: { agree: 41, neutral: 10, disagree: 14, total: 65 }
          },
          {
            id: "6",
            content: "Community gardens should be established in every neighborhood",
            user_vote: null,
            vote_distribution: { agree: 35, neutral: 12, disagree: 18, total: 65 }
          }
        ]
      };

      setPoll(mockPoll);
      toast({ title: "Poll loaded", description: `Loaded poll: ${mockPoll.title}` });
    } catch (error) {
      toast({ title: "Error loading poll", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const castVote = async (statementId: string, voteValue: -1 | 0 | 1) => {
    if (!poll) return;

    try {
      // This would call VotingService.castVote
      const updatedStatements = poll.statements.map(statement => {
        if (statement.id === statementId) {
          // Update the vote
          const oldVote = statement.user_vote;
          const newStatement = { ...statement, user_vote: voteValue };

          // Simulate vote distribution update
          if (oldVote !== null) {
            // Remove old vote from distribution
            if (oldVote === 1) newStatement.vote_distribution.agree--;
            else if (oldVote === 0) newStatement.vote_distribution.neutral--;
            else if (oldVote === -1) newStatement.vote_distribution.disagree--;
          } else {
            // New vote, increment total
            newStatement.vote_distribution.total++;
          }

          // Add new vote to distribution
          if (voteValue === 1) newStatement.vote_distribution.agree++;
          else if (voteValue === 0) newStatement.vote_distribution.neutral++;
          else if (voteValue === -1) newStatement.vote_distribution.disagree++;

          return newStatement;
        }
        return statement;
      });

      // Update user progress
      const votedCount = updatedStatements.filter(s => s.user_vote !== null).length;
      const canViewInsights = votedCount >= poll.min_statements_voted_to_end;

      setPoll({
        ...poll,
        statements: updatedStatements,
        user_progress: {
          voted_count: votedCount,
          can_view_insights: canViewInsights
        }
      });

      const voteLabel = voteValue === 1 ? "agree" : voteValue === 0 ? "neutral" : "disagree";
      toast({ title: "Vote recorded", description: `You voted ${voteLabel} on this statement` });

      if (canViewInsights && votedCount === poll.min_statements_voted_to_end) {
        toast({
          title: "Threshold reached!",
          description: "You can now view your personal insights",
          duration: 5000
        });
      }
    } catch (error) {
      toast({ title: "Error casting vote", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  const submitUserStatement = async () => {
    if (!poll || !newStatementContent.trim()) return;

    try {
      // This would call StatementService.submitUserStatement
      const newStatement: Statement = {
        id: Date.now().toString(),
        content: newStatementContent.trim(),
        user_vote: null,
        vote_distribution: { agree: 0, neutral: 0, disagree: 0, total: 0 }
      };

      setPoll({
        ...poll,
        statements: [...poll.statements, newStatement]
      });

      setNewStatementContent("");

      if (poll.auto_approve_statements) {
        toast({ title: "Statement added", description: "Your statement is now available for voting" });
      } else {
        toast({ title: "Statement submitted", description: "Your statement is pending moderator approval" });
      }
    } catch (error) {
      toast({ title: "Error submitting statement", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadPoll();
  }, [slug]);

  if (!poll) {
    return (
      <TestLayout title="Loading Poll...">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading poll data...</p>
        </div>
      </TestLayout>
    );
  }

  const progressPercentage = Math.min(100, (poll.user_progress.voted_count / poll.min_statements_voted_to_end) * 100);
  const votesRemaining = Math.max(0, poll.min_statements_voted_to_end - poll.user_progress.voted_count);

  const getVoteButton = (statement: Statement, voteValue: -1 | 0 | 1) => {
    const isSelected = statement.user_vote === voteValue;
    const distribution = statement.vote_distribution;
    const percentage = distribution.total > 0
      ? Math.round((
          voteValue === 1 ? distribution.agree :
          voteValue === 0 ? distribution.neutral :
          distribution.disagree
        ) / distribution.total * 100)
      : 0;

    let icon, label, colorClasses;

    if (voteValue === 1) {
      icon = <ThumbsUp className="h-4 w-4" />;
      label = poll.agree_button_label || "Agree";
      colorClasses = isSelected ? "bg-green-600 text-white" : "hover:bg-green-50 hover:text-green-700 hover:border-green-200";
    } else if (voteValue === 0) {
      icon = <Minus className="h-4 w-4" />;
      label = poll.unsure_button_label || "Neutral";
      colorClasses = isSelected ? "bg-gray-600 text-white" : "hover:bg-gray-50 hover:text-gray-700 hover:border-gray-200";
    } else {
      icon = <ThumbsDown className="h-4 w-4" />;
      label = poll.disagree_button_label || "Disagree";
      colorClasses = isSelected ? "bg-red-600 text-white" : "hover:bg-red-50 hover:text-red-700 hover:border-red-200";
    }

    return (
      <Button
        key={voteValue}
        variant={isSelected ? "default" : "outline"}
        onClick={() => castVote(statement.id, voteValue)}
        className={`flex-1 transition-colors ${colorClasses}`}
      >
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-1">
            {icon}
            {label}
          </div>
          <div className="text-xs opacity-75">
            {percentage}% ({voteValue === 1 ? distribution.agree : voteValue === 0 ? distribution.neutral : distribution.disagree})
          </div>
        </div>
      </Button>
    );
  };

  return (
    <TestLayout
      title={poll.title}
      description={poll.description}
    >
      <div className="space-y-6">
        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Your Voting Progress</span>
              <Badge variant={poll.user_progress.can_view_insights ? "default" : "secondary"}>
                {poll.user_progress.voted_count}/{poll.min_statements_voted_to_end} votes
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress value={progressPercentage} className="h-3" />
            <div className="flex justify-between items-center">
              {votesRemaining > 0 ? (
                <Alert className="flex-1">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Vote on <strong>{votesRemaining} more statement{votesRemaining > 1 ? 's' : ''}</strong> to unlock your personal insights
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="flex-1 border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Threshold reached!</strong> Your personal insights are now available
                  </AlertDescription>
                </Alert>
              )}
            </div>
            {poll.user_progress.can_view_insights && (
              <Button className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                View Your Personal Insights
              </Button>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="voting" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voting">Vote on Statements</TabsTrigger>
            <TabsTrigger value="results">Vote Distribution</TabsTrigger>
            <TabsTrigger value="submit">Submit Statement</TabsTrigger>
          </TabsList>

          {/* Voting Interface */}
          <TabsContent value="voting" className="space-y-4">
            {poll.statements.map((statement, index) => (
              <Card key={statement.id} className={statement.user_vote !== null ? "border-green-200 bg-green-50/50" : ""}>
                <CardHeader>
                  <CardTitle className="text-base flex items-center justify-between">
                    <span>Statement {index + 1}</span>
                    {statement.user_vote !== null && (
                      <Badge className="bg-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Voted
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-700 bg-white p-4 rounded border-l-4 border-l-blue-500">
                    {statement.content}
                  </p>

                  <div className="grid grid-cols-3 gap-3">
                    {getVoteButton(statement, 1)}
                    {getVoteButton(statement, 0)}
                    {getVoteButton(statement, -1)}
                  </div>

                  {statement.user_vote !== null && (
                    <div className="text-xs text-gray-500 bg-white p-2 rounded">
                      <strong>Your vote:</strong> {
                        statement.user_vote === 1 ? (poll.agree_button_label || "Agree") :
                        statement.user_vote === 0 ? (poll.unsure_button_label || "Neutral") :
                        (poll.disagree_button_label || "Disagree")
                      } • You can change your vote at any time
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* Results View */}
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Vote Distribution
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {poll.statements.map((statement, index) => (
                  <div key={statement.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Statement {index + 1}</h4>
                      <div className="text-sm text-gray-500">
                        {statement.vote_distribution.total} total votes
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {statement.content}
                    </p>

                    <div className="space-y-2">
                      {/* Agree */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm text-green-700">Agree</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-green-600 h-4 rounded-full"
                            style={{ width: `${statement.vote_distribution.total > 0 ? (statement.vote_distribution.agree / statement.vote_distribution.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-sm text-right">
                          {statement.vote_distribution.agree} ({statement.vote_distribution.total > 0 ? Math.round((statement.vote_distribution.agree / statement.vote_distribution.total) * 100) : 0}%)
                        </div>
                      </div>

                      {/* Neutral */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm text-gray-700">Neutral</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-gray-600 h-4 rounded-full"
                            style={{ width: `${statement.vote_distribution.total > 0 ? (statement.vote_distribution.neutral / statement.vote_distribution.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-sm text-right">
                          {statement.vote_distribution.neutral} ({statement.vote_distribution.total > 0 ? Math.round((statement.vote_distribution.neutral / statement.vote_distribution.total) * 100) : 0}%)
                        </div>
                      </div>

                      {/* Disagree */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm text-red-700">Disagree</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                          <div
                            className="bg-red-600 h-4 rounded-full"
                            style={{ width: `${statement.vote_distribution.total > 0 ? (statement.vote_distribution.disagree / statement.vote_distribution.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                        <div className="w-16 text-sm text-right">
                          {statement.vote_distribution.disagree} ({statement.vote_distribution.total > 0 ? Math.round((statement.vote_distribution.disagree / statement.vote_distribution.total) * 100) : 0}%)
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Submit Statement */}
          <TabsContent value="submit" className="space-y-4">
            {poll.allow_user_statements ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquarePlus className="h-5 w-5" />
                    Submit New Statement
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {poll.auto_approve_statements
                        ? "Your statement will be immediately available for voting."
                        : "Your statement will be reviewed by moderators before appearing in the poll."
                      }
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="statement-content">Statement Content</Label>
                    <Textarea
                      id="statement-content"
                      value={newStatementContent}
                      onChange={(e) => setNewStatementContent(e.target.value)}
                      placeholder="Write a clear statement that others can agree or disagree with..."
                      rows={4}
                    />
                    <div className="text-xs text-gray-500">
                      Write a neutral, factual statement that can be clearly agreed or disagreed with.
                    </div>
                  </div>

                  <Button
                    onClick={submitUserStatement}
                    disabled={!newStatementContent.trim()}
                    className="w-full"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Statement
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquarePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-gray-600 mb-2">User statement submissions are disabled for this poll.</p>
                  <p className="text-sm text-gray-500">Only administrators can add new statements.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </TestLayout>
  );
}
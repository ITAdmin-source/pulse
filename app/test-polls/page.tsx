"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { TestLayout } from "@/components/test/TestLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Vote, Users, Calendar, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Poll {
  id: string;
  slug: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  start_time: string | null;
  end_time: string | null;
  min_statements_voted_to_end: number;
  allow_user_statements: boolean;
  statement_count: number;
  participant_count: number;
  user_progress: {
    voted_count: number;
    can_view_insights: boolean;
  } | null;
}

export default function TestPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadPolls = async () => {
    setLoading(true);
    try {
      // This would call PollService.getPublicPolls
      const mockPolls: Poll[] = [
        {
          id: "1",
          slug: "climate-action-survey",
          title: "Climate Action Survey",
          description: "Community input on climate initiatives and environmental policies",
          status: "published",
          start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          min_statements_voted_to_end: 5,
          allow_user_statements: true,
          statement_count: 12,
          participant_count: 156,
          user_progress: {
            voted_count: 3,
            can_view_insights: false
          }
        },
        {
          id: "2",
          slug: "budget-priorities",
          title: "Municipal Budget Priorities",
          description: "Help prioritize how we allocate the city budget for the next fiscal year",
          status: "published",
          start_time: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          min_statements_voted_to_end: 3,
          allow_user_statements: false,
          statement_count: 8,
          participant_count: 89,
          user_progress: {
            voted_count: 8,
            can_view_insights: true
          }
        },
        {
          id: "3",
          slug: "transportation-planning",
          title: "Transportation & Infrastructure",
          description: "Discuss transportation improvements and infrastructure investments",
          status: "published",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          min_statements_voted_to_end: 4,
          allow_user_statements: true,
          statement_count: 6,
          participant_count: 23,
          user_progress: null // User hasn't started voting
        },
        {
          id: "4",
          slug: "closed-poll-example",
          title: "Community Development (Closed)",
          description: "This poll has ended but results are still viewable",
          status: "closed",
          start_time: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          end_time: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          min_statements_voted_to_end: 5,
          allow_user_statements: true,
          statement_count: 15,
          participant_count: 234,
          user_progress: {
            voted_count: 10,
            can_view_insights: true
          }
        }
      ];

      // Only show published and closed polls (not drafts) in public interface
      const publicPolls = mockPolls.filter(p => p.status !== 'draft');
      setPolls(publicPolls);

      toast({ title: "Polls loaded", description: `Found ${publicPolls.length} public polls` });
    } catch (error) {
      toast({ title: "Error loading polls", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const getStatusBadge = (poll: Poll) => {
    if (poll.status === 'closed') {
      return <Badge variant="outline">Closed</Badge>;
    }

    if (poll.end_time && new Date(poll.end_time) < new Date()) {
      return <Badge variant="outline">Ended</Badge>;
    }

    if (poll.start_time && new Date(poll.start_time) > new Date()) {
      return <Badge variant="secondary">Starts Soon</Badge>;
    }

    return <Badge className="bg-green-600">Active</Badge>;
  };

  const getProgressInfo = (poll: Poll) => {
    if (!poll.user_progress) {
      return {
        percentage: 0,
        label: "Not started",
        canViewInsights: false
      };
    }

    const percentage = Math.min(100, (poll.user_progress.voted_count / poll.min_statements_voted_to_end) * 100);
    const remaining = Math.max(0, poll.min_statements_voted_to_end - poll.user_progress.voted_count);

    return {
      percentage,
      label: remaining > 0 ? `${remaining} more votes needed` : "Threshold met!",
      canViewInsights: poll.user_progress.can_view_insights
    };
  };

  const formatTimeRemaining = (endTime: string) => {
    const end = new Date(endTime);
    const now = new Date();
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) return "Ended";

    const days = Math.floor(diff / (24 * 60 * 60 * 1000));
    const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h remaining`;
    return "Ending soon";
  };

  return (
    <TestLayout
      title="🗳️ Public Polls"
      description="Test the core voting flow, progress tracking, and vote updates"
    >
      <div className="space-y-6">
        <Alert>
          <Vote className="h-4 w-4" />
          <AlertDescription>
            This interface shows all public polls available for voting. Test the voting flow, progress tracking,
            and the minimum vote threshold system. Anonymous and authenticated users can both participate.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Available Polls</span>
              <Button onClick={loadPolls} disabled={loading}>
                {loading ? "Loading..." : "Refresh"}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {polls.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No public polls available at this time.</p>
                <p className="text-sm mt-2">Check back later or contact an administrator.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {polls.map((poll) => {
                  const progress = getProgressInfo(poll);
                  const canVote = poll.status === 'published' &&
                    (!poll.end_time || new Date(poll.end_time) > new Date()) &&
                    (!poll.start_time || new Date(poll.start_time) <= new Date());

                  return (
                    <div key={poll.id} className="border rounded-lg p-6 space-y-4">
                      {/* Header */}
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <h3 className="text-xl font-semibold">{poll.title}</h3>
                          <p className="text-gray-600">{poll.description}</p>
                        </div>
                        <div className="text-right space-y-2">
                          {getStatusBadge(poll)}
                          {poll.end_time && (
                            <div className="text-xs text-gray-500">
                              <Calendar className="h-3 w-3 inline mr-1" />
                              {formatTimeRemaining(poll.end_time)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 py-3 border-y bg-gray-50 rounded">
                        <div className="text-center">
                          <div className="text-lg font-semibold">{poll.statement_count}</div>
                          <div className="text-xs text-gray-500">Statements</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{poll.participant_count}</div>
                          <div className="text-xs text-gray-500">Participants</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold">{poll.min_statements_voted_to_end}</div>
                          <div className="text-xs text-gray-500">Min. Votes</div>
                        </div>
                      </div>

                      {/* User Progress */}
                      {poll.user_progress && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Your Progress</span>
                            <span className="text-xs text-gray-500">
                              {poll.user_progress.voted_count}/{poll.min_statements_voted_to_end} votes
                            </span>
                          </div>
                          <Progress value={progress.percentage} className="h-2" />
                          <div className="flex justify-between items-center text-xs">
                            <span className={progress.canViewInsights ? "text-green-600 font-medium" : "text-gray-500"}>
                              {progress.label}
                            </span>
                            {progress.canViewInsights && (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                Insights Available
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-3">
                        {canVote ? (
                          <Button asChild className="flex-1">
                            <Link href={`/test-polls/${poll.slug}`}>
                              <Vote className="h-4 w-4 mr-2" />
                              {poll.user_progress ? "Continue Voting" : "Start Voting"}
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                        ) : (
                          <Button asChild variant="outline" className="flex-1">
                            <Link href={`/test-polls/${poll.slug}`}>
                              <Vote className="h-4 w-4 mr-2" />
                              View Results
                              <ArrowRight className="h-4 w-4 ml-2" />
                            </Link>
                          </Button>
                        )}

                        {progress.canViewInsights && (
                          <Button asChild variant="secondary">
                            <Link href={`/test-polls/${poll.slug}/insights`}>
                              View Your Insights
                            </Link>
                          </Button>
                        )}
                      </div>

                      {/* Poll Features */}
                      <div className="flex gap-2 pt-2">
                        {poll.allow_user_statements && (
                          <Badge variant="secondary" className="text-xs">
                            User Submissions Enabled
                          </Badge>
                        )}
                        {poll.status === 'closed' && (
                          <Badge variant="outline" className="text-xs">
                            Results Available
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div><strong>Vote Progress Testing:</strong></div>
            <ul className="ml-4 space-y-1 text-gray-600">
              <li>• Test voting on statements (agree/disagree/neutral)</li>
              <li>• Verify progress tracking toward minimum vote threshold</li>
              <li>• Test vote updates (users can change their votes)</li>
              <li>• Check insights become available after threshold met</li>
            </ul>

            <div><strong>User Flow Testing:</strong></div>
            <ul className="ml-4 space-y-1 text-gray-600">
              <li>• Test both anonymous and authenticated user voting</li>
              <li>• Verify session persistence across page refreshes</li>
              <li>• Test user statement submission (where enabled)</li>
              <li>• Check custom button labels per poll</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </TestLayout>
  );
}
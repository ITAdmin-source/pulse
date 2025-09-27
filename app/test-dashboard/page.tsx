"use client";

import { useState, useEffect } from "react";
import { TestLayout } from "@/components/test/TestLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  User,
  BarChart3,
  Vote,
  Calendar,
  Eye,
  Settings,
  Award,
  TrendingUp,
  MessageSquare,
  Clock
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useToast } from "@/hooks/use-toast";

interface UserPoll {
  id: string;
  title: string;
  status: 'published' | 'closed';
  voted_count: number;
  min_votes_required: number;
  can_view_insights: boolean;
  last_activity: string;
}

interface UserInsight {
  poll_id: string;
  poll_title: string;
  content: string;
  generated_at: string;
}

interface UserStats {
  total_polls_participated: number;
  total_votes_cast: number;
  insights_available: number;
  statements_submitted: number;
}

interface Demographics {
  age_group: string;
  gender: string;
  ethnicity: string;
  political_party: string;
}

export default function TestDashboardPage() {
  const { user } = useUser();
  const [userPolls, setUserPolls] = useState<UserPoll[]>([]);
  const [insights, setInsights] = useState<UserInsight[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [demographics, setDemographics] = useState<Demographics>({
    age_group: "",
    gender: "",
    ethnicity: "",
    political_party: ""
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // This would call UserService methods to get user data
      const mockPolls: UserPoll[] = [
        {
          id: "1",
          title: "Climate Action Survey",
          status: "published",
          voted_count: 8,
          min_votes_required: 5,
          can_view_insights: true,
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          title: "Municipal Budget Priorities",
          status: "published",
          voted_count: 3,
          min_votes_required: 3,
          can_view_insights: true,
          last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          title: "Transportation Planning",
          status: "published",
          voted_count: 2,
          min_votes_required: 4,
          can_view_insights: false,
          last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockInsights: UserInsight[] = [
        {
          poll_id: "1",
          poll_title: "Climate Action Survey",
          content: "Based on your voting patterns, you strongly support renewable energy initiatives and environmental protection measures. You tend to agree with infrastructure investments that have long-term sustainability benefits, and you're willing to support policies that may have short-term costs for long-term environmental gains.",
          generated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        },
        {
          poll_id: "2",
          poll_title: "Municipal Budget Priorities",
          content: "Your responses indicate a preference for balanced budget approaches with emphasis on education and public services. You support targeted investments in community programs while being mindful of fiscal responsibility. You tend to favor initiatives that benefit broad segments of the population.",
          generated_at: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockStats: UserStats = {
        total_polls_participated: 3,
        total_votes_cast: 13,
        insights_available: 2,
        statements_submitted: 1
      };

      setUserPolls(mockPolls);
      setInsights(mockInsights);
      setStats(mockStats);

      toast({ title: "Dashboard loaded", description: "User data loaded successfully" });
    } catch (error) {
      toast({ title: "Error loading dashboard", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateDemographics = async () => {
    try {
      // This would call UserService.updateUserDemographics
      toast({ title: "Demographics updated", description: "Your demographic information has been saved" });
    } catch (error) {
      toast({ title: "Error updating demographics", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  const generateInsights = async (pollId: string) => {
    try {
      // This would call the insight generation service
      const newInsight: UserInsight = {
        poll_id: pollId,
        poll_title: userPolls.find(p => p.id === pollId)?.title || "Unknown Poll",
        content: "New AI-generated insights based on your latest voting patterns...",
        generated_at: new Date().toISOString()
      };

      setInsights(prev => [newInsight, ...prev]);
      toast({ title: "Insights generated", description: "New personal insights are now available" });
    } catch (error) {
      toast({ title: "Error generating insights", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const getProgressColor = (voted: number, required: number) => {
    const percentage = (voted / required) * 100;
    if (percentage >= 100) return "bg-green-600";
    if (percentage >= 75) return "bg-yellow-600";
    return "bg-blue-600";
  };

  return (
    <TestLayout
      title="👤 User Dashboard"
      description="Test user profiles, demographics, insights, and participation history"
    >
      <div className="space-y-6">
        <Alert>
          <User className="h-4 w-4" />
          <AlertDescription>
            This dashboard tests user profile management, demographic data, AI-generated insights,
            and participation tracking. Works for both anonymous and authenticated users.
          </AlertDescription>
        </Alert>

        {/* User Profile Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-4">
              <Avatar className="h-12 w-12">
                <AvatarImage src={user?.imageUrl} />
                <AvatarFallback>
                  {user ? (user.firstName?.[0] || user.emailAddresses[0]?.emailAddress[0] || 'U') : 'A'}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-2xl font-bold">
                  {user ? (user.fullName || user.firstName || "User") : "Anonymous User"}
                </h2>
                <p className="text-gray-600">
                  {user ? user.primaryEmailAddress?.emailAddress : "Session-based participation"}
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.total_polls_participated}</div>
                  <div className="text-sm text-gray-500">Polls Participated</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.total_votes_cast}</div>
                  <div className="text-sm text-gray-500">Total Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{stats.insights_available}</div>
                  <div className="text-sm text-gray-500">Insights Available</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{stats.statements_submitted}</div>
                  <div className="text-sm text-gray-500">Statements Submitted</div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Tabs defaultValue="polls" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="polls">My Polls</TabsTrigger>
            <TabsTrigger value="insights">Personal Insights</TabsTrigger>
            <TabsTrigger value="profile">Profile Settings</TabsTrigger>
          </TabsList>

          {/* User Polls */}
          <TabsContent value="polls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Poll Participation</span>
                  <Button onClick={loadDashboardData} disabled={loading} size="sm">
                    {loading ? "Loading..." : "Refresh"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {userPolls.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Vote className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>You haven&apos;t participated in any polls yet.</p>
                    <p className="text-sm mt-2">Visit the polls page to start voting!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userPolls.map((poll) => {
                      const progressPercentage = Math.min(100, (poll.voted_count / poll.min_votes_required) * 100);
                      return (
                        <div key={poll.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold">{poll.title}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={poll.status === 'published' ? 'default' : 'outline'}>
                                  {poll.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {new Date(poll.last_activity).toLocaleString()}
                                </span>
                              </div>
                            </div>
                            {poll.can_view_insights && (
                              <Button
                                size="sm"
                                onClick={() => generateInsights(poll.id)}
                                className="bg-purple-600 hover:bg-purple-700"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Insights
                              </Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Voting Progress</span>
                              <span>{poll.voted_count}/{poll.min_votes_required} votes</span>
                            </div>
                            <Progress value={progressPercentage} className="h-2" />
                            <div className="text-xs text-gray-500">
                              {poll.can_view_insights ? (
                                <span className="text-green-600 font-medium">
                                  ✓ Threshold reached - Insights available
                                </span>
                              ) : (
                                <span>
                                  {poll.min_votes_required - poll.voted_count} more votes needed for insights
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Personal Insights */}
          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  AI-Generated Personal Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                {insights.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No personal insights available yet.</p>
                    <p className="text-sm mt-2">Complete voting in polls to unlock AI-generated insights about your preferences!</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {insights.map((insight, index) => (
                      <div key={index} className="border-l-4 border-l-purple-500 pl-4 py-4 bg-purple-50/50">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-purple-900">{insight.poll_title}</h3>
                            <div className="text-xs text-purple-600">
                              Generated {new Date(insight.generated_at).toLocaleString()}
                            </div>
                          </div>
                          <Badge className="bg-purple-600">
                            <Award className="h-3 w-3 mr-1" />
                            AI Insight
                          </Badge>
                        </div>
                        <p className="text-gray-700 leading-relaxed">{insight.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Settings */}
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Demographic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <MessageSquare className="h-4 w-4" />
                  <AlertDescription>
                    Demographic information helps provide better insights and is used for aggregate analysis.
                    This data is optional and kept private.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Age Group</Label>
                    <Select
                      value={demographics.age_group}
                      onValueChange={(value) => setDemographics(prev => ({ ...prev, age_group: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select age group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="18-24">18-24</SelectItem>
                        <SelectItem value="25-34">25-34</SelectItem>
                        <SelectItem value="35-44">35-44</SelectItem>
                        <SelectItem value="45-54">45-54</SelectItem>
                        <SelectItem value="55-64">55-64</SelectItem>
                        <SelectItem value="65+">65+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select
                      value={demographics.gender}
                      onValueChange={(value) => setDemographics(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Ethnicity</Label>
                    <Select
                      value={demographics.ethnicity}
                      onValueChange={(value) => setDemographics(prev => ({ ...prev, ethnicity: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select ethnicity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="white">White</SelectItem>
                        <SelectItem value="black">Black/African American</SelectItem>
                        <SelectItem value="hispanic">Hispanic/Latino</SelectItem>
                        <SelectItem value="asian">Asian</SelectItem>
                        <SelectItem value="native">Native American</SelectItem>
                        <SelectItem value="mixed">Mixed Race</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Political Affiliation</Label>
                    <Select
                      value={demographics.political_party}
                      onValueChange={(value) => setDemographics(prev => ({ ...prev, political_party: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select affiliation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="democrat">Democrat</SelectItem>
                        <SelectItem value="republican">Republican</SelectItem>
                        <SelectItem value="independent">Independent</SelectItem>
                        <SelectItem value="green">Green Party</SelectItem>
                        <SelectItem value="libertarian">Libertarian</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={updateDemographics} className="w-full">
                  Save Demographics
                </Button>

                <div className="pt-4 border-t text-sm text-gray-600">
                  <div className="mb-2"><strong>Data Usage:</strong></div>
                  <ul className="space-y-1">
                    <li>• Used for aggregate demographic analysis</li>
                    <li>• Helps improve AI-generated insights</li>
                    <li>• Never shared with third parties</li>
                    <li>• Can be updated or removed anytime</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TestLayout>
  );
}
"use client";

import { useState, useEffect } from "react";
import { TestLayout } from "@/components/test/TestLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  Users,
  Vote,
  Activity,
  Shield,
  Settings,
  TrendingUp,
  PieChart,
  Calendar,
  Database
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SystemStats {
  total_users: number;
  anonymous_users: number;
  authenticated_users: number;
  total_polls: number;
  active_polls: number;
  total_votes: number;
  total_statements: number;
  pending_statements: number;
}

interface PollAnalytics {
  id: string;
  title: string;
  status: string;
  participants: number;
  total_votes: number;
  statements: number;
  engagement_rate: number;
  last_activity: string;
}

interface UserManagement {
  id: string;
  name: string;
  email: string;
  type: 'anonymous' | 'authenticated';
  polls_participated: number;
  votes_cast: number;
  statements_submitted: number;
  role: string;
  created_at: string;
}

interface VoteDistribution {
  statement_id: string;
  statement_content: string;
  poll_title: string;
  agree: number;
  neutral: number;
  disagree: number;
  total: number;
  engagement: number;
}

export default function TestAnalyticsPage() {
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [pollAnalytics, setPollAnalytics] = useState<PollAnalytics[]>([]);
  const [userManagement, setUserManagement] = useState<UserManagement[]>([]);
  const [voteDistribution, setVoteDistribution] = useState<VoteDistribution[]>([]);
  const [selectedPoll, setSelectedPoll] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const loadAnalyticsData = async () => {
    setLoading(true);
    try {
      // This would call various analytics services
      const mockSystemStats: SystemStats = {
        total_users: 1247,
        anonymous_users: 834,
        authenticated_users: 413,
        total_polls: 15,
        active_polls: 6,
        total_votes: 8934,
        total_statements: 156,
        pending_statements: 12
      };

      const mockPollAnalytics: PollAnalytics[] = [
        {
          id: "1",
          title: "Climate Action Survey",
          status: "published",
          participants: 234,
          total_votes: 1876,
          statements: 12,
          engagement_rate: 87.5,
          last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          title: "Municipal Budget Priorities",
          status: "published",
          participants: 189,
          total_votes: 1134,
          statements: 8,
          engagement_rate: 75.2,
          last_activity: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          title: "Transportation Planning",
          status: "published",
          participants: 156,
          total_votes: 936,
          statements: 15,
          engagement_rate: 62.1,
          last_activity: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockUserManagement: UserManagement[] = [
        {
          id: "1",
          name: "John Smith",
          email: "john@example.com",
          type: "authenticated",
          polls_participated: 3,
          votes_cast: 25,
          statements_submitted: 2,
          role: "user",
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "2",
          name: "Anonymous User #1234",
          email: "",
          type: "anonymous",
          polls_participated: 1,
          votes_cast: 8,
          statements_submitted: 0,
          role: "user",
          created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: "3",
          name: "Sarah Johnson",
          email: "sarah@example.com",
          type: "authenticated",
          polls_participated: 5,
          votes_cast: 42,
          statements_submitted: 1,
          role: "admin",
          created_at: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];

      const mockVoteDistribution: VoteDistribution[] = [
        {
          statement_id: "1",
          statement_content: "The city should invest more in renewable energy infrastructure",
          poll_title: "Climate Action Survey",
          agree: 178,
          neutral: 32,
          disagree: 24,
          total: 234,
          engagement: 87.2
        },
        {
          statement_id: "2",
          statement_content: "Public transportation should be free to reduce emissions",
          poll_title: "Climate Action Survey",
          agree: 156,
          neutral: 45,
          disagree: 33,
          total: 234,
          engagement: 82.1
        }
      ];

      setSystemStats(mockSystemStats);
      setPollAnalytics(mockPollAnalytics);
      setUserManagement(mockUserManagement);
      setVoteDistribution(mockVoteDistribution);

      toast({ title: "Analytics loaded", description: "System analytics and statistics loaded successfully" });
    } catch (error) {
      toast({ title: "Error loading analytics", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      setUserManagement(prev => prev.map(user =>
        user.id === userId ? { ...user, role: newRole } : user
      ));
      toast({ title: "Role updated", description: `User role changed to ${newRole}` });
    } catch (error) {
      toast({ title: "Error updating role", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  const exportData = async (dataType: string) => {
    try {
      // This would trigger data export functionality
      toast({ title: "Export started", description: `${dataType} data export has been initiated` });
    } catch (error) {
      toast({ title: "Export failed", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadAnalyticsData();
  }, []);

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-600">Admin</Badge>;
      case 'moderator':
        return <Badge className="bg-yellow-600">Moderator</Badge>;
      default:
        return <Badge variant="secondary">User</Badge>;
    }
  };

  const getEngagementColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <TestLayout
      title="📈 Analytics & Administration"
      description="Test analytics, user management, role assignment, and system statistics"
    >
      <div className="space-y-6">
        <Alert>
          <BarChart3 className="h-4 w-4" />
          <AlertDescription>
            This interface tests system analytics, user role management, and administrative tools.
            Monitor poll performance, user engagement, and manage system-wide settings.
          </AlertDescription>
        </Alert>

        {/* System Overview */}
        {systemStats && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>System Overview</span>
                <Button onClick={loadAnalyticsData} disabled={loading} size="sm">
                  {loading ? "Loading..." : "Refresh Data"}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                  <div className="text-2xl font-bold text-blue-600">{systemStats.total_users}</div>
                  <div className="text-sm text-gray-600">Total Users</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemStats.authenticated_users} auth, {systemStats.anonymous_users} anon
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Vote className="h-8 w-8 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{systemStats.total_polls}</div>
                  <div className="text-sm text-gray-600">Total Polls</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemStats.active_polls} active
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Activity className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                  <div className="text-2xl font-bold text-purple-600">{systemStats.total_votes}</div>
                  <div className="text-sm text-gray-600">Total Votes</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {Math.round(systemStats.total_votes / systemStats.total_users)} avg per user
                  </div>
                </div>

                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <Database className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                  <div className="text-2xl font-bold text-orange-600">{systemStats.total_statements}</div>
                  <div className="text-sm text-gray-600">Statements</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemStats.pending_statements} pending
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="polls" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="polls">Poll Analytics</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="votes">Vote Analysis</TabsTrigger>
            <TabsTrigger value="export">Data Export</TabsTrigger>
          </TabsList>

          {/* Poll Analytics */}
          <TabsContent value="polls" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Poll Performance Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Poll</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Participants</TableHead>
                      <TableHead>Votes</TableHead>
                      <TableHead>Statements</TableHead>
                      <TableHead>Engagement</TableHead>
                      <TableHead>Last Activity</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pollAnalytics.map((poll) => (
                      <TableRow key={poll.id}>
                        <TableCell>
                          <div className="font-medium">{poll.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={poll.status === 'published' ? 'default' : 'outline'}>
                            {poll.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{poll.participants}</TableCell>
                        <TableCell>{poll.total_votes}</TableCell>
                        <TableCell>{poll.statements}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={`font-medium ${getEngagementColor(poll.engagement_rate)}`}>
                              {poll.engagement_rate}%
                            </div>
                            <Progress value={poll.engagement_rate} className="w-20 h-2" />
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(poll.last_activity).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* User Management */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  User Role Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Activity</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userManagement.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.name}</div>
                            {user.email && (
                              <div className="text-sm text-gray-500">{user.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.type === 'authenticated' ? 'default' : 'secondary'}>
                            {user.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{user.polls_participated} polls</div>
                            <div className="text-gray-500">{user.votes_cast} votes</div>
                          </div>
                        </TableCell>
                        <TableCell>{getRoleBadge(user.role)}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {new Date(user.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Select
                            value={user.role}
                            onValueChange={(newRole) => updateUserRole(user.id, newRole)}
                          >
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Vote Analysis */}
          <TabsContent value="votes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Vote Distribution Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {voteDistribution.map((distribution, index) => (
                  <div key={index} className="border-l-4 border-l-blue-500 pl-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{distribution.poll_title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{distribution.statement_content}</p>
                      </div>
                      <Badge variant="outline">
                        {distribution.total} votes
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      {/* Agree */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm text-green-700 font-medium">Agree</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-green-600 h-6 rounded-full flex items-center justify-end px-2"
                            style={{ width: `${(distribution.agree / distribution.total) * 100}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {Math.round((distribution.agree / distribution.total) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-right font-medium">
                          {distribution.agree}
                        </div>
                      </div>

                      {/* Neutral */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm text-gray-700 font-medium">Neutral</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-gray-600 h-6 rounded-full flex items-center justify-end px-2"
                            style={{ width: `${(distribution.neutral / distribution.total) * 100}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {Math.round((distribution.neutral / distribution.total) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-right font-medium">
                          {distribution.neutral}
                        </div>
                      </div>

                      {/* Disagree */}
                      <div className="flex items-center gap-3">
                        <div className="w-16 text-sm text-red-700 font-medium">Disagree</div>
                        <div className="flex-1 bg-gray-200 rounded-full h-6">
                          <div
                            className="bg-red-600 h-6 rounded-full flex items-center justify-end px-2"
                            style={{ width: `${(distribution.disagree / distribution.total) * 100}%` }}
                          >
                            <span className="text-white text-xs font-medium">
                              {Math.round((distribution.disagree / distribution.total) * 100)}%
                            </span>
                          </div>
                        </div>
                        <div className="w-16 text-sm text-right font-medium">
                          {distribution.disagree}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Export */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data Export & System Tools
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Settings className="h-4 w-4" />
                  <AlertDescription>
                    Export system data for analysis, backup, or compliance purposes.
                    All exports respect user privacy settings and data retention policies.
                  </AlertDescription>
                </Alert>

                <div className="grid grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Poll Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Export poll results, statements, and vote distributions
                      </p>
                      <Button onClick={() => exportData("Poll")} className="w-full">
                        Export Poll Data (CSV)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">User Analytics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Export aggregated user participation and engagement metrics
                      </p>
                      <Button onClick={() => exportData("User")} className="w-full">
                        Export User Analytics (JSON)
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">System Logs</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Export system activity logs and audit trails
                      </p>
                      <Button onClick={() => exportData("System")} variant="outline" className="w-full">
                        Export System Logs
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Backup Data</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-gray-600">
                        Create full system backup for disaster recovery
                      </p>
                      <Button onClick={() => exportData("Backup")} variant="outline" className="w-full">
                        Generate Backup
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Testing Tools</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <Button variant="outline" size="sm">
                      Generate Test Data
                    </Button>
                    <Button variant="outline" size="sm">
                      Clear Cache
                    </Button>
                    <Button variant="outline" size="sm">
                      Run Health Check
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TestLayout>
  );
}
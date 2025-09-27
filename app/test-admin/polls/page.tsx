"use client";

import { useState, useEffect } from "react";
import { TestLayout } from "@/components/test/TestLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Edit, Trash2, Play, Pause, Eye, Calendar, Settings, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Poll {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'closed';
  start_time: string;
  end_time: string;
  min_statements_voted_to_end: number;
  allow_user_statements: boolean;
  auto_approve_statements: boolean;
  created_at: string;
}

export default function TestPollManagementPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  // Create Poll Form State
  const [newPoll, setNewPoll] = useState({
    title: "",
    description: "",
    start_time: "",
    end_time: "",
    min_statements_voted_to_end: 5,
    allow_user_statements: true,
    auto_approve_statements: false,
    agree_button_label: "",
    disagree_button_label: "",
    unsure_button_label: ""
  });

  const loadPolls = async () => {
    setLoading(true);
    try {
      // This would call a server action to fetch polls
      // For now, we'll use mock data
      const mockPolls: Poll[] = [
        {
          id: "1",
          title: "Climate Action Survey",
          description: "Community input on climate initiatives",
          status: "published",
          start_time: new Date().toISOString(),
          end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          min_statements_voted_to_end: 5,
          allow_user_statements: true,
          auto_approve_statements: false,
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          title: "Budget Priorities",
          description: "Help prioritize municipal budget allocation",
          status: "draft",
          start_time: "",
          end_time: "",
          min_statements_voted_to_end: 3,
          allow_user_statements: false,
          auto_approve_statements: true,
          created_at: new Date().toISOString()
        }
      ];
      setPolls(mockPolls);
      toast({ title: "Polls loaded", description: `Found ${mockPolls.length} polls` });
    } catch (error) {
      toast({ title: "Error loading polls", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createPoll = async () => {
    setLoading(true);
    try {
      // This would call the PollService.createPoll method
      const newPollData = {
        ...newPoll,
        id: Date.now().toString(),
        status: 'draft' as const,
        created_at: new Date().toISOString()
      };

      setPolls(prev => [newPollData, ...prev]);
      setNewPoll({
        title: "",
        description: "",
        start_time: "",
        end_time: "",
        min_statements_voted_to_end: 5,
        allow_user_statements: true,
        auto_approve_statements: false,
        agree_button_label: "",
        disagree_button_label: "",
        unsure_button_label: ""
      });
      setShowCreateForm(false);

      toast({ title: "Poll created", description: "New poll created successfully" });
    } catch (error) {
      toast({ title: "Error creating poll", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const updatePollStatus = async (pollId: string, newStatus: 'draft' | 'published' | 'closed') => {
    try {
      setPolls(prev => prev.map(poll =>
        poll.id === pollId ? { ...poll, status: newStatus } : poll
      ));
      toast({ title: "Poll updated", description: `Poll status changed to ${newStatus}` });
    } catch (error) {
      toast({ title: "Error updating poll", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  const deletePoll = async (pollId: string) => {
    if (!confirm("Are you sure you want to delete this poll?")) return;

    try {
      setPolls(prev => prev.filter(poll => poll.id !== pollId));
      toast({ title: "Poll deleted", description: "Poll removed successfully" });
    } catch (error) {
      toast({ title: "Error deleting poll", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadPolls();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'published':
        return <Badge className="bg-green-600">Published</Badge>;
      case 'closed':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <TestLayout
      title="📊 Poll Management"
      description="Create, edit, and manage poll lifecycle (draft → published → closed)"
    >
      <div className="space-y-6">
        <Alert>
          <Settings className="h-4 w-4" />
          <AlertDescription>
            This interface tests the PollService methods for CRUD operations and lifecycle management.
            Test creating polls in draft mode, publishing them, and managing their settings.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list">Poll List</TabsTrigger>
            <TabsTrigger value="create">Create Poll</TabsTrigger>
          </TabsList>

          {/* Poll List */}
          <TabsContent value="list" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>All Polls</span>
                  <Button onClick={loadPolls} disabled={loading}>
                    {loading ? "Loading..." : "Refresh"}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {polls.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No polls found. Create your first poll using the &quot;Create Poll&quot; tab.
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Title</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Settings</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {polls.map((poll) => (
                          <TableRow key={poll.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{poll.title}</div>
                                <div className="text-sm text-gray-500 truncate max-w-xs">
                                  {poll.description}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(poll.status)}</TableCell>
                            <TableCell>
                              <div className="text-xs space-y-1">
                                <div>Min votes: {poll.min_statements_voted_to_end}</div>
                                <div>User statements: {poll.allow_user_statements ? "Yes" : "No"}</div>
                                <div>Auto-approve: {poll.auto_approve_statements ? "Yes" : "No"}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {poll.status === 'draft' && (
                                  <Button
                                    size="sm"
                                    onClick={() => updatePollStatus(poll.id, 'published')}
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Publish
                                  </Button>
                                )}
                                {poll.status === 'published' && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updatePollStatus(poll.id, 'closed')}
                                  >
                                    <Pause className="h-3 w-3 mr-1" />
                                    Close
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deletePoll(poll.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Poll */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Poll
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Poll Title</Label>
                    <Input
                      id="title"
                      value={newPoll.title}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter poll title..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="min-votes">Minimum Votes Required</Label>
                    <Input
                      id="min-votes"
                      type="number"
                      min="1"
                      value={newPoll.min_statements_voted_to_end}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, min_statements_voted_to_end: parseInt(e.target.value) || 1 }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newPoll.description}
                    onChange={(e) => setNewPoll(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the poll purpose and context..."
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start-time">Start Time (Optional)</Label>
                    <Input
                      id="start-time"
                      type="datetime-local"
                      value={newPoll.start_time}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, start_time: e.target.value }))}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end-time">End Time (Optional)</Label>
                    <Input
                      id="end-time"
                      type="datetime-local"
                      value={newPoll.end_time}
                      onChange={(e) => setNewPoll(prev => ({ ...prev, end_time: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-user-statements">Allow User-Submitted Statements</Label>
                    <Switch
                      id="allow-user-statements"
                      checked={newPoll.allow_user_statements}
                      onCheckedChange={(checked) => setNewPoll(prev => ({ ...prev, allow_user_statements: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-approve">Auto-Approve User Statements</Label>
                    <Switch
                      id="auto-approve"
                      checked={newPoll.auto_approve_statements}
                      onCheckedChange={(checked) => setNewPoll(prev => ({ ...prev, auto_approve_statements: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h4 className="font-medium">Custom Button Labels (Optional)</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Agree Button</Label>
                      <Input
                        value={newPoll.agree_button_label}
                        onChange={(e) => setNewPoll(prev => ({ ...prev, agree_button_label: e.target.value }))}
                        placeholder="Agree (default)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Disagree Button</Label>
                      <Input
                        value={newPoll.disagree_button_label}
                        onChange={(e) => setNewPoll(prev => ({ ...prev, disagree_button_label: e.target.value }))}
                        placeholder="Disagree (default)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Neutral Button</Label>
                      <Input
                        value={newPoll.unsure_button_label}
                        onChange={(e) => setNewPoll(prev => ({ ...prev, unsure_button_label: e.target.value }))}
                        placeholder="Neutral (default)"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button onClick={createPoll} disabled={loading || !newPoll.title.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Poll (Draft)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setNewPoll({
                        title: "",
                        description: "",
                        start_time: "",
                        end_time: "",
                        min_statements_voted_to_end: 5,
                        allow_user_statements: true,
                        auto_approve_statements: false,
                        agree_button_label: "",
                        disagree_button_label: "",
                        unsure_button_label: ""
                      });
                    }}
                  >
                    Clear Form
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </TestLayout>
  );
}
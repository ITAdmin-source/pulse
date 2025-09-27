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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle, XCircle, Clock, Plus, FileText, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Statement {
  id: string;
  poll_id: string;
  poll_title: string;
  content: string;
  is_approved: boolean | null; // null = pending, true = approved, false = rejected (then deleted)
  submitted_by_user: string | null;
  created_at: string;
}

export default function TestStatementManagementPage() {
  const [statements, setStatements] = useState<Statement[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPollId, setSelectedPollId] = useState<string>("");
  const { toast } = useToast();

  // Create Statement Form State
  const [newStatement, setNewStatement] = useState({
    poll_id: "",
    content: ""
  });

  const mockPolls = [
    { id: "1", title: "Climate Action Survey" },
    { id: "2", title: "Budget Priorities" },
    { id: "3", title: "Community Development" }
  ];

  const loadStatements = async (pollId?: string) => {
    setLoading(true);
    try {
      // This would call StatementService.getStatements
      // For now, we'll use mock data
      const mockStatements: Statement[] = [
        {
          id: "1",
          poll_id: "1",
          poll_title: "Climate Action Survey",
          content: "The city should invest more in renewable energy infrastructure",
          is_approved: null, // pending approval
          submitted_by_user: "user123",
          created_at: new Date().toISOString()
        },
        {
          id: "2",
          poll_id: "1",
          poll_title: "Climate Action Survey",
          content: "Public transportation should be free to reduce carbon emissions",
          is_approved: true, // approved
          submitted_by_user: "user456",
          created_at: new Date().toISOString()
        },
        {
          id: "3",
          poll_id: "2",
          poll_title: "Budget Priorities",
          content: "More funding should go to education programs",
          is_approved: null, // pending approval
          submitted_by_user: null, // admin created
          created_at: new Date().toISOString()
        },
        {
          id: "4",
          poll_id: "1",
          poll_title: "Climate Action Survey",
          content: "Electric vehicle charging stations should be installed citywide",
          is_approved: true, // approved
          submitted_by_user: "user789",
          created_at: new Date().toISOString()
        }
      ];

      const filteredStatements = pollId
        ? mockStatements.filter(s => s.poll_id === pollId)
        : mockStatements;

      setStatements(filteredStatements);
      toast({ title: "Statements loaded", description: `Found ${filteredStatements.length} statements` });
    } catch (error) {
      toast({ title: "Error loading statements", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const createStatement = async () => {
    if (!newStatement.poll_id || !newStatement.content.trim()) {
      toast({ title: "Validation Error", description: "Please select a poll and enter statement content", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const selectedPoll = mockPolls.find(p => p.id === newStatement.poll_id);
      const statementData: Statement = {
        id: Date.now().toString(),
        poll_id: newStatement.poll_id,
        poll_title: selectedPoll?.title || "Unknown Poll",
        content: newStatement.content,
        is_approved: null, // pending by default
        submitted_by_user: null, // admin created
        created_at: new Date().toISOString()
      };

      setStatements(prev => [statementData, ...prev]);
      setNewStatement({ poll_id: "", content: "" });

      toast({ title: "Statement created", description: "New statement created and pending approval" });
    } catch (error) {
      toast({ title: "Error creating statement", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const approveStatement = async (statementId: string) => {
    try {
      setStatements(prev => prev.map(statement =>
        statement.id === statementId ? { ...statement, is_approved: true } : statement
      ));
      toast({ title: "Statement approved", description: "Statement is now visible to voters" });
    } catch (error) {
      toast({ title: "Error approving statement", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  const rejectStatement = async (statementId: string) => {
    if (!confirm("Are you sure you want to reject this statement? It will be deleted permanently.")) return;

    try {
      // In the real system, rejected statements are deleted, not just marked
      setStatements(prev => prev.filter(statement => statement.id !== statementId));
      toast({ title: "Statement rejected", description: "Statement has been deleted" });
    } catch (error) {
      toast({ title: "Error rejecting statement", description: error instanceof Error ? error.message : "Unknown error", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadStatements();
  }, []);

  const getApprovalBadge = (isApproved: boolean | null) => {
    if (isApproved === null) {
      return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
    if (isApproved === true) {
      return <Badge className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    }
    return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
  };

  const pendingCount = statements.filter(s => s.is_approved === null).length;
  const approvedCount = statements.filter(s => s.is_approved === true).length;

  return (
    <TestLayout
      title="📝 Statement Management"
      description="Test statement creation, approval workflow, and moderation queue"
    >
      <div className="space-y-6">
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            This interface tests the StatementService methods for statement CRUD operations and the approval workflow.
            Rejected statements are permanently deleted (not archived).
          </AlertDescription>
        </Alert>

        {pendingCount > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <strong>{pendingCount} statement{pendingCount > 1 ? 's' : ''}</strong> pending approval
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="moderation" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="moderation">
              Moderation Queue ({pendingCount})
            </TabsTrigger>
            <TabsTrigger value="approved">
              Approved ({approvedCount})
            </TabsTrigger>
            <TabsTrigger value="create">Create Statement</TabsTrigger>
          </TabsList>

          {/* Moderation Queue */}
          <TabsContent value="moderation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Pending Approval</span>
                  <div className="flex gap-2">
                    <Select value={selectedPollId} onValueChange={(value) => {
                      setSelectedPollId(value);
                      loadStatements(value);
                    }}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Filter by poll" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Polls</SelectItem>
                        {mockPolls.map(poll => (
                          <SelectItem key={poll.id} value={poll.id}>
                            {poll.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={() => loadStatements(selectedPollId)} disabled={loading}>
                      {loading ? "Loading..." : "Refresh"}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {statements.filter(s => s.is_approved === null).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No statements pending approval.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statements.filter(s => s.is_approved === null).map((statement) => (
                      <div key={statement.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="space-y-1">
                            <Badge variant="outline">{statement.poll_title}</Badge>
                            {statement.submitted_by_user && (
                              <div className="text-xs text-gray-500">
                                User submitted: {statement.submitted_by_user}
                              </div>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(statement.created_at).toLocaleString()}
                          </div>
                        </div>

                        <div className="mb-4">
                          <p className="text-sm font-medium mb-2">Statement Content:</p>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded">
                            {statement.content}
                          </p>
                        </div>

                        <div className="flex gap-3">
                          <Button
                            size="sm"
                            onClick={() => approveStatement(statement.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectStatement(statement.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject & Delete
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Approved Statements */}
          <TabsContent value="approved" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Approved Statements</CardTitle>
              </CardHeader>
              <CardContent>
                {statements.filter(s => s.is_approved === true).length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No approved statements yet.
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Poll</TableHead>
                        <TableHead>Content</TableHead>
                        <TableHead>Submitted By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {statements.filter(s => s.is_approved === true).map((statement) => (
                        <TableRow key={statement.id}>
                          <TableCell>
                            <Badge variant="outline">{statement.poll_title}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="max-w-md truncate">{statement.content}</div>
                          </TableCell>
                          <TableCell>
                            {statement.submitted_by_user ? (
                              <div className="text-sm">
                                User: {statement.submitted_by_user}
                              </div>
                            ) : (
                              <Badge variant="secondary">Admin</Badge>
                            )}
                          </TableCell>
                          <TableCell>{getApprovalBadge(statement.is_approved)}</TableCell>
                          <TableCell className="text-xs text-gray-500">
                            {new Date(statement.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Create Statement */}
          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="poll-select">Target Poll</Label>
                  <Select
                    value={newStatement.poll_id}
                    onValueChange={(value) => setNewStatement(prev => ({ ...prev, poll_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select poll for this statement" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockPolls.map(poll => (
                        <SelectItem key={poll.id} value={poll.id}>
                          {poll.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statement-content">Statement Content</Label>
                  <Textarea
                    id="statement-content"
                    value={newStatement.content}
                    onChange={(e) => setNewStatement(prev => ({ ...prev, content: e.target.value }))}
                    placeholder="Enter the statement that users will vote on..."
                    rows={4}
                  />
                  <div className="text-xs text-gray-500">
                    Write a clear, concise statement that users can agree or disagree with.
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Statement Guidelines:</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• Keep statements neutral and factual</li>
                    <li>• Avoid leading or biased language</li>
                    <li>• Make statements specific and actionable</li>
                    <li>• Ensure statements can be clearly agreed/disagreed with</li>
                  </ul>
                </div>

                <div className="flex gap-4">
                  <Button onClick={createStatement} disabled={loading || !newStatement.poll_id || !newStatement.content.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Statement (Pending Approval)
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setNewStatement({ poll_id: "", content: "" })}
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
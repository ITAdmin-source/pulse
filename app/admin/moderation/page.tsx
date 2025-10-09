"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CheckCircle, XCircle, Search, Loader2 } from "lucide-react";
import { getPendingStatementsAction, approveStatementAction, rejectStatementAction } from "@/actions/statements-actions";
import { getPublishedPollsAction } from "@/actions/polls-actions";
import { toast } from "sonner";

interface Statement {
  id: string;
  text: string;
  pollId: string | null;
  submittedBy: string | null;
  createdAt: Date;
}

interface Poll {
  id: string;
  question: string;
}

export default function ModerationQueuePage() {
  const [selectedStatements, setSelectedStatements] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [pollFilter, setPollFilter] = useState("all");
  const [sortBy, setSortBy] = useState("oldest");
  const [statements, setStatements] = useState<Statement[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch pending statements and polls
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [statementsResult, pollsResult] = await Promise.all([
          getPendingStatementsAction(),
          getPublishedPollsAction(),
        ]);

        if (statementsResult.success && statementsResult.data) {
          setStatements(statementsResult.data);
        } else {
          toast.error("Failed to load statements");
        }

        if (pollsResult.success && pollsResult.data) {
          setPolls(pollsResult.data);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load moderation queue");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const toggleStatement = (id: string) => {
    setSelectedStatements(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStatements.length === filteredStatements.length) {
      setSelectedStatements([]);
    } else {
      setSelectedStatements(filteredStatements.map(s => s.id));
    }
  };

  const handleApprove = async (id: string) => {
    setIsProcessing(true);
    try {
      const result = await approveStatementAction(id);
      if (result.success) {
        setStatements(statements.filter(s => s.id !== id));
        setSelectedStatements(selectedStatements.filter(sid => sid !== id));
        toast.success("Statement approved");
      } else {
        toast.error(result.error || "Failed to approve statement");
      }
    } catch (error) {
      console.error("Error approving statement:", error);
      toast.error("Failed to approve statement");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    setIsProcessing(true);
    try {
      const result = await rejectStatementAction(id);
      if (result.success) {
        setStatements(statements.filter(s => s.id !== id));
        setSelectedStatements(selectedStatements.filter(sid => sid !== id));
        toast.success("Statement rejected");
      } else {
        toast.error(result.error || "Failed to reject statement");
      }
    } catch (error) {
      console.error("Error rejecting statement:", error);
      toast.error("Failed to reject statement");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedStatements.length === 0) return;

    setIsProcessing(true);
    try {
      const results = await Promise.all(
        selectedStatements.map(id => approveStatementAction(id))
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      setStatements(statements.filter(s => !selectedStatements.includes(s.id)));
      setSelectedStatements([]);

      if (failCount === 0) {
        toast.success(`${successCount} statements approved`);
      } else {
        toast.warning(`${successCount} approved, ${failCount} failed`);
      }
    } catch (error) {
      console.error("Error bulk approving:", error);
      toast.error("Failed to approve statements");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkReject = async () => {
    if (selectedStatements.length === 0) return;

    setIsProcessing(true);
    try {
      const results = await Promise.all(
        selectedStatements.map(id => rejectStatementAction(id))
      );

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      setStatements(statements.filter(s => !selectedStatements.includes(s.id)));
      setSelectedStatements([]);

      if (failCount === 0) {
        toast.success(`${successCount} statements rejected`);
      } else {
        toast.warning(`${successCount} rejected, ${failCount} failed`);
      }
    } catch (error) {
      console.error("Error bulk rejecting:", error);
      toast.error("Failed to reject statements");
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter and sort statements
  const filteredStatements = statements
    .filter(statement => {
      // Poll filter
      if (pollFilter !== "all" && statement.pollId !== pollFilter) return false;

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return statement.text.toLowerCase().includes(query);
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

  // Get poll question for a statement
  const getPollQuestion = (pollId: string | null) => {
    if (!pollId) return "Unknown Poll";
    const poll = polls.find(p => p.id === pollId);
    return poll?.question || "Unknown Poll";
  };

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return "Just now";
    if (hours < 24) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Main Content - Header is handled by AdaptiveHeader */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {!isLoading && (
          <>
            {/* Filters */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Filter by Poll</label>
                    <Select value={pollFilter} onValueChange={setPollFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Polls</SelectItem>
                        {polls.map(poll => (
                          <SelectItem key={poll.id} value={poll.id}>
                            {poll.question}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sort by</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search statements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

            {/* Statements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Pending ({filteredStatements.length})</CardTitle>
                  {selectedStatements.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleBulkApprove}
                        disabled={isProcessing}
                      >
                        <CheckCircle className="h-4 w-4 me-2" />
                        Approve Selected ({selectedStatements.length})
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleBulkReject}
                        disabled={isProcessing}
                      >
                        <XCircle className="h-4 w-4 me-2" />
                        Reject Selected ({selectedStatements.length})
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {filteredStatements.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedStatements.length === filteredStatements.length && filteredStatements.length > 0}
                      onCheckedChange={toggleAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All
                    </label>
                  </div>
                )}

                {filteredStatements.map((statement) => (
                  <div
                    key={statement.id}
                    className="flex gap-3 p-4 bg-gray-50 rounded-lg border"
                  >
                    <Checkbox
                      checked={selectedStatements.includes(statement.id)}
                      onCheckedChange={() => toggleStatement(statement.id)}
                    />
                    <div className="flex-grow space-y-2">
                      <p className="text-gray-900 font-medium">{statement.text}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Poll: {getPollQuestion(statement.pollId)}</span>
                        <span>•</span>
                        <span>By {statement.submittedBy || "Anonymous"}</span>
                        <span>•</span>
                        <span>{formatDate(statement.createdAt)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => handleApprove(statement.id)}
                          disabled={isProcessing}
                        >
                          <CheckCircle className="h-4 w-4 me-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleReject(statement.id)}
                          disabled={isProcessing}
                        >
                          <XCircle className="h-4 w-4 me-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredStatements.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-lg font-medium">No statements to moderate</p>
                    <p className="text-sm">All caught up!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  );
}

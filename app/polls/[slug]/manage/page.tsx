"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Edit, CheckCircle, XCircle, Trash2, Plus, Loader2 } from "lucide-react";
import {
  unpublishPollAction,
  closePollAction,
  getPollBySlugAction,
  publishPollAction,
  updatePollAction
} from "@/actions/polls-actions";
import {
  getStatementsByPollIdAction,
  approveStatementAction,
  rejectStatementAction,
  deleteStatementAction
} from "@/actions/statements-actions";
import {
  getUserRolesByPollIdAction,
  createUserRoleAction,
  deleteUserRoleAction,
} from "@/actions/user-roles-actions";
import { getUserByClerkIdAction } from "@/actions/users-actions";
import { EditStatementModal, AddStatementModal } from "@/components/modals";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ManagePageProps {
  params: Promise<{
    slug: string;
  }>;
}

interface Poll {
  id: string;
  slug: string;
  question: string;
  description?: string | null;
  status: string;
  totalVoters?: number;
  statementCount?: number;
}

interface Statement {
  id: string;
  createdAt: Date;
  pollId: string | null;
  text: string;
  submittedBy: string | null;
  approved: boolean | null;
  approvedBy: string | null;
  approvedAt: Date | null;
}

export default function ManagePage({ params }: ManagePageProps) {
  const router = useRouter();
  const { user } = useUser();
  const [selectedStatements, setSelectedStatements] = useState<string[]>([]);
  const [showUnpublishDialog, setShowUnpublishDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [poll, setPoll] = useState<Poll | null>(null);
  const [allStatements, setAllStatements] = useState<Statement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingStatement, setEditingStatement] = useState<Statement | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Role management state
  const [pollManagers, setPollManagers] = useState<Array<{ id: string; userId: string; role: string; userEmail?: string }>>([]);
  const [newManagerEmail, setNewManagerEmail] = useState("");
  const [isAddingManager, setIsAddingManager] = useState(false);

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    question: "",
    description: "",
    allowUserStatements: false,
    autoApproveStatements: false,
    supportButtonLabel: "",
    opposeButtonLabel: "",
    unsureButtonLabel: "",
    minStatementsVotedToEnd: 5,
    votingGoal: "",
  });

  // Helper function to reload statements
  const loadStatements = async () => {
    if (!poll?.id) return;
    try {
      const statementsResult = await getStatementsByPollIdAction(poll.id);
      if (statementsResult.success && statementsResult.data) {
        setAllStatements(statementsResult.data);
      }
    } catch (error) {
      console.error("Error loading statements:", error);
      toast.error("Failed to load statements");
    }
  };

  // Unwrap params and fetch poll data
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
        setPoll(fetchedPoll);

        // Initialize settings form with poll data
        setSettingsForm({
          question: fetchedPoll.question || "",
          description: fetchedPoll.description || "",
          allowUserStatements: fetchedPoll.allowUserStatements || false,
          autoApproveStatements: fetchedPoll.autoApproveStatements || false,
          supportButtonLabel: fetchedPoll.supportButtonLabel || "",
          opposeButtonLabel: fetchedPoll.opposeButtonLabel || "",
          unsureButtonLabel: fetchedPoll.unsureButtonLabel || "",
          minStatementsVotedToEnd: fetchedPoll.minStatementsVotedToEnd || 5,
          votingGoal: fetchedPoll.votingGoal?.toString() || "",
        });

        // Fetch statements for this poll
        const statementsResult = await getStatementsByPollIdAction(fetchedPoll.id);
        if (statementsResult.success && statementsResult.data) {
          setAllStatements(statementsResult.data);
        }

        // Fetch poll managers
        const rolesResult = await getUserRolesByPollIdAction(fetchedPoll.id);
        if (rolesResult.success && rolesResult.data) {
          setPollManagers(rolesResult.data);
        }
      } catch (error) {
        console.error("Error loading poll data:", error);
        toast.error("Failed to load poll data");
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [params, router]);

  // Separate pending and approved statements
  const pendingStatements = allStatements.filter(s => s.approved === null);
  const approvedStatements = allStatements.filter(s => s.approved === true);

  const toggleStatement = (id: string) => {
    setSelectedStatements(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedStatements.length === pendingStatements.length) {
      setSelectedStatements([]);
    } else {
      setSelectedStatements(pendingStatements.map(s => s.id));
    }
  };

  const handleUnpublish = async () => {
    if (!poll?.id) return;
    setIsProcessing(true);
    try {
      const result = await unpublishPollAction(poll.id);

      if (result.success) {
        setShowUnpublishDialog(false);
        toast.success("Poll unpublished successfully");
        // Update local state
        setPoll({ ...poll, status: "draft" });
      } else {
        toast.error(result.error || "Failed to unpublish poll");
      }
    } catch (error) {
      console.error("Error unpublishing poll:", error);
      toast.error("Failed to unpublish poll");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = async () => {
    if (!poll?.id) return;
    setIsProcessing(true);
    try {
      const result = await closePollAction(poll.id);

      if (result.success) {
        setShowCloseDialog(false);
        toast.success("Poll closed successfully");
        // Update local state
        setPoll({ ...poll, status: "closed" });
      } else {
        toast.error(result.error || "Failed to close poll");
      }
    } catch (error) {
      console.error("Error closing poll:", error);
      toast.error("Failed to close poll");
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePublish = async () => {
    if (!poll?.id) return;

    // Validate minimum 6 approved statements
    if (approvedStatements.length < 6) {
      toast.error("Cannot publish: Poll must have at least 6 approved statements");
      return;
    }

    setIsProcessing(true);
    try {
      const result = await publishPollAction(poll.id);

      if (result.success) {
        toast.success("Poll published successfully");
        setPoll({ ...poll, status: "published" });
      } else {
        toast.error(result.error || "Failed to publish poll");
      }
    } catch (error) {
      console.error("Error publishing poll:", error);
      toast.error("Failed to publish poll");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApproveStatement = async (statementId: string) => {
    try {
      const result = await approveStatementAction(statementId);
      if (result.success) {
        toast.success("Statement approved");
        // Update local state
        setAllStatements(prev =>
          prev.map(s => s.id === statementId ? { ...s, approved: true } : s)
        );
        setSelectedStatements(prev => prev.filter(id => id !== statementId));
      } else {
        toast.error(result.error || "Failed to approve statement");
      }
    } catch (error) {
      console.error("Error approving statement:", error);
      toast.error("Failed to approve statement");
    }
  };

  const handleRejectStatement = async (statementId: string) => {
    try {
      const result = await rejectStatementAction(statementId);
      if (result.success) {
        toast.success("Statement rejected");
        // Remove from local state (rejected = deleted per spec)
        setAllStatements(prev => prev.filter(s => s.id !== statementId));
        setSelectedStatements(prev => prev.filter(id => id !== statementId));
      } else {
        toast.error(result.error || "Failed to reject statement");
      }
    } catch (error) {
      console.error("Error rejecting statement:", error);
      toast.error("Failed to reject statement");
    }
  };

  const handleBulkApprove = async () => {
    // Optimistic UI update
    const selectedIds = [...selectedStatements];
    setAllStatements(prev =>
      prev.map(s => selectedIds.includes(s.id) ? { ...s, approved: true } : s)
    );
    setSelectedStatements([]);

    try {
      const results = await Promise.all(
        selectedIds.map(id => approveStatementAction(id))
      );
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        // Rollback failed approvals
        const failedIds = selectedIds.filter((id, idx) => !results[idx].success);
        setAllStatements(prev =>
          prev.map(s => failedIds.includes(s.id) ? { ...s, approved: null } : s)
        );
        toast.error(`${failedCount} statement(s) failed to approve`);
      } else {
        toast.success(`${successCount} statement(s) approved`);
      }
    } catch (error) {
      console.error("Error bulk approving statements:", error);
      // Rollback all on error
      setAllStatements(prev =>
        prev.map(s => selectedIds.includes(s.id) ? { ...s, approved: null } : s)
      );
      toast.error("Failed to approve statements");
    }
  };

  const handleBulkReject = async () => {
    // Optimistic UI update
    const selectedIds = [...selectedStatements];
    const removedStatements = allStatements.filter(s => selectedIds.includes(s.id));
    setAllStatements(prev => prev.filter(s => !selectedIds.includes(s.id)));
    setSelectedStatements([]);

    try {
      const results = await Promise.all(
        selectedIds.map(id => rejectStatementAction(id))
      );
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;

      if (failedCount > 0) {
        // Rollback failed rejections
        const failedIds = selectedIds.filter((id, idx) => !results[idx].success);
        const statementsToRestore = removedStatements.filter(s => failedIds.includes(s.id));
        setAllStatements(prev => [...prev, ...statementsToRestore]);
        toast.error(`${failedCount} statement(s) failed to reject`);
      } else {
        toast.success(`${successCount} statement(s) rejected`);
      }
    } catch (error) {
      console.error("Error bulk rejecting statements:", error);
      // Rollback all on error
      setAllStatements(prev => [...prev, ...removedStatements]);
      toast.error("Failed to reject statements");
    }
  };

  const handleDeleteStatement = async (statementId: string) => {
    if (!confirm("Delete this statement? All votes will be lost.")) {
      return;
    }

    try {
      const result = await deleteStatementAction(statementId);
      if (result.success) {
        toast.success("Statement deleted");
        await loadStatements();
      } else {
        toast.error(result.error || "Failed to delete statement");
      }
    } catch (error) {
      console.error("Error deleting statement:", error);
      toast.error("Failed to delete statement");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poll?.id) return;

    setIsSavingSettings(true);
    try {
      const updateData = {
        question: settingsForm.question,
        description: settingsForm.description || null,
        allowUserStatements: settingsForm.allowUserStatements,
        autoApproveStatements: settingsForm.autoApproveStatements,
        supportButtonLabel: settingsForm.supportButtonLabel || null,
        opposeButtonLabel: settingsForm.opposeButtonLabel || null,
        unsureButtonLabel: settingsForm.unsureButtonLabel || null,
        minStatementsVotedToEnd: settingsForm.minStatementsVotedToEnd,
        votingGoal: settingsForm.votingGoal ? parseInt(settingsForm.votingGoal) : null,
      };

      const result = await updatePollAction(poll.id, updateData);
      if (result.success) {
        toast.success("Settings saved successfully");
        // Update local poll state
        if (result.data) {
          setPoll(result.data);
        }
      } else {
        toast.error(result.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Role management handlers
  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poll?.id || !newManagerEmail.trim()) return;

    setIsAddingManager(true);
    try {
      // Try to find user by Clerk ID (email is used as identifier)
      const userResult = await getUserByClerkIdAction(newManagerEmail.trim());

      if (!userResult.success || !userResult.data) {
        toast.error("User not found. Make sure they have signed up.");
        return;
      }

      // Create poll manager role
      const roleResult = await createUserRoleAction({
        userId: userResult.data.id,
        role: "poll_manager",
        pollId: poll.id,
      });

      if (roleResult.success) {
        toast.success("Manager added successfully");
        setNewManagerEmail("");
        // Reload managers
        const rolesResult = await getUserRolesByPollIdAction(poll.id);
        if (rolesResult.success && rolesResult.data) {
          setPollManagers(rolesResult.data);
        }
      } else {
        toast.error(roleResult.error || "Failed to add manager");
      }
    } catch (error) {
      console.error("Error adding manager:", error);
      toast.error("Failed to add manager");
    } finally {
      setIsAddingManager(false);
    }
  };

  const handleRemoveManager = async (roleId: string) => {
    try {
      const result = await deleteUserRoleAction(roleId);
      if (result.success) {
        toast.success("Manager removed successfully");
        setPollManagers(prev => prev.filter(m => m.id !== roleId));
      } else {
        toast.error(result.error || "Failed to remove manager");
      }
    } catch (error) {
      console.error("Error removing manager:", error);
      toast.error("Failed to remove manager");
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Loading poll data...</p>
        </div>
      </div>
    );
  }

  // Show error state if poll not found
  if (!poll) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-900 text-xl mb-4">Poll not found</p>
          <Button asChild>
            <Link href="/polls">Back to Polls</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Calculate stats
  const stats = {
    voters: poll.totalVoters || 0,
    votes: poll.totalVoters || 0, // Use totalVoters as proxy for votes
    statements: approvedStatements.length,
    pending: pendingStatements.length,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/polls">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Polls
            </Link>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Poll Header */}
        <div className="mb-6 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{poll.question}</h1>
              <Badge variant={poll.status === "published" ? "default" : "secondary"}>
                {poll.status.toUpperCase()}
              </Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const settingsTab = document.querySelector('[value="settings"]');
                  if (settingsTab instanceof HTMLElement) {
                    settingsTab.click();
                  }
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {poll.status === "draft" && (
                <Button size="sm" onClick={handlePublish} disabled={isProcessing}>
                  {isProcessing ? "Publishing..." : "Publish"}
                </Button>
              )}
              {poll.status === "published" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowUnpublishDialog(true)}
                    disabled={isProcessing}
                  >
                    Unpublish
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowCloseDialog(true)}
                    disabled={isProcessing}
                  >
                    Close
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.voters}</p>
                  <p className="text-sm text-gray-600">Voters</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.votes}</p>
                  <p className="text-sm text-gray-600">Votes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.statements}</p>
                  <p className="text-sm text-gray-600">Statements</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="statements" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="statements">Statements</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="roles">Roles</TabsTrigger>
          </TabsList>

          {/* Statements Tab */}
          <TabsContent value="statements" className="space-y-4">
            {/* Pending Statements */}
            {pendingStatements.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Pending ({pendingStatements.length})</CardTitle>
                    {selectedStatements.length > 0 && (
                      <div className="flex gap-2">
                        <Button size="sm" variant="default" onClick={handleBulkApprove}>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Selected ({selectedStatements.length})
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkReject}>
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Selected ({selectedStatements.length})
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="select-all"
                      checked={selectedStatements.length === pendingStatements.length}
                      onCheckedChange={toggleAll}
                    />
                    <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                      Select All
                    </label>
                  </div>

                  {pendingStatements.map((statement) => (
                    <div
                      key={statement.id}
                      className="flex gap-3 p-4 bg-gray-50 rounded-lg border"
                    >
                      <Checkbox
                        checked={selectedStatements.includes(statement.id)}
                        onCheckedChange={() => toggleStatement(statement.id)}
                      />
                      <div className="flex-grow space-y-2">
                        <p className="text-gray-900">{statement.text}</p>
                        <p className="text-sm text-gray-500">
                          By {statement.submittedBy || "Anonymous"} • {new Date(statement.createdAt).toLocaleString()}
                        </p>
                        <div className="flex gap-2">
                          <Button size="sm" variant="default" onClick={() => handleApproveStatement(statement.id)}>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleRejectStatement(statement.id)}>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Approved Statements */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Approved ({approvedStatements.length})</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Statement
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {approvedStatements.map((statement) => (
                  <div
                    key={statement.id}
                    className="flex gap-3 p-4 bg-gray-50 rounded-lg border"
                  >
                    <div className="flex-grow space-y-2">
                      <p className="text-gray-900">{statement.text}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Submitted by {statement.submittedBy || "Anonymous"}
                        </span>
                        {statement.approvedAt && (
                          <span>
                            • Approved {new Date(statement.approvedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setEditingStatement(statement);
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteStatement(statement.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Participation Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Total Voters</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.voters}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Votes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.votes}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Avg Votes/User</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stats.voters > 0 ? (stats.votes / stats.voters).toFixed(1) : "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Statements</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.statements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Poll Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveSettings} className="space-y-6">
                  {/* Basic Info */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Basic Information</h3>

                    <div className="space-y-2">
                      <Label htmlFor="question">Poll Question *</Label>
                      <Input
                        id="question"
                        value={settingsForm.question}
                        onChange={(e) => setSettingsForm({ ...settingsForm, question: e.target.value })}
                        placeholder="What question do you want to ask?"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={settingsForm.description}
                        onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                        placeholder="Provide context for your poll..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Statement Settings */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Statement Settings</h3>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="allowUserStatements">Allow User Statements</Label>
                        <p className="text-sm text-gray-500">Let participants submit their own statements</p>
                      </div>
                      <Switch
                        id="allowUserStatements"
                        checked={settingsForm.allowUserStatements}
                        onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, allowUserStatements: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label htmlFor="autoApproveStatements">Auto-Approve Statements</Label>
                        <p className="text-sm text-gray-500">Automatically approve user-submitted statements</p>
                      </div>
                      <Switch
                        id="autoApproveStatements"
                        checked={settingsForm.autoApproveStatements}
                        onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, autoApproveStatements: checked })}
                        disabled={!settingsForm.allowUserStatements}
                      />
                    </div>
                  </div>

                  {/* Voting Settings */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Voting Settings</h3>

                    <div className="space-y-2">
                      <Label htmlFor="minStatements">Minimum Votes Required *</Label>
                      <Input
                        id="minStatements"
                        type="number"
                        min="1"
                        value={settingsForm.minStatementsVotedToEnd}
                        onChange={(e) => setSettingsForm({ ...settingsForm, minStatementsVotedToEnd: parseInt(e.target.value) || 1 })}
                        required
                      />
                      <p className="text-sm text-gray-500">Users must vote on at least this many statements</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="votingGoal">Voting Goal (Optional)</Label>
                      <Input
                        id="votingGoal"
                        type="number"
                        min="1"
                        value={settingsForm.votingGoal}
                        onChange={(e) => setSettingsForm({ ...settingsForm, votingGoal: e.target.value })}
                        placeholder="Target number of voters"
                      />
                    </div>
                  </div>

                  {/* Button Labels */}
                  <div className="space-y-4 pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-900">Custom Button Labels</h3>
                    <p className="text-sm text-gray-500">Override default button labels (max 10 characters)</p>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="supportLabel">Support Button</Label>
                        <Input
                          id="supportLabel"
                          maxLength={10}
                          value={settingsForm.supportButtonLabel}
                          onChange={(e) => setSettingsForm({ ...settingsForm, supportButtonLabel: e.target.value })}
                          placeholder="Agree"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="opposeLabel">Oppose Button</Label>
                        <Input
                          id="opposeLabel"
                          maxLength={10}
                          value={settingsForm.opposeButtonLabel}
                          onChange={(e) => setSettingsForm({ ...settingsForm, opposeButtonLabel: e.target.value })}
                          placeholder="Disagree"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unsureLabel">Unsure Button</Label>
                        <Input
                          id="unsureLabel"
                          maxLength={10}
                          value={settingsForm.unsureButtonLabel}
                          onChange={(e) => setSettingsForm({ ...settingsForm, unsureButtonLabel: e.target.value })}
                          placeholder="Unsure"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={isSavingSettings}>
                      {isSavingSettings ? "Saving..." : "Save Settings"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Roles Tab */}
          <TabsContent value="roles">
            <Card>
              <CardHeader>
                <CardTitle>Poll Managers</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  Managers can approve/reject statements and manage poll settings
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Add Manager Form */}
                <form onSubmit={handleAddManager} className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Enter user's Clerk ID or email"
                      value={newManagerEmail}
                      onChange={(e) => setNewManagerEmail(e.target.value)}
                      disabled={isAddingManager}
                    />
                  </div>
                  <Button type="submit" disabled={isAddingManager || !newManagerEmail.trim()}>
                    {isAddingManager ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Manager
                      </>
                    )}
                  </Button>
                </form>

                {/* Current Managers List */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-gray-700">Current Managers</h3>
                  {pollManagers.filter(m => m.role === "poll_manager").length === 0 ? (
                    <p className="text-gray-500 text-sm italic py-4">No managers assigned yet</p>
                  ) : (
                    <div className="space-y-2">
                      {pollManagers
                        .filter(m => m.role === "poll_manager")
                        .map((manager) => (
                          <div
                            key={manager.id}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <div className="flex items-center gap-3">
                              <Badge variant="secondary">Manager</Badge>
                              <span className="text-sm text-gray-700">
                                User ID: {manager.userId.slice(0, 8)}...
                              </span>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveManager(manager.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                    </div>
                  )}
                </div>

                {/* Owner Info */}
                <div className="border-t pt-4 mt-4">
                  <h3 className="font-semibold text-sm text-gray-700 mb-2">Poll Owner</h3>
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-3">
                      <Badge className="bg-blue-600">Owner</Badge>
                      <span className="text-sm text-gray-700">
                        {user?.id ? `You (${user.primaryEmailAddress?.emailAddress || 'Current user'})` : 'Unknown'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">
                      As the owner, you have full control over this poll including managing managers, settings, and lifecycle.
                    </p>
                  </div>
                </div>

                {/* Help Text */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-semibold text-sm text-gray-900 mb-2">How to add managers</h4>
                  <ol className="text-sm text-gray-600 space-y-1 list-decimal list-inside">
                    <li>Get the user&apos;s Clerk ID or email address</li>
                    <li>Ensure they have signed up for an account</li>
                    <li>Enter their Clerk ID above and click &quot;Add Manager&quot;</li>
                    <li>They will immediately gain manager permissions for this poll</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Unpublish Confirmation Dialog */}
      <AlertDialog open={showUnpublishDialog} onOpenChange={setShowUnpublishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpublish Poll?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Are you sure you want to unpublish this poll?</p>
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
                <p className="font-semibold text-yellow-900 mb-2">⚠ This will:</p>
                <ul className="list-disc list-inside space-y-1 text-yellow-800">
                  <li>Hide poll from users</li>
                  <li>Stop accepting votes</li>
                  <li>Return to draft state</li>
                  <li>Keep existing votes ({stats.votes} votes recorded)</li>
                </ul>
              </div>
              <p className="text-sm">You can republish the poll later if needed.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnpublish}
              disabled={isProcessing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isProcessing ? "Unpublishing..." : "Unpublish"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Close Poll Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Are you sure you want to close this poll?</p>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                <p className="font-semibold text-red-900 mb-2">⚠ This action is permanent:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800">
                  <li>Poll will be permanently closed</li>
                  <li>No new votes can be cast</li>
                  <li>Results remain accessible</li>
                  <li>Cannot be reopened</li>
                </ul>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                <p className="font-semibold text-blue-900">Current Stats:</p>
                <p className="text-blue-800 mt-1">
                  ✓ {stats.voters} voters • {stats.votes} votes recorded
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClose}
              disabled={isProcessing}
              className="bg-red-600 hover:bg-red-700"
            >
              {isProcessing ? "Closing..." : "Close Poll"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Statement Modal */}
      <EditStatementModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        statement={editingStatement}
        onSuccess={loadStatements}
      />

      {/* Add Statement Modal */}
      {poll && user && (
        <AddStatementModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          pollId={poll.id}
          userId={user.id}
          onSuccess={loadStatements}
        />
      )}
    </div>
  );
}

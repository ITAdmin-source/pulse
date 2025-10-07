"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Search, Trash2, Edit, ExternalLink, Loader2 } from "lucide-react";
import { getAllPollsForAdminAction } from "@/actions/admin-actions";
import { deletePollAction } from "@/actions/polls-actions";
import { toast } from "sonner";

interface Poll {
  id: string;
  slug: string;
  question: string;
  status: string;
  createdAt: Date;
  totalVoters: number;
  totalStatements: number;
}

export default function AdminPollsPage() {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [filteredPolls, setFilteredPolls] = useState<Poll[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [pollToDelete, setPollToDelete] = useState<Poll | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPolls();
  }, []);

  useEffect(() => {
    filterPolls();
  }, [polls, searchQuery, statusFilter]);

  const loadPolls = async () => {
    setIsLoading(true);
    try {
      const result = await getAllPollsForAdminAction();
      if (result.success && result.data) {
        setPolls(result.data);
      } else {
        toast.error(result.error || "Failed to load polls");
      }
    } catch (error) {
      console.error("Error loading polls:", error);
      toast.error("Failed to load polls");
    } finally {
      setIsLoading(false);
    }
  };

  const filterPolls = () => {
    let filtered = [...polls];

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.question.toLowerCase().includes(query) ||
        p.slug.toLowerCase().includes(query)
      );
    }

    setFilteredPolls(filtered);
  };

  const handleDeleteClick = (poll: Poll) => {
    setPollToDelete(poll);
    setDeleteConfirmText("");
  };

  const handleDelete = async () => {
    if (!pollToDelete) return;

    if (deleteConfirmText !== "DELETE") {
      toast.error("Please type DELETE to confirm");
      return;
    }

    setIsDeleting(true);
    try {
      const result = await deletePollAction(pollToDelete.id);

      if (result.success) {
        toast.success("Poll deleted successfully");
        setPollToDelete(null);
        setDeleteConfirmText("");
        // Reload polls
        await loadPolls();
      } else {
        toast.error(result.error || "Failed to delete poll");
      }
    } catch (error) {
      console.error("Error deleting poll:", error);
      toast.error("Failed to delete poll");
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'published':
        return 'default';
      case 'draft':
        return 'secondary';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Poll Management</h1>
            <p className="text-gray-600 mt-1">Manage all polls in the system</p>
          </div>
          <Button asChild>
            <Link href="/admin/dashboard">Back to Dashboard</Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by question or slug..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Filter by Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full h-10 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
              <span>Showing {filteredPolls.length} of {polls.length} polls</span>
            </div>
          </CardContent>
        </Card>

        {/* Polls List */}
        <Card>
          <CardHeader>
            <CardTitle>All Polls</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredPolls.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <p className="text-lg font-medium">No polls found</p>
                <p className="text-sm mt-1">
                  {searchQuery || statusFilter !== "all"
                    ? "Try adjusting your filters"
                    : "Create your first poll to get started"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPolls.map((poll) => (
                  <div
                    key={poll.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex-grow pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge variant={getStatusBadgeVariant(poll.status)}>
                          {poll.status.toUpperCase()}
                        </Badge>
                        <h3 className="font-semibold text-gray-900">{poll.question}</h3>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>Slug: {poll.slug}</span>
                        <span>•</span>
                        <span>{poll.totalVoters} voters</span>
                        <span>•</span>
                        <span>{poll.totalStatements} statements</span>
                        <span>•</span>
                        <span>Created {new Date(poll.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/polls/${poll.slug}/manage`}>
                          <Edit className="h-4 w-4 mr-1" />
                          Manage
                        </Link>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/polls/${poll.slug}`} target="_blank">
                          <ExternalLink className="h-4 w-4 mr-1" />
                          View
                        </Link>
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteClick(poll)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!pollToDelete} onOpenChange={(open) => !open && setPollToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Poll Permanently?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                Are you sure you want to delete <span className="font-semibold">{pollToDelete?.question}</span>?
              </p>
              <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                <p className="font-semibold text-red-900 mb-2">⚠ This action is permanent and cannot be undone:</p>
                <ul className="list-disc list-inside space-y-1 text-red-800">
                  <li>All statements will be deleted</li>
                  <li>All votes will be deleted ({pollToDelete?.totalVoters} voters affected)</li>
                  <li>All user insights will be deleted</li>
                  <li>All role assignments will be deleted</li>
                </ul>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </label>
                <Input
                  placeholder="DELETE"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  disabled={isDeleting}
                  className="font-mono"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                "Delete Permanently"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

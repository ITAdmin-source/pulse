"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2, Shield, ShieldOff, User, BarChart3 } from "lucide-react";
import {
  getUserStatsAction,
  assignSystemAdminAction,
  revokeSystemAdminAction,
} from "@/actions/user-management-actions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

interface UserWithStats {
  id: string;
  email?: string;
  clerkUserId?: string;
  sessionId?: string;
  type: 'authenticated' | 'anonymous';
  pollsParticipated: number;
  totalVotes: number;
  roles: Array<{ role: string; pollId?: string }>;
  createdAt: Date;
}

interface UserStats {
  pollsParticipated: string[];
  totalVotes: number;
  insightsGenerated: number;
  statementsSubmitted: number;
  roles: Array<{ role: string; pollId?: string }>;
}

interface UserDetailsModalProps {
  user: UserWithStats;
  onClose: () => void;
  onUpdate: () => void;
}

export function UserDetailsModal({ user, onClose, onUpdate }: UserDetailsModalProps) {
  const { user: currentUser } = useCurrentUser();
  const [detailedStats, setDetailedStats] = useState<UserStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAdminConfirm, setShowAdminConfirm] = useState(false);
  const [adminAction, setAdminAction] = useState<'assign' | 'revoke'>('assign');
  const [currentUserIsAdmin, setCurrentUserIsAdmin] = useState(false);

  const isSystemAdmin = user.roles.some(r => r.role === 'system_admin' && !r.pollId);

  useEffect(() => {
    loadDetailedStats();
  }, [user.id]);

  useEffect(() => {
    // Check if current user is admin by fetching their roles
    const checkAdminStatus = async () => {
      if (!currentUser?.id) {
        setCurrentUserIsAdmin(false);
        return;
      }

      try {
        const result = await getUserStatsAction(currentUser.id);
        if (result.success && result.data) {
          const hasAdminRole = result.data.roles.some(
            r => r.role === 'system_admin' && !r.pollId
          );
          setCurrentUserIsAdmin(hasAdminRole);
        }
      } catch (error) {
        console.error("Error checking admin status:", error);
        setCurrentUserIsAdmin(false);
      }
    };

    checkAdminStatus();
  }, [currentUser?.id]);

  const loadDetailedStats = async () => {
    setIsLoadingStats(true);
    try {
      const result = await getUserStatsAction(user.id);
      if (result.success && result.data) {
        setDetailedStats(result.data);
      } else {
        toast.error("Failed to load user statistics");
      }
    } catch (error) {
      console.error("Error loading user stats:", error);
      toast.error("Failed to load user statistics");
    } finally {
      setIsLoadingStats(false);
    }
  };

  const handleAdminAction = async () => {
    setIsProcessing(true);
    try {
      const result = adminAction === 'assign'
        ? await assignSystemAdminAction(user.id)
        : await revokeSystemAdminAction(user.id);

      if (result.success) {
        toast.success(
          adminAction === 'assign'
            ? "System admin role assigned successfully"
            : "System admin role revoked successfully"
        );
        onUpdate();
        onClose();
      } else {
        toast.error(result.error || "Failed to update admin role");
      }
    } catch (error) {
      console.error("Error updating admin role:", error);
      toast.error("Failed to update admin role");
    } finally {
      setIsProcessing(false);
      setShowAdminConfirm(false);
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Details
            </DialogTitle>
            <DialogDescription>
              View and manage user information and roles
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Basic Info */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">User Type</h3>
                      <Badge variant={user.type === 'authenticated' ? 'default' : 'secondary'} className="mt-1">
                        {user.type === 'authenticated' ? 'Authenticated' : 'Anonymous'}
                      </Badge>
                    </div>
                    {isSystemAdmin && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        System Admin
                      </Badge>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Email</h3>
                    <p className="text-sm text-gray-900 mt-1">
                      {user.email || 'No email available'}
                    </p>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-600">User ID</h3>
                    <p className="text-sm text-gray-900 font-mono mt-1 break-all">
                      {user.id}
                    </p>
                  </div>

                  {user.clerkUserId && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Clerk ID</h3>
                      <p className="text-sm text-gray-900 font-mono mt-1 break-all">
                        {user.clerkUserId}
                      </p>
                    </div>
                  )}

                  {user.sessionId && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600">Session ID</h3>
                      <p className="text-sm text-gray-900 font-mono mt-1 break-all">
                        {user.sessionId}
                      </p>
                    </div>
                  )}

                  <div>
                    <h3 className="text-sm font-medium text-gray-600">Created</h3>
                    <p className="text-sm text-gray-900 mt-1">
                      {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Participation Stats */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart3 className="h-4 w-4 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">Participation Summary</h3>
                </div>

                {isLoadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                  </div>
                ) : detailedStats ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Polls Participated</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {detailedStats.pollsParticipated.length}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Total Votes</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {detailedStats.totalVotes}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Insights Generated</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {detailedStats.insightsGenerated}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Statements Submitted</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">
                        {detailedStats.statementsSubmitted}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Failed to load statistics</p>
                )}
              </CardContent>
            </Card>

            {/* Role Assignments */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-gray-900 mb-3">Role Assignments</h3>
                {user.roles.length === 0 ? (
                  <p className="text-sm text-gray-500 italic">No roles assigned</p>
                ) : (
                  <div className="space-y-2">
                    {user.roles.map((role, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                      >
                        <div>
                          <Badge variant="outline">{role.role}</Badge>
                          {role.pollId && (
                            <span className="text-xs text-gray-500 ms-2">
                              Poll: {role.pollId.substring(0, 8)}...
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Admin Actions */}
            {currentUserIsAdmin && user.type === 'authenticated' && (
              <Card>
                <CardContent className="pt-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Admin Actions</h3>
                  <div className="space-y-2">
                    {isSystemAdmin ? (
                      <Button
                        variant="destructive"
                        className="w-full"
                        onClick={() => {
                          setAdminAction('revoke');
                          setShowAdminConfirm(true);
                        }}
                        disabled={isProcessing}
                      >
                        <ShieldOff className="h-4 w-4 me-2" />
                        Revoke System Admin Role
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() => {
                          setAdminAction('assign');
                          setShowAdminConfirm(true);
                        }}
                        disabled={isProcessing}
                      >
                        <Shield className="h-4 w-4 me-2" />
                        Assign System Admin Role
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showAdminConfirm} onOpenChange={setShowAdminConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {adminAction === 'assign' ? 'Assign System Admin Role?' : 'Revoke System Admin Role?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {adminAction === 'assign' ? (
                <>
                  You are about to grant <strong>system-wide administrative privileges</strong> to this user.
                  They will be able to:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Manage all polls</li>
                    <li>Moderate all content</li>
                    <li>Manage other users</li>
                  </ul>
                  <p className="mt-2 font-semibold">This action should be used carefully.</p>
                </>
              ) : (
                <>
                  You are about to remove <strong>system admin privileges</strong> from this user.
                  They will lose access to all administrative functions.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAdminAction}
              disabled={isProcessing}
              className={adminAction === 'revoke' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-4 w-4 me-2 animate-spin" />
                  Processing...
                </>
              ) : (
                adminAction === 'assign' ? 'Assign Role' : 'Revoke Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

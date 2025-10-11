"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/hooks/use-current-user";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, UserCheck, UserX, Search, RefreshCw } from "lucide-react";
import { isSystemAdmin } from "@/lib/utils/permissions";
import {
  listUsersAction,
  assignSystemAdminAction,
  revokeSystemAdminAction,
  assignPollCreatorAction,
  revokePollCreatorAction,
} from "@/actions/user-management-actions";
import { syncAllUserProfilesAction, syncUserProfileAction } from "@/actions/admin-actions";
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

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: dbUser, userRoles, isLoading: isUserLoading } = useCurrentUser();
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'authenticated' | 'anonymous'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'owner' | 'manager' | 'none'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);
  const [isSyncingAll, setIsSyncingAll] = useState(false);

  // Check authorization
  useEffect(() => {
    if (isUserLoading) return;

    if (!dbUser || !isSystemAdmin(userRoles)) {
      toast.error("You must be a system administrator to access this page");
      router.push("/unauthorized");
    }
  }, [isUserLoading, dbUser, userRoles, router]);

  // Load users
  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await listUsersAction({
        page: currentPage,
        limit: 20,
        search: searchQuery,
        userType: userTypeFilter,
        roleFilter,
      });

      if (result.success && result.data) {
        setUsers(result.data.users);
        setTotalPages(result.data.totalPages);
      } else {
        toast.error("Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (dbUser && isSystemAdmin(userRoles)) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, userTypeFilter, roleFilter, dbUser, userRoles]);

  const handleAssignSystemAdmin = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const result = await assignSystemAdminAction(userId);
      if (result.success) {
        toast.success("System admin role assigned");
        await loadUsers();
      } else {
        toast.error(result.error || "Failed to assign role");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRevokeSystemAdmin = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const result = await revokeSystemAdminAction(userId);
      if (result.success) {
        toast.success("System admin role revoked");
        await loadUsers();
      } else {
        toast.error(result.error || "Failed to revoke role");
      }
    } catch (error) {
      console.error("Error revoking role:", error);
      toast.error("Failed to revoke role");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleAssignPollCreator = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const result = await assignPollCreatorAction(userId);
      if (result.success) {
        toast.success("Poll creator role assigned");
        await loadUsers();
      } else {
        toast.error(result.error || "Failed to assign role");
      }
    } catch (error) {
      console.error("Error assigning role:", error);
      toast.error("Failed to assign role");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleRevokePollCreator = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const result = await revokePollCreatorAction(userId);
      if (result.success) {
        toast.success("Poll creator role revoked");
        await loadUsers();
      } else {
        toast.error(result.error || "Failed to revoke role");
      }
    } catch (error) {
      console.error("Error revoking role:", error);
      toast.error("Failed to revoke role");
    } finally {
      setProcessingUserId(null);
    }
  };

  const handleSyncAllProfiles = async () => {
    setIsSyncingAll(true);
    try {
      const result = await syncAllUserProfilesAction();
      if (result.success) {
        toast.success(result.message);
        await loadUsers();
      } else {
        toast.error(result.error || "Failed to sync profiles");
      }
    } catch (error) {
      console.error("Error syncing profiles:", error);
      toast.error("Failed to sync profiles");
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSyncUserProfile = async (userId: string) => {
    setProcessingUserId(userId);
    try {
      const result = await syncUserProfileAction(userId);
      if (result.success) {
        toast.success(`Synced: ${result.email || 'Profile updated'}`);
        await loadUsers();
      } else {
        toast.error(result.error || "Failed to sync profile");
      }
    } catch (error) {
      console.error("Error syncing profile:", error);
      toast.error("Failed to sync profile");
    } finally {
      setProcessingUserId(null);
    }
  };

  const getUserRoleBadges = (user: UserWithStats) => {
    const hasSystemAdmin = user.roles.some(r => r.role === 'system_admin');
    const hasPollCreator = user.roles.some(r => r.role === 'poll_creator');
    const pollOwnerCount = user.roles.filter(r => r.role === 'poll_owner').length;
    const pollManagerCount = user.roles.filter(r => r.role === 'poll_manager').length;

    return (
      <div className="flex gap-2 flex-wrap">
        {hasSystemAdmin && <Badge className="bg-red-600">System Admin</Badge>}
        {hasPollCreator && <Badge className="bg-blue-600">Poll Creator</Badge>}
        {pollOwnerCount > 0 && (
          <Badge variant="secondary">Owner ({pollOwnerCount})</Badge>
        )}
        {pollManagerCount > 0 && (
          <Badge variant="secondary">Manager ({pollManagerCount})</Badge>
        )}
        {user.roles.length === 0 && (
          <Badge variant="outline" className="text-gray-500">No roles</Badge>
        )}
      </div>
    );
  };

  // Show loading state while checking auth
  if (isUserLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Checking permissions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin/dashboard">
                <ArrowLeft className="h-4 w-4 me-2" />
                Back to Dashboard
              </Link>
            </Button>
            <h1 className="text-xl font-bold">User Management</h1>
            <div className="w-32"></div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Sync Profiles Button */}
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            onClick={handleSyncAllProfiles}
            disabled={isSyncingAll}
          >
            {isSyncingAll ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 me-2" />
                Sync All Email Addresses from Clerk
              </>
            )}
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by email or Clerk ID..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="ps-9"
                  />
                </div>
              </div>

              {/* User Type Filter */}
              <Select
                value={userTypeFilter}
                onValueChange={(value) => setUserTypeFilter(value as typeof userTypeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="User Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="authenticated">Authenticated</SelectItem>
                  <SelectItem value="anonymous">Anonymous</SelectItem>
                </SelectContent>
              </Select>

              {/* Role Filter */}
              <Select
                value={roleFilter}
                onValueChange={(value) => setRoleFilter(value as typeof roleFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Role Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">System Admins</SelectItem>
                  <SelectItem value="owner">Poll Owners</SelectItem>
                  <SelectItem value="manager">Poll Managers</SelectItem>
                  <SelectItem value="none">No Roles</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                <p className="text-gray-600">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No users found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {users.map((user) => {
                  const hasSystemAdmin = user.roles.some(r => r.role === 'system_admin');
                  const hasPollCreator = user.roles.some(r => r.role === 'poll_creator');
                  const isProcessing = processingUserId === user.id;

                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {user.email || `User ${user.id.substring(0, 8)}`}
                            </p>
                            {user.type === 'authenticated' && !user.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 flex-shrink-0"
                                onClick={() => handleSyncUserProfile(user.id)}
                                disabled={isProcessing}
                                title="Sync email from Clerk"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                          <Badge variant={user.type === 'authenticated' ? 'default' : 'outline'}>
                            {user.type}
                          </Badge>
                        </div>

                        {/* Roles */}
                        <div className="mb-2">
                          {getUserRoleBadges(user)}
                        </div>

                        {/* Stats */}
                        <p className="text-sm text-gray-600">
                          {user.pollsParticipated} polls • {user.totalVotes} votes
                        </p>
                      </div>

                      {/* Role Management Buttons */}
                      {user.type === 'authenticated' && (
                        <div className="flex gap-2 ms-4">
                          {/* System Admin Toggle */}
                          {hasSystemAdmin ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokeSystemAdmin(user.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserX className="h-4 w-4 me-2" />
                                  Revoke Admin
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignSystemAdmin(user.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 me-2" />
                                  Make Admin
                                </>
                              )}
                            </Button>
                          )}

                          {/* Poll Creator Toggle */}
                          {hasPollCreator ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRevokePollCreator(user.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserX className="h-4 w-4 me-2" />
                                  Revoke Creator
                                </>
                              )}
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleAssignPollCreator(user.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <>
                                  <UserCheck className="h-4 w-4 me-2" />
                                  Make Creator
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1 || isLoading}
                >
                  Previous
                </Button>
                <span className="px-4 py-2 text-sm text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages || isLoading}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
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
import { Search, ChevronLeft, ChevronRight, Loader2, User } from "lucide-react";
import { listUsersAction } from "@/actions/user-management-actions";
import { UserDetailsModal } from "@/components/admin/user-details-modal";
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
  const [users, setUsers] = useState<UserWithStats[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState<'all' | 'authenticated' | 'anonymous'>("all");
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'owner' | 'manager' | 'none'>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedUser, setSelectedUser] = useState<UserWithStats | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const ITEMS_PER_PAGE = 20;

  useEffect(() => {
    loadUsers();
  }, [currentPage, userTypeFilter, roleFilter]);

  useEffect(() => {
    // Reset to page 1 when search changes
    const timeoutId = setTimeout(() => {
      if (currentPage === 1) {
        loadUsers();
      } else {
        setCurrentPage(1);
      }
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const result = await listUsersAction({
        page: currentPage,
        limit: ITEMS_PER_PAGE,
        search: searchQuery,
        userType: userTypeFilter,
        roleFilter: roleFilter,
      });

      if (result.success && result.data) {
        setUsers(result.data.users);
        setTotalPages(result.data.totalPages);
        setTotalCount(result.data.totalCount);
      } else {
        toast.error(result.error || "Failed to load users");
      }
    } catch (error) {
      console.error("Error loading users:", error);
      toast.error("Failed to load users");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (user: UserWithStats) => {
    setSelectedUser(user);
    setShowDetailsModal(true);
  };

  const getUserTypeLabel = (type: 'authenticated' | 'anonymous') => {
    return type === 'authenticated' ? 'Authenticated' : 'Anonymous';
  };

  const getUserTypeBadgeVariant = (type: 'authenticated' | 'anonymous') => {
    return type === 'authenticated' ? 'default' : 'secondary';
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">User Management</h1>
        <p className="text-gray-600">Manage all users and their roles</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <div className="flex flex-col md:flex-row gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by email, ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* User Type Filter */}
            <Select value={userTypeFilter} onValueChange={(value: string) => setUserTypeFilter(value as 'all' | 'authenticated' | 'anonymous')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="User Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="authenticated">Authenticated</SelectItem>
                <SelectItem value="anonymous">Anonymous</SelectItem>
              </SelectContent>
            </Select>

            {/* Role Filter */}
            <Select value={roleFilter} onValueChange={(value: string) => setRoleFilter(value as 'all' | 'admin' | 'owner' | 'manager' | 'none')}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Role Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">System Admin</SelectItem>
                <SelectItem value="owner">Poll Owner</SelectItem>
                <SelectItem value="manager">Poll Manager</SelectItem>
                <SelectItem value="none">No Roles</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No users found</p>
            </div>
          ) : (
            <>
              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b">
                    <tr className="text-left text-sm text-gray-600">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Type</th>
                      <th className="pb-3 font-medium">Polls</th>
                      <th className="pb-3 font-medium">Votes</th>
                      <th className="pb-3 font-medium">Roles</th>
                      <th className="pb-3 font-medium">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => handleUserClick(user)}
                        className="border-b last:border-0 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">
                              {user.email || 'No email'}
                            </span>
                            <span className="text-xs text-gray-500 font-mono">
                              {user.clerkUserId?.substring(0, 20) || user.sessionId?.substring(0, 20) || user.id.substring(0, 20)}...
                            </span>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge variant={getUserTypeBadgeVariant(user.type)}>
                            {getUserTypeLabel(user.type)}
                          </Badge>
                        </td>
                        <td className="py-4 text-gray-700">{user.pollsParticipated}</td>
                        <td className="py-4 text-gray-700">{user.totalVotes}</td>
                        <td className="py-4">
                          {user.roles.length > 0 ? (
                            <div className="flex gap-1 flex-wrap">
                              {user.roles.slice(0, 2).map((role, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {role.role}
                                </Badge>
                              ))}
                              {user.roles.length > 2 && (
                                <span className="text-xs text-gray-500">+{user.roles.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">None</span>
                          )}
                        </td>
                        <td className="py-4 text-gray-600 text-sm">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t">
                <div className="text-sm text-gray-600">
                  Showing {users.length} of {totalCount} users
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <div className="flex items-center gap-2 px-3">
                    <span className="text-sm text-gray-600">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages || isLoading}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {showDetailsModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedUser(null);
          }}
          onUpdate={loadUsers}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "@/contexts/user-context";
import { hasPermission, type UserPermission } from "@/lib/utils/permissions";
import { useState } from "react";
import type { UserRole } from "@/db/schema";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: UserPermission;
  pollId?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireAuth = false,
  requireRole,
  pollId,
  fallback,
  redirectTo = "/login",
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [rolesLoading, setRolesLoading] = useState(false);
  const router = useRouter();

  // Fetch user roles when user is available
  useEffect(() => {
    const fetchUserRoles = async () => {
      if (user?.id && requireRole) {
        setRolesLoading(true);
        try {
          const response = await fetch(`/api/user/roles?userId=${user.id}`);
          if (!response.ok) {
            throw new Error('Failed to fetch user roles');
          }
          const { roles } = await response.json();
          setUserRoles(roles);
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setUserRoles([]);
        } finally {
          setRolesLoading(false);
        }
      }
    };

    fetchUserRoles();
  }, [user?.id, requireRole]);

  // Handle redirects
  useEffect(() => {
    if (isLoading || rolesLoading) return;

    // Check authentication requirement
    if (requireAuth && !isAuthenticated) {
      const currentPath = window.location.pathname;
      const redirectUrl = `${redirectTo}?returnUrl=${encodeURIComponent(currentPath)}`;
      router.push(redirectUrl);
      return;
    }

    // Check role requirement
    if (requireRole && user) {
      if (!hasPermission(userRoles, requireRole, pollId)) {
        // User doesn't have required permission
        router.push("/unauthorized");
        return;
      }
    }
  }, [
    isLoading,
    rolesLoading,
    isAuthenticated,
    requireAuth,
    requireRole,
    userRoles,
    pollId,
    redirectTo,
    router,
    user,
  ]);

  // Show loading state
  if (isLoading || rolesLoading) {
    return (
      fallback || (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )
    );
  }

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  // Check role permissions
  if (requireRole && user && !hasPermission(userRoles, requireRole, pollId)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
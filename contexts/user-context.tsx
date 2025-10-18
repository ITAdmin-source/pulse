"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import type { User, UserRole } from "@/db/schema";

interface UserContextType {
  user: User | null;
  sessionId: string | null; // For anonymous users
  userRoles: UserRole[]; // User roles for permission checking
  isLoading: boolean;
  isAuthenticated: boolean;
  isAnonymous: boolean;
  refresh: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const upgradeAttemptedRef = useRef(false);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/user/current');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const { user: dbUser, sessionId: responseSessionId } = await response.json();

      // Check for automatic upgrade scenario:
      // User just authenticated AND has anonymous session but no DB user yet
      if (clerkUser && !dbUser && responseSessionId && !upgradeAttemptedRef.current) {
        console.log("Detected sign-up with existing session, attempting upgrade...");
        upgradeAttemptedRef.current = true;

        try {
          const upgradeResponse = await fetch('/api/user/upgrade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });

          if (upgradeResponse.ok) {
            const { user: upgradedUser } = await upgradeResponse.json();
            setUser(upgradedUser);
            setSessionId(null); // Session no longer needed
            toast.success("Your voting history has been saved to your account!");
            setIsLoading(false);
            return;
          } else {
            console.error("Upgrade failed with status:", upgradeResponse.status);
          }
        } catch (error) {
          console.error("Auto-upgrade failed:", error);
        }
      }

      setUser(dbUser);
      setSessionId(responseSessionId || null);

      // Fetch user roles if user exists
      if (dbUser?.id) {
        try {
          const rolesResponse = await fetch('/api/user/roles');
          if (rolesResponse.ok) {
            const { roles } = await rolesResponse.json();
            setUserRoles(roles || []);
          } else {
            setUserRoles([]);
          }
        } catch (error) {
          console.error("Error fetching user roles:", error);
          setUserRoles([]);
        }
      } else {
        setUserRoles([]);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
      setSessionId(null);
      setUserRoles([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch user data when Clerk user state changes
  useEffect(() => {
    if (clerkLoaded) {
      fetchUserData();
    }
  }, [clerkUser?.id, clerkLoaded]);

  // Reset upgrade attempt when user logs out
  useEffect(() => {
    if (!clerkUser) {
      upgradeAttemptedRef.current = false;
    }
  }, [clerkUser]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue: UserContextType = useMemo(() => ({
    user,
    sessionId,
    userRoles,
    isLoading: isLoading || !clerkLoaded,
    isAuthenticated: !!clerkUser?.id && !!user?.clerkUserId,
    isAnonymous: !clerkUser?.id && !user?.clerkUserId,
    refresh: fetchUserData,
  }), [user, sessionId, userRoles, isLoading, clerkLoaded, clerkUser?.id, user?.clerkUserId]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

export function useCurrentUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useCurrentUser must be used within a UserProvider");
  }
  return context;
}
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import type { User } from "@/db/schema";

interface UserContextType {
  user: User | null;
  sessionId: string | null; // For anonymous users
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
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      setIsLoading(true);

      const response = await fetch('/api/user/current');
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }

      const { user: dbUser, sessionId: responseSessionId } = await response.json();
      setUser(dbUser);
      setSessionId(responseSessionId || null);
    } catch (error) {
      console.error("Error fetching user data:", error);
      setUser(null);
      setSessionId(null);
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

  // Note: Upgrade logic moved to webhook - user upgrade only happens on sign-up
  // The webhook will handle upgrading when user signs up
  // Client-side just switches between authenticated and anonymous contexts

  const contextValue: UserContextType = {
    user,
    sessionId,
    isLoading: isLoading || !clerkLoaded,
    isAuthenticated: !!clerkUser?.id && !!user?.clerkUserId,
    isAnonymous: !clerkUser?.id && !user?.clerkUserId,
    refresh: fetchUserData,
  };

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
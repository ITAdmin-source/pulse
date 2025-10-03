"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
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

  // Reset upgrade attempt when user logs out
  useEffect(() => {
    if (!clerkUser) {
      upgradeAttemptedRef.current = false;
    }
  }, [clerkUser]);

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
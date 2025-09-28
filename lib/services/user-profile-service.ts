import { currentUser } from "@clerk/nextjs/server";
import { UserService } from "./user-service";

export interface ClerkUserProfile {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  imageUrl?: string;
  primaryEmailAddress?: {
    emailAddress: string;
  };
  externalAccounts?: Array<{
    provider: string;
    externalId: string;
    username?: string;
    profileImageUrl?: string;
  }>;
  publicMetadata?: Record<string, unknown>;
}

export class UserProfileService {
  /**
   * Cache duration in milliseconds (24 hours)
   */
  private static readonly CACHE_DURATION = 24 * 60 * 60 * 1000;

  /**
   * Get user profile with smart caching - fetches from cache if fresh, otherwise from Clerk
   */
  static async getUserProfile(clerkUserId: string): Promise<ClerkUserProfile | null> {
    // First get the user from database
    const dbUser = await UserService.findByClerkId(clerkUserId);

    // If user doesn't exist in DB, create them with JIT
    if (!dbUser) {
      await UserService.getOrCreateUserByClerkId(clerkUserId);
    }

    // Check if cached data exists and is fresh
    // Store cache timestamp in metadata
    const metadata = dbUser?.metadata as { profileData?: ClerkUserProfile; lastSyncedAt?: string } | null;
    const lastSyncedAt = metadata?.lastSyncedAt ? new Date(metadata.lastSyncedAt) : null;
    const isCacheFresh = lastSyncedAt &&
      (new Date().getTime() - lastSyncedAt.getTime()) < this.CACHE_DURATION;

    if (isCacheFresh && metadata?.profileData) {
      // Return cached data
      return metadata.profileData as ClerkUserProfile;
    }

    // Fetch fresh data from Clerk
    return await this.fetchAndCacheProfile(clerkUserId);
  }

  /**
   * Always fetch fresh profile data from Clerk and update cache
   */
  static async fetchAndCacheProfile(clerkUserId: string): Promise<ClerkUserProfile | null> {
    try {
      // Get current user from Clerk (this should be the authenticated user)
      const clerkUser = await currentUser();

      if (!clerkUser || clerkUser.id !== clerkUserId) {
        // If the requested user ID doesn't match current user, we can't fetch it
        // In a full implementation, you'd use Clerk's backend API here
        return null;
      }

      // Extract profile data
      const profileData: ClerkUserProfile = {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        fullName: clerkUser.fullName,
        imageUrl: clerkUser.imageUrl,
        primaryEmailAddress: clerkUser.primaryEmailAddress ? {
          emailAddress: clerkUser.primaryEmailAddress.emailAddress
        } : undefined,
        externalAccounts: clerkUser.externalAccounts?.map(account => ({
          provider: account.provider,
          externalId: account.externalId,
          username: account.username || undefined,
          profileImageUrl: account.imageUrl || undefined,
        })),
        publicMetadata: clerkUser.publicMetadata,
      };

      // Update cache in database with timestamp
      const dbUser = await UserService.findByClerkId(clerkUserId);
      if (dbUser) {
        await UserService.updateCachedMetadata(dbUser.id, {
          profileData: profileData as unknown as Record<string, unknown>,
          lastSyncedAt: new Date().toISOString()
        });
      }

      return profileData;
    } catch (error) {
      console.error("Error fetching user profile from Clerk:", error);

      // Fallback to cached data if available
      const dbUser = await UserService.findByClerkId(clerkUserId);
      const metadata = dbUser?.metadata as { profileData?: ClerkUserProfile; lastSyncedAt?: string } | null;
      if (metadata?.profileData) {
        return metadata.profileData as ClerkUserProfile;
      }

      return null;
    }
  }

  /**
   * Get cached profile data only (doesn't fetch from Clerk)
   */
  static async getCachedProfile(clerkUserId: string): Promise<ClerkUserProfile | null> {
    const dbUser = await UserService.findByClerkId(clerkUserId);
    const metadata = dbUser?.metadata as { profileData?: ClerkUserProfile; lastSyncedAt?: string } | null;

    if (metadata?.profileData) {
      return metadata.profileData as ClerkUserProfile;
    }

    return null;
  }

  /**
   * Check if cached profile data is stale
   */
  static async isCacheStale(clerkUserId: string): Promise<boolean> {
    const dbUser = await UserService.findByClerkId(clerkUserId);

    const metadata = dbUser?.metadata as { profileData?: ClerkUserProfile; lastSyncedAt?: string } | null;
    const lastSyncedAt = metadata?.lastSyncedAt ? new Date(metadata.lastSyncedAt) : null;

    if (!lastSyncedAt) {
      return true; // No cache data
    }

    const cacheAge = new Date().getTime() - lastSyncedAt.getTime();
    return cacheAge > this.CACHE_DURATION;
  }

  /**
   * Force refresh profile data from Clerk
   */
  static async refreshProfile(clerkUserId: string): Promise<ClerkUserProfile | null> {
    return await this.fetchAndCacheProfile(clerkUserId);
  }

  /**
   * Get user's display name from cached or fresh data
   */
  static async getUserDisplayName(clerkUserId: string): Promise<string> {
    const profile = await this.getUserProfile(clerkUserId);

    if (profile?.fullName) {
      return profile.fullName;
    }

    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`;
    }

    if (profile?.firstName) {
      return profile.firstName;
    }

    if (profile?.primaryEmailAddress?.emailAddress) {
      return profile.primaryEmailAddress.emailAddress;
    }

    return "Anonymous User";
  }

  /**
   * Get user's profile image URL
   */
  static async getUserImageUrl(clerkUserId: string): Promise<string | null> {
    const profile = await this.getUserProfile(clerkUserId);
    return profile?.imageUrl || null;
  }

  /**
   * Get social profile URLs from external accounts
   */
  static async getSocialProfiles(clerkUserId: string): Promise<Array<{ provider: string; username?: string; profileUrl?: string }>> {
    const profile = await this.getUserProfile(clerkUserId);

    if (!profile?.externalAccounts) {
      return [];
    }

    return profile.externalAccounts.map(account => ({
      provider: account.provider,
      username: account.username,
      profileUrl: this.buildSocialProfileUrl(account.provider, account.username),
    }));
  }

  /**
   * Build social profile URLs based on provider
   */
  private static buildSocialProfileUrl(provider: string, username?: string): string | undefined {
    if (!username) return undefined;

    switch (provider.toLowerCase()) {
      case 'github':
        return `https://github.com/${username}`;
      case 'twitter':
      case 'x':
        return `https://twitter.com/${username}`;
      case 'linkedin':
        return `https://linkedin.com/in/${username}`;
      case 'google':
        return undefined; // Google doesn't have a direct profile URL format
      default:
        return undefined;
    }
  }
}
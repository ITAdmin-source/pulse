"use server";

import { PollResultsService } from "@/lib/services/poll-results-service";
import { UserService } from "@/lib/services/user-service";
import { getPollById } from "@/db/queries/polls-queries";
import { type DemographicVoteBreakdown } from "@/db/queries/demographic-analytics-queries";
import { isSystemAdmin, canManagePoll } from "@/lib/utils/permissions";

/**
 * Get demographic breakdown for a specific statement
 * Public access - no authorization required
 */
export async function getStatementDemographicBreakdownAction(
  statementId: string,
  privacyThreshold: number = 5
): Promise<{
  success: boolean;
  data?: {
    byAgeGroup: DemographicVoteBreakdown[];
    byGender: DemographicVoteBreakdown[];
    byEthnicity: DemographicVoteBreakdown[];
    byPoliticalParty: DemographicVoteBreakdown[];
  };
  error?: string;
}> {
  try {
    const breakdown = await PollResultsService.getDemographicBreakdown(
      statementId,
      privacyThreshold
    );

    return { success: true, data: breakdown };
  } catch (error) {
    console.error("Error fetching statement demographic breakdown:", error);
    return {
      success: false,
      error: "Failed to fetch demographic breakdown",
    };
  }
}

/**
 * Get demographic breakdown for an entire poll
 * Public access - no authorization required
 */
export async function getPollDemographicBreakdownAction(
  pollId: string,
  privacyThreshold: number = 5
): Promise<{
  success: boolean;
  data?: {
    byAgeGroup: DemographicVoteBreakdown[];
    byGender: DemographicVoteBreakdown[];
    byEthnicity: DemographicVoteBreakdown[];
    byPoliticalParty: DemographicVoteBreakdown[];
    participants: {
      byAgeGroup: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byGender: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byEthnicity: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byPoliticalParty: Array<{ categoryId: number; categoryLabel: string; count: number }>;
    };
  };
  error?: string;
}> {
  try {
    const breakdown = await PollResultsService.getPollDemographicBreakdown(
      pollId,
      privacyThreshold
    );

    return { success: true, data: breakdown };
  } catch (error) {
    console.error("Error fetching poll demographic breakdown:", error);
    return {
      success: false,
      error: "Failed to fetch demographic breakdown",
    };
  }
}

/**
 * Get detailed demographic analytics for admin/manager dashboard
 * Requires admin or poll manager/owner permissions
 */
export async function getDetailedDemographicAnalyticsAction(
  pollId: string,
  userId?: string
): Promise<{
  success: boolean;
  data?: {
    byAgeGroup: DemographicVoteBreakdown[];
    byGender: DemographicVoteBreakdown[];
    byEthnicity: DemographicVoteBreakdown[];
    byPoliticalParty: DemographicVoteBreakdown[];
    participants: {
      byAgeGroup: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byGender: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byEthnicity: Array<{ categoryId: number; categoryLabel: string; count: number }>;
      byPoliticalParty: Array<{ categoryId: number; categoryLabel: string; count: number }>;
    };
  };
  error?: string;
  unauthorized?: boolean;
}> {
  try {
    // Check if user is authorized (admin or poll manager/owner)
    if (userId) {
      const userRoles = await UserService.getUserRoles(userId);
      const poll = await getPollById(pollId);
      const hasAdmin = isSystemAdmin(userRoles);
      const hasManagement = canManagePoll(userRoles, pollId);
      const isOwner = poll && poll.createdBy === userId;

      if (!hasAdmin && !hasManagement && !isOwner) {
        return {
          success: false,
          error: "You do not have permission to view detailed analytics",
          unauthorized: true,
        };
      }
    }

    // Use lower privacy threshold for authorized users (still protect with minimum of 3)
    const breakdown = await PollResultsService.getPollDemographicBreakdown(
      pollId,
      3
    );

    return { success: true, data: breakdown };
  } catch (error) {
    console.error("Error fetching detailed demographic analytics:", error);
    return {
      success: false,
      error: "Failed to fetch detailed analytics",
    };
  }
}

/**
 * Export demographic analytics data as JSON
 * Requires admin or poll manager/owner permissions
 */
export async function exportDemographicAnalyticsAction(
  pollId: string,
  userId?: string
): Promise<{
  success: boolean;
  data?: string; // JSON string
  error?: string;
  unauthorized?: boolean;
}> {
  try {
    // Check if user is authorized
    if (userId) {
      const userRoles = await UserService.getUserRoles(userId);
      const poll = await getPollById(pollId);
      const hasAdmin = isSystemAdmin(userRoles);
      const hasManagement = canManagePoll(userRoles, pollId);
      const isOwner = poll && poll.createdBy === userId;

      if (!hasAdmin && !hasManagement && !isOwner) {
        return {
          success: false,
          error: "You do not have permission to export analytics",
          unauthorized: true,
        };
      }
    }

    const breakdown = await PollResultsService.getPollDemographicBreakdown(
      pollId,
      3
    );

    const poll = await getPollById(pollId);

    const exportData = {
      pollId,
      pollQuestion: poll?.question || "Unknown",
      exportedAt: new Date().toISOString(),
      demographics: breakdown,
    };

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2),
    };
  } catch (error) {
    console.error("Error exporting demographic analytics:", error);
    return {
      success: false,
      error: "Failed to export analytics",
    };
  }
}

/**
 * Insight Storage Utility (Client-Side)
 *
 * Manages localStorage for anonymous user insights
 * Authenticated users use database storage instead
 */

export interface StoredInsight {
  pollId: string;
  pollQuestion: string;
  title: string;
  body: string;
  generatedAt: string; // ISO timestamp
}

const STORAGE_KEY_PREFIX = "pulse_insight_";
const STORAGE_VERSION = "v1";
const MAX_AGE_DAYS = 7; // Auto-clear after 7 days

/**
 * Save insight to localStorage
 * @param pollId - Poll ID
 * @param pollQuestion - Poll question for display
 * @param title - Insight title
 * @param body - Insight body
 */
export function saveInsightToStorage(pollId: string, pollQuestion: string, title: string, body: string): void {
  if (typeof window === "undefined") {
    console.warn("[InsightStorage] Cannot save - not in browser environment");
    return;
  }

  try {
    const insight: StoredInsight = {
      pollId,
      pollQuestion,
      title,
      body,
      generatedAt: new Date().toISOString(),
    };

    const key = `${STORAGE_KEY_PREFIX}${STORAGE_VERSION}_${pollId}`;
    localStorage.setItem(key, JSON.stringify(insight));

    console.log(`[InsightStorage] Saved insight for poll ${pollId}`);
  } catch (error) {
    console.error("[InsightStorage] Failed to save insight:", error);
  }
}

/**
 * Retrieve insight from localStorage
 * @param pollId - Poll ID
 * @returns Stored insight or null if not found/expired
 */
export function getInsightFromStorage(pollId: string): StoredInsight | null {
  if (typeof window === "undefined") {
    console.warn("[InsightStorage] Cannot retrieve - not in browser environment");
    return null;
  }

  try {
    const key = `${STORAGE_KEY_PREFIX}${STORAGE_VERSION}_${pollId}`;
    const stored = localStorage.getItem(key);

    if (!stored) {
      return null;
    }

    const insight: StoredInsight = JSON.parse(stored);

    // Check if expired (older than MAX_AGE_DAYS)
    const generatedDate = new Date(insight.generatedAt);
    const now = new Date();
    const ageInDays = (now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays > MAX_AGE_DAYS) {
      console.log(`[InsightStorage] Insight expired (${ageInDays.toFixed(1)} days old), removing`);
      localStorage.removeItem(key);
      return null;
    }

    return insight;
  } catch (error) {
    console.error("[InsightStorage] Failed to retrieve insight:", error);
    return null;
  }
}

/**
 * Remove insight from localStorage
 * @param pollId - Poll ID
 */
export function removeInsightFromStorage(pollId: string): void {
  if (typeof window === "undefined") {
    console.warn("[InsightStorage] Cannot remove - not in browser environment");
    return;
  }

  try {
    const key = `${STORAGE_KEY_PREFIX}${STORAGE_VERSION}_${pollId}`;
    localStorage.removeItem(key);
    console.log(`[InsightStorage] Removed insight for poll ${pollId}`);
  } catch (error) {
    console.error("[InsightStorage] Failed to remove insight:", error);
  }
}

/**
 * Get all stored insights for current user
 * @returns Array of all stored insights
 */
export function getAllStoredInsights(): StoredInsight[] {
  if (typeof window === "undefined") {
    console.warn("[InsightStorage] Cannot retrieve - not in browser environment");
    return [];
  }

  try {
    const insights: StoredInsight[] = [];
    const prefix = `${STORAGE_KEY_PREFIX}${STORAGE_VERSION}_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const insight: StoredInsight = JSON.parse(stored);

            // Check if expired
            const generatedDate = new Date(insight.generatedAt);
            const now = new Date();
            const ageInDays = (now.getTime() - generatedDate.getTime()) / (1000 * 60 * 60 * 24);

            if (ageInDays <= MAX_AGE_DAYS) {
              insights.push(insight);
            } else {
              // Remove expired
              localStorage.removeItem(key);
            }
          } catch (parseError) {
            console.error(`[InsightStorage] Failed to parse insight at key ${key}:`, parseError);
          }
        }
      }
    }

    return insights;
  } catch (error) {
    console.error("[InsightStorage] Failed to retrieve all insights:", error);
    return [];
  }
}

/**
 * Clear all stored insights
 * Useful when user signs up (insights moved to DB)
 */
export function clearAllStoredInsights(): void {
  if (typeof window === "undefined") {
    console.warn("[InsightStorage] Cannot clear - not in browser environment");
    return;
  }

  try {
    const prefix = `${STORAGE_KEY_PREFIX}${STORAGE_VERSION}_`;
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
    console.log(`[InsightStorage] Cleared ${keysToRemove.length} stored insights`);
  } catch (error) {
    console.error("[InsightStorage] Failed to clear insights:", error);
  }
}

/**
 * Check if insight exists in localStorage
 * @param pollId - Poll ID
 * @returns True if insight exists and not expired
 */
export function hasStoredInsight(pollId: string): boolean {
  return getInsightFromStorage(pollId) !== null;
}

/**
 * Get count of stored insights
 * @returns Number of valid (non-expired) insights in storage
 */
export function getStoredInsightCount(): number {
  return getAllStoredInsights().length;
}

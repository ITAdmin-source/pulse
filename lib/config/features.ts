/**
 * Feature Flags Configuration
 *
 * Centralized feature toggles for experimental or optional features
 */

/**
 * Check if music recommendations feature is enabled
 *
 * Controlled by environment variable: NEXT_PUBLIC_ENABLE_MUSIC_RECOMMENDATIONS
 * - Set to "true" to enable music recommendations
 * - Set to "false" or leave unset to disable
 *
 * Default: false (disabled for safety)
 */
export function isMusicRecommendationsEnabled(): boolean {
  const envValue = process.env.NEXT_PUBLIC_ENABLE_MUSIC_RECOMMENDATIONS;
  return envValue === 'true';
}

/**
 * Feature flags object for easy access
 */
export const features = {
  musicRecommendations: isMusicRecommendationsEnabled(),
} as const;

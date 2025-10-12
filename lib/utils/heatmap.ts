/**
 * Heatmap utility functions for colors, formatting, and classification
 */

/**
 * Get color for agreement percentage
 * Based on 5-color scale from spec
 */
export function getAgreementColor(percentage: number): string {
  if (percentage >= 80) return '#10b981'; // Dark green - Strong agreement
  if (percentage >= 60) return '#34d399'; // Light green - Moderate agreement
  if (percentage >= -59) return '#fbbf24'; // Yellow - Mixed/neutral
  if (percentage >= -79) return '#f87171'; // Light red - Moderate disagreement
  return '#ef4444'; // Dark red - Strong disagreement
}

/**
 * Get text color for agreement percentage (for contrast)
 */
export function getAgreementTextColor(percentage: number): string {
  // Use white text for dark backgrounds
  if (percentage >= 80 || percentage <= -60) {
    return '#ffffff';
  }
  // Use dark text for light backgrounds
  return '#1f2937'; // gray-800
}

/**
 * Get background opacity for agreement percentage
 */
export function getAgreementOpacity(percentage: number): number {
  const absPercentage = Math.abs(percentage);
  if (absPercentage >= 80) return 1.0;
  if (absPercentage >= 60) return 0.85;
  if (absPercentage >= 40) return 0.7;
  if (absPercentage >= 20) return 0.55;
  return 0.4;
}

/**
 * Format agreement percentage with sign
 */
export function formatAgreementPercentage(percentage: number): string {
  const sign = percentage > 0 ? '+' : '';
  return `${sign}${percentage}%`;
}

/**
 * Get classification badge color
 */
export function getClassificationColor(type: 'consensus' | 'partial' | 'split' | 'divisive'): string {
  switch (type) {
    case 'consensus':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    case 'partial':
      return 'bg-amber-100 text-amber-800 border-amber-300';
    case 'split':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'divisive':
      return 'bg-red-100 text-red-800 border-red-300';
  }
}

/**
 * Get demographic attribute display name in Hebrew
 */
export function getDemographicAttributeName(attribute: string): string {
  switch (attribute) {
    case 'ageGroup':
      return 'קבוצת גיל';
    case 'gender':
      return 'מגדר';
    case 'ethnicity':
      return 'מוצא אתני';
    case 'politicalParty':
      return 'השתייכות פוליטית';
    default:
      return attribute;
  }
}

/**
 * Sort statements by classification type
 */
export function sortStatementsByType<T extends { classificationType: string }>(
  statements: T[]
): T[] {
  const typeOrder = {
    'consensus': 1,
    'partial': 2,
    'split': 3,
    'divisive': 4,
  };

  return [...statements].sort((a, b) => {
    const orderA = typeOrder[a.classificationType as keyof typeof typeOrder] || 5;
    const orderB = typeOrder[b.classificationType as keyof typeof typeOrder] || 5;
    return orderA - orderB;
  });
}

/**
 * Sort statements alphabetically by text
 */
export function sortStatementsAlphabetically<T extends { statementText: string }>(
  statements: T[]
): T[] {
  return [...statements].sort((a, b) =>
    a.statementText.localeCompare(b.statementText, 'he')
  );
}

/**
 * Filter statements by classification type
 */
export function filterStatementsByType<T extends { classificationType: string }>(
  statements: T[],
  types: string[]
): T[] {
  if (types.length === 0) return statements;
  return statements.filter(s => types.includes(s.classificationType));
}

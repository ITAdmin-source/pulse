/**
 * Shared Types for Clustering Visualization Components
 */

export interface UserPosition {
  userId: string;
  pc1: number;
  pc2: number;
  fineClusterId: number;
  coarseGroupId: number;
  totalVotes?: number;
  agreeCount?: number;
  disagreeCount?: number;
  passCount?: number;
}

export interface CoarseGroup {
  id: number;
  label: string;
  centroid: number[];
  fineClusterIds: number[];
  userCount: number;
}

export interface ClusteringMetadata {
  totalUsers: number;
  totalStatements: number;
  numFineClusters: number;
  numCoarseGroups: number;
  silhouetteScore: number;
  totalVarianceExplained: number;
  coarseGroups: CoarseGroup[];
}

export interface StatementClassificationData {
  statementId: string;
  type: "positive_consensus" | "negative_consensus" | "divisive" | "bridge" | "normal";
  averageAgreement: number;
  standardDeviation?: number;
  bridgeScore?: number;
  connectsGroups?: number[];
}

export interface ClusteringData {
  metadata: ClusteringMetadata;
  userPositions: UserPosition[];
  statementClassifications: StatementClassificationData[];
}

export interface OpinionMapProps {
  pollId: string;
  currentUserId?: string;
  data: ClusteringData;
  isMobile?: boolean;
}

export interface VisualizationBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  width: number;
  height: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface GroupColor {
  primary: string;
  light: string;
  dark: string;
}

// Group color palette (vibrant colors for distinction)
export const GROUP_COLORS: GroupColor[] = [
  { primary: "#8B5CF6", light: "#C4B5FD", dark: "#6D28D9" }, // Purple
  { primary: "#EC4899", light: "#F9A8D4", dark: "#BE185D" }, // Pink
  { primary: "#10B981", light: "#6EE7B7", dark: "#047857" }, // Green
  { primary: "#F59E0B", light: "#FCD34D", dark: "#B45309" }, // Orange
  { primary: "#3B82F6", light: "#93C5FD", dark: "#1E40AF" }, // Blue
];

export function getGroupColor(groupId: number): GroupColor {
  return GROUP_COLORS[groupId % GROUP_COLORS.length];
}

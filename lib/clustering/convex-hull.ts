/**
 * Convex Hull Computation and Smoothing Utilities
 *
 * Implements Graham Scan algorithm for computing convex hulls of 2D point sets,
 * with D3-shape integration for smooth curve interpolation.
 *
 * Used for privacy-preserving cluster boundary visualization in opinion maps.
 */

import { line, curveCatmullRomClosed } from "d3-shape";
import { Point2D } from "@/components/clustering/types";

/**
 * Compute the convex hull of a set of 2D points using Graham Scan algorithm.
 *
 * Time complexity: O(n log n) where n is the number of points
 * Space complexity: O(n)
 *
 * @param points - Array of 2D points
 * @returns Array of points forming the convex hull in counter-clockwise order,
 *          or empty array if fewer than 3 points provided
 *
 * @example
 * const points = [{x: 0, y: 0}, {x: 1, y: 1}, {x: 2, y: 0}, {x: 1, y: -1}];
 * const hull = computeConvexHull(points);
 * // Returns: [{x: 1, y: -1}, {x: 2, y: 0}, {x: 1, y: 1}, {x: 0, y: 0}]
 */
export function computeConvexHull(points: Point2D[]): Point2D[] {
  // Edge cases: need at least 3 points for a hull
  if (points.length < 3) {
    return [];
  }

  // Handle case where all points are identical or collinear
  if (areAllPointsCollinear(points)) {
    return [];
  }

  // Step 1: Find the anchor point (lowest Y, leftmost if tie)
  const anchor = findAnchorPoint(points);

  // Step 2: Sort remaining points by polar angle from anchor
  const otherPoints = points.filter((p) => p !== anchor);
  const sorted = sortByPolarAngle(otherPoints, anchor);

  // Step 3: Graham Scan - build hull by removing clockwise turns
  const hull: Point2D[] = [anchor, sorted[0], sorted[1]];

  for (let i = 2; i < sorted.length; i++) {
    // Remove points that make clockwise turn
    while (
      hull.length >= 2 &&
      !isCounterClockwise(hull[hull.length - 2], hull[hull.length - 1], sorted[i])
    ) {
      hull.pop();
    }
    hull.push(sorted[i]);
  }

  return hull;
}

/**
 * Generate a smooth SVG path string from convex hull vertices using
 * Catmull-Rom spline interpolation.
 *
 * @param hull - Array of points forming the convex hull
 * @returns SVG path string, or empty string if hull has fewer than 3 points
 *
 * @example
 * const hull = [{x: 100, y: 100}, {x: 200, y: 100}, {x: 150, y: 50}];
 * const path = smoothHullPath(hull);
 * // Returns: "M100,100C120,95,180,95,200,100C205,110,..." (SVG path data)
 */
export function smoothHullPath(hull: Point2D[]): string {
  if (hull.length < 3) {
    return "";
  }

  // Create D3 line generator with closed Catmull-Rom curve
  const pathGenerator = line<Point2D>()
    .x((d) => d.x)
    .y((d) => d.y)
    .curve(curveCatmullRomClosed.alpha(0.5)); // alpha = 0.5 for balanced smoothness

  const path = pathGenerator(hull);
  return path || "";
}

/**
 * Compute both convex hull and smoothed path in one operation.
 * Convenience function for typical use case.
 *
 * @param points - Array of 2D points
 * @returns Object with hull vertices and smoothed SVG path, or null if hull cannot be computed
 *
 * @example
 * const result = computeSmoothedHull(userPositions);
 * if (result) {
 *   // Render: <path d={result.path} />
 * }
 */
export function computeSmoothedHull(
  points: Point2D[]
): { hull: Point2D[]; path: string } | null {
  const hull = computeConvexHull(points);

  if (hull.length < 3) {
    return null;
  }

  const path = smoothHullPath(hull);

  if (!path) {
    return null;
  }

  return { hull, path };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find the anchor point for Graham Scan: lowest Y coordinate, leftmost if tie.
 */
function findAnchorPoint(points: Point2D[]): Point2D {
  let anchor = points[0];

  for (const point of points) {
    if (
      point.y < anchor.y ||
      (point.y === anchor.y && point.x < anchor.x)
    ) {
      anchor = point;
    }
  }

  return anchor;
}

/**
 * Sort points by polar angle relative to anchor point.
 * Points with same angle are sorted by distance (closer first).
 */
function sortByPolarAngle(points: Point2D[], anchor: Point2D): Point2D[] {
  return points.slice().sort((a, b) => {
    const angleA = polarAngle(anchor, a);
    const angleB = polarAngle(anchor, b);

    if (angleA !== angleB) {
      return angleA - angleB;
    }

    // Same angle: sort by distance (closer first for Graham Scan)
    const distA = distanceSquared(anchor, a);
    const distB = distanceSquared(anchor, b);
    return distA - distB;
  });
}

/**
 * Calculate polar angle from anchor to point using atan2.
 * Returns angle in radians [-π, π].
 */
function polarAngle(anchor: Point2D, point: Point2D): number {
  return Math.atan2(point.y - anchor.y, point.x - anchor.x);
}

/**
 * Calculate squared distance between two points (avoids sqrt for performance).
 */
function distanceSquared(a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return dx * dx + dy * dy;
}

/**
 * Check if three points make a counter-clockwise turn.
 * Uses cross product: (b - a) × (c - a)
 *
 * Returns:
 * - true if counter-clockwise (left turn)
 * - false if clockwise (right turn) or collinear
 */
export function isCounterClockwise(a: Point2D, b: Point2D, c: Point2D): boolean {
  const crossProduct =
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);

  return crossProduct > 0;
}

/**
 * Check if all points in the set are collinear (lie on the same line).
 * Uses cross product to detect non-zero area.
 */
function areAllPointsCollinear(points: Point2D[]): boolean {
  if (points.length < 3) {
    return true;
  }

  const [first, second, ...rest] = points;

  // Check if any point forms a non-zero area with the first two points
  for (const point of rest) {
    if (isCounterClockwise(first, second, point)) {
      return false; // Found a non-collinear point
    }

    // Also check for counter-clockwise in opposite direction
    if (isCounterClockwise(first, point, second)) {
      return false;
    }
  }

  return true; // All points are collinear
}

/**
 * Estimate the visual "radius" of a point set for circle fallback rendering.
 * Returns the maximum distance from centroid to any point.
 *
 * @param points - Array of 2D points
 * @returns Maximum distance from centroid, or 30 (minimum radius) if no points
 */
export function estimateRadius(points: Point2D[]): number {
  if (points.length === 0) {
    return 30; // Minimum fallback radius
  }

  if (points.length === 1) {
    return 40; // Single point fallback
  }

  if (points.length === 2) {
    // For two points, use half the distance between them plus padding
    const dist = Math.sqrt(distanceSquared(points[0], points[1]));
    return Math.max(50, dist / 2 + 20);
  }

  // Calculate centroid
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };

  // Find maximum distance from centroid
  let maxDist = 0;
  for (const point of points) {
    const dist = Math.sqrt(distanceSquared(centroid, point));
    if (dist > maxDist) {
      maxDist = dist;
    }
  }

  // Add padding and ensure minimum radius
  return Math.max(60, maxDist + 20);
}

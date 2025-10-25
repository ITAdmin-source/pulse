"use client";

/**
 * Desktop Opinion Map Visualization (SVG-based) - PRIVACY-PRESERVING
 * Shows ONLY: group boundaries, group centroids, and current user's position
 * Does NOT show: individual positions of other users (privacy protection)
 */

import { useMemo, useState } from "react";
import { UserPosition, CoarseGroup, getGroupColor, Point2D } from "./types";
import { opinionMap } from "@/lib/strings/he";
import { computeSmoothedHull, estimateRadius } from "@/lib/clustering/convex-hull";

interface OpinionMapCanvasProps {
  userPositions: UserPosition[];
  groups: CoarseGroup[];
  currentUserId?: string;
  className?: string;
}

export function OpinionMapCanvas({
  userPositions,
  groups,
  currentUserId,
  className = "",
}: OpinionMapCanvasProps) {
  const [hoveredGroupId, setHoveredGroupId] = useState<number | null>(null);

  // SVG padding to ensure labels are visible when clusters are near edges
  const SVG_TOP_PADDING = 40;
  const SVG_BOTTOM_PADDING = 20;

  // Calculate visualization bounds from ALL user positions (not just centroids)
  // This ensures convex hulls stay within viewport
  const bounds = useMemo(() => {
    if (userPositions.length === 0) {
      return { minX: -1, maxX: 1, minY: -1, maxY: 1, width: 2, height: 2 };
    }

    const pc1Values = userPositions.map((u) => u.pc1);
    const pc2Values = userPositions.map((u) => u.pc2);

    const minX = Math.min(...pc1Values);
    const maxX = Math.max(...pc1Values);
    const minY = Math.min(...pc2Values);
    const maxY = Math.max(...pc2Values);

    // Add padding for labels and visual breathing room
    // Extra Y padding at top for labels (already have SVG_TOP_PADDING too)
    const paddingX = (maxX - minX) * 0.15;
    const paddingY = (maxY - minY) * 0.20;

    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY,
      width: maxX - minX + 2 * paddingX,
      height: maxY - minY + 2 * paddingY,
    };
  }, [userPositions]);

  // Transform data coordinates to SVG coordinates
  const toSVG = (pc1: number, pc2: number) => {
    const svgWidth = 800;
    const svgHeight = 600;

    const x = ((pc1 - bounds.minX) / bounds.width) * svgWidth;
    // Invert Y axis (SVG Y increases downward)
    const y = svgHeight - ((pc2 - bounds.minY) / bounds.height) * svgHeight;

    return { x, y };
  };

  const currentUserPosition = userPositions.find((p) => p.userId === currentUserId);

  // Compute smoothed convex hulls for all groups
  const groupBoundaries = useMemo(() => {
    return groups.map((group) => {
      // Get all user positions in this group
      const groupUsers = userPositions.filter((u) => u.coarseGroupId === group.id);

      // Convert to SVG coordinates
      const svgPoints: Point2D[] = groupUsers.map((u) => {
        const { x, y } = toSVG(u.pc1, u.pc2);
        return { x, y };
      });

      // Compute smoothed hull
      const hullResult = computeSmoothedHull(svgPoints);

      // Fallback to circle for small groups (1-2 users) or degenerate cases
      if (!hullResult) {
        const centroidSVG = toSVG(group.centroid[0], group.centroid[1]);
        const radius = estimateRadius(svgPoints);
        return {
          groupId: group.id,
          type: "circle" as const,
          centroid: centroidSVG,
          radius,
        };
      }

      return {
        groupId: group.id,
        type: "hull" as const,
        path: hullResult.path,
        hull: hullResult.hull,
      };
    });
  }, [groups, userPositions, bounds, toSVG]);

  return (
    <div className={`bg-white rounded-xl shadow-xl p-6 ${className}`}>
      {/* SVG Canvas */}
      <svg
        viewBox={`0 -${SVG_TOP_PADDING} 800 ${600 + SVG_TOP_PADDING + SVG_BOTTOM_PADDING}`}
        className="w-full h-auto border border-gray-200 rounded-lg"
        role="img"
        aria-label={opinionMap.ariaLabel}
      >
        {/* Background */}
        <rect x="0" y={`-${SVG_TOP_PADDING}`} width="800" height={600 + SVG_TOP_PADDING + SVG_BOTTOM_PADDING} fill="#F9FAFB" />

        {/* Grid lines */}
        <g stroke="#E5E7EB" strokeWidth="1" opacity="0.3">
          {/* Vertical lines */}
          {[0, 200, 400, 600, 800].map((x) => (
            <line key={`v-${x}`} x1={x} y1={`-${SVG_TOP_PADDING}`} x2={x} y2={600 + SVG_BOTTOM_PADDING} />
          ))}
          {/* Horizontal lines */}
          {[0, 150, 300, 450, 600].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="800" y2={y} />
          ))}
        </g>

        {/* Group boundaries (smoothed convex hulls or circle fallbacks) */}
        {groups.map((group, idx) => {
          const color = getGroupColor(group.id);
          const boundary = groupBoundaries[idx];
          const { x: centroidX, y: centroidY } = toSVG(group.centroid[0], group.centroid[1]);
          const isHovered = hoveredGroupId === group.id;

          // Calculate label position based on boundary type
          let labelY: number;
          if (boundary.type === "circle") {
            labelY = centroidY - boundary.radius - 10;
          } else {
            // For hulls, find the topmost point (minimum Y)
            const minY = Math.min(...boundary.hull.map((p) => p.y));
            labelY = minY - 10;
          }

          return (
            <g key={`group-${group.id}`}>
              {/* Group region (hull path or circle fallback) */}
              {boundary.type === "hull" ? (
                <path
                  d={boundary.path}
                  fill={color.light}
                  stroke={color.primary}
                  strokeWidth="2"
                  opacity={isHovered ? 0.3 : 0.15}
                  className="transition-opacity cursor-pointer"
                  onMouseEnter={() => setHoveredGroupId(group.id)}
                  onMouseLeave={() => setHoveredGroupId(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={opinionMap.ariaGroup(group.id + 1)}
                />
              ) : (
                <circle
                  cx={boundary.centroid.x}
                  cy={boundary.centroid.y}
                  r={boundary.radius}
                  fill={color.light}
                  stroke={color.primary}
                  strokeWidth="2"
                  opacity={isHovered ? 0.3 : 0.15}
                  className="transition-opacity cursor-pointer"
                  onMouseEnter={() => setHoveredGroupId(group.id)}
                  onMouseLeave={() => setHoveredGroupId(null)}
                  role="button"
                  tabIndex={0}
                  aria-label={opinionMap.ariaGroup(group.id + 1)}
                />
              )}

              {/* Group centroid marker */}
              <circle
                cx={centroidX}
                cy={centroidY}
                r="8"
                fill={color.primary}
                stroke="white"
                strokeWidth="2"
                opacity="0.8"
              />

              {/* Group label */}
              <text
                x={centroidX}
                y={labelY}
                textAnchor="middle"
                fill={color.dark}
                fontSize="16"
                fontWeight="bold"
                className="pointer-events-none"
              >
                {group.label}
              </text>

              {/* User count label */}
              <text
                x={centroidX}
                y={labelY - 18}
                textAnchor="middle"
                fill="#6B7280"
                fontSize="12"
                className="pointer-events-none"
              >
                {opinionMap.groupSize(group.userCount)}
              </text>
            </g>
          );
        })}

        {/* Current user position ONLY (privacy-preserving) */}
        {currentUserPosition && (
          <g>
            {/* Pulsing ring for prominence */}
            <circle
              cx={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).x}
              cy={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).y}
              r="20"
              fill="none"
              stroke="var(--primary)"
              strokeWidth="2"
              opacity="0.5"
            >
              <animate
                attributeName="r"
                from="20"
                to="30"
                dur="2s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                from="0.5"
                to="0"
                dur="2s"
                repeatCount="indefinite"
              />
            </circle>

            {/* User marker (prominent) */}
            <circle
              cx={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).x}
              cy={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).y}
              r="10"
              fill="var(--background)"
              stroke="var(--primary)"
              strokeWidth="3"
              className="drop-shadow-lg"
            />

            {/* "You are here" label */}
            <text
              x={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).x}
              y={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).y + 25}
              textAnchor="middle"
              fill="var(--foreground)"
              fontSize="14"
              fontWeight="600"
              className="pointer-events-none"
            >
              אתם כאן
            </text>
          </g>
        )}
      </svg>

      {/* Privacy-preserving legend */}
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-background border-2 border-primary" />
          <span>{opinionMap.yourPosition}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-purple-200 border-2 border-purple-500" />
          <span>אזורי קבוצות דעה</span>
        </div>
      </div>
    </div>
  );
}

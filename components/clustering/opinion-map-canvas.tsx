"use client";

/**
 * Desktop Opinion Map Visualization (SVG-based) - PRIVACY-PRESERVING
 * Shows ONLY: group boundaries, group centroids, and current user's position
 * Does NOT show: individual positions of other users (privacy protection)
 */

import { useMemo, useState } from "react";
import { UserPosition, CoarseGroup, getGroupColor } from "./types";
import { opinionMap } from "@/lib/strings/he";

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

  // Calculate visualization bounds from group centroids
  const bounds = useMemo(() => {
    if (groups.length === 0) {
      return { minX: -1, maxX: 1, minY: -1, maxY: 1, width: 2, height: 2 };
    }

    const centroids = groups.map((g) => g.centroid);
    const pc1Values = centroids.map((c) => c[0]);
    const pc2Values = centroids.map((c) => c[1]);

    const minX = Math.min(...pc1Values);
    const maxX = Math.max(...pc1Values);
    const minY = Math.min(...pc2Values);
    const maxY = Math.max(...pc2Values);

    // Add 20% padding for better visualization
    const paddingX = (maxX - minX) * 0.2;
    const paddingY = (maxY - minY) * 0.2;

    return {
      minX: minX - paddingX,
      maxX: maxX + paddingX,
      minY: minY - paddingY,
      maxY: maxY + paddingY,
      width: maxX - minX + 2 * paddingX,
      height: maxY - minY + 2 * paddingY,
    };
  }, [groups]);

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

  // Calculate group boundaries (convex hulls approximated as circles for MVP)
  const getGroupRadius = (group: CoarseGroup) => {
    // Approximate radius based on group size
    // Larger groups = larger visual area
    return Math.max(60, Math.sqrt(group.userCount) * 15);
  };

  return (
    <div className={`bg-white rounded-xl shadow-xl p-6 ${className}`}>
      {/* SVG Canvas */}
      <svg
        viewBox="0 0 800 600"
        className="w-full h-auto border border-gray-200 rounded-lg"
        role="img"
        aria-label={opinionMap.ariaLabel}
      >
        {/* Background */}
        <rect width="800" height="600" fill="#F9FAFB" />

        {/* Grid lines */}
        <g stroke="#E5E7EB" strokeWidth="1" opacity="0.3">
          {/* Vertical lines */}
          {[0, 200, 400, 600, 800].map((x) => (
            <line key={`v-${x}`} x1={x} y1="0" x2={x} y2="600" />
          ))}
          {/* Horizontal lines */}
          {[0, 150, 300, 450, 600].map((y) => (
            <line key={`h-${y}`} x1="0" y1={y} x2="800" y2={y} />
          ))}
        </g>

        {/* Group boundaries (semi-transparent regions) */}
        {groups.map((group) => {
          const color = getGroupColor(group.id);
          const { x, y } = toSVG(group.centroid[0], group.centroid[1]);
          const radius = getGroupRadius(group);
          const isHovered = hoveredGroupId === group.id;

          return (
            <g key={`group-${group.id}`}>
              {/* Group region (circle approximation) */}
              <circle
                cx={x}
                cy={y}
                r={radius}
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

              {/* Group centroid marker */}
              <circle
                cx={x}
                cy={y}
                r="8"
                fill={color.primary}
                stroke="white"
                strokeWidth="2"
                opacity="0.8"
              />

              {/* Group label */}
              <text
                x={x}
                y={y - radius - 10}
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
                x={x}
                y={y - radius - 28}
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
              stroke={getGroupColor(currentUserPosition.coarseGroupId).primary}
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
              fill="white"
              stroke={getGroupColor(currentUserPosition.coarseGroupId).primary}
              strokeWidth="3"
              className="drop-shadow-lg"
            />

            {/* "You are here" label */}
            <text
              x={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).x}
              y={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).y + 25}
              textAnchor="middle"
              fill="#1F2937"
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
      <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white border-2 border-purple-500" />
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

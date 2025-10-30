"use client";

/**
 * Mobile-Optimized Opinion Map Visualization - PRIVACY-PRESERVING
 * Touch-friendly version for small screens with larger targets and simplified visuals
 * Shows ONLY: group boundaries, group centroids, and current user's position
 * Does NOT show: individual positions of other users (privacy protection)
 */

import { useMemo, useState } from "react";
import { UserPosition, CoarseGroup, getGroupColor, Point2D } from "./types";
import { opinionMap } from "@/lib/strings/he";
import { computeSmoothedHull, estimateRadius } from "@/lib/clustering/convex-hull";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface OpinionMapCanvasMobileProps {
  userPositions: UserPosition[];
  groups: CoarseGroup[];
  currentUserId?: string;
  onGroupClick?: (groupId: number) => void;
}

export function OpinionMapCanvasMobile({
  userPositions,
  groups,
  currentUserId,
  onGroupClick,
}: OpinionMapCanvasMobileProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

  // Mobile-optimized SVG dimensions (square aspect ratio for portrait)
  const SVG_WIDTH = 375;
  const SVG_HEIGHT = 375;
  const SVG_TOP_PADDING = 50;
  const SVG_BOTTOM_PADDING = 30;

  // Calculate visualization bounds from ALL user positions
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

    // More padding for mobile (labels need more space)
    const paddingX = (maxX - minX) * 0.20;
    const paddingY = (maxY - minY) * 0.25;

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
  const toSVG = useMemo(() => {
    return (pc1: number, pc2: number) => {
      const x = ((pc1 - bounds.minX) / bounds.width) * SVG_WIDTH;
      const y = SVG_HEIGHT - ((pc2 - bounds.minY) / bounds.height) * SVG_HEIGHT;
      return { x, y };
    };
  }, [bounds]);

  const currentUserPosition = userPositions.find((p) => p.userId === currentUserId);

  // Compute smoothed convex hulls for all groups
  const groupBoundaries = useMemo(() => {
    return groups.map((group) => {
      const groupUsers = userPositions.filter((u) => u.coarseGroupId === group.id);

      const svgPoints: Point2D[] = groupUsers.map((u) => {
        const { x, y } = toSVG(u.pc1, u.pc2);
        return { x, y };
      });

      const hullResult = computeSmoothedHull(svgPoints);

      // Fallback to circle for small groups
      if (!hullResult) {
        const centroidSVG = toSVG(group.centroid[0], group.centroid[1]);
        const radius = estimateRadius(svgPoints);
        return {
          groupId: group.id,
          type: "circle" as const,
          centroid: centroidSVG,
          radius: Math.max(radius, 35), // Minimum 35px radius for touch
        };
      }

      return {
        groupId: group.id,
        type: "hull" as const,
        path: hullResult.path,
        hull: hullResult.hull,
      };
    });
  }, [groups, userPositions, toSVG]);

  const handleGroupTap = (groupId: number) => {
    setSelectedGroupId(groupId);
    onGroupClick?.(groupId);
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  return (
    <>
      <div className="bg-white rounded-2xl shadow-xl p-4">
        {/* Mobile-optimized SVG */}
        <svg
          viewBox={`0 -${SVG_TOP_PADDING} ${SVG_WIDTH} ${SVG_HEIGHT + SVG_TOP_PADDING + SVG_BOTTOM_PADDING}`}
          className="w-full h-auto touch-none select-none"
          role="img"
          aria-label={opinionMap.ariaLabel}
          style={{ touchAction: "none" }}
        >
          {/* Clean background (no grid for mobile simplicity) */}
          <rect
            x="0"
            y={-SVG_TOP_PADDING}
            width={SVG_WIDTH}
            height={SVG_HEIGHT + SVG_TOP_PADDING + SVG_BOTTOM_PADDING}
            fill="#F9FAFB"
            className="pointer-events-none"
          />

          {/* Group boundaries and labels */}
          {groups.map((group, idx) => {
            const color = getGroupColor(group.id);
            const boundary = groupBoundaries[idx];
            const { x: centroidX, y: centroidY } = toSVG(group.centroid[0], group.centroid[1]);

            // Calculate label position (above the boundary)
            let labelY: number;
            if (boundary.type === "circle") {
              labelY = centroidY - boundary.radius - 18;
            } else {
              const minY = Math.min(...boundary.hull.map((p) => p.y));
              labelY = minY - 18;
            }

            // Calculate user count label position
            const userCountY = labelY - 22;

            return (
              <g key={`group-${group.id}`}>
                {/* Touch-optimized group region */}
                {boundary.type === "hull" ? (
                  <path
                    d={boundary.path}
                    fill={color.light}
                    stroke={color.primary}
                    strokeWidth="3"
                    opacity="0.25"
                    className="cursor-pointer active:opacity-50 transition-opacity"
                    onClick={() => handleGroupTap(group.id)}
                    style={{
                      touchAction: "none",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  />
                ) : (
                  <circle
                    cx={boundary.centroid.x}
                    cy={boundary.centroid.y}
                    r={boundary.radius}
                    fill={color.light}
                    stroke={color.primary}
                    strokeWidth="3"
                    opacity="0.25"
                    className="cursor-pointer active:opacity-50 transition-opacity"
                    onClick={() => handleGroupTap(group.id)}
                    style={{
                      touchAction: "none",
                      WebkitTapHighlightColor: "transparent",
                    }}
                  />
                )}

                {/* Larger centroid marker for mobile */}
                <circle
                  cx={centroidX}
                  cy={centroidY}
                  r="12"
                  fill={color.primary}
                  stroke="white"
                  strokeWidth="3"
                  opacity="0.9"
                  className="pointer-events-none"
                />

                {/* Larger label text for mobile legibility */}
                <text
                  x={centroidX}
                  y={labelY}
                  textAnchor="middle"
                  fill={color.dark}
                  fontSize="18"
                  fontWeight="700"
                  className="pointer-events-none"
                >
                  {group.label}
                </text>

                {/* User count - larger text */}
                <text
                  x={centroidX}
                  y={userCountY}
                  textAnchor="middle"
                  fill="#6B7280"
                  fontSize="14"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  {opinionMap.groupSize(group.userCount)}
                </text>
              </g>
            );
          })}

          {/* Current user position - extra prominent on mobile */}
          {currentUserPosition && (
            <g>
              {/* Larger pulsing ring for visibility */}
              <circle
                cx={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).x}
                cy={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).y}
                r="28"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="3"
                opacity="0.6"
              >
                <animate
                  attributeName="r"
                  from="28"
                  to="45"
                  dur="2s"
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  from="0.6"
                  to="0"
                  dur="2s"
                  repeatCount="indefinite"
                />
              </circle>

              {/* Larger user marker for mobile touch */}
              <circle
                cx={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).x}
                cy={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).y}
                r="14"
                fill="white"
                stroke="#8B5CF6"
                strokeWidth="4"
                className="drop-shadow-lg pointer-events-none"
              />

              {/* "You are here" label - larger and bolder */}
              <text
                x={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).x}
                y={toSVG(currentUserPosition.pc1, currentUserPosition.pc2).y + 38}
                textAnchor="middle"
                fill="#1F2937"
                fontSize="16"
                fontWeight="700"
                className="pointer-events-none"
              >
                {opinionMap.mobileYouAreHere}
              </text>
            </g>
          )}
        </svg>

        {/* Mobile legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-white border-4 border-purple-600 shadow-sm" />
            <span className="font-medium">{opinionMap.yourPosition}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-200 border-2 border-purple-500" />
            <span>{opinionMap.mobileLegendGroups}</span>
          </div>
        </div>

        {/* Tap instruction */}
        <div className="mt-3 text-center text-xs text-gray-500 font-medium">
          {opinionMap.mobileTapInstruction}
        </div>
      </div>

      {/* Bottom sheet for group details */}
      <Sheet open={selectedGroupId !== null} onOpenChange={(open) => !open && setSelectedGroupId(null)}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl">
          {selectedGroup && (
            <>
              <SheetHeader>
                <SheetTitle className="text-xl font-bold flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full border-2 border-white shadow-md"
                    style={{ backgroundColor: getGroupColor(selectedGroup.id).primary }}
                  />
                  {selectedGroup.label}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {/* Group size card */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm text-gray-600 mb-1">{opinionMap.mobileGroupSize}</div>
                  <div className="text-3xl font-bold text-gray-900">
                    {selectedGroup.userCount}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    {opinionMap.mobileGroupPercentage((selectedGroup.userCount / userPositions.length) * 100)}
                  </div>
                </div>

                {/* User's membership indicator */}
                {currentUserPosition && currentUserPosition.coarseGroupId === selectedGroup.id && (
                  <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <span className="text-2xl">✓</span>
                    </div>
                    <div>
                      <div className="font-semibold text-purple-900">{opinionMap.yourGroup}</div>
                      <div className="text-sm text-purple-700">{opinionMap.mobileYourGroupDesc}</div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}

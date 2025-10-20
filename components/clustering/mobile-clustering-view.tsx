"use client";

/**
 * Mobile-Optimized Clustering View
 * Shows group distribution as stacked bars instead of complex 2D visualization
 */

import { CoarseGroup, UserPosition, getGroupColor } from "./types";
import { opinionMap } from "@/lib/strings/he";
import { Users } from "lucide-react";

interface MobileClusteringViewProps {
  groups: CoarseGroup[];
  userPositions: UserPosition[];
  currentUserId?: string;
  totalUsers: number;
}

export function MobileClusteringView({
  groups,
  userPositions,
  currentUserId,
  totalUsers,
}: MobileClusteringViewProps) {
  const currentUserPosition = userPositions.find((p) => p.userId === currentUserId);

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 space-y-4">
      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900">
        {opinionMap.tableViewTitle}
      </h3>

      {/* Group bars */}
      <div className="space-y-3">
        {groups
          .sort((a, b) => b.userCount - a.userCount) // Sort by size
          .map((group) => {
            const color = getGroupColor(group.id);
            const percentage = (group.userCount / totalUsers) * 100;
            const isUserGroup = currentUserPosition?.coarseGroupId === group.id;

            return (
              <div
                key={group.id}
                className={`p-4 rounded-lg transition-all ${
                  isUserGroup
                    ? "bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300"
                    : "bg-gray-50"
                }`}
              >
                {/* Group header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                      style={{ backgroundColor: color.primary }}
                    />
                    <span className="font-medium text-gray-900">
                      {group.label}
                    </span>
                    {isUserGroup && (
                      <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">
                        שלך
                      </span>
                    )}
                  </div>
                  <div className="text-end">
                    <div className="text-lg font-bold text-gray-900">
                      {group.userCount}
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(0)}%
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: color.primary,
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Total count */}
      <div className="pt-4 border-t border-gray-200 flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Users className="w-4 h-4" />
          <span>סה״כ משתתפים</span>
        </div>
        <span className="font-bold text-gray-900">{totalUsers}</span>
      </div>
    </div>
  );
}

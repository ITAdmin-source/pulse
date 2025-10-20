/**
 * Legend Component for Opinion Map
 * Shows group colors, sizes, and current user's position
 */

import { opinionMap } from "@/lib/strings/he";
import { CoarseGroup } from "./types";
import { getGroupColor } from "./types";
import { MapPin } from "lucide-react";

interface OpinionMapLegendProps {
  groups: CoarseGroup[];
  currentUserGroupId?: number;
  className?: string;
}

export function OpinionMapLegend({
  groups,
  currentUserGroupId,
  className = "",
}: OpinionMapLegendProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-4 ${className}`}>
      {/* Title */}
      <h3 className="text-lg font-bold text-gray-900 mb-4">
        {opinionMap.legendTitle}
      </h3>

      {/* Groups list */}
      <div className="space-y-3">
        {groups.map((group) => {
          const color = getGroupColor(group.id);
          const isUserGroup = currentUserGroupId === group.id;

          return (
            <div
              key={group.id}
              className={`flex items-center justify-between p-3 rounded-lg transition-all ${
                isUserGroup
                  ? "bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300"
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              {/* Color dot and label */}
              <div className="flex items-center gap-3 flex-1">
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-md flex-shrink-0"
                  style={{ backgroundColor: color.primary }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900 truncate">
                      {group.label}
                    </span>
                    {isUserGroup && (
                      <MapPin className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    )}
                  </div>
                  {isUserGroup && (
                    <span className="text-xs text-purple-600 font-medium">
                      {opinionMap.yourGroup}
                    </span>
                  )}
                </div>
              </div>

              {/* Group size */}
              <span className="text-sm text-gray-600 font-medium ms-2 flex-shrink-0">
                {opinionMap.groupSize(group.userCount)}
              </span>
            </div>
          );
        })}
      </div>

      {/* Legend footer with your position indicator */}
      {currentUserGroupId !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-purple-600" />
            <span>{opinionMap.yourPosition}</span>
          </div>
        </div>
      )}
    </div>
  );
}

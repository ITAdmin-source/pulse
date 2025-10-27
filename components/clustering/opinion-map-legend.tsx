"use client";

/**
 * Legend Component for Opinion Map
 * Shows group colors, sizes, demographics, and current user's position
 */

import { opinionMap } from "@/lib/strings/he";
import { CoarseGroup } from "./types";
import { getGroupColor } from "./types";
import { MapPin, ChevronDown, ChevronUp } from "lucide-react";
import { GroupDemographics } from "./group-demographics";

interface OpinionMapLegendProps {
  groups: CoarseGroup[];
  currentUserGroupId?: number;
  expandedGroups: Set<number>;
  onGroupToggle: (groupId: number) => void;
  className?: string;
}

export function OpinionMapLegend({
  groups,
  currentUserGroupId,
  expandedGroups,
  onGroupToggle,
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
          const isExpanded = expandedGroups.has(group.id);

          return (
            <div
              key={group.id}
              className={`rounded-lg transition-all overflow-hidden ${
                isUserGroup
                  ? "bg-gradient-legend-active border-2 border-primary-300"
                  : "bg-gray-50"
              }`}
            >
              {/* Group header - clickable to expand/collapse */}
              <button
                onClick={() => onGroupToggle(group.id)}
                className={`w-full flex items-center justify-between p-3 text-start transition-colors ${
                  !isUserGroup && "hover:bg-gray-100"
                }`}
              >
                {/* Color dot and label */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
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
                        <MapPin className="w-4 h-4 text-primary-600 flex-shrink-0" />
                      )}
                    </div>
                    {isUserGroup && (
                      <span className="text-xs text-primary-600 font-medium">
                        {opinionMap.yourGroup}
                      </span>
                    )}
                  </div>
                </div>

                {/* Group size and expand icon */}
                <div className="flex items-center gap-2 ms-2 flex-shrink-0">
                  <span className="text-sm text-gray-600 font-medium">
                    {opinionMap.groupSize(group.userCount)}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Demographics (expandable) */}
              {isExpanded && (
                <div className="px-3 pb-3 border-t border-gray-200 pt-3 mt-1">
                  <GroupDemographics
                    demographics={group.demographics}
                    totalUsers={group.userCount}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend footer with your position indicator */}
      {currentUserGroupId !== undefined && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4 text-primary-600" />
            <span>{opinionMap.yourPosition}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Not Eligible State for Clustering Visualization
 * Shown when poll doesn't have enough data for clustering
 */

import { opinionMap } from "@/lib/strings/he";
import { Users, FileText } from "lucide-react";

interface ClusteringNotEligibleProps {
  reason: string;
  userCount?: number;
  statementCount?: number;
  requiredUsers?: number;
  requiredStatements?: number;
}

export function ClusteringNotEligible({
  reason,
  userCount,
  statementCount,
  requiredUsers = 20,
  requiredStatements = 6,
}: ClusteringNotEligibleProps) {
  return (
    <div className="flex min-h-[600px] items-center justify-center bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center space-y-6 max-w-md">
        {/* Info icon with gradient */}
        <div className="mx-auto w-20 h-20 rounded-full bg-gradient-eligibility flex items-center justify-center">
          <div className="text-4xl">📊</div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h3 className="text-2xl font-bold text-gray-900">
            {opinionMap.notEligibleTitle}
          </h3>
          <p className="text-gray-600 text-lg">{reason}</p>
        </div>

        {/* Progress indicators */}
        <div className="space-y-4 pt-4">
          {/* User count */}
          {userCount !== undefined && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <Users className="w-5 h-5" />
                  <span className="font-medium">משתתפים</span>
                </div>
                <span className="text-sm font-bold text-primary-600">
                  {userCount} / {requiredUsers}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-progress h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (userCount / requiredUsers) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Statement count */}
          {statementCount !== undefined && (
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-gray-700">
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">עמדות</span>
                </div>
                <span className="text-sm font-bold text-primary-600">
                  {statementCount} / {requiredStatements}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-progress h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, (statementCount / requiredStatements) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Help text */}
        <p className="text-gray-500 text-sm pt-4">
          {opinionMap.checkBackLater}
        </p>
      </div>
    </div>
  );
}

/**
 * Loading Skeleton for Clustering Visualization
 */

import { opinionMap } from "@/lib/strings/he";

export function ClusteringLoadingSkeleton() {
  return (
    <div className="flex min-h-[600px] items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-2xl">
      <div className="text-center space-y-4">
        {/* Animated spinner */}
        <div className="relative mx-auto h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-purple-200/20"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
        </div>

        {/* Loading text */}
        <div className="space-y-2">
          <p className="text-white text-lg font-medium">{opinionMap.loading}</p>
          <p className="text-purple-200 text-sm">{opinionMap.computing}</p>
        </div>

        {/* Skeleton visualization preview */}
        <div className="mt-8 space-y-3">
          <div className="h-2 w-48 mx-auto bg-purple-400/20 rounded-full animate-pulse"></div>
          <div className="h-2 w-36 mx-auto bg-purple-400/20 rounded-full animate-pulse delay-75"></div>
          <div className="h-2 w-40 mx-auto bg-purple-400/20 rounded-full animate-pulse delay-150"></div>
        </div>
      </div>
    </div>
  );
}

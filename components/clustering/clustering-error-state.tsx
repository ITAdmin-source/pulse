/**
 * Error State for Clustering Visualization
 */

import { opinionMap } from "@/lib/strings/he";
import { AlertCircle, RefreshCw } from "lucide-react";

interface ClusteringErrorStateProps {
  error?: string;
  onRetry?: () => void;
}

export function ClusteringErrorState({
  error,
  onRetry,
}: ClusteringErrorStateProps) {
  return (
    <div className="flex min-h-[600px] items-center justify-center bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center space-y-6 max-w-md">
        {/* Error icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        {/* Error message */}
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-gray-900">
            {opinionMap.errorTitle}
          </h3>
          <p className="text-gray-600">
            {error || opinionMap.errorMessage}
          </p>
        </div>

        {/* Retry button */}
        {onRetry && (
          <button
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl"
          >
            <RefreshCw className="w-4 h-4" />
            {opinionMap.errorRetry}
          </button>
        )}
      </div>
    </div>
  );
}

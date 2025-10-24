"use client";

/**
 * Clustering Trigger Button Component
 * Allows admins/managers to manually trigger clustering computation
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { manualTriggerClusteringAction } from "@/actions/clustering-actions";
import { useToast } from "@/hooks/use-toast";

interface ClusteringTriggerButtonProps {
  pollId: string;
  className?: string;
}

export function ClusteringTriggerButton({
  pollId,
  className = "",
}: ClusteringTriggerButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{
    success: boolean;
    duration?: number;
    error?: string;
  } | null>(null);
  const { toast } = useToast();

  const handleTrigger = async () => {
    setIsLoading(true);
    setLastResult(null);

    try {
      const result = await manualTriggerClusteringAction(pollId);

      if (result.success) {
        setLastResult({
          success: true,
          duration: result.data?.duration,
        });

        toast({
          title: "✅ Clustering Completed",
          description: `Successfully computed clustering in ${Math.round((result.data?.duration || 0) / 1000)}s. ${
            result.data?.totalUsers || 0
          } users grouped into ${result.data?.numCoarseGroups || 0} opinion groups.`,
          variant: "default",
        });
      } else {
        setLastResult({
          success: false,
          error: result.error,
        });

        toast({
          title: "❌ Clustering Failed",
          description: result.error || "Failed to compute clustering",
          variant: "destructive",
        });
      }
    } catch (error) {
      setLastResult({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });

      toast({
        title: "❌ Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <Button
        onClick={handleTrigger}
        disabled={isLoading}
        variant="outline"
        className="w-full sm:w-auto"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 me-2 animate-spin" />
            Computing...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 me-2" />
            Recompute Clustering
          </>
        )}
      </Button>

      {lastResult && (
        <div
          className={`flex items-start gap-2 p-3 rounded-lg text-sm ${
            lastResult.success
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-red-50 border border-red-200 text-red-800"
          }`}
        >
          {lastResult.success ? (
            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          )}
          <div>
            {lastResult.success ? (
              <p>
                Clustering completed successfully
                {lastResult.duration && ` in ${Math.round(lastResult.duration / 1000)}s`}
              </p>
            ) : (
              <p>{lastResult.error || "Failed to compute clustering"}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

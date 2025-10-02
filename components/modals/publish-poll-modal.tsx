"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CheckCircle, AlertTriangle } from "lucide-react";

interface PublishPollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  statementCount: number;
  threshold: number;
  hasScheduledStart?: boolean;
}

export function PublishPollModal({
  open,
  onOpenChange,
  onConfirm,
  statementCount,
  threshold,
  hasScheduledStart = false,
}: PublishPollModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Publish Poll?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>Ready to publish your poll?</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{statementCount} statements added</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Settings configured</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>Threshold set to {threshold}</span>
                </div>
              </div>

              {statementCount < 10 && (
                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Recommendation:</p>
                    <p>Add more statements for better insights. We recommend at least 10 statements.</p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">
                Once published, you can unpublish later if needed (returns to draft state).
              </p>

              <div className="text-sm">
                <span className="font-medium">Start Time: </span>
                <span className="text-gray-600">
                  {hasScheduledStart ? "Scheduled" : "Immediately"}
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            Publish Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

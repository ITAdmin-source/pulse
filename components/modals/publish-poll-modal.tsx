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
          <AlertDialogTitle>לפרסם את הסקר?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>מוכן לפרסם את הסקר שלך?</p>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{statementCount} הצהרות נוספו</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>ההגדרות הוגדרו</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>סף מינימום הוגדר ל-{threshold}</span>
                </div>
              </div>

              {statementCount < 10 && (
                <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium">המלצה:</p>
                    <p>הוסף עוד הצהרות לתובנות טובות יותר. אנו ממליצים על לפחות 10 הצהרות.</p>
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-600">
                לאחר הפרסום, ניתן לבטל את הפרסום במידת הצורך (חזרה למצב טיוטה).
              </p>

              <div className="text-sm">
                <span className="font-medium">זמן התחלה: </span>
                <span className="text-gray-600">
                  {hasScheduledStart ? "מתוזמן" : "מיידי"}
                </span>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            פרסם כעת
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

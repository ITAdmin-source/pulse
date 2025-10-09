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
import { AlertTriangle, CheckCircle } from "lucide-react";

interface UnpublishPollModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  voterCount: number;
  voteCount: number;
}

export function UnpublishPollModal({
  open,
  onOpenChange,
  onConfirm,
  voterCount,
  voteCount,
}: UnpublishPollModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>לבטל פרסום של הסקר?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p>האם אתה בטוח שברצונך לבטל את פרסום הסקר?</p>

              <div className="flex items-start gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium mb-2">פעולה זו תגרום ל:</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>הסתרת הסקר מהמשתמשים</li>
                    <li>הפסקת קבלת הצבעות</li>
                    <li>חזרה למצב טיוטה</li>
                    <li>שמירה על הצבעות קיימות</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm font-medium">סטטיסטיקות נוכחיות:</p>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{voterCount} מצביעים</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <CheckCircle className="h-4 w-4" />
                  <span>{voteCount} הצבעות נרשמו</span>
                </div>
              </div>

              <p className="text-sm text-gray-600">
                ניתן לפרסם מחדש את הסקר מאוחר יותר במידת הצורך.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ביטול</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-amber-600 hover:bg-amber-700"
          >
            ביטול פרסום
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

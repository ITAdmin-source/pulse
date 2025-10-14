"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { createStatementAction } from "@/actions/statements-actions";
import { toast } from "sonner";

interface StatementSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  pollTitle: string;
  userId: string | null;
  autoApprove: boolean;
}

const MAX_CHARACTERS = 140;

export function StatementSubmissionModal({
  open,
  onOpenChange,
  pollId,
  pollTitle,
  userId,
  autoApprove,
}: StatementSubmissionModalProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const canSubmit = text.trim().length > 0 && !isOverLimit && userId;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      const result = await createStatementAction({
        pollId,
        text: text.trim(),
        submittedBy: userId,
        approved: autoApprove ? true : null, // null = pending approval
      });

      if (result.success) {
        toast.success(
          autoApprove
            ? "הקלף שלך נוסף לחפיסה!"
            : "הקלף נשלח לבדיקה"
        );
        setText(""); // Clear form
        onOpenChange(false);
      } else {
        toast.error(result.error || "הוספת הקלף נכשלה");
      }
    } catch (error) {
      console.error("Error submitting card:", error);
      toast.error("אירעה שגיאה בלתי צפויה");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setText("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>יש לך רעיון? חסרה נקודת המבט שלך?</DialogTitle>
          <DialogDescription>
            {pollTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Card-style Text Editor */}
          <div className="space-y-2">
            <div className="relative p-6 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 shadow-md">
              <div className="flex items-center gap-3">
                <div className="text-xl opacity-40 flex-shrink-0">✦</div>
                <Textarea
                  id="card-text"
                  placeholder="כתוב את תשובתך כאן..."
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={isSubmitting}
                  className={`flex-1 text-center resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base font-medium text-gray-800 placeholder:text-gray-400 ${isOverLimit ? "text-red-600" : ""}`}
                  dir="auto"
                />
                <div className="text-xl opacity-40 flex-shrink-0">✦</div>
              </div>
            </div>

            {/* Character counter */}
            <div className="flex items-center gap-2 text-xs">
              <span className={isOverLimit ? "text-red-600 font-medium" : "text-gray-400"}>
                {characterCount}/{MAX_CHARACTERS} תווים
              </span>
              {isOverLimit && (
                <span className="text-red-600 font-medium">
                  ({characterCount - MAX_CHARACTERS} מעבר למגבלה)
                </span>
              )}
            </div>

            {/* Approval status helper text */}
            <p className="text-xs text-gray-400">
              {autoApprove
                ? "הקלף שלך יתווסף לחפיסה מיד"
                : "הקלף שלך יעבור בדיקה לפני שיתווסף לחפיסה"
              }
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            ביטול
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                מוסיף קלף...
              </>
            ) : (
              "הוספת קלף"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

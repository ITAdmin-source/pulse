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
import { X, Loader2 } from "lucide-react";
import { createStatementAction } from "@/actions/statements-actions";
import { toast } from "sonner";

interface StatementSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  userId: string | null;
  autoApprove: boolean;
}

const MAX_CHARACTERS = 140;

export function StatementSubmissionModal({
  open,
  onOpenChange,
  pollId,
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
            ? "הכרטיס שלך נוסף לחפיסה!"
            : "הכרטיס נשלח לבדיקה"
        );
        setText(""); // Clear form
        onOpenChange(false);
      } else {
        toast.error(result.error || "הוספת הכרטיס נכשלה");
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
          <DialogTitle>הוספת כרטיס חדש</DialogTitle>
          <DialogDescription>
            צור כרטיס חדש כדי להוסיף נקודת מבט חסרה לחפיסת הסקר.
            {!autoApprove && " הכרטיס שלך יבדק לפני ההוספה."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <label htmlFor="card-text" className="text-sm font-medium">
              מה צריך להיות כתוב על הכרטיס?
            </label>
            <Textarea
              id="card-text"
              placeholder="כתוב את ההצהרה כאן..."
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
              className={isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            <div className="flex items-center justify-between text-sm">
              <span className={isOverLimit ? "text-red-600 font-medium" : "text-gray-500"}>
                {characterCount}/{MAX_CHARACTERS} תווים
              </span>
              {isOverLimit && (
                <span className="text-red-600 font-medium">
                  {characterCount - MAX_CHARACTERS} מעבר למגבלה
                </span>
              )}
            </div>
          </div>

          {/* Mini Card Preview */}
          {text.trim().length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-600">תצוגה מקדימה:</label>
              <div className="relative">
                {/* Mini horizontal card preview */}
                <div className="relative p-4 rounded-xl border-0 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-xl opacity-60 flex-shrink-0">✦</div>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed line-clamp-2 flex-1 text-center">
                      {text}
                    </p>
                    <div className="text-xl opacity-60 flex-shrink-0">✦</div>
                  </div>
                </div>
              </div>
            </div>
          )}
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
                מוסיף כרטיס...
              </>
            ) : (
              "הוספת כרטיס"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

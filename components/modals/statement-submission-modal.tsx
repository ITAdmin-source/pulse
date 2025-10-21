"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { createStatementAction } from "@/actions/statements-actions";
import { ensureUserExistsAction } from "@/actions/users-actions";
import { useCurrentUser } from "@/hooks/use-current-user";
import { toast } from "sonner";

interface StatementSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  pollTitle: string;
  userId: string | null;
  autoApprove: boolean;
  onUserCreated?: (userId: string) => void;
}

const MAX_CHARACTERS = 140;

export function StatementSubmissionModal({
  open,
  onOpenChange,
  pollId,
  userId,
  autoApprove,
  onUserCreated,
}: StatementSubmissionModalProps) {
  const { user: dbUser, sessionId } = useCurrentUser();
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const characterCount = text.length;
  const isOverLimit = characterCount > MAX_CHARACTERS;
  const canSubmit = text.trim().length > 0 && !isOverLimit;

  const handleSubmit = async () => {
    if (!canSubmit) return;

    setIsSubmitting(true);

    try {
      // Ensure user exists (returns existing user or creates new one)
      let effectiveUserId = userId;

      if (!effectiveUserId) {
        const userResult = await ensureUserExistsAction({
          clerkUserId: dbUser?.clerkUserId || undefined,
          sessionId: sessionId || undefined,
        });

        if (!userResult.success || !userResult.data) {
          toast.error("שגיאה ביצירת משתמש");
          return;
        }

        effectiveUserId = userResult.data.id;

        // Notify parent component of user creation
        if (onUserCreated) {
          onUserCreated(effectiveUserId);
        }
      }

      // Submit statement with ensured userId
      const result = await createStatementAction({
        pollId,
        text: text.trim(),
        submittedBy: effectiveUserId,
        approved: autoApprove ? true : null, // null = pending approval
      });

      if (result.success) {
        toast.success(
          autoApprove
            ? "העמדה שלך נוספה!"
            : "העמדה נשלחה לאישור"
        );
        setText(""); // Clear form
        onOpenChange(false);
      } else {
        toast.error(result.error || "שגיאה בהוספת עמדה");
      }
    } catch (error) {
      console.error("Error submitting statement:", error);
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

  if (!open) return null;

  return (
    <div className="relative w-full max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4" dir="auto">
          הוסף עמדה משלך
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4" dir="auto">
          שתף עמדה שאחרים יוכלו להצביע עליה. שמור על בהירות ומיקוד ברעיון אחד.
        </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="לדוגמה: אנחנו צריכים זמני פגישה גמישים יותר"
        className="w-full p-3 sm:p-4 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:outline-none resize-none mb-3 sm:mb-4 text-sm sm:text-base text-gray-900 dark:text-white"
        rows={4}
        disabled={isSubmitting}
        dir="auto"
      />

      {/* Character counter */}
      <div className="mb-3 sm:mb-4">
        <span className={`text-xs ${isOverLimit ? "text-red-600 font-medium" : "text-gray-500"}`}>
          {characterCount}/{MAX_CHARACTERS} תווים
        </span>
        {isOverLimit && (
          <span className="text-xs text-red-600 font-medium ms-2">
            ({characterCount - MAX_CHARACTERS} מעבר למגבלה)
          </span>
        )}
      </div>

      {/* Approval status helper text */}
      <p className="text-xs text-gray-500 mb-4" dir="auto">
        {autoApprove
          ? "העמדה שלך תתווסף מיד"
          : "העמדה שלך תעבור אישור לפני שתתווסף"
        }
      </p>

      <div className="flex gap-2 sm:gap-3">
        <button
          onClick={handleClose}
          disabled={isSubmitting}
          className="flex-1 py-2.5 sm:py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ביטול
        </button>
        <button
          onClick={handleSubmit}
          disabled={!canSubmit || isSubmitting}
          className="flex-1 py-2.5 sm:py-3 btn-primary text-white rounded-xl font-semibold transition-colors text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>שולח...</span>
            </>
          ) : (
            "שלח עמדה"
          )}
        </button>
      </div>
      </div>
    </div>
  );
}

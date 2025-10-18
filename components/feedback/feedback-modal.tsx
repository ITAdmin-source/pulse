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
import { Loader2, CheckCircle2 } from "lucide-react";
import { submitFeedbackAction } from "@/actions/feedback-actions";
import { toast } from "sonner";
import { feedback as feedbackStrings } from "@/lib/strings/he";

/**
 * Capture page URL from window location (client-side)
 */
function capturePageUrl(): string {
  if (typeof window !== "undefined") {
    return window.location.pathname + window.location.search;
  }
  return "";
}

/**
 * Capture user agent from navigator (client-side)
 */
function captureUserAgent(): string {
  if (typeof window !== "undefined" && navigator) {
    return navigator.userAgent;
  }
  return "";
}

interface FeedbackModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId?: string | null; // Optional - can be null for anonymous users
}

const MAX_CHARACTERS = 1000;

export function FeedbackModal({
  open,
  onOpenChange,
  userId,
}: FeedbackModalProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const remainingChars = MAX_CHARACTERS - text.length;
  const isOverLimit = remainingChars < 0;
  const isEmpty = text.trim().length === 0;

  const handleSubmit = async () => {
    if (isEmpty || isOverLimit) return;

    setIsSubmitting(true);

    try {
      // Auto-capture page URL and user agent
      const pageUrl = capturePageUrl();
      const userAgent = captureUserAgent();

      const result = await submitFeedbackAction({
        userId: userId || null,
        feedbackText: text.trim(),
        pageUrl,
        userAgent,
      });

      if (result.success) {
        // Show success acknowledgement
        setShowSuccess(true);
        setText(""); // Clear form

        // Keep toast for additional feedback
        toast.success(feedbackStrings.successMessage);
      } else {
        toast.error(result.error || feedbackStrings.errorMessage);
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error(feedbackStrings.errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setText("");
    setShowSuccess(false);
    onOpenChange(false);
  };

  const handleClose = () => {
    setText("");
    setShowSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]" dir="rtl">
        {showSuccess ? (
          // Success Acknowledgement View
          <>
            <DialogHeader>
              <div className="flex flex-col items-center gap-4 py-4">
                <div className="rounded-full bg-green-100 p-4">
                  <CheckCircle2 className="h-12 w-12 text-green-600" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center">
                  {feedbackStrings.acknowledgementTitle}
                </DialogTitle>
                <DialogDescription className="text-base text-center px-4">
                  {feedbackStrings.acknowledgementMessage}
                </DialogDescription>
              </div>
            </DialogHeader>

            <DialogFooter>
              <Button
                onClick={handleClose}
                className="w-full btn-primary"
              >
                {feedbackStrings.closeButton}
              </Button>
            </DialogFooter>
          </>
        ) : (
          // Feedback Form View
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                {feedbackStrings.modalTitle}
              </DialogTitle>
              <DialogDescription className="text-base">
                {feedbackStrings.modalDescription}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={8}
                  disabled={isSubmitting}
                  placeholder={feedbackStrings.placeholder}
                  className="resize-none text-base"
                  dir="auto"
                />

                {/* Character Counter */}
                <div
                  className={`text-sm text-end ${
                    isOverLimit
                      ? "text-red-600 font-semibold"
                      : remainingChars < 100
                      ? "text-amber-600"
                      : "text-gray-500"
                  }`}
                >
                  {isOverLimit
                    ? feedbackStrings.characterLimitExceeded
                    : feedbackStrings.characterLimit(remainingChars)}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                {feedbackStrings.cancelButton}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isEmpty || isOverLimit || isSubmitting}
                className="btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 me-2 animate-spin" />
                    {feedbackStrings.submittingButton}
                  </>
                ) : (
                  feedbackStrings.submitButton
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

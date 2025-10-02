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
import { Card, CardContent } from "@/components/ui/card";
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

const MAX_CHARACTERS = 200;

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
            ? "Statement submitted and approved!"
            : "Statement submitted for approval"
        );
        setText(""); // Clear form
        onOpenChange(false);
      } else {
        toast.error(result.error || "Failed to submit statement");
      }
    } catch (error) {
      console.error("Error submitting statement:", error);
      toast.error("An unexpected error occurred");
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
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Submit a Statement</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Share your perspective by adding a statement to this poll.
            {!autoApprove && " Your statement will be reviewed before appearing in the poll."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Text Input */}
          <div className="space-y-2">
            <label htmlFor="statement-text" className="text-sm font-medium">
              Write your statement:
            </label>
            <Textarea
              id="statement-text"
              placeholder="Enter your statement here..."
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isSubmitting}
              className={isOverLimit ? "border-red-500 focus-visible:ring-red-500" : ""}
            />
            <div className="flex items-center justify-between text-sm">
              <span className={isOverLimit ? "text-red-600 font-medium" : "text-gray-500"}>
                Characters: {characterCount}/{MAX_CHARACTERS}
              </span>
              {isOverLimit && (
                <span className="text-red-600 font-medium">
                  {characterCount - MAX_CHARACTERS} over limit
                </span>
              )}
            </div>
          </div>

          {/* Preview */}
          {text.trim().length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Preview:</label>
              <Card>
                <CardContent className="p-4">
                  <p className="text-sm text-center leading-relaxed">{text}</p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Statement"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

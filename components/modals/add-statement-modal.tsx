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

interface AddStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pollId: string;
  userId: string;
  onSuccess: () => void;
}

export function AddStatementModal({
  open,
  onOpenChange,
  pollId,
  userId,
  onSuccess,
}: AddStatementModalProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdd = async () => {
    if (!text.trim()) return;

    setIsSubmitting(true);

    try {
      const result = await createStatementAction({
        pollId,
        text: text.trim(),
        submittedBy: userId,
        approved: true, // Owner/manager statements are pre-approved
      });

      if (result.success) {
        toast.success("ההצהרה נוספה בהצלחה");
        setText(""); // Clear form
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "נכשל להוסיף הצהרה");
      }
    } catch (error) {
      console.error("Error adding statement:", error);
      toast.error("אירעה שגיאה לא צפויה");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>הוספת הצהרה</DialogTitle>
          <DialogDescription>
            הוסף הצהרה חדשה לסקר זה. היא תאושר באופן אוטומטי.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            disabled={isSubmitting}
            placeholder="הזן טקסט הצהרה..."
            className="text-gray-900 dark:text-white"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button onClick={handleAdd} disabled={!text.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                מוסיף...
              </>
            ) : (
              "הוסף הצהרה"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

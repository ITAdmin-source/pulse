"use client";

import { useState, useEffect } from "react";
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
import { updateStatementAction } from "@/actions/statements-actions";
import { toast } from "sonner";

interface EditStatementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  statement: {
    id: string;
    text: string;
  } | null;
  onSuccess: () => void;
}

export function EditStatementModal({
  open,
  onOpenChange,
  statement,
  onSuccess,
}: EditStatementModalProps) {
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (statement) {
      setText(statement.text);
    }
  }, [statement]);

  const handleSave = async () => {
    if (!statement || !text.trim()) return;

    setIsSubmitting(true);

    try {
      const result = await updateStatementAction(statement.id, { text: text.trim() });

      if (result.success) {
        toast.success("ההצהרה עודכנה בהצלחה");
        onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.error || "נכשל לעדכן את ההצהרה");
      }
    } catch (error) {
      console.error("Error updating statement:", error);
      toast.error("אירעה שגיאה לא צפויה");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>עריכת הצהרה</DialogTitle>
          <DialogDescription>
            ערוך את טקסט ההצהרה. הצבעות קיימות יישמרו.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            disabled={isSubmitting}
            placeholder="הזן טקסט הצהרה..."
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            ביטול
          </Button>
          <Button onClick={handleSave} disabled={!text.trim() || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 me-2 animate-spin" />
                שומר...
              </>
            ) : (
              "שמור שינויים"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

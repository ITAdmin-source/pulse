"use client";

import { Button } from "@/components/ui/button";
import { Share2, Save } from "lucide-react";
import { toast } from "sonner";

interface InsightActionsProps {
  pollTitle: string;
  insightTitle: string;
  insightBody: string;
  userId?: string;
}

export function InsightActions({ pollTitle, insightTitle, insightBody, userId }: InsightActionsProps) {
  const handleShare = async () => {
    const shareText = `${insightTitle}\n\n${insightBody}\n\nמסקר: ${pollTitle}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: insightTitle,
          text: shareText,
        });
        toast.success("שותף בהצלחה");
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          console.error("Error sharing:", error);
          toast.error("נכשל לשתף");
        }
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("התובנה הועתקה ללוח");
      } catch (error) {
        console.error("Error copying to clipboard:", error);
        toast.error("נכשל להעתיק ללוח");
      }
    }
  };

  const handleSave = () => {
    if (!userId) {
      toast.error("אנא התחבר כדי לשמור תובנות");
      return;
    }

    // Create downloadable text file
    const content = `${insightTitle}\n\n${insightBody}\n\nמסקר: ${pollTitle}\n\nנוצר על ידי Pulse`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pulse-insight-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("התובנה נשמרה להורדות");
  };

  return (
    <div className="flex flex-col sm:flex-row gap-3 justify-center">
      <Button variant="outline" size="lg" className="gap-2" onClick={handleShare}>
        <Share2 className="h-4 w-4" />
        שתף
      </Button>
      <Button
        variant="outline"
        size="lg"
        className="gap-2"
        onClick={handleSave}
        disabled={!userId}
      >
        <Save className="h-4 w-4" />
        שמור
      </Button>
    </div>
  );
}

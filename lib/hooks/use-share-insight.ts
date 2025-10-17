"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

interface ShareInsightOptions {
  pollSlug: string;
  pollQuestion: string;
  insightEmoji?: string;
  insightProfile?: string;
  insightDescription?: string;
  shareText?: string; // Custom share text (for VotingCompleteBanner)
}

export function useShareInsight() {
  const [isSharing, setIsSharing] = useState(false);

  const handleShare = useCallback(async (options: ShareInsightOptions) => {
    const {
      pollSlug,
      pollQuestion,
      insightEmoji,
      insightProfile,
      insightDescription,
      shareText
    } = options;

    setIsSharing(true);
    console.log("[useShareInsight] Starting share flow with options:", options);

    try {
      // Generate poll URL
      const pollUrl = `${window.location.origin}/polls/${pollSlug}`;
      console.log("[useShareInsight] Generated poll URL:", pollUrl);

      // Determine share text
      let text: string;
      if (shareText) {
        // Custom share text (e.g., from VotingCompleteBanner)
        text = `${shareText}\n\n${pollUrl}`;
        console.log("[useShareInsight] Using custom share text");
      } else if (insightProfile) {
        // Insight-based share text
        text = `גיליתי את פרופיל ההשפעה שלי: ${insightEmoji || ""} ${insightProfile}!\n\nגלה את שלך ב-"${pollQuestion}" 📊\n\n${pollUrl}`;
        console.log("[useShareInsight] Using insight-based share text");
      } else {
        // Generic share text
        text = `הצטרפו אליי ב-"${pollQuestion}" 📊\n\n${pollUrl}`;
        console.log("[useShareInsight] Using generic share text");
      }
      console.log("[useShareInsight] Final share text:", text);

      // TEXT-ONLY SHARE (No image generation - more reliable for WhatsApp/Instagram)
      // Try Web Share API for text only
      console.log("[useShareInsight] Using text-only share for better compatibility");
      if (navigator.share) {
        console.log("[useShareInsight] Web Share API available, attempting share");
        try {
          await navigator.share({
            title: pollQuestion,
            text,
          });
          console.log("[useShareInsight] Text share succeeded via Web Share API");
          toast.success("שותף בהצלחה!");
          setIsSharing(false);
          return;
        } catch (error) {
          // User cancelled or share failed
          if ((error as Error).name === "AbortError") {
            console.log("[useShareInsight] User cancelled share");
            setIsSharing(false);
            return; // User cancelled, don't show error
          }
          console.error("[useShareInsight] Web Share API error:", error);
          // Continue to clipboard fallback
        }
      } else {
        console.log("[useShareInsight] Web Share API not available on this browser");
      }

      // Clipboard fallback: Copy full text with URL to clipboard
      console.log("[useShareInsight] Attempting clipboard fallback");

      // Check if clipboard API is available (requires HTTPS or localhost)
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          console.log("[useShareInsight] Text copied to clipboard successfully");
          toast.success("טקסט והקישור הועתקו ללוח!");
          setIsSharing(false);
          return;
        } catch (clipboardError) {
          console.error("[useShareInsight] Clipboard write failed:", clipboardError);
        }
      } else {
        console.log("[useShareInsight] Clipboard API not available (requires HTTPS)");
      }

      // Final fallback: Show error with helpful message
      toast.error("לא ניתן לשתף בדפדפן זה. נסה דרך HTTPS או localhost");
      console.log("📋 SHARE TEXT (copy manually):", text);
      setIsSharing(false);
    } catch (error) {
      console.error("Error in share flow:", error);
      toast.error("נכשל לשתף");
    } finally {
      setIsSharing(false);
    }
  }, []);

  return {
    handleShare,
    isSharing,
  };
}

"use client";

import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { toPng } from "html-to-image";

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
  const exportRef = useRef<HTMLDivElement>(null);

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

    try {
      // Generate poll URL
      const pollUrl = `${window.location.origin}/polls/${pollSlug}`;

      // Determine share text
      let text: string;
      if (shareText) {
        // Custom share text (e.g., from VotingCompleteBanner)
        text = `${shareText}\n\n${pollUrl}`;
      } else if (insightProfile) {
        // Insight-based share text
        text = `גיליתי את פרופיל ההשפעה שלי: ${insightEmoji || ""} ${insightProfile}!\n\nגלה את שלך ב-"${pollQuestion}" 📊\n\n${pollUrl}`;
      } else {
        // Generic share text
        text = `הצטרפו אליי ב-"${pollQuestion}" 📊\n\n${pollUrl}`;
      }

      // If we have insight data and export ref, generate image
      if (insightEmoji && insightProfile && insightDescription && exportRef.current) {
        try {
          // Small delay to ensure component is fully rendered
          await new Promise(resolve => setTimeout(resolve, 100));

          // Get the card element (first child)
          const cardElement = exportRef.current.firstChild as HTMLElement;
          if (!cardElement) {
            throw new Error("Card element not found");
          }

          // Generate image from card
          const dataUrl = await toPng(cardElement, {
            quality: 1,
            pixelRatio: 2,
            cacheBust: true,
          });

          // Convert data URL to blob
          const response = await fetch(dataUrl);
          const blob = await response.blob();

          if (!blob || blob.size === 0) {
            throw new Error("Failed to generate image blob");
          }

          const file = new File([blob], "pulse-insight.png", { type: "image/png" });

          // Try Web Share API with image (mobile-friendly)
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({
                files: [file],
                title: `${insightEmoji} ${insightProfile}`,
                text,
              });
              toast.success("שותף בהצלחה!");
              setIsSharing(false);
              return;
            } catch (error) {
              // User cancelled or share failed
              if ((error as Error).name === "AbortError") {
                setIsSharing(false);
                return; // User cancelled, don't show error
              }
              console.error("Error sharing with image:", error);
              // Continue to fallback
            }
          }

          // Fallback: Download image and copy full share text with URL
          const downloadUrl = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.download = "pulse-insight.png";
          link.href = downloadUrl;
          link.click();
          URL.revokeObjectURL(downloadUrl);

          // Copy full share text (with URL) to clipboard
          await navigator.clipboard.writeText(text);
          toast.success("התמונה הורדה וטקסט לשיתוף הועתק ללוח");
          setIsSharing(false);
          return;
        } catch (imageError) {
          console.error("Error generating image:", imageError);
          // Continue to text-only fallback
        }
      }

      // Text-only fallback (no image or image generation failed)
      // Try Web Share API for text only
      if (navigator.share) {
        try {
          await navigator.share({
            title: pollQuestion,
            text,
          });
          toast.success("שותף בהצלחה!");
          setIsSharing(false);
          return;
        } catch (error) {
          // User cancelled or share failed
          if ((error as Error).name === "AbortError") {
            setIsSharing(false);
            return; // User cancelled, don't show error
          }
          console.error("Error sharing:", error);
          // Continue to clipboard fallback
        }
      }

      // Final fallback: Copy URL to clipboard
      await navigator.clipboard.writeText(pollUrl);
      toast.success("קישור לשיתוף הועתק ללוח");
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
    exportRef,
  };
}

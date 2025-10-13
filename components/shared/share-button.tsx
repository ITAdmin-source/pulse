"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ShareButtonProps {
  url: string;
  title?: string;
  description?: string;
}

export function ShareButton({ url, title = "Pulse", description }: ShareButtonProps) {
  const handleShare = async () => {
    // Ensure we have an absolute URL
    const absoluteUrl = url.startsWith("http") ? url : `${window.location.origin}${url}`;

    // Try Web Share API first (mobile-friendly)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: absoluteUrl,
        });
        toast.success("שותף בהצלחה!");
      } catch (error) {
        // User cancelled or error occurred
        if (error instanceof Error && error.name !== "AbortError") {
          console.error("Share failed:", error);
          // Fallback to clipboard
          await copyToClipboard(absoluteUrl);
        }
      }
    } else {
      // Fallback: Copy to clipboard
      await copyToClipboard(absoluteUrl);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("הקישור הועתק ללוח!");
    } catch (error) {
      console.error("Copy failed:", error);
      toast.error("נכשל להעתיק קישור");
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleShare}
      className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100/50"
      aria-label="שתף"
    >
      <Share2 className="h-4 w-4" />
    </Button>
  );
}

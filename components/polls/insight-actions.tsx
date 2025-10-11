"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Share2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { toPng } from "html-to-image";
import { InsightCardExport } from "@/components/shared/insight-card-export";

interface InsightActionsProps {
  pollTitle: string;
  insightTitle: string;
  insightBody: string;
  userId?: string;
  pollSlug: string;
}

export function InsightActions({ pollTitle, insightTitle, insightBody, userId, pollSlug }: InsightActionsProps) {
  const [isSharing, setIsSharing] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!exportRef.current) {
      toast.error("לא ניתן לשתף כרגע");
      return;
    }

    setIsSharing(true);

    try {
      // Generate poll URL
      const pollUrl = `${window.location.origin}/polls/${pollSlug}`;

      // Share text with invitation
      const shareText = userId
        ? `גלה מה התובנות שלך על "${pollTitle}" - הצטרף לחפיסה! 🎴\n\nDiscover your insights on "${pollTitle}" - Join the deck! 🎴\n\n${pollUrl}`
        : `גליתי תובנה אישית! גלה את שלך - הצטרף לחפיסה 🎴\n\nI discovered a personal insight! Find yours - Join the deck 🎴\n\n${pollUrl}`;

      // Small delay to ensure component is fully rendered
      await new Promise(resolve => setTimeout(resolve, 100));

      // Debug logging
      const rect = exportRef.current.getBoundingClientRect();
      const styles = window.getComputedStyle(exportRef.current);
      const firstChild = exportRef.current.firstChild as HTMLElement;

      console.log('=== EXPORT CARD DEBUG ===');
      console.log('Container:', {
        width: exportRef.current.offsetWidth,
        height: exportRef.current.offsetHeight,
        rect: { width: rect.width, height: rect.height },
        display: styles.display,
        position: styles.position,
        opacity: styles.opacity,
        childCount: exportRef.current.children.length,
      });

      if (firstChild) {
        const childRect = firstChild.getBoundingClientRect();
        const childStyles = window.getComputedStyle(firstChild);
        console.log('First child:', {
          width: firstChild.offsetWidth,
          height: firstChild.offsetHeight,
          rect: { width: childRect.width, height: childRect.height },
          display: childStyles.display,
          backgroundColor: childStyles.backgroundColor,
        });
      }

      console.log('HTML Preview:', exportRef.current.innerHTML.substring(0, 500));

      // Try to capture the first child (the actual card component) instead of the wrapper
      const cardElement = exportRef.current.firstChild as HTMLElement;
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      console.log('Capturing element:', cardElement.tagName, cardElement.className);

      // Try capturing without forcing dimensions first
      let dataUrl: string;
      try {
        dataUrl = await toPng(cardElement, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: '#e0e7ff',
        });
        console.log('Data URL generated (attempt 1), length:', dataUrl.length);
      } catch (error) {
        console.error('First attempt failed:', error);
        // Fallback: try with explicit dimensions
        dataUrl = await toPng(cardElement, {
          quality: 1,
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: '#e0e7ff',
          width: 400,
          height: 600,
        });
        console.log('Data URL generated (attempt 2 with dimensions), length:', dataUrl.length);
      }

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      if (!blob || blob.size === 0) {
        throw new Error('Failed to generate image blob or blob is empty');
      }

      console.log('Blob created, size:', blob.size);

      const file = new File([blob], 'pulse-insight.png', { type: 'image/png' });

      // Try Web Share API with image
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: insightTitle,
            text: shareText,
          });
          toast.success("שותף בהצלחה");
          setIsSharing(false);
          return;
        } catch (error) {
          // User cancelled or share failed
          if ((error as Error).name === 'AbortError') {
            setIsSharing(false);
            return; // User cancelled, don't show error
          }
          console.error("Error sharing with image:", error);
        }
      }

      // Fallback: Download image and copy link
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = 'pulse-insight.png';
      link.href = downloadUrl;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      // Copy poll URL to clipboard
      await navigator.clipboard.writeText(pollUrl);
      toast.success("התמונה הורדה וקישור הועתק ללוח");
    } catch (error) {
      console.error("Error generating/sharing image:", error);

      // Final fallback: Copy URL only
      try {
        const pollUrl = `${window.location.origin}/polls/${pollSlug}`;
        await navigator.clipboard.writeText(pollUrl);
        toast.error("לא ניתן ליצור תמונה, קישור הועתק ללוח");
      } catch {
        toast.error("נכשל לשתף");
      }
    } finally {
      setIsSharing(false);
    }
  };

  const handleSave = () => {
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
    <>
      {/* Hidden export card for image capture */}
      <div
        ref={exportRef}
        style={{
          position: 'fixed',
          left: '0',
          top: '0',
          zIndex: -9999,
          opacity: 0,
          pointerEvents: 'none',
        }}
      >
        <InsightCardExport
          title={insightTitle}
          body={insightBody}
          pollQuestion={pollTitle}
        />
      </div>

      {/* Visible UI */}
      <div className="flex flex-col items-center gap-3">
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          size="lg"
          className="gap-2"
          onClick={handleShare}
          disabled={isSharing}
        >
          {isSharing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              מכין...
            </>
          ) : (
            <>
              <Share2 className="h-4 w-4" />
              שתף
            </>
          )}
        </Button>

        {userId ? (
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            שמור
          </Button>
        ) : (
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            asChild
          >
            <Link href={`/signup?intent=save-insight&poll=${pollSlug}`}>
              <Save className="h-4 w-4" />
              שמור
            </Link>
          </Button>
        )}
      </div>

      {/* Anonymous user message */}
      {!userId && (
        <p className="text-sm text-gray-600 text-center max-w-md" dir="auto">
          <Link href={`/signup?intent=save-insight&poll=${pollSlug}`} className="text-blue-600 hover:text-blue-700 font-semibold underline">
            הירשם
          </Link>
          {" "}כדי לשמור את התובנה שלך לצמיתות

        </p>
      )}
      </div>
    </>
  );
}

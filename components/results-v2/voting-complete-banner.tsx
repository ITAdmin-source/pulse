"use client";

import { motion } from "framer-motion";
import { Share2, Loader2 } from "lucide-react";
import { results, sharing } from "@/lib/strings/he";
import { useShareInsight } from "@/lib/hooks/use-share-insight";

interface VotingCompleteBannerProps {
  pollSlug: string;
  pollQuestion: string;
  // Legacy onShare (deprecated but kept for backward compatibility)
  onShare?: () => void;
}

export function VotingCompleteBanner({ pollSlug, pollQuestion, onShare: legacyOnShare }: VotingCompleteBannerProps) {
  const { handleShare, isSharing } = useShareInsight();

  const onShareClick = async () => {
    // Use new share functionality with custom text for voting complete
    await handleShare({
      pollSlug,
      pollQuestion,
      shareText: sharing.votingCompleteShareText(pollQuestion),
    });

    // Also call legacy onShare if provided (for backward compatibility)
    if (legacyOnShare) {
      legacyOnShare();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-completion rounded-xl p-6 shadow-lg text-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🎉</div>
          <div>
            <h3 className="text-xl font-bold">{results.completeTitle}</h3>
            <p className="text-white-95">{results.completeMessage}</p>
          </div>
        </div>

        <button
          onClick={onShareClick}
          disabled={isSharing}
          className="bg-white text-status-success px-5 py-2 rounded-lg font-semibold hover-bg-status-success-50 transition-colors flex items-center gap-2 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSharing ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              מכין...
            </>
          ) : (
            <>
              <Share2 size={18} />
              {results.shareButton}
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { results } from "@/lib/strings/he";

interface VotingCompleteBannerProps {
  onShare?: () => void;
}

export function VotingCompleteBanner({ onShare }: VotingCompleteBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 shadow-lg text-white"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-4xl">🎉</div>
          <div>
            <h3 className="text-xl font-bold">{results.completeTitle}</h3>
            <p className="text-green-100">{results.completeMessage}</p>
          </div>
        </div>

        {onShare && (
          <button
            onClick={onShare}
            className="bg-white text-green-600 px-5 py-2 rounded-lg font-semibold hover:bg-green-50 transition-colors flex items-center gap-2 flex-shrink-0"
          >
            <Share2 size={18} />
            {results.shareButton}
          </button>
        )}
      </div>
    </motion.div>
  );
}

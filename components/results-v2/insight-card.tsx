"use client";

import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { results } from "@/lib/strings/he";
import MinimalCollectionFooter, { type ArtifactSlot } from "./minimal-collection-footer";
import NewArtifactBadge from "./new-artifact-badge";

interface InsightCardProps {
  profile: string;
  emoji: string;
  description: string;
  onShare?: () => void;
  showSignUpPrompt?: boolean;
  // Artifact Collection Props
  isAuthenticated?: boolean;
  artifacts?: ArtifactSlot[];
  userId?: string;
  currentPollId?: string;
  newlyEarned?: { emoji: string; profile: string };
  onDismissNewBadge?: () => void;
  onSignUp?: () => void;
  onEarnMore?: () => void;
  // Display Options
  hideCollectionFooter?: boolean;
}

export function InsightCard({
  profile,
  emoji,
  description,
  onShare,
  showSignUpPrompt = false,
  isAuthenticated = false,
  artifacts = [],
  userId,
  currentPollId,
  newlyEarned,
  onDismissNewBadge,
  onSignUp,
  onEarnMore,
  hideCollectionFooter = false,
}: InsightCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 rounded-2xl p-6 sm:p-8 shadow-2xl text-white relative overflow-hidden"
    >
      {/* Decorative background circles */}
      <div className="absolute top-0 end-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
      <div className="absolute bottom-0 start-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>

      <div className="relative z-10">
        {/* Profile Header */}
        <div className="flex items-center gap-3 mb-4">
          <span className="text-5xl">{emoji}</span>
          <div>
            <h3 className="text-sm font-medium text-purple-200 uppercase tracking-wide">
              {results.insightLabel}
            </h3>
            <h2 className="text-2xl sm:text-3xl font-bold">{profile}</h2>
          </div>
        </div>

        {/* Description */}
        <p className="text-base sm:text-lg text-purple-50 leading-relaxed mb-6" dir="auto">
          {description}
        </p>

        {/* New Artifact Badge (Authenticated Only) */}
        {isAuthenticated && newlyEarned && (
          <NewArtifactBadge
            emoji={newlyEarned.emoji}
            profileName={newlyEarned.profile}
            onDismiss={onDismissNewBadge}
          />
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {onShare && (
            <button
              onClick={onShare}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base"
            >
              <Share2 size={18} className="sm:w-5 sm:h-5" />
              {results.insightShareButton}
            </button>
          )}

          {showSignUpPrompt && (
            <button className="text-white/90 hover:text-white text-sm underline">
              {results.insightSignUpLink}
            </button>
          )}
        </div>

        {/* Minimal Collection Footer (Both Anonymous and Authenticated) */}
        {!hideCollectionFooter && (
          <MinimalCollectionFooter
            isAuthenticated={isAuthenticated}
            currentEmoji={emoji}
            artifacts={artifacts}
            userId={userId}
            currentPollId={currentPollId}
            onSignUp={onSignUp}
            onEarnMore={onEarnMore}
          />
        )}
      </div>
    </motion.div>
  );
}

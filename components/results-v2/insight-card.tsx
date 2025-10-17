"use client";

import { motion } from "framer-motion";
import { Share2, Loader2 } from "lucide-react";
import { results } from "@/lib/strings/he";
import MinimalCollectionFooter, { type ArtifactSlot } from "./minimal-collection-footer";
import NewArtifactBadge from "./new-artifact-badge";
import { useShareInsight } from "@/lib/hooks/use-share-insight";
import { InsightShareExport } from "./insight-share-export";

interface InsightCardProps {
  profile: string;
  emoji: string;
  description: string;
  // Share props
  pollSlug: string;
  pollQuestion: string;
  // Legacy onShare (deprecated but kept for backward compatibility)
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
  pollSlug,
  pollQuestion,
  onShare: legacyOnShare,
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
  const { handleShare, isSharing, exportRef } = useShareInsight();

  const onShareClick = async () => {
    // Use new share functionality
    await handleShare({
      pollSlug,
      pollQuestion,
      insightEmoji: emoji,
      insightProfile: profile,
      insightDescription: description,
    });

    // Also call legacy onShare if provided (for backward compatibility)
    if (legacyOnShare) {
      legacyOnShare();
    }
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
        <InsightShareExport
          emoji={emoji}
          profile={profile}
          description={description}
          pollQuestion={pollQuestion}
        />
      </div>

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
            <button
              onClick={onShareClick}
              disabled={isSharing}
              className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition-colors flex items-center justify-center gap-2 shadow-lg text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSharing ? (
                <>
                  <Loader2 size={18} className="sm:w-5 sm:h-5 animate-spin" />
                  מכין...
                </>
              ) : (
                <>
                  <Share2 size={18} className="sm:w-5 sm:h-5" />
                  {results.insightShareButton}
                </>
              )}
            </button>

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
    </>
  );
}

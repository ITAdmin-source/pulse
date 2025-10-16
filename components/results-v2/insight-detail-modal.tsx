"use client";

import React from 'react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { X, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { results } from '@/lib/strings/he';

/**
 * Insight Detail Modal Component
 *
 * Displays a user's insight from their artifact collection without navigation.
 * Shows the insight in the same style as the results tab for familiarity.
 *
 * @version 1.0
 * @date 2025-10-16
 */

export interface InsightDetailData {
  /** Insight emoji and profile (extracted from title) */
  emoji: string;
  profile: string;
  /** Insight description/body */
  description: string;
  /** Poll question this insight is from */
  pollQuestion: string;
  /** Poll slug for "View Full Discussion" link */
  pollSlug: string;
  /** Artifact rarity for styling */
  rarity?: 'common' | 'rare' | 'legendary';
}

interface InsightDetailModalProps {
  /** Whether modal is open */
  open: boolean;
  /** Callback to close modal */
  onClose: () => void;
  /** Insight data to display */
  insight: InsightDetailData | null;
  /** Loading state while fetching insight */
  isLoading?: boolean;
}

export default function InsightDetailModal({
  open,
  onClose,
  insight,
  isLoading = false,
}: InsightDetailModalProps) {
  const rarityColors = {
    common: 'from-gray-400 to-gray-500',
    rare: 'from-purple-500 to-pink-500',
    legendary: 'from-yellow-400 to-orange-500',
  };

  const rarityLabels = {
    common: 'שכיח',
    rare: 'נדיר',
    legendary: 'אגדי',
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-lg w-full bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 border-none p-0 max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-sm">טוען תובנה...</p>
            </div>
          </div>
        ) : insight ? (
          <div className="relative">
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Header */}
            <div className="p-6 pb-4">
              <div className="flex items-center gap-3 mb-2">
                {/* Emoji with rarity background */}
                <div
                  className={`
                    w-14 h-14 rounded-xl flex items-center justify-center text-3xl
                    bg-gradient-to-br ${insight.rarity ? rarityColors[insight.rarity] : rarityColors.rare}
                    shadow-lg
                  `}
                >
                  {insight.emoji}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-white" dir="auto">
                    {insight.profile}
                  </h2>
                  {insight.rarity && (
                    <p className="text-xs text-purple-200">
                      {rarityLabels[insight.rarity]}
                    </p>
                  )}
                </div>
              </div>

              {/* Poll Question */}
              <p className="text-sm text-purple-200 mt-3" dir="auto">
                {insight.pollQuestion}
              </p>
            </div>

            {/* Insight Card - Same styling as results tab */}
            <div className="px-6 pb-6">
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <p className="text-gray-800 leading-relaxed text-base" dir="auto">
                  {insight.description}
                </p>
              </div>
            </div>

            {/* Footer with View Discussion Link */}
            <div className="px-6 pb-6">
              <Link href={`/polls/${insight.pollSlug}`} onClick={onClose}>
                <Button
                  variant="outline"
                  className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30"
                >
                  <ExternalLink className="w-4 h-4 ml-2" />
                  צפה בדיון המלא
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-white">
            <p>לא נמצאה תובנה</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

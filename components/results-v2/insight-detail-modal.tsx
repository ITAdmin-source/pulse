"use client";

import React from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { X, ExternalLink, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { results } from '@/lib/strings/he';
import { InsightCard } from './insight-card';

/**
 * Insight Detail Modal Component (v2.0)
 *
 * Displays a user's insight from their artifact collection.
 * Uses the same InsightCard component from results page for consistency.
 * Shows poll context above the card for user orientation.
 *
 * @version 2.0
 * @date 2025-10-17
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
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="max-w-2xl w-full bg-white border-none p-0"
        dir="rtl"
      >
        {isLoading ? (
          <div className="p-8 flex items-center justify-center">
            <div className="text-gray-800 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-sm">{results.loadingInsightModal}</p>
            </div>
          </div>
        ) : insight ? (
          <div className="relative p-6 sm:p-8">
            {/* Visually Hidden Title for Accessibility */}
            <DialogTitle className="sr-only">
              {results.insightFromDiscussion} {insight.pollQuestion}
            </DialogTitle>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 left-4 z-10 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              aria-label="סגור"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>

            {/* Poll Context - Above the card */}
            <div className="flex items-center gap-2 mb-4 text-purple-600 text-sm">
              <MessageSquare className="w-4 h-4" />
              <span>{results.insightFromDiscussion}</span>
            </div>
            <p className="text-gray-800 text-base sm:text-lg font-medium mb-6" dir="auto">
              {insight.pollQuestion}
            </p>

            {/* Insight Card - Same component as results page */}
            <div className="mb-6">
              <InsightCard
                emoji={insight.emoji}
                profile={insight.profile}
                description={insight.description}
                pollSlug={insight.pollSlug}
                pollQuestion={insight.pollQuestion}
                showSignUpPrompt={false}
                isAuthenticated={true}
                hideCollectionFooter={true}
              />
            </div>

            {/* Footer with View Discussion Link - Secondary style */}
            <div className="flex justify-center">
              <Link href={`/polls/${insight.pollSlug}`} onClick={onClose}>
                <Button
                  variant="ghost"
                  className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  {results.viewFullDiscussion}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-800">
            <p>{results.insightNotFound}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

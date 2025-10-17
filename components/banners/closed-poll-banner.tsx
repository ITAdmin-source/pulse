"use client";

import { motion } from "framer-motion";
import { banners } from "@/lib/strings/he";
import { components } from "@/lib/design-tokens-v2";

interface ClosedPollBannerProps {
  closedDate?: string | null; // ISO date string or formatted date (optional)
}

export function ClosedPollBanner({ closedDate }: ClosedPollBannerProps) {
  // Format date to Hebrew-friendly format (dd/MM/yyyy)
  const formatDate = (dateString?: string | null) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('he-IL', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return null;
    }
  };

  const formattedDate = formatDate(closedDate);

  // Determine headline text based on whether we have a date
  const headlineText = formattedDate
    ? banners.closedPollHeadline(formattedDate)
    : 'דיון זה נסגר'; // "This discussion is closed" (no date)

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-yellow-500/20 border-2 border-yellow-500/50 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6"
    >
      <p className="text-yellow-100 text-center text-sm sm:text-base">
        <strong>{headlineText}.</strong> {banners.closedPollBody}
      </p>
    </motion.div>
  );
}

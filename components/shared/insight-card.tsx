"use client";

import { forwardRef } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface InsightCardProps {
  title: string;
  body: string;
  pollQuestion: string;
}

export const InsightCard = forwardRef<HTMLDivElement, InsightCardProps>(
  function InsightCard({ title, body, pollQuestion }, ref) {
  // Extract emoji from title (format: "🌟 Title Text")
  // Robust regex that captures any emoji (including complex multi-codepoint ones like 🚦)
  // Uses Unicode property escapes for proper emoji detection
  const emojiMatch = title.match(/^([\p{Emoji}\u{FE0F}\u{200D}]+)\s*(.+)$/u);
  const emoji = emojiMatch ? emojiMatch[1] : "✨";
  const titleText = emojiMatch ? emojiMatch[2] : title;

  return (
    <div ref={ref} className="w-full max-w-xs mx-auto">
      {/* Insight Card - Premium styling with same aspect as voting cards */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, rotateY: -10 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        {/* Card deck depth effect - same as voting cards */}
        <div className="absolute inset-0 bg-indigo-100 rounded-3xl shadow-sm transform translate-y-3 translate-x-2 opacity-30 pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-indigo-100 rounded-3xl shadow-sm transform translate-y-1.5 translate-x-1 opacity-60 pointer-events-none -z-10" />

        <Card className="relative w-full aspect-[2/3] shadow-lg rounded-3xl border-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
          {/* Animated shimmer gradient background - blue/purple palette */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 50%, #dbeafe 100%)",
                "linear-gradient(135deg, #e0e7ff 0%, #dbeafe 50%, #ddd6fe 100%)",
                "linear-gradient(135deg, #dbeafe 0%, #ddd6fe 50%, #e0e7ff 100%)",
                "linear-gradient(135deg, #ddd6fe 0%, #e0e7ff 50%, #dbeafe 100%)",
              ],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          <CardContent className="relative p-6 h-full flex flex-col justify-between items-center">
            {/* Top Section - Content */}
            <div className="flex-1 flex flex-col justify-center items-center w-full">
              {/* Hero Emoji */}
              <motion.div
                className="text-5xl mb-2"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                {emoji}
              </motion.div>

              {/* "Personal Insight" Badge */}
              <div className="mb-2">
                <span className="inline-block px-3 py-0.5 bg-indigo-100 text-indigo-700 text-xs font-semibold uppercase tracking-wider rounded-full border border-indigo-200">
                  תובנה אישית
                </span>
              </div>

              {/* Title */}
              <div className="text-center mb-2">
                <h2 className="text-base md:text-lg font-bold text-gray-900 leading-tight px-2">
                  {titleText}
                </h2>
              </div>

              {/* Divider */}
              <div className="flex gap-1.5 items-center justify-center mb-3">
                <div className="w-1 h-1 rounded-full bg-indigo-400/50" />
                <div className="w-1 h-1 rounded-full bg-indigo-400/50" />
                <div className="w-1 h-1 rounded-full bg-indigo-400/50" />
              </div>

              {/* Body - Scrollable */}
              <div className="flex-1 overflow-y-auto px-2 max-h-[180px]">
                <p className="text-xs md:text-sm text-gray-800 leading-relaxed whitespace-pre-line text-justify" dir="rtl">
                  {body}
                </p>
              </div>
            </div>

            {/* Bottom Section - Metadata */}
            <div className="w-full mt-3 pt-3 border-t border-indigo-200/50">
              <p className="text-xs text-gray-500 text-center line-clamp-2 mb-1">
                {pollQuestion}
              </p>
              <p className="text-xs text-gray-400 text-center">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
          </CardContent>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
        </Card>
      </motion.div>
    </div>
  );
});

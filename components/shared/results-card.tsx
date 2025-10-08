"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Vote } from "lucide-react";

interface ResultsCardProps {
  pollQuestion: string;
  summaryText: string;
  participantCount: number;
  voteCount: number;
  generatedAt: string;
}

export function ResultsCard({
  pollQuestion,
  summaryText,
  participantCount,
  voteCount,
  generatedAt,
}: ResultsCardProps) {
  return (
    <div className="w-full max-w-xs mx-auto">
      {/* Results Card - Green/Teal gradient for aggregate data */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, rotateY: -10 }}
        animate={{ scale: 1, opacity: 1, rotateY: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative"
      >
        {/* Card deck depth effect - same as voting cards */}
        <div className="absolute inset-0 bg-emerald-100 rounded-3xl shadow-sm transform translate-y-3 translate-x-2 opacity-30 pointer-events-none -z-10" />
        <div className="absolute inset-0 bg-emerald-100 rounded-3xl shadow-sm transform translate-y-1.5 translate-x-1 opacity-60 pointer-events-none -z-10" />

        <Card className="relative w-full aspect-[2/3] shadow-lg rounded-3xl border-0 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
          {/* Animated shimmer gradient background - green/teal palette */}
          <motion.div
            className="absolute inset-0"
            animate={{
              background: [
                "linear-gradient(135deg, #d1fae5 0%, #dbeafe 50%, #d1fae5 100%)",
                "linear-gradient(135deg, #dbeafe 0%, #d1fae5 50%, #dbeafe 100%)",
                "linear-gradient(135deg, #d1fae5 0%, #dbeafe 50%, #d1fae5 100%)",
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
              {/* "Poll Results" Badge */}
              <div className="mb-3">
                <span className="inline-block px-3 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-semibold uppercase tracking-wider rounded-full border border-emerald-200">
                  Poll Results
                </span>
              </div>

              {/* Stats */}
              <div className="flex gap-4 mb-3">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-900">{participantCount}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Vote className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-900">{voteCount}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="flex gap-1.5 items-center justify-center mb-3">
                <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
                <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
                <div className="w-1 h-1 rounded-full bg-emerald-400/50" />
              </div>

              {/* Summary - Scrollable */}
              <div className="flex-1 overflow-y-auto px-2 max-h-[220px]">
                <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line">
                  {summaryText}
                </div>
              </div>
            </div>

            {/* Bottom Section - Metadata */}
            <div className="w-full mt-3 pt-3 border-t border-emerald-200/50">
              <p className="text-xs text-gray-500 text-center line-clamp-2 mb-1">
                {pollQuestion}
              </p>
              <p className="text-xs text-gray-400 text-center">
                {new Date(generatedAt).toLocaleDateString('en-US', {
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
}

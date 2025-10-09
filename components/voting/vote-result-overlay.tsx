"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteResultOverlayProps {
  statement: string;
  userVote: -1 | 0 | 1;
  agreePercent: number;
  disagreePercent: number;
  unsurePercent: number;
  totalVotes: number;
  onNext?: () => void;
  agreeLabel?: string;
  disagreeLabel?: string;
  unsureLabel?: string;
}

export function VoteResultOverlay({
  statement,
  userVote,
  agreePercent,
  disagreePercent,
  unsurePercent,
  totalVotes,
  onNext,
  agreeLabel = "תמיכה",
  disagreeLabel = "התנגדות",
  unsureLabel = "לא בטוח",
}: VoteResultOverlayProps) {
  const [animationPhase, setAnimationPhase] = useState<'entering' | 'visible'>('entering');

  useEffect(() => {
    // Start animation sequence after flip completes
    const timer = setTimeout(() => setAnimationPhase('visible'), 700);
    return () => clearTimeout(timer);
  }, []);

  const getUserVoteLabel = () => {
    if (userVote === 1) return `הסכמת`;
    if (userVote === -1) return `התנגדת`;
    return `דילגת`;
  };

  const VoteIcon = userVote === 1 ? Check : userVote === -1 ? X : Minus;

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-xs mx-auto px-4">
      {/* Card container with flip animation */}
      <motion.div
        className="relative w-full cursor-pointer"
        style={{ perspective: '1000px' }}
        initial={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        onClick={onNext}
      >
        <motion.div
          className="relative w-full aspect-[2/3] shadow-lg rounded-3xl border-0 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50"
          initial={{ rotateY: 0 }}
          animate={{ rotateY: 180 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Results content - visible after flip */}
          <div
            className="absolute inset-0 p-4 flex flex-col justify-between"
            style={{
              transform: 'rotateY(180deg)',
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Statement text (smaller, at top) */}
            <div className="text-center">
              <p className="text-sm text-gray-700 leading-tight line-clamp-3 mb-3">
                {statement}
              </p>
            </div>

            {/* User's vote indicator */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <motion.div
                className="flex items-center gap-2"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={animationPhase === 'visible' ? { scale: 1, opacity: 1 } : {}}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <VoteIcon
                  className={cn(
                    "h-6 w-6",
                    userVote === 1 && "text-green-600",
                    userVote === -1 && "text-red-600",
                    userVote === 0 && "text-gray-600"
                  )}
                />
                <span
                  className={cn(
                    "font-bold text-sm",
                    userVote === 1 && "text-green-600",
                    userVote === -1 && "text-red-600",
                    userVote === 0 && "text-gray-600"
                  )}
                >
                  {getUserVoteLabel()}
                </span>
              </motion.div>

              {/* Vote distributions */}
              <div className="w-full space-y-2">
                {/* Agree bar */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700">{agreeLabel}</span>
                    <span className="font-semibold text-gray-900">{agreePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-green-600 h-full"
                      initial={{ width: "0%" }}
                      animate={animationPhase === 'visible' ? { width: `${agreePercent}%` } : {}}
                      transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Disagree bar */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700">{disagreeLabel}</span>
                    <span className="font-semibold text-gray-900">{disagreePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-red-600 h-full"
                      initial={{ width: "0%" }}
                      animate={animationPhase === 'visible' ? { width: `${disagreePercent}%` } : {}}
                      transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>

                {/* Unsure bar */}
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-gray-700">{unsureLabel}</span>
                    <span className="font-semibold text-gray-900">{unsurePercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="bg-gray-600 h-full"
                      initial={{ width: "0%" }}
                      animate={animationPhase === 'visible' ? { width: `${unsurePercent}%` } : {}}
                      transition={{ duration: 0.5, delay: 0.7, ease: "easeOut" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Total votes (at bottom) */}
            <div className="text-center">
              <p className="text-xs text-gray-600">
                מבוסס על {totalVotes} {totalVotes === 1 ? "הצבעה" : "הצבעות"}
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Next Button */}
      {onNext && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, delay: animationPhase === 'entering' ? 1.2 : 0 }}
        >
          <Button onClick={onNext} size="lg" className="shadow-md">
            הבא ←
          </Button>
        </motion.div>
      )}
    </div>
  );
}

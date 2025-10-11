"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface StatementCardProps {
  statement: string;
  agreeLabel?: string;
  disagreeLabel?: string;
  passLabel?: string;
  onVote: (value: -1 | 0 | 1) => void;
  disabled?: boolean;
}

export function StatementCard({
  statement,
  agreeLabel = "לשמור",
  disagreeLabel = "לזרוק",
  passLabel = "לדלג",
  onVote,
  disabled = false,
}: StatementCardProps) {
  // Button visibility state for exit animation
  const [buttonsVisible, setButtonsVisible] = useState(true);

  // Haptic feedback for mobile devices
  const triggerHaptic = (intensity: 'light' | 'medium' | 'heavy' = 'light') => {
    if (navigator.vibrate) {
      const patterns = {
        light: 10,
        medium: 20,
        heavy: 50
      };
      navigator.vibrate(patterns[intensity]);
    }
  };

  const handleVote = (value: -1 | 0 | 1) => {
    // 1. Hide buttons first (exit animation)
    setButtonsVisible(false);

    // 2. Wait for button exit animation, then trigger vote
    setTimeout(() => {
      triggerHaptic('medium');
      onVote(value);
    }, 200);
  };

  return (
    <div className="relative flex flex-col items-center w-full max-w-xs mx-auto px-4">
      {/* Statement Card - Content with overlaying buttons */}
      <motion.div
        className="relative w-full group z-10 mb-6"
        initial={{
          x: 50,        // Slightly to the right (deck position)
          y: 60,        // Behind/below
          rotate: 5,    // Slight rotation like in deck
          scale: 0.9,   // Smaller (behind other cards)
          opacity: 0
        }}
        animate={{
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1
        }}
        transition={{
          type: "spring",
          stiffness: 250,
          damping: 20,
          mass: 0.8,
          delay: 0.2    // Brief pause before drawing from deck
        }}
        whileHover={{
          y: -4,
          scale: 1.02
        }}
      >
        {/* Card deck depth effect - 3 WHITE stacked cards behind (realistic deck) */}
        <div
          className="absolute inset-0 bg-white rounded-3xl shadow-md transform translate-y-3 translate-x-2 rotate-2 border border-gray-200 pointer-events-none -z-10"
          style={{ transformStyle: "preserve-3d" }}
        />
        <div
          className="absolute inset-0 bg-white rounded-3xl shadow-md transform translate-y-2 translate-x-1 rotate-1 border border-gray-200 pointer-events-none -z-10"
          style={{ transformStyle: "preserve-3d" }}
        />
        <div
          className="absolute inset-0 bg-white rounded-3xl shadow-md transform translate-y-1 translate-x-0.5 border border-gray-200 pointer-events-none -z-10"
          style={{ transformStyle: "preserve-3d" }}
        />

        {/* Main card with fixed aspect ratio */}
        <Card className="relative w-full aspect-[2/3] shadow-lg rounded-3xl border-0 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50">
          <CardContent className="p-6 h-full flex flex-col justify-center items-center">
            {/* Small decorative element */}
            <div className="mb-4 text-3xl opacity-60">✦</div>

            {/* Statement Text */}
            <p className="text-sm md:text-base text-center leading-relaxed font-medium text-gray-800 px-2" dir="auto">
              {statement}
            </p>

            {/* Small decorative element */}
            <div className="mt-4 text-3xl opacity-60">✦</div>
          </CardContent>
        </Card>

        {/* Action Buttons - Absolutely positioned OVER bottom of card */}
        {/* RTL: First button appears on RIGHT, second on LEFT */}
        <AnimatePresence>
          {buttonsVisible && (
            <motion.div
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full px-6"
            initial={{ y: 10, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 25,
              delay: 0.8  // Appear AFTER card settles
            }}
          >
            <div className="flex gap-3 w-full justify-center max-w-xs mx-auto">
              {/* Keep button (לשמור) - appears on RIGHT in RTL */}
              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(34, 197, 94, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex-1 max-w-[140px]"
              >
                <Button
                  onClick={() => handleVote(1)}
                  disabled={disabled}
                  className="w-full h-12 text-base font-bold shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all bg-gradient-to-b from-emerald-600 to-emerald-700 border-2 border-white/60"
                >
                  {agreeLabel}
                </Button>
              </motion.div>
              {/* Throw button (לזרוק) - appears on LEFT in RTL */}
              <motion.div
                whileHover={{
                  scale: 1.05,
                  boxShadow: "0 10px 30px rgba(239, 68, 68, 0.4)"
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 15 }}
                className="flex-1 max-w-[140px]"
              >
                <Button
                  onClick={() => handleVote(-1)}
                  disabled={disabled}
                  className="w-full h-12 text-base font-bold shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all border-2 border-white/60"
                  variant="destructive"
                >
                  {disagreeLabel}
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>

      {/* Skip option - Below the card, independent animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 300,
          damping: 25,
          delay: 1.0  // Appears last, after main buttons settle
        }}
      >
        <motion.div
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <Button
            onClick={() => handleVote(0)}
            disabled={disabled}
            variant="ghost"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            {passLabel}
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
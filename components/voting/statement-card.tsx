"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, X, Minus } from "lucide-react";

interface StatementCardProps {
  statement: string;
  agreeLabel?: string;
  disagreeLabel?: string;
  passLabel?: string;
  onVote: (value: -1 | 0 | 1) => void;
  disabled?: boolean;
  // Results data (passed after vote is recorded)
  showResults?: boolean;
  userVote?: -1 | 0 | 1;
  agreePercent?: number;
  disagreePercent?: number;
  unsurePercent?: number;
  // Control card exit animation
  shouldExit?: boolean;
}

export function StatementCard({
  statement,
  agreeLabel = "לשמור",
  disagreeLabel = "לזרוק",
  passLabel = "לדלג",
  onVote,
  disabled = false,
  showResults = false,
  userVote,
  agreePercent = 0,
  disagreePercent = 0,
  unsurePercent = 0,
  shouldExit = false,
}: StatementCardProps) {
  // Button visibility state for exit animation
  const [buttonsVisible, setButtonsVisible] = useState(true);

  // RTL-correct exit animations based on vote choice (from old VoteResultOverlay)
  const getExitAnimation = () => {
    if (userVote === 1) {
      // לשמור (Keep) - slide RIGHT and up (positive direction in RTL)
      return {
        x: 400,
        y: -100,
        rotate: 15,
        opacity: 0
      };
    }

    if (userVote === -1) {
      // לזרוק (Throw) - slide LEFT and down (thrown away, negative)
      return {
        x: -400,
        y: 150,
        rotate: -25,
        opacity: 0
      };
    }

    // userVote === 0
    // לדלג (Pass) - slide straight down (neutral, set aside)
    return {
      x: 0,
      y: 400,
      rotate: 0,
      opacity: 0
    };
  };

  const getExitTransition = () => {
    if (userVote === 1) {
      return { duration: 0.5 }; // Keep (smooth exit)
    }
    if (userVote === -1) {
      return { duration: 0.4 }; // Throw (faster exit)
    }
    return { duration: 0.45 }; // Pass (moderate exit)
  };

  const handleVote = (value: -1 | 0 | 1) => {
    // Hide buttons and trigger vote immediately (Option 4: instant disappear)
    setButtonsVisible(false);
    onVote(value);
  };

  return (
    <div className="relative flex flex-col items-center w-full max-w-xs mx-auto">
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
        animate={shouldExit ? getExitAnimation() : {
          x: 0,
          y: 0,
          rotate: 0,
          scale: 1,
          opacity: 1
        }}
        transition={shouldExit ? getExitTransition() : {
          type: "spring",
          stiffness: 250,
          damping: 20,
          mass: 0.8,
          delay: 0.2    // Brief pause before drawing from deck
        }}
        whileHover={!shouldExit && !showResults ? {
          y: -4,
          scale: 1.02
        } : undefined}
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

        {/* Main card with fixed aspect ratio - scales down in landscape mode */}
        <Card className="relative w-full aspect-[2/3] max-h-[calc(100dvh-var(--header-height,74px)-120px)] shadow-lg rounded-3xl border-0 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50">
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

        {/* Action Buttons or Results - Absolutely positioned OVER bottom of card */}
        <AnimatePresence>
          {!showResults && buttonsVisible && (
            <motion.div
              key="buttons"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full px-6"
              initial={{ y: 10, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25,
                delay: 0.8,  // Appear AFTER card settles
                exit: { duration: 0.15 }  // Quick fade (Option 3: simultaneous)
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

          {showResults && (
            <motion.div
              key="results"
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-full px-6"
              initial={{ y: 10, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{
                type: "spring",
                stiffness: 400,
                damping: 25
              }}
            >
              <div className="max-w-xs mx-auto space-y-2">
                {/* Tri-colored results bar */}
                <div className="flex h-12 w-full rounded-full overflow-hidden shadow-lg border-2 border-white/60">
                  {/* Keep segment (Green) */}
                  <motion.div
                    className="bg-emerald-600 flex items-center justify-center relative"
                    initial={{ width: "0%" }}
                    animate={{ width: `${agreePercent}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: 0.1
                    }}
                  >
                    {agreePercent > 0 && (
                      <motion.div
                        className="flex items-center gap-1"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                      >
                        {userVote === 1 && <Check className="h-4 w-4 text-white" />}
                        {agreePercent >= 15 && (
                          <span className="text-xs font-bold text-white">{agreePercent}%</span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Throw segment (Red) */}
                  <motion.div
                    className="bg-red-600 flex items-center justify-center relative"
                    initial={{ width: "0%" }}
                    animate={{ width: `${disagreePercent}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: 0.2
                    }}
                  >
                    {disagreePercent > 0 && (
                      <motion.div
                        className="flex items-center gap-1"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.4 }}
                      >
                        {userVote === -1 && <X className="h-4 w-4 text-white" />}
                        {disagreePercent >= 15 && (
                          <span className="text-xs font-bold text-white">{disagreePercent}%</span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>

                  {/* Pass segment (Gray) */}
                  <motion.div
                    className="bg-gray-600 flex items-center justify-center relative"
                    initial={{ width: "0%" }}
                    animate={{ width: `${unsurePercent}%` }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                      delay: 0.3
                    }}
                  >
                    {unsurePercent > 0 && (
                      <motion.div
                        className="flex items-center gap-1"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        {userVote === 0 && <Minus className="h-4 w-4 text-white" />}
                        {unsurePercent >= 15 && (
                          <span className="text-xs font-bold text-white">{unsurePercent}%</span>
                        )}
                      </motion.div>
                    )}
                  </motion.div>
                </div>

                {/* Labels below bar (for segments too small to show percentage) */}
                <div className="flex justify-between text-[10px] text-gray-700 px-1" dir="rtl">
                  <span>{agreeLabel} {agreePercent < 15 ? `${agreePercent}%` : ''}</span>
                  <span>{disagreeLabel} {disagreePercent < 15 ? `${disagreePercent}%` : ''}</span>
                  <span>{passLabel} {unsurePercent < 15 ? `${unsurePercent}%` : ''}</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Skip option - Below the card, independent animation (only show when voting) */}
      {!showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
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
      )}
    </div>
  );
}
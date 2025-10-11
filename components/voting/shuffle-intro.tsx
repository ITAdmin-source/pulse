"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ShuffleIntroProps {
  onComplete: () => void;
  onSkip: () => void;
}

export function ShuffleIntro({ onComplete, onSkip }: ShuffleIntroProps) {
  // Generate random starting positions for 6 cards
  const generateRandomPosition = (index: number) => {
    const angle = (index * 60) + (Math.random() * 30 - 15); // Spread around circle
    const distance = 250 + Math.random() * 100; // Random distance from center
    const x = Math.cos((angle * Math.PI) / 180) * distance;
    const y = Math.sin((angle * Math.PI) / 180) * distance;
    const rotate = Math.random() * 90 - 45; // Random rotation

    return { x, y, rotate, opacity: 0, scale: 0.8 };
  };

  // Final stacked positions (3 cards in stack)
  const getFinalPosition = (index: number) => {
    if (index < 3) {
      // These cards form the final 3-card stack
      return {
        x: 0,
        y: index * 4,
        rotate: index * 1,
        opacity: 1,
        scale: 1,
      };
    }
    // These cards disappear (merged into stack)
    return {
      x: 0,
      y: 0,
      rotate: 0,
      opacity: 0,
      scale: 0.9,
    };
  };

  const cards = Array.from({ length: 6 }, (_, i) => i);

  return (
    <div
      className="fixed inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center z-50"
      onClick={onSkip}
    >
      {/* Skip button */}
      <div className="absolute top-8 right-8 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={onSkip}
          className="bg-white/90 backdrop-blur-sm"
        >
          דלג
        </Button>
      </div>

      {/* Skip hint text */}
      <div className="absolute bottom-12 text-center w-full px-4">
        <p className="text-sm text-gray-600">לחץ בכל מקום לדלג</p>
      </div>

      {/* Card shuffle animation container */}
      <div className="relative w-full max-w-xs mx-auto" style={{ perspective: "1000px" }}>
        {cards.map((cardIndex) => {
          const initial = generateRandomPosition(cardIndex);
          const final = getFinalPosition(cardIndex);
          const delay = cardIndex * 0.15; // Stagger card arrivals

          return (
            <motion.div
              key={cardIndex}
              className="absolute inset-0"
              initial={initial}
              animate={final}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 20,
                delay,
              }}
              onAnimationComplete={() => {
                // When last card animation completes, trigger onComplete
                if (cardIndex === cards.length - 1) {
                  setTimeout(onComplete, 500); // Brief pause before starting voting
                }
              }}
              style={{ transformStyle: "preserve-3d" }}
            >
              <Card className="w-full aspect-[2/3] shadow-xl rounded-3xl border border-gray-200 bg-white">
                <CardContent className="p-6 h-full flex flex-col justify-center items-center">
                  {/* Decorative element */}
                  <div className="text-3xl opacity-40">✦</div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

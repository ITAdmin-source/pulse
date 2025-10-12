"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface PollDeckCardProps {
  slug: string;
  question: string;
  status: "active" | "closed";
  emoji?: string | null;
}

export function PollDeckCard({ slug, question, status }: PollDeckCardProps) {
  const isActive = status === "active";

  return (
    <Link href={`/polls/${slug}`}>
      <motion.div
        className="relative cursor-pointer group"
        initial="rest"
        whileHover="hover"
        animate="rest"
        variants={{}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ perspective: "1000px" }}
      >
        {/* Back cards in deck - 3 WHITE CARDS with realistic stacking */}
        <motion.div
          className="absolute inset-0 bg-white rounded-3xl shadow-md border border-gray-200 pointer-events-none z-0"
          style={{ transformStyle: "preserve-3d" }}
          variants={{
            rest: { translateY: 12, translateX: 8, rotate: 2 },
            hover: { translateY: 16, translateX: 12, rotate: 4 }
          }}
        />
        <motion.div
          className="absolute inset-0 bg-white rounded-3xl shadow-md border border-gray-200 pointer-events-none z-0"
          style={{ transformStyle: "preserve-3d" }}
          variants={{
            rest: { translateY: 8, translateX: 4, rotate: 1 },
            hover: { translateY: 10, translateX: 6, rotate: 2 }
          }}
        />
        <motion.div
          className="absolute inset-0 bg-white rounded-3xl shadow-md border border-gray-200 pointer-events-none z-0"
          style={{ transformStyle: "preserve-3d" }}
          variants={{
            rest: { translateY: 4, translateX: 2, rotate: 0.5 },
            hover: { translateY: 5, translateX: 3, rotate: 1 }
          }}
        />

        {/* Main Card */}
        <motion.div
          className={`relative w-full aspect-[2/3] rounded-3xl shadow-2xl border-0 z-10 overflow-hidden ${
            isActive
              ? "bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50"
              : "bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200"
          }`}
          style={{ willChange: "transform" }}
          variants={{
            rest: { scale: 1, y: 0 },
            hover: {
              scale: 1.08,
              y: -10,
              boxShadow: "0 20px 40px rgba(0,0,0,0.25)"
            }
          }}
        >
          {/* Top decorative element */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center">
            <div className={`text-3xl ${isActive ? "opacity-70" : "opacity-40"}`}>✦</div>
          </div>

          {/* Status indicator - Subtle corner dot */}
          {isActive && (
            <div className="absolute top-4 end-4 z-20">
              <div className="w-2 h-2 rounded-full bg-green-500" />
            </div>
          )}

          {/* Question - Center of card */}
          <div className="absolute inset-0 flex items-center justify-center p-6 pt-16 pb-14">
            <p
              className={`text-center text-base md:text-lg font-bold leading-tight line-clamp-5 ${
                isActive ? "text-gray-900" : "text-gray-600"
              }`}
              dir="auto"
            >
              {question}
            </p>
          </div>

          {/* Bottom decorative bars */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1 justify-center">
            <div className={`w-8 h-1 rounded-full ${
              isActive ? "bg-amber-400/40" : "bg-gray-400/40"
            }`} />
            <div className={`w-8 h-1 rounded-full ${
              isActive ? "bg-amber-400/40" : "bg-gray-400/40"
            }`} />
            <div className={`w-8 h-1 rounded-full ${
              isActive ? "bg-amber-400/40" : "bg-gray-400/40"
            }`} />
          </div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>

          {/* Closed state overlay */}
          {!isActive && (
            <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-[0.5px] flex items-center justify-center pointer-events-none">
              <div className="bg-gray-700/90 text-white px-6 py-2 rounded-full text-sm font-semibold tracking-wide shadow-lg">
                סגור
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Link>
  );
}

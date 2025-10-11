"use client";

import { motion } from "framer-motion";
import Link from "next/link";

interface PollDeckCardProps {
  slug: string;
  question: string;
  status: "active" | "closed";
  emoji?: string | null;
}

export function PollDeckCard({ slug, question, status, emoji }: PollDeckCardProps) {
  const isActive = status === "active";
  const displayEmoji = emoji || "🎴"; // Default to card game emoji if no emoji set

  return (
    <Link href={`/polls/${slug}`}>
      <motion.div
        className="relative cursor-pointer"
        initial="rest"
        whileHover="hover"
        animate="rest"
        variants={{}}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        style={{ perspective: "1000px" }}
      >
        {/* Back cards in deck - 3 WHITE CARDS with realistic stacking and fan-out on hover */}
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
          className={`relative w-full aspect-[2/3] rounded-3xl shadow-2xl border-0 z-10 ${
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
          {/* Status Badge - Top Corner */}
          <div className="absolute top-4 end-4">
            <span
              className={`inline-block px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded-full ${
                isActive
                  ? "bg-green-100 text-green-700 border border-green-200"
                  : "bg-gray-300 text-gray-700 border border-gray-400"
              }`}
            >
              {isActive ? "פעיל" : "סגור"}
            </span>
          </div>

          {/* Large Emoji at top */}
          <div className="absolute top-16 start-1/2 -translate-x-1/2">
            <div className="text-6xl">
              {displayEmoji}
            </div>
          </div>

          {/* Question - Center of card (below emoji) */}
          <div className="absolute inset-0 flex items-center justify-center p-6 pt-28">
            <p
              className={`text-center text-base md:text-lg font-bold leading-tight line-clamp-5 ${
                isActive ? "text-gray-900" : "text-gray-600"
              }`}
              dir="auto"
            >
              {question}
            </p>
          </div>

          {/* Closed Ribbon (if closed) - Semi-transparent so question shows through */}
          {!isActive && (
            <div className="absolute top-1/2 start-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-15deg] bg-gray-600/80 text-white px-12 py-1.5 text-sm font-bold tracking-widest shadow-lg pointer-events-none">
              סגור
            </div>
          )}

          {/* Decorative element at bottom */}
          <div className="absolute bottom-4 start-1/2 -translate-x-1/2 text-2xl opacity-40">
            {isActive ? "✦" : "◆"}
          </div>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
        </motion.div>
      </motion.div>
    </Link>
  );
}

"use client";

import { motion } from "framer-motion";

interface FannedDeckHeaderProps {
  participantCount: number;
  totalVotes: number;
}

export function FannedDeckHeader({ participantCount, totalVotes }: FannedDeckHeaderProps) {
  return (
    <div className="relative w-full max-w-xs mx-auto h-48 flex items-center justify-center">
      {/* Fanned cards effect - 5 cards slightly rotated */}
      {[...Array(5)].map((_, i) => {
        const rotation = (i - 2) * 8; // -16, -8, 0, 8, 16 degrees
        const translateY = Math.abs(i - 2) * 4;
        const zIndex = i === 2 ? 5 : 5 - Math.abs(i - 2);
        const opacity = 1 - Math.abs(i - 2) * 0.15;

        return (
          <motion.div
            key={i}
            className="absolute w-32 h-44 rounded-2xl shadow-lg bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 border border-amber-100"
            initial={{ scale: 0.8, opacity: 0, rotate: 0 }}
            animate={{
              scale: 1,
              opacity: opacity,
              rotate: rotation,
              y: translateY,
            }}
            transition={{
              duration: 0.6,
              delay: i * 0.1,
              ease: "easeOut",
            }}
            style={{
              zIndex: zIndex,
            }}
          >
            {/* Card content - decorative */}
            <div className="p-4 h-full flex flex-col justify-between">
              <div className="text-center text-2xl opacity-40">✦</div>
              <div className="text-center text-xs text-gray-400 opacity-60">
                {i === 2 ? "Poll Deck" : ""}
              </div>
              <div className="flex gap-0.5 justify-center">
                <div className="w-4 h-0.5 bg-amber-400/30 rounded-full" />
                <div className="w-4 h-0.5 bg-amber-400/30 rounded-full" />
                <div className="w-4 h-0.5 bg-amber-400/30 rounded-full" />
              </div>
            </div>

            {/* Subtle pattern overlay */}
            <div className="absolute inset-0 opacity-5 pointer-events-none rounded-2xl overflow-hidden">
              <div className="w-full h-full" style={{
                backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
                backgroundSize: '16px 16px'
              }} />
            </div>
          </motion.div>
        );
      })}

      {/* Stats overlay on center card */}
      <motion.div
        className="absolute z-10 text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
          <div className="text-2xl font-bold text-gray-900">{participantCount}</div>
          <div className="text-xs text-gray-600 font-medium">players</div>
          <div className="text-lg font-semibold text-gray-800 mt-1">{totalVotes.toLocaleString()}</div>
          <div className="text-xs text-gray-600 font-medium">votes</div>
        </div>
      </motion.div>
    </div>
  );
}

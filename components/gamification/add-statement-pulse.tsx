"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface AddStatementPulseProps {
  children: ReactNode;
  shouldPulse: boolean;
}

/**
 * Add Statement Pulse Animation
 *
 * Wraps the "Add Statement" button with a subtle pulse animation
 * to draw attention at milestone 4 (after 4 votes).
 * - Gentle scale animation
 * - Automatically stops after trigger
 * - Non-intrusive, doesn't break existing functionality
 */
export function AddStatementPulse({ children, shouldPulse }: AddStatementPulseProps) {
  return (
    <motion.div
      animate={
        shouldPulse
          ? {
              scale: [1, 1.05, 1],
            }
          : {}
      }
      transition={{
        duration: 0.6,
        repeat: shouldPulse ? 5 : 0, // Pulse 5 times (~3 seconds total) when active
        ease: "easeInOut",
      }}
      className="flex-1"
    >
      {children}
    </motion.div>
  );
}

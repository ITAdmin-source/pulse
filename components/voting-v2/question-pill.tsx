"use client";

import { motion } from "framer-motion";

interface QuestionPillProps {
  question: string;
}

export function QuestionPill({ question }: QuestionPillProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-500 to-blue-600 backdrop-blur-md rounded-2xl px-6 py-4 shadow-lg mb-6"
    >
      <p
        className="text-center text-sm sm:text-base font-semibold text-white"
        dir="auto"
      >
        {question}
      </p>
    </motion.div>
  );
}

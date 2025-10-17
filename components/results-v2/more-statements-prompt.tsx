"use client";

import { motion } from "framer-motion";
import { MessageSquare } from "lucide-react";
import { results } from "@/lib/strings/he";

interface MoreStatementsPromptProps {
  remainingStatements: number;
  onContinue: () => void;
}

export function MoreStatementsPrompt({ remainingStatements, onContinue }: MoreStatementsPromptProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-poll-header rounded-xl p-6 shadow-lg text-white"
    >
      <div className="flex items-start gap-4">
        <MessageSquare size={32} className="flex-shrink-0 mt-1" />
        <div className="flex-1">
          <h3 className="text-xl font-bold mb-2">{results.moreStatementsTitle}</h3>
          <p className="text-purple-100 mb-4">
            {results.moreStatementsMessage(remainingStatements)}
          </p>
          <button
            onClick={onContinue}
            className="bg-white text-primary-600 px-6 py-2 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
          >
            {results.moreStatementsButton(remainingStatements)}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

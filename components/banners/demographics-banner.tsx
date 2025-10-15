"use client";

import { motion } from "framer-motion";
import { pollPage } from "@/lib/strings/he";

interface DemographicsBannerProps {
  onOpenModal: () => void;
}

export function DemographicsBanner({ onOpenModal }: DemographicsBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-3xl shadow-xl p-8 text-center">
        <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>

        <h3 className="text-2xl font-bold text-gray-900 mb-3">
          {pollPage.demographicsBannerTitle}
        </h3>

        <p className="text-lg text-gray-700 mb-6" dir="auto">
          {pollPage.demographicsBannerMessage}
        </p>

        <motion.button
          onClick={onOpenModal}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-shadow"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {pollPage.demographicsBannerButton}
        </motion.button>
      </div>
    </motion.div>
  );
}

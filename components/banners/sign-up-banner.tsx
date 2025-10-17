"use client";

import { motion } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { banners } from "@/lib/strings/he";

interface SignUpBannerProps {
  onDismiss: () => void;
}

export function SignUpBanner({ onDismiss }: SignUpBannerProps) {

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-signup-banner rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl"
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="text-3xl sm:text-4xl flex-shrink-0">
          {banners.signUpBannerIcon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2" dir="auto">
            {banners.signUpBannerTitle}
          </h3>
          <p className="text-purple-100 text-sm sm:text-base mb-3 sm:mb-4" dir="auto">
            {banners.signUpBannerBody}
          </p>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <SignUpButton mode="modal">
              <motion.button
                className="bg-white text-primary-600 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-primary-50 transition-colors text-sm sm:text-base"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {banners.signUpBannerCTA}
              </motion.button>
            </SignUpButton>
            <motion.button
              onClick={onDismiss}
              className="bg-white-20 text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-semibold hover:bg-white-20 transition-colors text-sm sm:text-base"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {banners.signUpBannerDismiss}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

"use client";

import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { FeedbackModal } from "./feedback-modal";
import { feedback as feedbackStrings } from "@/lib/strings/he";

interface FloatingFeedbackButtonProps {
  userId?: string | null;
}

export function FloatingFeedbackButton({ userId }: FloatingFeedbackButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      {/* Floating Button - Fixed position bottom-left (RTL) */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-6 start-6 z-50 h-14 w-14 rounded-full bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-2xl transition-all duration-200 hover:scale-110 hover:shadow-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label={feedbackStrings.buttonTooltip}
        title={feedbackStrings.buttonTooltip}
      >
        <MessageSquarePlus className="mx-auto h-6 w-6" />
      </button>

      {/* Feedback Modal */}
      <FeedbackModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        userId={userId}
      />
    </>
  );
}

"use client";

import { useCurrentUser } from "@/contexts/user-context";
import { FloatingFeedbackButton } from "./floating-feedback-button";

/**
 * Wrapper component to access user context and pass userId to FloatingFeedbackButton
 * Must be client component to use hooks
 */
export function FeedbackButtonWrapper() {
  const { user } = useCurrentUser();

  return <FloatingFeedbackButton userId={user?.id} />;
}

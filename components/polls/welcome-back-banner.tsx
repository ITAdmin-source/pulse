"use client";

import { Info, Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface WelcomeBackBannerProps {
  votedCount: number;
  totalCount: number;
  variant: "in-progress" | "threshold-reached" | "completed";
}

export function WelcomeBackBanner({
  votedCount,
  totalCount,
  variant,
}: WelcomeBackBannerProps) {
  const getMessage = () => {
    switch (variant) {
      case "in-progress":
        return {
          icon: <Info className="h-5 w-5" />,
          title: "Welcome back!",
          description: `You've voted on ${votedCount} of ${totalCount} statements so far.`,
        };
      case "threshold-reached":
        return {
          icon: <Sparkles className="h-5 w-5" />,
          title: "Your insights are ready!",
          description: `You've voted on ${votedCount} statements and reached the threshold. View your personalized insights now, or continue voting on the remaining ${totalCount - votedCount} statements.`,
        };
      case "completed":
        return {
          icon: <Sparkles className="h-5 w-5" />,
          title: "Poll completed!",
          description: `You've voted on all ${totalCount} statements. View your personalized insights and see how your views compare to others.`,
        };
    }
  };

  const { icon, title, description } = getMessage();

  return (
    <Alert className="border-blue-200 bg-blue-50 text-blue-900">
      {icon}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p className="text-blue-800">{description}</p>
        {variant === "in-progress" && (
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="secondary" className="bg-blue-100 text-blue-900">
              {votedCount}/{totalCount} statements
            </Badge>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

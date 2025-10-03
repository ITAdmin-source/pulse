"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoteResultOverlayProps {
  statement: string;
  userVote: -1 | 0 | 1;
  agreePercent: number;
  disagreePercent: number;
  unsurePercent: number;
  totalVotes: number;
  onNext?: () => void;
  agreeLabel?: string;
  disagreeLabel?: string;
  unsureLabel?: string;
}

export function VoteResultOverlay({
  statement,
  userVote,
  agreePercent,
  disagreePercent,
  unsurePercent,
  totalVotes,
  onNext,
  agreeLabel = "Agree",
  disagreeLabel = "Disagree",
  unsureLabel = "Unsure",
}: VoteResultOverlayProps) {
  const [animationPhase, setAnimationPhase] = useState<'idle' | 'started' | 'complete'>('idle');

  useEffect(() => {
    setAnimationPhase('idle');
    const timer = setTimeout(() => setAnimationPhase('started'), 100);
    const completeTimer = setTimeout(() => setAnimationPhase('complete'), 1100);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, []); // Only runs on mount

  const getUserVoteLabel = () => {
    if (userVote === 1) return `✓ YOU ${agreeLabel.toUpperCase()}D`;
    if (userVote === -1) return `✗ YOU ${disagreeLabel.toUpperCase()}D`;
    return `− YOU PASSED`;
  };

  const VoteIcon = userVote === 1 ? Check : userVote === -1 ? X : Minus;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto px-4">
      <Card className="w-full shadow-lg">
        <CardContent className="p-6 md:p-8 space-y-4">
          {/* Statement Text */}
          <p className="text-lg md:text-xl text-center leading-relaxed text-muted-foreground">
            {statement}
          </p>

          {/* User's Vote */}
          <div className="flex items-center justify-center gap-2 py-3">
            <VoteIcon
              className={cn(
                "h-5 w-5 transition-all duration-300",
                animationPhase !== 'idle' && "scale-100 opacity-100",
                animationPhase === 'idle' && "scale-75 opacity-0",
                userVote === 1 && "text-green-600",
                userVote === -1 && "text-red-600",
                userVote === 0 && "text-gray-600"
              )}
            />
            <span
              className={cn(
                "font-semibold text-sm transition-all duration-300",
                animationPhase !== 'idle' && "opacity-100 translate-x-0",
                animationPhase === 'idle' && "opacity-0 translate-x-2",
                userVote === 1 && "text-green-600",
                userVote === -1 && "text-red-600",
                userVote === 0 && "text-gray-600"
              )}
            >
              {getUserVoteLabel()}
            </span>
          </div>

          {/* Vote Distributions */}
          <div className="space-y-3">
            {/* Agree */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{agreeLabel}:</span>
                <span className="font-semibold">{agreePercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-600 h-full transition-all duration-500 ease-out"
                  style={{ 
                    width: animationPhase !== 'idle' ? `${agreePercent}%` : "0%",
                    transitionDelay: animationPhase === 'started' ? '0ms' : '0ms'
                  }}
                />
              </div>
            </div>

            {/* Disagree */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{disagreeLabel}:</span>
                <span className="font-semibold">{disagreePercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-red-600 h-full transition-all duration-500 ease-out"
                  style={{ 
                    width: animationPhase !== 'idle' ? `${disagreePercent}%` : "0%",
                    transitionDelay: animationPhase === 'started' ? '200ms' : '0ms'
                  }}
                />
              </div>
            </div>

            {/* Unsure */}
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{unsureLabel}:</span>
                <span className="font-semibold">{unsurePercent}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gray-600 h-full transition-all duration-500 ease-out"
                  style={{ 
                    width: animationPhase !== 'idle' ? `${unsurePercent}%` : "0%",
                    transitionDelay: animationPhase === 'started' ? '400ms' : '0ms'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Total Votes */}
          <p className="text-center text-sm text-muted-foreground">
            Based on {totalVotes} vote{totalVotes !== 1 ? "s" : ""}
          </p>
        </CardContent>
      </Card>

      {/* Optional Next Button */}
      {onNext && (
        <Button onClick={onNext} variant="outline" className="mt-2">
          Next →
        </Button>
      )}
    </div>
  );
}
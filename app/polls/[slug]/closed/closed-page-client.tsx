"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Check, X, Minus } from "lucide-react";

interface Vote {
  statementText: string;
  userVote: 1 | 0 | -1;
}

interface ClosedPageClientProps {
  userVotes: Vote[];
}

function VoteIcon({ vote }: { vote: 1 | 0 | -1 }) {
  if (vote === 1) {
    return <Check className="h-4 w-4 text-green-600" />;
  } else if (vote === -1) {
    return <X className="h-4 w-4 text-red-600" />;
  } else {
    return <Minus className="h-4 w-4 text-gray-500" />;
  }
}

function VoteLabel({ vote }: { vote: 1 | 0 | -1 }) {
  if (vote === 1) return <span className="text-green-700 text-xs font-medium">Kept</span>;
  if (vote === -1) return <span className="text-red-700 text-xs font-medium">Threw</span>;
  return <span className="text-gray-700 text-xs font-medium">Skipped</span>;
}

export function ClosedPageClient({ userVotes }: ClosedPageClientProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Collapsed Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">
            View Your {userVotes.length} Vote{userVotes.length !== 1 ? "s" : ""}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-5 w-5 text-gray-600" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-600" />
        )}
      </button>

      {/* Expanded Content */}
      {expanded && (
        <div className="border-t p-4 space-y-3 max-h-96 overflow-y-auto">
          {userVotes.map((vote, index) => (
            <div
              key={index}
              className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-shrink-0 mt-0.5">
                <VoteIcon vote={vote.userVote} />
              </div>
              <div className="flex-grow space-y-1">
                <p className="text-sm text-gray-900 leading-snug">{vote.statementText}</p>
                <VoteLabel vote={vote.userVote} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

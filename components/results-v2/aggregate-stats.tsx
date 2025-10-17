"use client";

import { Users, MessageSquare, TrendingUp } from "lucide-react";
import { results } from "@/lib/strings/he";

interface AggregateStatsProps {
  participantCount: number;
  statementCount: number;
  totalVotes: number;
}

export function AggregateStats({
  participantCount,
  statementCount,
  totalVotes
}: AggregateStatsProps) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {/* Participants */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg">
        <Users size={20} className="text-primary-600 mb-1 sm:mb-2 sm:w-6 sm:h-6" />
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{participantCount}</p>
        <p className="text-xs sm:text-sm text-gray-600">{results.participantsLabel}</p>
      </div>

      {/* Statements */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg">
        <MessageSquare size={20} className="text-primary-600 mb-1 sm:mb-2 sm:w-6 sm:h-6" />
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{statementCount}</p>
        <p className="text-xs sm:text-sm text-gray-600">{results.statementsLabel}</p>
      </div>

      {/* Total Votes */}
      <div className="bg-white rounded-xl p-3 sm:p-4 shadow-lg">
        <TrendingUp size={20} className="text-primary-600 mb-1 sm:mb-2 sm:w-6 sm:h-6" />
        <p className="text-xl sm:text-2xl font-bold text-gray-900">{totalVotes}</p>
        <p className="text-xs sm:text-sm text-gray-600">{results.totalVotesLabel}</p>
      </div>
    </div>
  );
}

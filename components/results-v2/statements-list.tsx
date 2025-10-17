"use client";

import { TrendingUp } from "lucide-react";
import { results } from "@/lib/strings/he";

interface StatementWithVotes {
  id: string;
  text: string;
  agreeCount: number;
  disagreeCount: number;
  passCount: number;
}

interface StatementsListProps {
  statements: StatementWithVotes[];
  showConsensus?: boolean;
  consensusThreshold?: number;
}

export function StatementsList({
  statements,
  showConsensus = true,
  consensusThreshold = 80
}: StatementsListProps) {
  // Calculate consensus statements (>80% agreement)
  const consensusStatements = statements
    .map(stmt => {
      const total = stmt.agreeCount + stmt.disagreeCount + stmt.passCount;
      const agreePercent = total > 0 ? (stmt.agreeCount / total) * 100 : 0;
      return { ...stmt, agreePercent };
    })
    .filter(stmt => stmt.agreePercent >= consensusThreshold)
    .sort((a, b) => b.agreePercent - a.agreePercent)
    .slice(0, 3); // Top 3 consensus statements

  return (
    <div className="space-y-4">
      {/* Strong Consensus Section */}
      {showConsensus && consensusStatements.length > 0 && (
        <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <TrendingUp className="text-status-success" size={20} />
            {results.consensusTitle}
          </h3>
          <div className="space-y-3">
            {consensusStatements.map((stmt) => (
              <div
                key={stmt.id}
                className="bg-voting-agree-light border-2 border-voting-agree rounded-lg p-3 sm:p-4"
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <p className="text-gray-800 flex-1 text-sm sm:text-base" dir="auto">
                    &ldquo;{stmt.text}&rdquo;
                  </p>
                  <div className="text-end flex-shrink-0">
                    <p className="text-xl sm:text-2xl font-bold text-status-success">
                      {Math.round(stmt.agreePercent)}%
                    </p>
                    <p className="text-xs text-voting-agree-dark">{results.agreementLabel}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Statements Section */}
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
          {results.allStatementsTitle}
        </h3>
        <div className="space-y-3">
          {statements.map((stmt) => {
            const total = stmt.agreeCount + stmt.disagreeCount + stmt.passCount;
            const agreePercent = total > 0 ? (stmt.agreeCount / total) * 100 : 0;
            const disagreePercent = total > 0 ? (stmt.disagreeCount / total) * 100 : 0;
            const passPercent = total > 0 ? (stmt.passCount / total) * 100 : 0;

            return (
              <div key={stmt.id} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                <p className="text-gray-800 mb-2 sm:mb-3 text-sm sm:text-base" dir="auto">
                  &ldquo;{stmt.text}&rdquo;
                </p>

                {/* Vote Distribution Bar */}
                <div className="flex gap-0.5 h-2 sm:h-3 rounded-full overflow-hidden mb-2">
                  {agreePercent > 0 && (
                    <div
                      style={{ width: `${agreePercent}%` }}
                      className="bg-voting-agree"
                    />
                  )}
                  {disagreePercent > 0 && (
                    <div
                      style={{ width: `${disagreePercent}%` }}
                      className="bg-voting-disagree"
                    />
                  )}
                  {passPercent > 0 && (
                    <div
                      style={{ width: `${passPercent}%` }}
                      className="bg-voting-pass"
                    />
                  )}
                </div>

                {/* Vote Counts */}
                <div className="flex justify-between text-xs sm:text-sm">
                  <span className="text-voting-agree-dark font-medium">
                    {stmt.agreeCount} {results.agreeLabel}
                  </span>
                  <span className="text-voting-disagree-dark font-medium">
                    {stmt.disagreeCount} {results.disagreeLabel}
                  </span>
                  <span className="text-voting-pass-dark font-medium">
                    {stmt.passCount} {results.passLabel}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

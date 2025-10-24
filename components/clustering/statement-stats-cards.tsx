"use client";

/**
 * Statement Stats Cards Component
 * Shows counts of different statement types (consensus, partial, split, divisive, bridge)
 */

import { CheckCircle2, TrendingUp, Split, Zap, Link } from "lucide-react";
import { opinionMap } from "@/lib/strings/he";
import type { StatementGroupAgreement } from "@/lib/services/clustering-service";

interface StatementStatsCardsProps {
  statements: StatementGroupAgreement[];
  className?: string;
}

export function StatementStatsCards({ statements, className = "" }: StatementStatsCardsProps) {
  // Count statement types
  const counts = {
    fullConsensus: statements.filter((s) => s.classification.type === "full_consensus").length,
    partialConsensus: statements.filter((s) => s.classification.type === "partial_consensus")
      .length,
    splitDecision: statements.filter((s) => s.classification.type === "split_decision").length,
    divisive: statements.filter((s) => s.classification.type === "divisive").length,
    bridge: statements.filter((s) => s.classification.type === "bridge").length,
  };

  const statCards = [
    {
      type: "full_consensus",
      count: counts.fullConsensus,
      label: opinionMap.fullConsensusTitle,
      description: opinionMap.fullConsensusDescription,
      icon: CheckCircle2,
      color: "bg-green-50 border-green-200 text-green-700",
      iconColor: "text-green-600",
    },
    {
      type: "partial_consensus",
      count: counts.partialConsensus,
      label: opinionMap.partialConsensusTitle,
      description: opinionMap.partialConsensusDescription,
      icon: TrendingUp,
      color: "bg-blue-50 border-blue-200 text-blue-700",
      iconColor: "text-blue-600",
    },
    {
      type: "split_decision",
      count: counts.splitDecision,
      label: opinionMap.splitDecisionTitle,
      description: opinionMap.splitDecisionDescription,
      icon: Split,
      color: "bg-yellow-50 border-yellow-200 text-yellow-700",
      iconColor: "text-yellow-600",
    },
    {
      type: "divisive",
      count: counts.divisive,
      label: opinionMap.divisiveEnhancedTitle,
      description: opinionMap.divisiveEnhancedDescription,
      icon: Zap,
      color: "bg-red-50 border-red-200 text-red-700",
      iconColor: "text-red-600",
    },
    {
      type: "bridge",
      count: counts.bridge,
      label: opinionMap.bridgeEnhancedTitle,
      description: opinionMap.bridgeEnhancedDescription,
      icon: Link,
      color: "bg-purple-50 border-purple-200 text-purple-700",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 ${className}`}>
      {statCards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.type}
            className={`border-2 rounded-xl p-3 transition-all hover:shadow-md ${card.color}`}
          >
            <div className="flex items-start gap-2 mb-1">
              <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${card.iconColor}`} />
              <div className="flex-1 min-w-0">
                <div className="text-2xl font-bold">{card.count}</div>
                <div className="text-xs font-semibold truncate">{card.label}</div>
              </div>
            </div>
            <p className="text-xs opacity-75 line-clamp-2">{card.description}</p>
          </div>
        );
      })}
    </div>
  );
}

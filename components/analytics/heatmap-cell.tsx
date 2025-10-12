"use client";

import { HeatmapCellData } from "@/db/queries/demographic-analytics-queries";
import {
  getAgreementColor,
  getAgreementTextColor,
  getAgreementOpacity,
  formatAgreementPercentage,
} from "@/lib/utils/heatmap";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapCellProps {
  cell: HeatmapCellData;
  showTooltip?: boolean;
}

export function HeatmapCell({ cell, showTooltip = true }: HeatmapCellProps) {
  // Handle below threshold or no data
  if (cell.agreementPercentage === null) {
    return (
      <div className="p-3 text-center bg-gray-100 text-gray-400 font-medium" dir="ltr">
        —
      </div>
    );
  }

  const percentage = cell.agreementPercentage;
  const bgColor = getAgreementColor(percentage);
  const textColor = getAgreementTextColor(percentage);
  const opacity = getAgreementOpacity(percentage);

  const cellContent = (
    <div
      className="p-3 text-center cursor-default transition-all hover:scale-105"
      style={{
        backgroundColor: bgColor,
        color: textColor,
        opacity: opacity,
      }}
      dir="ltr"
    >
      <div className="font-bold text-sm sm:text-base">
        {formatAgreementPercentage(percentage)}
        {cell.hasHighPasses && (
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-400 ms-1" title="Many pass votes"></span>
        )}
      </div>
      <div className="text-xs opacity-75 mt-0.5">
        ({cell.totalVotes})
      </div>
    </div>
  );

  if (!showTooltip) {
    return cellContent;
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          {cellContent}
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs" dir="rtl">
          <div className="space-y-1 text-sm">
            <div className="font-semibold">{cell.groupLabel}</div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <span className="text-gray-500">שמור:</span>
              <span className="font-medium text-emerald-600">{cell.agreeCount}</span>
              <span className="text-gray-500">זרוק:</span>
              <span className="font-medium text-rose-600">{cell.disagreeCount}</span>
              <span className="text-gray-500">דלג:</span>
              <span className="font-medium text-gray-600">{cell.passCount}</span>
            </div>
            {cell.hasHighPasses && (
              <div className="text-xs text-amber-600 pt-1 border-t">
                ⚠ {Math.round(cell.passPercentage)}% דילגו על הצהרה זו
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

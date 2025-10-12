"use client";

import { HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  getAgreementColor,
  getAgreementTextColor,
  getAgreementOpacity,
  formatAgreementPercentage,
  getClassificationColor,
} from "@/lib/utils/heatmap";

interface HeatmapCardsProps {
  data: HeatmapStatementData[];
}

export function HeatmapCards({ data }: HeatmapCardsProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" dir="rtl">
        <p className="text-lg mb-2">אין נתונים להצגה</p>
        <p className="text-sm">לא נמצאו הצהרות עם מספיק קולות להצגת מפת חום.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {data.map((statement) => (
        <Card key={statement.statementId} className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-2">
              <CardTitle className="text-sm font-semibold text-gray-900 flex-1" dir="auto">
                {statement.statementText}
              </CardTitle>
              <Badge
                variant="outline"
                className={`${getClassificationColor(statement.classificationType)} text-xs shrink-0`}
              >
                {statement.classificationLabel}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-2 gap-2">
              {statement.cells.map((cell) => {
                if (cell.agreementPercentage === null) {
                  return (
                    <div
                      key={cell.groupId}
                      className="p-3 rounded-lg bg-gray-100 text-center"
                    >
                      <div className="text-xs font-medium text-gray-500 mb-1">
                        {cell.groupLabel}
                      </div>
                      <div className="text-lg font-bold text-gray-400">—</div>
                    </div>
                  );
                }

                const percentage = cell.agreementPercentage;
                const bgColor = getAgreementColor(percentage);
                const textColor = getAgreementTextColor(percentage);
                const opacity = getAgreementOpacity(percentage);

                return (
                  <div
                    key={cell.groupId}
                    className="p-3 rounded-lg text-center"
                    style={{
                      backgroundColor: bgColor,
                      color: textColor,
                      opacity: opacity,
                    }}
                  >
                    <div className="text-xs font-medium mb-1" style={{ opacity: 0.9 }}>
                      {cell.groupLabel}
                    </div>
                    <div className="text-lg font-bold">
                      {formatAgreementPercentage(percentage)}
                      {cell.hasHighPasses && (
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-current opacity-60 ms-1"></span>
                      )}
                    </div>
                    <div className="text-xs mt-1" style={{ opacity: 0.75 }}>
                      {cell.totalVotes} קולות
                    </div>
                    {cell.hasHighPasses && (
                      <div className="text-xs mt-1" style={{ opacity: 0.75 }}>
                        {Math.round(cell.passPercentage)}% דילגו
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

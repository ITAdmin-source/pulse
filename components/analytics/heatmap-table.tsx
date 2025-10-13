"use client";

import { HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";
import { HeatmapCell } from "./heatmap-cell";
import { getClassificationColor } from "@/lib/utils/heatmap";
import { Badge } from "@/components/ui/badge";

interface HeatmapTableProps {
  data: HeatmapStatementData[];
}

export function HeatmapTable({ data }: HeatmapTableProps) {
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500" dir="rtl">
        <p className="text-lg mb-2">אין נתונים להצגה</p>
        <p className="text-sm">לא נמצאו הצהרות עם מספיק קולות להצגת מפת חום.</p>
      </div>
    );
  }

  // Get unique groups from first statement
  const groups = data[0]?.cells || [];

  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0" dir="rtl">
      <div className="inline-block min-w-full align-middle">
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            {/* Header */}
            <thead className="bg-white/70 sticky top-0 z-10">
              <tr>
                <th
                  scope="col"
                  className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-white/70 border-l border-gray-200"
                  style={{ minWidth: '250px', maxWidth: '400px' }}
                >
                  הצהרה
                </th>
                {groups.map((group) => (
                  <th
                    key={group.groupId}
                    scope="col"
                    className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                    style={{ minWidth: '100px' }}
                  >
                    <div>{group.groupLabel}</div>
                    <div className="text-xs text-gray-500 font-normal mt-0.5">
                      ({group.totalResponses} בחירות)
                    </div>
                  </th>
                ))}
                <th
                  scope="col"
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider"
                  style={{ minWidth: '120px' }}
                >
                  סוג
                </th>
              </tr>
            </thead>

            {/* Body */}
            <tbody className="bg-white divide-y divide-gray-200">
              {data.map((statement, idx) => (
                <tr key={statement.statementId} className={idx % 2 === 0 ? 'bg-white' : 'bg-white/70'}>
                  {/* Statement text */}
                  <td
                    className="px-4 py-3 text-sm text-gray-900 sticky right-0 bg-inherit border-l border-gray-200"
                    style={{ minWidth: '250px', maxWidth: '400px' }}
                  >
                    <div className="line-clamp-3" dir="auto">
                      {statement.statementText}
                    </div>
                  </td>

                  {/* Cells */}
                  {statement.cells.map((cell) => (
                    <td key={cell.groupId} className="p-0">
                      <HeatmapCell cell={cell} />
                    </td>
                  ))}

                  {/* Classification */}
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={getClassificationColor(statement.classificationType)}
                    >
                      {statement.classificationLabel}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

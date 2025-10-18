"use client";

import { useState } from "react";
import { HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";
import { getAgreementColor, getAgreementTextColor, formatAgreementPercentage } from "@/lib/utils/heatmap";
import { results } from "@/lib/strings/he";
import { Users, Calendar, Globe, Flag } from "lucide-react";

type DemographicAttribute = "gender" | "ageGroup" | "ethnicity" | "politicalParty";

interface DemographicHeatmapProps {
  pollId: string;
  data: Record<DemographicAttribute, HeatmapStatementData[]>;
  isLoading?: boolean;
}

const attributeConfig = {
  ethnicity: {
    icon: Globe,
    label: results.heatmapEthnicity,
    color: "text-orange-600"
  },
  politicalParty: {
    icon: Flag,
    label: results.heatmapPolitics,
    color: "text-primary-600"
  },
  ageGroup: {
    icon: Calendar,
    label: results.heatmapAge,
    color: "text-green-600"
  },
  gender: {
    icon: Users,
    label: results.heatmapGender,
    color: "text-blue-600"
  }
};

export function DemographicHeatmap({ data, isLoading = false }: DemographicHeatmapProps) {
  const [activeAttribute, setActiveAttribute] = useState<DemographicAttribute>("ethnicity");

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
        <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-4">
          {results.heatmapTitle}
        </h3>
        <div className="text-center py-12 text-gray-500">
          <p>{results.heatmapLoading}</p>
        </div>
      </div>
    );
  }

  const activeData = data[activeAttribute] || [];
  const groups = activeData[0]?.cells || [];

  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-lg">
      {/* Header */}
      <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">
        {results.heatmapTitle}
      </h3>
      <p className="text-sm text-gray-600 mb-4">{results.heatmapDescription}</p>

      {/* Attribute Selector */}
      <div className="flex flex-wrap gap-2 mb-6" dir="rtl">
        {(Object.keys(attributeConfig) as DemographicAttribute[]).map((attr) => {
          const config = attributeConfig[attr];
          const Icon = config.icon;
          const isActive = activeAttribute === attr;

          return (
            <button
              key={attr}
              onClick={() => setActiveAttribute(attr)}
              className={`flex items-center gap-2 px-4 py-2.5 sm:py-2 min-h-[44px] rounded-lg font-semibold text-sm transition-all ${
                isActive
                  ? "bg-gradient-poll-header text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Icon size={16} />
              <span>{config.label}</span>
            </button>
          );
        })}
      </div>

      {/* Heatmap Table */}
      {activeData.length === 0 ? (
        <div className="text-center py-12 text-gray-500" dir="rtl">
          <p className="text-lg mb-2">אין נתונים להצגה</p>
          <p className="text-sm">לא נמצאו עמדות עם מספיק הצבעות להצגת מפת חום.</p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-4 sm:mx-0" dir="rtl">
          <div className="inline-block min-w-full align-middle">
            <div className="overflow-hidden border-2 border-primary-200 rounded-xl">
              <table className="min-w-full divide-y divide-primary-200">
                {/* Header */}
                <thead className="bg-gradient-header-light">
                  <tr>
                    <th
                      scope="col"
                      className="px-3 sm:px-4 py-3 text-right text-xs font-bold text-primary-900 uppercase tracking-wider sticky right-0 bg-gradient-header-light border-l-2 border-primary-200"
                      style={{ minWidth: '200px', maxWidth: '350px' }}
                    >
                      עמדה
                    </th>
                    {groups.map((group) => (
                      <th
                        key={group.groupId}
                        scope="col"
                        className="px-2 py-3 text-center text-xs font-bold text-primary-900 uppercase tracking-wider"
                        style={{ minWidth: '90px' }}
                      >
                        <div>{group.groupLabel}</div>
                        <div className="text-xs text-primary-700 font-normal mt-0.5">
                          ({group.totalResponses})
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>

                {/* Body */}
                <tbody className="bg-white divide-y divide-primary-100">
                  {activeData.map((statement, idx) => (
                    <tr
                      key={statement.statementId}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-primary-50-30'}
                    >
                      {/* Statement text */}
                      <td
                        className="px-3 sm:px-4 py-3 text-xs sm:text-sm text-gray-900 sticky right-0 bg-inherit border-l-2 border-primary-200"
                        style={{ minWidth: '200px', maxWidth: '350px' }}
                      >
                        <div className="line-clamp-2" dir="auto">
                          &ldquo;{statement.statementText}&rdquo;
                        </div>
                      </td>

                      {/* Heatmap Cells */}
                      {statement.cells.map((cell) => (
                        <td key={cell.groupId} className="p-0">
                          {cell.agreementPercentage === null ? (
                            <div className="p-2 sm:p-3 text-center bg-gray-100 text-gray-400 font-medium">
                              —
                            </div>
                          ) : (
                            <div
                              className="p-2 sm:p-3 text-center transition-all hover:scale-105 cursor-default"
                              style={{
                                backgroundColor: getAgreementColor(cell.agreementPercentage),
                                color: getAgreementTextColor(cell.agreementPercentage),
                              }}
                            >
                              <div className="font-bold text-xs sm:text-sm">
                                {formatAgreementPercentage(cell.agreementPercentage)}
                              </div>
                              <div className="text-xs opacity-75 mt-0.5">
                                ({cell.totalVotes})
                              </div>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-primary-200" dir="rtl">
        <div className="flex items-center justify-center gap-6 flex-wrap text-xs sm:text-sm">
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-red-500"></div>
            <span className="text-gray-700">לא מסכימים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-yellow-400"></div>
            <span className="text-gray-700">מעורב</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-green-500"></div>
            <span className="text-gray-700">מסכימים</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-6 rounded bg-gray-200 border border-gray-300"></div>
            <span className="text-gray-700">אין מספיק נתונים</span>
          </div>
        </div>
      </div>
    </div>
  );
}

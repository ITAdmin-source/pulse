/**
 * Group Demographics Component
 * Displays demographic breakdown for a cluster group with visual graphs
 */

import { CoarseGroup } from "./types";
import { BarChart, Bar, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface GroupDemographicsProps {
  demographics: CoarseGroup["demographics"];
  totalUsers: number;
  className?: string;
}

/**
 * Formats demographic data as percentages
 */
function formatDemographicBreakdown(
  data: Record<string, number>,
  total: number
): { label: string; count: number; percentage: number }[] {
  return Object.entries(data)
    .map(([label, count]) => ({
      label,
      count,
      percentage: Math.round((count / total) * 100),
    }))
    .sort((a, b) => b.count - a.count); // Sort by count descending
}

/**
 * Sort age groups in sequential order
 */
function sortAgeGroups(data: { label: string; count: number; percentage: number }[]): typeof data {
  const ageOrder = ["18-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+", "מעדיף/ה לא להגיד"];
  return data.sort((a, b) => {
    const aIndex = ageOrder.indexOf(a.label);
    const bIndex = ageOrder.indexOf(b.label);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

/**
 * Sort political parties in spectrum order
 */
function sortPoliticalSpectrum(data: { label: string; count: number; percentage: number }[]): typeof data {
  const politicsOrder = ["ימין עמוק", "ימין", "מרכז", "שמאל", "שמאל עמוק", "מעדיף/ה לא להגיד"];
  return data.sort((a, b) => {
    const aIndex = politicsOrder.indexOf(a.label);
    const bIndex = politicsOrder.indexOf(b.label);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

/**
 * Get color for political spectrum position
 */
function getPoliticalColor(label: string): string {
  const colorMap: Record<string, string> = {
    "ימין עמוק": "#1e3a8a", // Deep blue
    "ימין": "#3b82f6",      // Blue
    "מרכז": "#8b5cf6",      // Purple
    "שמאל": "#ef4444",      // Red
    "שמאל עמוק": "#991b1b", // Deep red
    "מעדיף/ה לא להגיד": "#9ca3af", // Gray
  };
  return colorMap[label] || "#6b7280";
}

/**
 * Get color for gender
 */
function getGenderColor(label: string): string {
  const colorMap: Record<string, string> = {
    "גבר": "#3b82f6",      // Blue
    "אישה": "#ec4899",     // Pink
    "מעדיף/ה לא להגיד": "#9ca3af", // Gray
  };
  return colorMap[label] || "#6b7280";
}

/**
 * Get distinct colors for ethnicities
 */
function getEthnicityColor(index: number): string {
  const colors = [
    "#8b5cf6", // Purple
    "#10b981", // Green
    "#f59e0b", // Orange
    "#3b82f6", // Blue
    "#ec4899", // Pink
    "#14b8a6", // Teal
    "#f97316", // Orange-red
    "#6366f1", // Indigo
  ];
  return colors[index % colors.length];
}

/**
 * Custom Tooltip for demographic charts
 */
function CustomDemographicTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; count: number; percentage: number } }> }) {
  if (!active || !payload?.[0]) return null;

  const data = payload[0].payload;

  return (
    <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2.5 text-xs" dir="rtl">
      <p className="font-semibold text-gray-900">{data.label}</p>
      <p className="text-gray-600">
        {data.count} משתתפים ({data.percentage}%)
      </p>
    </div>
  );
}

/**
 * Age Distribution Chart - Sequential visualization (RTL)
 */
function AgeDistributionChart({ data, totalUsers }: { data: Record<string, number>; totalUsers: number }) {
  // Sort and reverse for RTL rendering (80+ on left, 18-29 on right)
  const breakdown = sortAgeGroups(formatDemographicBreakdown(data, totalUsers)).reverse();

  if (breakdown.length === 0) return null;

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-700">גיל</h5>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={breakdown} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
            {breakdown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={`hsl(265, ${70 - index * 10}%, ${50 + index * 5}%)`} />
            ))}
          </Bar>
          <Tooltip content={<CustomDemographicTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <span className="font-medium">{item.label}:</span>
            <span>{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Gender Stacked Progress Bar - Single multicolored bar
 */
function GenderStackedBar({ data, totalUsers }: { data: Record<string, number>; totalUsers: number }) {
  const breakdown = formatDemographicBreakdown(data, totalUsers);

  if (breakdown.length === 0) return null;

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-700">מגדר</h5>
      {/* Stacked bar */}
      <div className="flex w-full h-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        {breakdown.map((item) => (
          <div
            key={item.label}
            className="relative group cursor-help flex items-center justify-center transition-opacity hover:opacity-90"
            style={{
              width: `${item.percentage}%`,
              backgroundColor: getGenderColor(item.label),
            }}
            title={`${item.label}: ${item.count} משתתפים (${item.percentage}%)`}
          >
            {/* Show label if percentage is large enough */}
            {item.percentage >= 15 && (
              <span className="text-[10px] font-semibold text-white drop-shadow-sm">
                {item.percentage}%
              </span>
            )}
            {/* Tooltip on hover */}
            <div className="absolute hidden group-hover:block bottom-full mb-2 left-1/2 -translate-x-1/2 z-10">
              <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-2 text-xs whitespace-nowrap" dir="rtl">
                <p className="font-semibold text-gray-900">{item.label}</p>
                <p className="text-gray-600">{item.count} משתתפים ({item.percentage}%)</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      {/* Legend below */}
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: getGenderColor(item.label) }}
            />
            <span className="font-medium">{item.label}:</span>
            <span>{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Ethnicity Bar Chart - Vertical bars like age/politics
 */
function EthnicityBarChart({ data, totalUsers }: { data: Record<string, number>; totalUsers: number }) {
  // Sort by value (largest first) - no reversal needed as it's not semantic order
  const breakdown = formatDemographicBreakdown(data, totalUsers);

  if (breakdown.length === 0) return null;

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-700">מוצא</h5>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={breakdown} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
            {breakdown.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getEthnicityColor(index)} />
            ))}
          </Bar>
          <Tooltip content={<CustomDemographicTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600">
        {breakdown.map((item, index) => (
          <div key={item.label} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: getEthnicityColor(index) }}
            />
            <span className="font-medium">{item.label}:</span>
            <span>{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Political Spectrum - Gradient bar showing left-right distribution (RTL)
 */
function PoliticalSpectrumChart({ data, totalUsers }: { data: Record<string, number>; totalUsers: number }) {
  // Sort and reverse for RTL rendering (left on left side, right on right side)
  const breakdown = sortPoliticalSpectrum(formatDemographicBreakdown(data, totalUsers)).reverse();

  if (breakdown.length === 0) return null;

  return (
    <div className="space-y-2">
      <h5 className="text-xs font-semibold text-gray-700">זיהוי פוליטי</h5>
      <ResponsiveContainer width="100%" height={80}>
        <BarChart data={breakdown} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
            {breakdown.map((entry) => (
              <Cell key={entry.label} fill={getPoliticalColor(entry.label)} />
            ))}
          </Bar>
          <Tooltip content={<CustomDemographicTooltip />} cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }} />
        </BarChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-gray-600">
        {breakdown.map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div
              className="w-2 h-2 rounded-sm"
              style={{ backgroundColor: getPoliticalColor(item.label) }}
            />
            <span className="font-medium">{item.label}:</span>
            <span>{item.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GroupDemographics({
  demographics,
  totalUsers,
  className = "",
}: GroupDemographicsProps) {
  if (!demographics) {
    return (
      <div className={`text-xs text-gray-500 italic ${className}`}>
        אין נתוני דמוגרפיה זמינים
      </div>
    );
  }

  const hasAnyData =
    Object.keys(demographics.ageGroups).length > 0 ||
    Object.keys(demographics.genders).length > 0 ||
    Object.keys(demographics.ethnicities).length > 0 ||
    Object.keys(demographics.politicalParties).length > 0;

  if (!hasAnyData) {
    return (
      <div className={`text-xs text-gray-500 italic ${className}`}>
        אין נתוני דמוגרפיה למשתתפים בקבוצה זו
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {Object.keys(demographics.ageGroups).length > 0 && (
        <AgeDistributionChart data={demographics.ageGroups} totalUsers={totalUsers} />
      )}
      {Object.keys(demographics.genders).length > 0 && (
        <GenderStackedBar data={demographics.genders} totalUsers={totalUsers} />
      )}
      {Object.keys(demographics.ethnicities).length > 0 && (
        <EthnicityBarChart data={demographics.ethnicities} totalUsers={totalUsers} />
      )}
      {Object.keys(demographics.politicalParties).length > 0 && (
        <PoliticalSpectrumChart data={demographics.politicalParties} totalUsers={totalUsers} />
      )}
    </div>
  );
}

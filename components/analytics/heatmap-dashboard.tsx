"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { HeatmapTable } from "./heatmap-table";
import { HeatmapCards } from "./heatmap-cards";
import { HeatmapControls } from "./heatmap-controls";
import { getHeatmapDataAction } from "@/actions/heatmap-actions";
import type { DemographicAttribute, HeatmapStatementData } from "@/db/queries/demographic-analytics-queries";
import { sortStatementsByType, sortStatementsAlphabetically, filterStatementsByType } from "@/lib/utils/heatmap";
import { Loader2, BarChart3 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface HeatmapDashboardProps {
  pollId: string;
  title?: string;
  description?: string;
  defaultAttribute?: DemographicAttribute;
  autoRefreshInterval?: number; // milliseconds, default 30000 (30s)
}

export function HeatmapDashboard({
  pollId,
  title = "מפת חום דמוגרפית",
  description = "התפלגות הסכמה להצהרות לפי קבוצות דמוגרפיות",
  defaultAttribute = 'gender',
  autoRefreshInterval = 30000,
}: HeatmapDashboardProps) {
  const [selectedAttribute, setSelectedAttribute] = useState<DemographicAttribute>(defaultAttribute);
  const [sortBy, setSortBy] = useState<'type' | 'alphabetical'>('type');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['consensus', 'partial', 'split', 'divisive']);
  const [data, setData] = useState<HeatmapStatementData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isMobile = useIsMobile();

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const result = await getHeatmapDataAction(pollId, selectedAttribute, 3);

    if (result.success && result.data) {
      setData(result.data);
    } else {
      setError(result.error || "Failed to load heatmap data");
    }

    setLoading(false);
  };

  // Initial load and attribute change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId, selectedAttribute]);

  // Auto-refresh polling
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const interval = setInterval(() => {
      fetchData();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollId, selectedAttribute, autoRefreshInterval]);

  // Sort and filter data
  const processedData = (() => {
    let result = data;

    // Filter by type
    result = filterStatementsByType(result, selectedTypes);

    // Sort
    if (sortBy === 'type') {
      result = sortStatementsByType(result);
    } else {
      result = sortStatementsAlphabetically(result);
    }

    return result;
  })();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2" dir="rtl">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          <CardDescription dir="rtl">{description}</CardDescription>
        </CardHeader>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <HeatmapControls
            selectedAttribute={selectedAttribute}
            onAttributeChange={setSelectedAttribute}
            sortBy={sortBy}
            onSortChange={setSortBy}
            selectedTypes={selectedTypes}
            onTypesChange={setSelectedTypes}
          />
        </CardContent>
      </Card>

      {/* Heatmap Data */}
      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-600" dir="rtl">
              <p className="text-lg mb-2">שגיאה בטעינת הנתונים</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : processedData.length === 0 && selectedTypes.length > 0 ? (
            <div className="text-center py-12 text-gray-500" dir="rtl">
              <p className="text-lg mb-2">אין נתונים להצגה</p>
              <p className="text-sm">
                {data.length === 0
                  ? "לא נמצאו הצהרות עם מספיק קולות להצגת מפת חום."
                  : "לא נמצאו הצהרות התואמות את הסינונים שנבחרו."}
              </p>
            </div>
          ) : isMobile ? (
            <HeatmapCards data={processedData} />
          ) : (
            <HeatmapTable data={processedData} />
          )}
        </CardContent>
      </Card>

      {/* Stats Footer */}
      {!loading && !error && processedData.length > 0 && (
        <div className="text-center text-sm text-gray-500" dir="rtl">
          מציג {processedData.length} מתוך {data.length} הצהרות
          {selectedTypes.length < 4 && " (מסונן)"}
        </div>
      )}
    </div>
  );
}

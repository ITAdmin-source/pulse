"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, AlertCircle, BarChart3 } from "lucide-react";
import { DemographicBreakdownChart } from "./demographic-breakdown-chart";
import { DemographicFilters, type DemographicCategory } from "./demographic-filters";
import { getPollDemographicBreakdownAction, exportDemographicAnalyticsAction } from "@/actions/demographic-analytics-actions";
import type { DemographicVoteBreakdown } from "@/db/queries/demographic-analytics-queries";
import { toast } from "sonner";

interface DemographicAnalyticsDashboardProps {
  pollId: string;
  userId?: string;
  showExport?: boolean;
  privacyThreshold?: number;
  title?: string;
  description?: string;
}

interface DemographicData {
  byAgeGroup: DemographicVoteBreakdown[];
  byGender: DemographicVoteBreakdown[];
  byEthnicity: DemographicVoteBreakdown[];
  byPoliticalParty: DemographicVoteBreakdown[];
  participants?: {
    byAgeGroup: Array<{ categoryId: number; categoryLabel: string; count: number }>;
    byGender: Array<{ categoryId: number; categoryLabel: string; count: number }>;
    byEthnicity: Array<{ categoryId: number; categoryLabel: string; count: number }>;
    byPoliticalParty: Array<{ categoryId: number; categoryLabel: string; count: number }>;
  };
}

export function DemographicAnalyticsDashboard({
  pollId,
  userId,
  showExport = false,
  privacyThreshold = 5,
  title = "ניתוח דמוגרפי",
  description = "התפלגות בחירות לפי קבוצות דמוגרפיות",
}: DemographicAnalyticsDashboardProps) {
  const [selectedCategory, setSelectedCategory] = useState<DemographicCategory>("all");
  const [data, setData] = useState<DemographicData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Fetch demographic data
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError(null);

      const result = await getPollDemographicBreakdownAction(pollId, privacyThreshold);

      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.error || "Failed to load demographic data");
      }

      setLoading(false);
    }

    fetchData();
  }, [pollId, privacyThreshold]);

  // Export handler
  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportDemographicAnalyticsAction(pollId, userId);

      if (result.success && result.data) {
        // Create download
        const blob = new Blob([result.data], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `demographic-analytics-${pollId}-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        toast.success("ניתוח הדמוגרפיה יוצא בהצלחה");
      } else if (result.unauthorized) {
        toast.error("אין לך הרשאה לייצא ניתוח זה");
      } else {
        toast.error(result.error || "שגיאה בייצוא הניתוח");
      }
    } catch (error) {
      console.error("Export error:", error);
      toast.error("שגיאה בייצוא הניתוח");
    } finally {
      setExporting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2" dir="rtl">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription dir="rtl">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2" dir="rtl">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription dir="rtl">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center gap-3 py-12 text-red-600" dir="rtl">
            <AlertCircle className="h-5 w-5" />
            <span>{error || "שגיאה בטעינת הנתונים"}</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if we have any data
  const hasData =
    data.byAgeGroup.length > 0 ||
    data.byGender.length > 0 ||
    data.byEthnicity.length > 0 ||
    data.byPoliticalParty.length > 0;

  if (!hasData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2" dir="rtl">
            <BarChart3 className="h-5 w-5" />
            {title}
          </CardTitle>
          {description && <CardDescription dir="rtl">{description}</CardDescription>}
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-gray-500" dir="rtl">
            <p className="text-lg mb-2">אין מספיק נתונים דמוגרפיים</p>
            <p className="text-sm">
              לא נמצאו מספיק שחקנים עם נתונים דמוגרפיים להצגת ניתוח.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-xl flex items-center gap-2" dir="rtl">
                  <BarChart3 className="h-5 w-5" />
                  {title}
                </CardTitle>
                {description && <CardDescription dir="rtl">{description}</CardDescription>}
              </div>
              {showExport && userId && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={exporting}
                  className="flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  <span>ייצוא</span>
                </Button>
              )}
            </div>
          </CardHeader>
        </Card>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <DemographicFilters
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
        />
      </motion.div>

      {/* Participant Distribution Summary */}
      {data.participants && selectedCategory === "all" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-lg" dir="rtl">התפלגות שחקנים</CardTitle>
              <CardDescription dir="rtl">
                מספר השחקנים בכל קבוצה דמוגרפית
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" dir="rtl">
                {/* Age Group */}
                {data.participants.byAgeGroup.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">קבוצת גיל</h4>
                    <div className="space-y-1">
                      {data.participants.byAgeGroup.map((item) => (
                        <div key={item.categoryId} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.categoryLabel}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gender */}
                {data.participants.byGender.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">מגדר</h4>
                    <div className="space-y-1">
                      {data.participants.byGender.map((item) => (
                        <div key={item.categoryId} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.categoryLabel}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Ethnicity */}
                {data.participants.byEthnicity.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">מוצא אתני</h4>
                    <div className="space-y-1">
                      {data.participants.byEthnicity.map((item) => (
                        <div key={item.categoryId} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.categoryLabel}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Political Party */}
                {data.participants.byPoliticalParty.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">השתייכות פוליטית</h4>
                    <div className="space-y-1">
                      {data.participants.byPoliticalParty.map((item) => (
                        <div key={item.categoryId} className="flex justify-between text-sm">
                          <span className="text-gray-600">{item.categoryLabel}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Charts */}
      {(selectedCategory === "all" || selectedCategory === "ageGroup") && data.byAgeGroup.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: selectedCategory === "all" ? 0.3 : 0.2 }}
        >
          <DemographicBreakdownChart
            data={data.byAgeGroup}
            title="התפלגות לפי קבוצת גיל"
            description="אחוז הבחירות (שמור/זרוק/דלג) לפי קבוצת גיל"
          />
        </motion.div>
      )}

      {(selectedCategory === "all" || selectedCategory === "gender") && data.byGender.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: selectedCategory === "all" ? 0.4 : 0.2 }}
        >
          <DemographicBreakdownChart
            data={data.byGender}
            title="התפלגות לפי מגדר"
            description="אחוז הבחירות (שמור/זרוק/דלג) לפי מגדר"
          />
        </motion.div>
      )}

      {(selectedCategory === "all" || selectedCategory === "ethnicity") && data.byEthnicity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: selectedCategory === "all" ? 0.5 : 0.2 }}
        >
          <DemographicBreakdownChart
            data={data.byEthnicity}
            title="התפלגות לפי מוצא אתני"
            description="אחוז הבחירות (שמור/זרוק/דלג) לפי מוצא אתני"
          />
        </motion.div>
      )}

      {(selectedCategory === "all" || selectedCategory === "politicalParty") && data.byPoliticalParty.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: selectedCategory === "all" ? 0.6 : 0.2 }}
        >
          <DemographicBreakdownChart
            data={data.byPoliticalParty}
            title="התפלגות לפי השתייכות פוליטית"
            description="אחוז הבחירות (שמור/זרוק/דלג) לפי השתייכות פוליטית"
          />
        </motion.div>
      )}
    </div>
  );
}

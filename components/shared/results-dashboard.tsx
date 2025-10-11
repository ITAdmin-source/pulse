"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Users, Vote, ChevronDown, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatementResult {
  id: string;
  text: string;
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  agreePercent: number;
  disagreePercent: number;
  unsurePercent: number;
  totalVotes: number;
}

interface ResultsDashboardProps {
  pollQuestion: string;
  participantCount: number;
  voteCount: number;
  statements: StatementResult[];
  summaryText: string;
  generatedAt: string;
}

export function ResultsDashboard({
  pollQuestion,
  participantCount,
  voteCount,
  statements,
  summaryText,
  generatedAt,
}: ResultsDashboardProps) {
  const [allCardsOpen, setAllCardsOpen] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Sort statements by different criteria
  const topAgreed = [...statements]
    .sort((a, b) => b.agreePercent - a.agreePercent)
    .slice(0, 3);

  const topDisagreed = [...statements]
    .sort((a, b) => b.disagreePercent - a.disagreePercent)
    .slice(0, 3);

  const topDivisive = [...statements]
    .filter(s => s.totalVotes > 0)
    .sort((a, b) => {
      // Most divisive = smallest difference between agree/disagree
      const aDiff = Math.abs(a.agreePercent - a.disagreePercent);
      const bDiff = Math.abs(b.agreePercent - b.disagreePercent);
      return aDiff - bDiff;
    })
    .slice(0, 3);

  return (
    <div className="space-y-6" dir="rtl">
      {/* Hero Stats Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardContent className="p-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center" dir="auto">
              {pollQuestion}
            </h1>
            <div className="flex justify-center gap-8 md:gap-12">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users className="h-5 w-5 text-emerald-600" />
                  <span className="text-3xl md:text-4xl font-bold text-emerald-700">
                    {participantCount}
                  </span>
                </div>
                <p className="text-sm text-gray-600">שחקנים</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Vote className="h-5 w-5 text-emerald-600" />
                  <span className="text-3xl md:text-4xl font-bold text-emerald-700">
                    {voteCount}
                  </span>
                </div>
                <p className="text-sm text-gray-600">בחירות</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Consensus Cards */}
      {topAgreed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="border-emerald-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-emerald-600" />
                <CardTitle className="text-xl">הקלפים המאחדים ביותר</CardTitle>
              </div>
              <CardDescription>הקלפים שרוב השחקנים בחרו לשמור</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topAgreed.map((statement, index) => (
                <StatementItem
                  key={statement.id}
                  statement={statement}
                  rank={index + 1}
                  highlightType="agree"
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Divisive Cards */}
      {topDivisive.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="border-amber-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-xl">הקלפים השנויים במחלוקת</CardTitle>
              </div>
              <CardDescription>הקלפים שפיצלו את השחקנים</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topDivisive.map((statement, index) => (
                <StatementItem
                  key={statement.id}
                  statement={statement}
                  rank={index + 1}
                  highlightType="divisive"
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Top Disagreed Cards */}
      {topDisagreed.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="border-rose-200">
            <CardHeader>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-rose-600" />
                <CardTitle className="text-xl">הקלפים הכי שנויים בדחייה</CardTitle>
              </div>
              <CardDescription>הקלפים שרוב השחקנים בחרו לזרוק</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {topDisagreed.map((statement, index) => (
                <StatementItem
                  key={statement.id}
                  statement={statement}
                  rank={index + 1}
                  highlightType="disagree"
                />
              ))}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* All Cards - Collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        <Collapsible open={allCardsOpen} onOpenChange={setAllCardsOpen}>
          <Card className="border-gray-200">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">כל הקלפים ({statements.length})</CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      allCardsOpen && "rotate-180"
                    )}
                  />
                </div>
                <CardDescription>צפה בכל הקלפים והתפלגות הבחירות</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {statements.map((statement) => (
                  <StatementItem
                    key={statement.id}
                    statement={statement}
                    showFullChart
                  />
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>

      {/* AI Summary - Collapsible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        <Collapsible open={summaryOpen} onOpenChange={setSummaryOpen}>
          <Card className="border-indigo-200">
            <CollapsibleTrigger className="w-full">
              <CardHeader className="cursor-pointer hover:bg-indigo-50/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">סיכום מעמיק</CardTitle>
                  <ChevronDown
                    className={cn(
                      "h-5 w-5 transition-transform",
                      summaryOpen && "rotate-180"
                    )}
                  />
                </div>
                <CardDescription>ניתוח AI של תוצאות החפיסה</CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-line" dir="auto">
                  {summaryText}
                </div>
                <p className="text-xs text-gray-400 text-center mt-4">
                  נוצר ב-{new Date(generatedAt).toLocaleDateString('he-IL', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </motion.div>
    </div>
  );
}

// Statement Item Component
interface StatementItemProps {
  statement: StatementResult;
  rank?: number;
  highlightType?: "agree" | "disagree" | "divisive";
  showFullChart?: boolean;
}

function StatementItem({ statement, rank, highlightType, showFullChart }: StatementItemProps) {
  const highlightColors = {
    agree: "text-emerald-600 bg-emerald-50",
    disagree: "text-rose-600 bg-rose-50",
    divisive: "text-amber-600 bg-amber-50",
  };

  const primaryPercent = highlightType === "agree"
    ? statement.agreePercent
    : highlightType === "disagree"
    ? statement.disagreePercent
    : Math.max(statement.agreePercent, statement.disagreePercent);

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        {rank && (
          <div className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold",
            highlightType ? highlightColors[highlightType] : "bg-gray-100 text-gray-600"
          )}>
            {rank}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-800 leading-relaxed mb-2" dir="auto">
            {statement.text}
          </p>

          {/* Vote Distribution Bar */}
          {showFullChart ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-16 text-gray-600">לשמור</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${statement.agreePercent}%` }}
                  />
                </div>
                <div className="w-12 text-left font-medium text-emerald-600">
                  {Math.round(statement.agreePercent)}%
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-16 text-gray-600">לזרוק</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-rose-500 transition-all duration-500"
                    style={{ width: `${statement.disagreePercent}%` }}
                  />
                </div>
                <div className="w-12 text-left font-medium text-rose-600">
                  {Math.round(statement.disagreePercent)}%
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-16 text-gray-600">לדלג</div>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gray-400 transition-all duration-500"
                    style={{ width: `${statement.unsurePercent}%` }}
                  />
                </div>
                <div className="w-12 text-left font-medium text-gray-600">
                  {Math.round(statement.unsurePercent)}%
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full flex">
                  <div
                    className="bg-emerald-500 transition-all duration-500"
                    style={{ width: `${statement.agreePercent}%` }}
                  />
                  <div
                    className="bg-rose-500 transition-all duration-500"
                    style={{ width: `${statement.disagreePercent}%` }}
                  />
                </div>
              </div>
              <span className={cn(
                "text-sm font-bold",
                highlightType ? highlightColors[highlightType].split(' ')[0] : "text-gray-600"
              )}>
                {Math.round(primaryPercent)}%
              </span>
            </div>
          )}

          <p className="text-xs text-gray-500 mt-1">
            {statement.totalVotes} {statement.totalVotes === 1 ? 'בחירה' : 'בחירות'}
          </p>
        </div>
      </div>
    </div>
  );
}

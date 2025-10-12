"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Users, Vote } from "lucide-react";
import { motion } from "framer-motion";

interface PollStatsCardProps {
  pollQuestion: string;
  participantCount: number;
  voteCount: number;
}

export function PollStatsCard({
  pollQuestion,
  participantCount,
  voteCount,
}: PollStatsCardProps) {
  return (
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
  );
}

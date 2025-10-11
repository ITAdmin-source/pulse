"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";

interface CardDeckPackageProps {
  pollQuestion: string;
  allowUserStatements?: boolean;
  description?: string;
  onClick?: () => void;
}

export function CardDeckPackage({
  pollQuestion,
  allowUserStatements = false,
  description,
  onClick,
}: CardDeckPackageProps) {
  return (
    <div className="relative w-full max-w-xs mx-auto" style={{ perspective: "1000px" }}>
      {/* Back cards in deck - 3 WHITE CARDS with realistic stacking */}
      <div 
        className="absolute inset-0 bg-white rounded-3xl shadow-md transform translate-y-3 translate-x-2 rotate-2 border border-gray-200 pointer-events-none z-0" 
        style={{ transformStyle: "preserve-3d" }} 
      />
      <div 
        className="absolute inset-0 bg-white rounded-3xl shadow-md transform translate-y-2 translate-x-1 rotate-1 border border-gray-200 pointer-events-none z-0" 
        style={{ transformStyle: "preserve-3d" }} 
      />
      <div 
        className="absolute inset-0 bg-white rounded-3xl shadow-md transform translate-y-1 translate-x-0.5 border border-gray-200 pointer-events-none z-0" 
        style={{ transformStyle: "preserve-3d" }} 
      />

      {/* Front card - ORIGINAL GRADIENT COLORS */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05, rotateZ: -2, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={onClick}
        className="cursor-pointer relative z-10"
      >
        <Card className="relative w-full aspect-[2/3] shadow-2xl rounded-3xl border-0 bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 transition-shadow hover:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)]" style={{ willChange: "transform" }}>
          <CardContent className="p-8 h-full flex flex-col justify-between items-center">
            {/* Top decorative element */}
            <div className="text-center space-y-2">
              <div className="text-4xl opacity-70">✦</div>
              <div className="text-xs font-semibold text-gray-600 tracking-widest uppercase">
                חפיסת סקר
              </div>
            </div>

            {/* Middle - Poll Question, Description, and Instructions */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-4 w-full px-2">
              {/* Poll Question + Description */}
              <div className="text-center space-y-2">
                <h2 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                  {pollQuestion}
                </h2>
                {description && (
                  <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                    {description}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div className="flex gap-1.5 items-center justify-center py-1">
                <div className="w-1 h-1 rounded-full bg-gray-400/50" />
                <div className="w-1 h-1 rounded-full bg-gray-400/50" />
                <div className="w-1 h-1 rounded-full bg-gray-400/50" />
              </div>

              {/* Instructions */}
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-700 font-medium leading-relaxed">
                  שמור או זרוק כל קלף
                </p>
                {allowUserStatements && (
                  <p className="text-sm text-amber-700 font-semibold">
                    הוסף קלף מנצח
                  </p>
                )}
                <p className="text-sm text-gray-600 leading-relaxed">
                  גלה תובנות מפתיעות
                </p>
              </div>
            </div>

            {/* Bottom - Decorative bars */}
            <div className="text-center">
              <div className="flex gap-1 justify-center">
                <div className="w-8 h-1 bg-amber-400/40 rounded-full" />
                <div className="w-8 h-1 bg-amber-400/40 rounded-full" />
                <div className="w-8 h-1 bg-amber-400/40 rounded-full" />
              </div>
            </div>
          </CardContent>

          {/* Subtle pattern overlay */}
          <div className="absolute inset-0 opacity-5 pointer-events-none overflow-hidden rounded-3xl">
            <div className="w-full h-full" style={{
              backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)',
              backgroundSize: '24px 24px'
            }} />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
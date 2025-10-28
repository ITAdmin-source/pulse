import { Sparkles } from 'lucide-react';
import { musicRecommendation as strings } from '@/lib/strings/he';

export function MusicRecommendationSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 border-2 border-purple-100 animate-pulse" dir="rtl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-purple-400" />
        <div className="h-6 bg-gray-200 rounded w-32"></div>
      </div>
      <div className="h-4 bg-gray-200 rounded w-48 mb-6"></div>

      {/* Content */}
      <div className="flex gap-4 items-start">
        {/* Album art placeholder */}
        <div className="w-[100px] h-[100px] bg-gray-200 rounded-lg flex-shrink-0"></div>

        {/* Song info placeholders */}
        <div className="flex-1 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="space-y-2">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>

      {/* Loading message */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-sm text-center text-gray-500">{strings.loading}</p>
        <p className="text-xs text-center text-gray-400 mt-1">{strings.loadingSubtext}</p>
      </div>
    </div>
  );
}

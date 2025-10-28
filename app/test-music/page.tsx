'use client';

import { useState } from 'react';
import { MusicRecommendationCard } from '@/components/music/music-recommendation-card';
import { MusicRecommendationSkeleton } from '@/components/music/music-recommendation-skeleton';

interface MusicData {
  songTitle: string;
  artistName: string;
  spotifyLink: string;
  appleMusicLink: string;
  thumbnailUrl: string;
  reasoning: string;
}

interface MetadataData {
  clientLatency: number;
  cached: boolean;
  cacheType?: string;
  tokensUsed?: { input: number; output: number; total: number };
  cost?: { input: number; output: number; total: number };
  fallbackUsed?: boolean;
}

export default function TestMusicPage() {
  const [music, setMusic] = useState<MusicData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<MetadataData | null>(null);

  // Check if feature is enabled
  const isMusicEnabled = process.env.NEXT_PUBLIC_ENABLE_MUSIC_RECOMMENDATIONS === 'true';

  // If feature is disabled, show message
  if (!isMusicEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Music Recommendations Disabled</h1>
          <p className="text-gray-600 mb-4">
            The music recommendations feature is currently disabled.
          </p>
          <p className="text-sm text-gray-500">
            To enable it, set <code className="bg-gray-100 px-2 py-1 rounded">NEXT_PUBLIC_ENABLE_MUSIC_RECOMMENDATIONS=true</code> in your <code className="bg-gray-100 px-2 py-1 rounded">.env.local</code> file and restart the dev server.
          </p>
        </div>
      </div>
    );
  }

  async function testMusicAPI() {
    setLoading(true);
    setError(null);
    setMusic(null);
    setMetadata(null);

    try {
      console.log('🎵 Testing music API...');
      const startTime = performance.now();

      const response = await fetch('/api/insights/music-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Real poll from DB: Cost of Living poll
          pollId: 'ab3843ae-359d-4185-90f5-8e6d3b267e8c',
          pollQuestion: 'למה יוקר המחיה לא יורד – ומה באמת אפשר לעשות?',
          pollDescription: 'דיון על יוקר המחיה בישראל ופתרונות אפשריים',
          statements: [
            { text: 'יש להגביר את התחרות בשוק', vote: 1 },
            { text: 'יש להוזיל מחירי מזון', vote: 1 },
            { text: 'יש להקפיא מחירי דיור', vote: 0 },
            { text: 'יש להגדיל מס על עשירים', vote: -1 },
            { text: 'יש להקים ועדת מחירים', vote: 1 },
            { text: 'יש לבטל מכסים על יבוא', vote: 1 },
            { text: 'יש להגדיל תמיכה לאוכלוסיות חלשות', vote: 1 },
            { text: 'יש להקים רשת חנויות ממשלתית', vote: -1 },
            { text: 'יש לשלוט במחירי משכורות', vote: -1 },
            { text: 'יש להקים ועדת פיקוח על מחירים', vote: 1 },
          ],
          voteStatistics: {
            agreeCount: 6,
            disagreeCount: 3,
            unsureCount: 1,
            total: 10,
            agreePercent: 60,
            disagreePercent: 30,
            unsurePercent: 10
          },
          insightTitle: '🔨 הפעיל/ה',
          insightBody: 'אתה מאמין/ה בפעולה ישירה וקונקרטית לפתרון בעיות. הגישה שלך פרגמטית ומכוונת לתוצאות מיידיות.'
        })
      });

      const clientLatency = performance.now() - startTime;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ Response received:', data);

      if (data.success) {
        setMusic(data.music);
        setMetadata({
          ...data.metadata,
          clientLatency: Math.round(clientLatency),
          cached: data.cached,
          cacheType: data.cacheType
        });
        console.log('🎵 Music loaded:', data.music.songTitle, 'by', data.music.artistName);
        console.log('📊 Performance:', {
          cached: data.cached,
          cacheType: data.cacheType,
          clientLatency: Math.round(clientLatency) + 'ms'
        });
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch');
      console.error('❌ Error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🎵 Music Recommendation Test
          </h1>
          <p className="text-purple-200 text-sm">
            Test the music recommendation API with sample voting data
          </p>
        </div>

        {/* Test Button */}
        <button
          onClick={testMusicAPI}
          disabled={loading}
          className="w-full mb-8 px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg hover:shadow-xl"
        >
          {loading ? '⏳ טוען המלצת מוזיקה...' : '🎵 Test Music API'}
        </button>

        {/* Instructions */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 text-white">
          <h3 className="font-bold mb-3 text-lg">📋 Test Instructions:</h3>
          <ol className="text-sm space-y-2 list-decimal list-inside">
            <li>Click the button above to generate a music recommendation</li>
            <li>First request: Should take 2-5 seconds (OpenAI generation)</li>
            <li>Click again: Should be &lt;100ms (database cache)</li>
            <li>Click a third time: Should be &lt;15ms (in-memory cache)</li>
            <li>Check browser console for detailed logs</li>
            <li>Check server terminal for backend logs</li>
          </ol>
        </div>

        {/* Performance Metrics */}
        {metadata && (
          <div className="bg-green-500/20 backdrop-blur-sm border-2 border-green-400 rounded-2xl p-6 mb-8 text-white">
            <h3 className="font-bold mb-3 text-lg flex items-center gap-2">
              📊 Performance Metrics
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-green-300">Client Latency:</span>
                <div className="font-bold text-xl">{metadata.clientLatency}ms</div>
              </div>
              <div>
                <span className="text-green-300">Cached:</span>
                <div className="font-bold text-xl">
                  {metadata.cached ? `✅ ${metadata.cacheType}` : '❌ Generated'}
                </div>
              </div>
              {metadata.tokensUsed && (
                <div>
                  <span className="text-green-300">Tokens Used:</span>
                  <div className="font-bold text-xl">{metadata.tokensUsed.total}</div>
                </div>
              )}
              {metadata.cost && (
                <div>
                  <span className="text-green-300">Cost:</span>
                  <div className="font-bold text-xl">${metadata.cost.total.toFixed(4)}</div>
                </div>
              )}
              {metadata.fallbackUsed !== undefined && (
                <div className="col-span-2">
                  <span className="text-green-300">Fallback Used:</span>
                  <div className="font-bold text-xl">
                    {metadata.fallbackUsed ? '⚠️ Yes (OpenAI failed)' : '✅ No (AI generated)'}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && <MusicRecommendationSkeleton />}

        {/* Error State */}
        {error && (
          <div className="bg-red-100 border-2 border-red-500 rounded-2xl p-6 text-red-700 mb-8">
            <h3 className="font-bold mb-2 text-lg">❌ Error:</h3>
            <p className="text-sm">{error}</p>
            <p className="text-xs mt-4 text-red-600">
              Check the server console for detailed error logs
            </p>
          </div>
        )}

        {/* Success State */}
        {music && <MusicRecommendationCard {...music} />}

        {/* Debug Info */}
        {music && (
          <details className="mt-8 bg-white/10 backdrop-blur-sm rounded-2xl p-6 text-white">
            <summary className="cursor-pointer font-bold mb-4">
              🔍 Debug Info (Click to expand)
            </summary>
            <pre className="text-xs overflow-auto bg-black/30 p-4 rounded-lg">
              {JSON.stringify({ music, metadata }, null, 2)}
            </pre>
          </details>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-purple-200 text-sm">
          <p>
            Built with GPT-5 mini • Cached with multi-tier strategy • Israeli music knowledge base
          </p>
        </div>
      </div>
    </div>
  );
}

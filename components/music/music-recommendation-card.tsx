'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { ExternalLink, Music } from 'lucide-react';
import { musicRecommendation as strings } from '@/lib/strings/he';
import { useState } from 'react';

interface MusicRecommendationCardProps {
  songTitle: string;
  artistName: string;
  spotifyLink: string;
  appleMusicLink: string;
  thumbnailUrl: string;
  reasoning: string;
  fallbackUsed?: boolean;
}

export function MusicRecommendationCard({
  songTitle,
  artistName,
  spotifyLink,
  appleMusicLink,
  thumbnailUrl,
}: MusicRecommendationCardProps) {
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
      className="bg-white rounded-2xl shadow-xl p-6 sm:p-8"
      dir="rtl"
    >
      {/* Header */}
      <p className="text-sm text-gray-600 mb-4">{strings.sectionSubtitle}</p>

      {/* Music Content */}
      <div className="flex gap-4 items-start">
        {/* Album Art */}
        <div className="relative flex-shrink-0">
          {!imageError ? (
            <Image
              src={thumbnailUrl}
              alt={`${songTitle} - ${artistName}`}
              width={100}
              height={100}
              className="rounded-lg shadow-md"
              onError={() => setImageError(true)}
              priority={false}
              loading="lazy"
            />
          ) : (
            <div className="w-[100px] h-[100px] rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <Music className="w-12 h-12 text-white" />
            </div>
          )}
        </div>

        {/* Song Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-lg font-bold text-gray-900 truncate">{songTitle}</h4>
          <p className="text-sm text-gray-600 mb-2">
            {strings.songBy} {artistName}
          </p>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <a
              href={spotifyLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1DB954] text-white rounded-lg font-medium hover:bg-[#1ed760] transition-colors text-xs"
            >
              <span>{strings.listenOnSpotify}</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={appleMusicLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#FA57C1] to-[#FB5C74] text-white rounded-lg font-medium hover:opacity-90 transition-opacity text-xs"
            >
              <span>{strings.listenOnAppleMusic}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * Spotify API Service
 *
 * Provides search functionality to find real Spotify track URLs and album artwork
 * Uses Client Credentials Flow (server-to-server authentication)
 */

interface SpotifyToken {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface SpotifyTrackResult {
  spotifyLink: string;
  appleMusicSearchUrl: string; // Fallback to search URL
  thumbnailUrl: string;
  albumName: string;
  releaseDate: string;
}

interface SpotifyImage {
  url: string;
  height: number;
  width: number;
}

interface SpotifyArtist {
  name: string;
  id: string;
}

interface SpotifyAlbum {
  name: string;
  images: SpotifyImage[];
  release_date: string;
}

interface SpotifyTrack {
  name: string;
  external_urls: {
    spotify: string;
  };
  album: SpotifyAlbum;
  artists: SpotifyArtist[];
}

interface SpotifySearchResponse {
  tracks: {
    items: SpotifyTrack[];
  };
}

// Token cache (in-memory, valid for 1 hour)
let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Get Spotify access token using Client Credentials Flow
 * Caches token for reuse (valid for 1 hour)
 */
async function getSpotifyToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    console.log('[Spotify] Using cached access token');
    return cachedToken.token;
  }

  console.log('[Spotify] Fetching new access token...');

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured. Add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to .env.local');
  }

  // Encode credentials as base64
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Spotify token request failed: ${response.status} - ${error}`);
  }

  const data: SpotifyToken = await response.json();

  // Cache token (expires in 1 hour, cache for 55 minutes to be safe)
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (55 * 60 * 1000), // 55 minutes
  };

  console.log('[Spotify] ✅ Access token obtained, valid for 55 minutes');
  return data.access_token;
}

/**
 * Search for a track on Spotify and return real URLs
 *
 * @param songTitle - Song title (Hebrew or English)
 * @param artistName - Artist name (Hebrew or English)
 * @returns Track data with real Spotify URLs and album art
 */
export async function searchSpotifyTrack(
  songTitle: string,
  artistName: string
): Promise<SpotifyTrackResult | null> {
  try {
    const token = await getSpotifyToken();

    console.log(`[Spotify] Searching for: "${songTitle}" by ${artistName}`);

    // Try multiple search strategies for better Hebrew song matching
    const searchStrategies = [
      // Strategy 1: Track and artist (most specific)
      `track:${songTitle} artist:${artistName}`,
      // Strategy 2: Just combined search (more flexible)
      `${songTitle} ${artistName}`,
      // Strategy 3: Artist only (fallback to get any track by this artist)
      `artist:${artistName}`,
    ];

    let data: SpotifySearchResponse | null = null;
    let strategyUsed = 0;

    for (let i = 0; i < searchStrategies.length; i++) {
      const query = encodeURIComponent(searchStrategies[i]);

      const response = await fetch(
        `https://api.spotify.com/v1/search?q=${query}&type=track&market=IL&limit=5`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`[Spotify] Search strategy ${i + 1} failed: ${response.status}`);
        continue;
      }

      data = await response.json();

      if (data?.tracks?.items?.length && data.tracks.items.length > 0) {
        strategyUsed = i + 1;
        console.log(`[Spotify] Found results using strategy ${strategyUsed}`);
        break;
      }
    }

    if (!data?.tracks?.items?.length) {
      console.warn(`[Spotify] No results found after trying all strategies`);
      return null;
    }

    const track = data.tracks.items[0];

    // Get largest album image (usually 640x640)
    const albumImage = track.album.images[0]?.url || track.album.images[1]?.url;

    if (!albumImage) {
      console.warn('[Spotify] No album artwork found');
      return null;
    }

    // Create Apple Music search fallback URL
    const appleMusicQuery = encodeURIComponent(`${songTitle} ${artistName}`);
    const appleMusicSearchUrl = `https://music.apple.com/il/search?term=${appleMusicQuery}`;

    const result: SpotifyTrackResult = {
      spotifyLink: track.external_urls.spotify,
      appleMusicSearchUrl,
      thumbnailUrl: albumImage,
      albumName: track.album.name,
      releaseDate: track.album.release_date,
    };

    console.log('[Spotify] ✅ Found track:', {
      song: track.name,
      artist: track.artists[0]?.name,
      album: track.album.name,
      strategy: `Strategy ${strategyUsed}`,
      spotifyUrl: result.spotifyLink,
    });

    return result;
  } catch (error) {
    console.error('[Spotify] Search error:', error);
    return null;
  }
}

/**
 * Validate Spotify credentials are configured
 */
export function validateSpotifyConfig(): boolean {
  return !!(process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET);
}

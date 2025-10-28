# Spotify API Setup Guide

This guide explains how to set up Spotify API integration for the music recommendation feature.

## Why Spotify Integration?

Without Spotify API, the AI generates **placeholder URLs** that don't work. With Spotify integration, you get:
- ✅ **Real, working Spotify track URLs**
- ✅ **Real album artwork from Spotify CDN**
- ✅ **Apple Music search fallback URLs**
- ✅ **Better user experience**

## Setup Steps (5-10 minutes)

### 1. Create a Spotify Developer Account

1. Go to https://developer.spotify.com/dashboard
2. Log in with your Spotify account (or create one if needed)
3. Accept the Terms of Service

### 2. Create an App

1. Click **"Create app"**
2. Fill in the form:
   - **App name**: `Pulse Music Recommendations` (or any name)
   - **App description**: `Music recommendations for Pulse polling platform`
   - **Website**: `http://localhost:3000` (or your production URL)
   - **Redirect URIs**: Leave empty (not needed for Client Credentials Flow)
   - **APIs used**: Check **Web API**
3. Click **"Save"**

### 3. Get Your Credentials

1. On your app's dashboard, you'll see:
   - **Client ID** (visible by default)
   - **Client Secret** (click "View client secret" to reveal)
2. Copy both values

### 4. Add to Environment Variables

Add these two lines to your `.env.local` file:

```bash
# Spotify API (for music recommendations)
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

Replace `your_client_id_here` and `your_client_secret_here` with the actual values from step 3.

### 5. Restart Dev Server

```bash
# Stop the current dev server (Ctrl+C)
npm run dev
```

## Testing

1. Clear the music cache:
   ```bash
   npx tsx scripts/clear-music-cache.ts
   ```

2. Test at http://localhost:3000/test-music

3. Check the server logs for:
   ```
   [Spotify] Searching for: "SONG_NAME" by ARTIST_NAME
   [Spotify] ✅ Found track: {...}
   [MusicAPI] ✅ Spotify enrichment: XXms
   [MusicAPI] Real URLs obtained: {...}
   ```

## How It Works

1. **AI generates recommendation**: Song title + artist name
2. **Spotify search**: Searches for the exact track on Spotify
3. **URL enrichment**: Replaces placeholder URLs with real ones:
   - Spotify track URL (e.g., `https://open.spotify.com/track/abc123`)
   - Album artwork URL from Spotify CDN (640x640px)
   - Apple Music search URL (fallback to search page)
4. **Cache & serve**: Real URLs are cached for future requests

## Rate Limits

Spotify's rate limits are generous for this use case:
- **Token caching**: Access token valid for 1 hour (we cache for 55 minutes)
- **Search requests**: Limited but sufficient for typical usage
- **No user authentication required**: Using Client Credentials Flow (server-to-server)

## Fallback Behavior

If Spotify API fails or is not configured:
- ✅ Feature still works (uses AI-generated URLs)
- ⚠️ Links may not work (placeholder URLs)
- ⚠️ Album art may not load (placeholder images)

The system gracefully degrades without Spotify credentials.

## Security Notes

- ✅ **Client Secret is safe**: Only used server-side, never exposed to browser
- ✅ **No user data access**: Client Credentials Flow doesn't access user data
- ✅ **Token caching**: Minimizes API calls and improves performance

## Production Deployment

1. Add the same environment variables to your production environment (Vercel, etc.)
2. Update the **Website** field in your Spotify app dashboard to your production URL
3. Test in production to ensure credentials work

## Troubleshooting

**"Spotify credentials not configured"**
→ Check that both `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET` are in `.env.local`

**"Spotify token request failed: 401"**
→ Check that your Client ID and Secret are correct

**"No results found"**
→ The AI's song/artist name might not match Spotify's database exactly (this is rare for Israeli music)

**Token keeps refreshing**
→ This is normal - token expires after 1 hour and gets automatically refreshed

## Cost

Spotify API is **completely free** for this use case:
- No payment method required
- No rate limit charges
- Unlimited API calls (within reasonable limits)

---

**Setup time**: 5-10 minutes
**Maintenance**: None (automatic token refresh)
**Benefits**: Much better UX with real, working links

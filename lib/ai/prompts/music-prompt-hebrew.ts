/**
 * Hebrew Music Recommendation Prompt for GPT-5 Mini
 *
 * Comprehensive Israeli music knowledge base with demographics-aware recommendations
 * This file is designed to be easily editable for testing and iteration
 */

import type { MusicRecommendationRequest, MusicRecommendation } from "@/lib/types/music-recommendation";
import { z } from "zod";

/**
 * System prompt - instructs AI on Israeli music landscape and matching strategy
 * CONFIGURABLE: Edit this prompt to improve recommendations
 */
export const MUSIC_SYSTEM_PROMPT = `You are an expert in Israeli music across all generations, communities, and genres.
Your task: Recommend ONE Israeli song that deeply matches the user's personality, demographics, and voting patterns.

CRITICAL REQUIREMENTS:
1. Song MUST be a REAL, EXISTING song that actually exists - NO made-up or fictional songs
2. Song MUST be Israeli (Hebrew/Arabic/Russian by Israeli artists)
3. Song MUST be available on both Spotify and Apple Music
4. ONLY recommend songs you are CERTAIN exist - if unsure, choose a well-known classic instead
5. Song title and artist name must match exactly as they appear on streaming platforms
6. Provide REAL, VALID Spotify URLs (format: https://open.spotify.com/track/[TRACK_ID])
7. Consider user's AGE GROUP and ETHNICITY for culturally relevant recommendations
8. Match both VOTING CONTENT (what they care about) and PATTERN (how they engage)
9. Reasoning in Hebrew: EXACTLY 2-3 SHORT sentences (MAX 350 characters total). Be concise and direct.

Output format: JSON with exact structure (songTitle, artistName, spotifyLink, appleMusicLink, thumbnailUrl, reasoning)

===== ISRAELI MUSIC LANDSCAPE BY DEMOGRAPHICS =====

AGE-APPROPRIATE ARTISTS & GENRES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18-24 (Gen Z):
  • פופ חדש: עומר אדם, נועה קירל, סטטיק ובן אל, איתי לוי, אדן בן זקן
  • ראפ/היפ-הופ: נסרין קדרי, שגב, רותם כהן, נתי, קרני
  • אלקטרוני: Vini Vici, Infected Mushroom, Astrix
  • מזרחי מודרני: ישי ריבו, עדן חסון, אייל גולן הצעיר

25-34 (Millennials):
  • רוק/אלטרנטיבי: הדג נחש, משינה, בארי סחרוף, קרן פלס
  • פופ בוגר: אסף אבידן, עידן רייכל, עומר אדם
  • מזרחי: אייל גולן, סטטיק ובן אל, עדן חסון
  • שירי זמר מודרניים: אסף אמדורסקי, יובל דיין

35-44 (Gen X):
  • קלאסיקות ישראליות: שלמה ארצי, אריק איינשטיין, יהודה פוליקר
  • רוק ישראלי: ברי סחרוף, משינה, טיפקס
  • שירי זמר: מאיר אריאל, רמי קלינשטיין, אלון אולארצ'יק
  • מזרחי קלאסי: זוהר ארגוב, אייל גולן

45-54:
  • זמרים ותיקים: שלום חנוך, יהודית רביץ, צביקה פיק, חווה אלברשטיין
  • קלאסיקות: אריק איינשטיין, שלמה ארצי, מאיר אריאל
  • מזרחי מסורתי: זוהר ארגוב, אופיר בן שטרית, משה פרץ

55+ (Boomers+):
  • זמרי הזהב: אריק איינשטיין, שלום חנוך, חווה אלברשטיין
  • ליד המדורה: יהורם גאון, גידי גוב, שלמה גרוניך
  • קלאסיקות נצח: יפה ירקוני, שושנה דמארי, עופרה חזה

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ETHNICITY & COMMUNITY-RELEVANT ARTISTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
יהודי חילוני (Secular Jewish):
  • רוק/פופ/אלטרנטיבי: הדג נחש, משינה, ברי סחרוף, אסף אמדורסקי
  • שירי זמר: מאיר אריאל, אריק איינשטיין, שלמה ארצי
  • אקטיביזם חברתי: שלום חנוך, יהודה פוליקר

יהודי דתי/מסורתי (Religious/Traditional):
  • זמרי דת ומסורת: עידן רייכל, ישי ריבו, יענקי רוזן, איתי לוי
  • שירים עם משמעות רוחנית: אלון דה לוקו, עדן בן זקן
  • שירים מסורתיים מודרניים: אביהו מדינה, דודו אהרון

יהודי מזרחי/ספרדי (Mizrahi/Sephardic):
  • מזרחי קלאסי: זוהר ארגוב, אופיר בן שטרית, עופר לוי
  • מזרחי מודרני: עומר אדם, סטטיק ובן אל, אייל גולן, עדן חסון
  • מזרחי-פופ פיוז'ן: נסרין קדרי, אנה זק

ערבי (Arabic):
  • זמרים ערבים-ישראליים: נסרין קדרי, מירה עוואד, ווראד דכי
  • אימאן חמד, נתאי אזולאי, אופיר בן שטרית (שירים בערבית)
  • שירי דו-קיום: עידן רייכל פרויקט, אייל גולן + נסרין קדרי

אתיופי (Ethiopian):
  • אומנים אתיופים-ישראליים: אסתר רדה, אתי אנקרי, Teddy Neguse
  • פיוז'ן אתיופי-ישראלי: עידן רייכל (עם זמרים אתיופים)

רוסי (Russian):
  • זמרים רוסים-ישראליים: גבריאלה, אלכסנדר ריבק, יוליה בוריסוב
  • פופ רוסי-ישראלי: קסניה

דרוזי/צ'רקסי (Druze/Circassian):
  • אמנים עם קרוס-קולטורל אפיל: עידן רייכל, אופיר בן שטרית
  • שירי שלום ודו-קיום

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PERSONALITY-TO-GENRE MAPPING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
High Agreement (60%+ agree votes):
  Style: Uplifting, hopeful, optimistic
  Genres: פופ אופטימי, שירי אהבה, התחלות חדשות
  Examples:
    • "תן לי סימן" - עומר אדם (young, hopeful)
    • "בואי" - עידן רייכל (mature, hopeful)
    • "כל הכבוד" - שלמה ארצי (experienced, supportive)

High Disagreement (60%+ disagree votes):
  Style: Critical, rebellious, questioning authority
  Genres: רוק מחאה, היפ-הופ ביקורתי, שירי חברה
  Examples:
    • "לב של זהב" - הדג נחש (young, rebellious)
    • "שיר המחאה" - שלום חנוך (classic protest)
    • "עיר של שלום" - דוד ברוזה (critical of Jerusalem politics)

High Unsure (40%+ unsure/pass votes):
  Style: Thoughtful, contemplative, complex
  Genres: שירי זמר מעמיקים, אלטרנטיבי, ליריקה מורכבת
  Examples:
    • "מכתב" - אסף אמדורסקי (introspective)
    • "צלצולי פעמונים" - מאיר אריאל (philosophical)
    • "פתאום באה האהבה" - מאיר אריאל (contemplative)

Balanced Voting (even distribution):
  Style: Nuanced, layered, multi-faceted
  Genres: שילוב ז'אנרים, מלודיות מורכבות, שירים עם עומק
  Examples:
    • "שאריות של החיים" - משינה (complexity)
    • "בואי" - עידן רייכל (cultural fusion)
    • "מה שהיה היה" - אביב גפן (philosophical balance)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TOPIC-TO-THEME MATCHING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
If poll/statements are about:
  • Housing/Cost of Living: "דירה להשכיר" (הדג נחש), "תל אביב" (ברי סחרוף)
  • Transportation/Traffic: "נסיעה לירושלים" (יהודה פוליקר), "כביש אחד" (אביב גפן)
  • Education: "למדו ללמוד" (מאיר אריאל), "ילדים של החורף" (עברי לידר)
  • Environment/Nature: "ים של דמעות" (יהודה פוליקר), "ארץ טרופית יפה" (ברי סחרוף)
  • Peace/Security: "שיר לשלום" (מירי אלוני), "עיר של שלום" (דוד ברוזה)
  • Social Justice: "רוצה לחיות" (שלום חנוח), "עוד לא אהבתי מספיק" (הדג נחש)
  • Immigration: "שירת הסטיקר" (שלמה ארצי), "אני רק תורכי" (אברה הדאיה)
  • Gender/Equality: "אני ואתה" (אריק איינשטיין), "גבר" - אסתי גינזבורג
  • Religion/Tradition: "אהבת חינם" (ישי ריבו), "לכה דודי" (עידן רייכל)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

CROSS-CULTURAL CONSIDERATIONS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Religious users (דתי/חרדי): Avoid overtly romantic/sexual songs, prefer spiritual/meaningful content
• Arabic speakers: Prioritize Arabic-Israeli artists or bilingual songs
• Russian immigrants: Consider Russian-Israeli fusion artists for relatability
• Ethiopian community: Artists with Ethiopian-Israeli heritage create strong connection
• Young Gen Z: Prefer modern production, streaming-popular tracks
• Older generations: Classic songs carry nostalgic emotional weight

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

MATCHING ALGORITHM (PRIORITY ORDER):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. VOTING CONTENT: What topics did they agree/disagree with? Match song theme to topics.
2. VOTING PATTERN: Are they decisive, cautious, balanced? Match emotional tone.
3. AGE GROUP: Select artist/era that resonates with their generation.
4. ETHNICITY: Ensure cultural relevance - song should feel "for them".
5. EMOTIONAL TONE: Optimistic, critical, contemplative, or balanced?
6. LYRICAL THEMES: Must align with their values shown in voting.

Final check: Does this song's LYRICS + THEME + STYLE all connect to their profile?

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REASONING FORMAT (Hebrew, 2-3 sentences):
"השיר [song title] של [artist] מתאים לך כי [connection to voting pattern/topics].
[How demographics (age/ethnicity) influenced this choice].
[Why this song's message/style resonates with their civic personality]."

Example reasoning:
"השיר 'שאריות של החיים' של משינה מתאים לך כי ההצבעות שלך מראות נכונות לראות את המורכבות בנושאים חברתיים.
כגבר בגיל 35-44 מהקהילה היהודית החילונית, הרוק הישראלי הקלאסי הזה מדבר ישירות אל הזיכרון הקולקטיבי שלך.
המסר על חיפוש משמעות בתוך הכאוס היומיומי משקף את הגישה המאוזנת שלך לשיח הציבורי."

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ CRITICAL: WHAT NOT TO DO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ DO NOT create fictional song titles
❌ DO NOT combine real artists with made-up songs
❌ DO NOT guess at song names - use exact titles only
❌ DO NOT use placeholder URLs or make up Spotify links
❌ DO NOT recommend obscure songs you're unsure about

✅ DO use well-known, verifiable Israeli songs
✅ DO stick to artists and songs explicitly listed in this prompt when unsure
✅ DO verify song names match exactly as they appear on Spotify
✅ DO choose popular/classic songs when demographics match multiple options

If you're uncertain about ANY song's existence, choose from these VERIFIED classics instead:
• "שאריות של החיים" - משינה (universal, contemplative)
• "כל הכבוד" - שלמה ארצי (optimistic, supportive)
• "לב של זהב" - הדג נחש (critical, rebellious)
• "בואי" - עידן רייכל (hopeful, multicultural)
• "תן לי סימן" - עומר אדם (young, hopeful)
• "שיר לשלום" - מירי אלוני (peace, unity)
• "צלצולי פעמונים" - מאיר אריאל (philosophical, thoughtful)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

IMPORTANT NOTES:
• ALWAYS provide real, working Spotify and Apple Music URLs
• For thumbnail URLs, use Spotify album art URLs (format: https://i.scdn.co/image/...)
• Songs must be actually available on both platforms
• Reasoning must be in Hebrew and connect demographics + voting patterns + song meaning
• When in doubt, prioritize song accuracy over perfect demographic matching`;

/**
 * Generate enhanced user prompt with full voting data
 * CONFIGURABLE: Edit this function to change how data is presented to AI
 */
export function generateMusicPrompt(request: MusicRecommendationRequest): string {
  const {
    pollQuestion,
    pollDescription,
    statements,
    voteStatistics,
    demographics,
    insightTitle,
    insightBody
  } = request;

  // Build statements list with votes (like insight generation)
  const statementsList = statements
    .map((s, idx) => {
      const voteEmoji = s.vote === 1 ? "✓" : s.vote === -1 ? "✗" : "?";
      const voteLabel = s.vote === 1 ? "הסכמה" : s.vote === -1 ? "אי הסכמה" : "לא בטוח";
      return `${idx + 1}. ${voteEmoji} "${s.text}" → ${voteLabel}`;
    })
    .join("\n");

  // Build demographics context
  let demographicsContext = "";
  if (demographics && (demographics.gender || demographics.ageGroup || demographics.ethnicity)) {
    const parts = [];
    if (demographics.gender) parts.push(`• מגדר: ${demographics.gender}`);
    if (demographics.ageGroup) parts.push(`• קבוצת גיל: ${demographics.ageGroup}`);
    if (demographics.ethnicity) parts.push(`• מוצא: ${demographics.ethnicity}`);

    demographicsContext = `\n\nפרופיל דמוגרפי:\n${parts.join("\n")}`;
  }

  // Include insight for deeper context (optional but powerful)
  let insightContext = "";
  if (insightTitle && insightBody) {
    insightContext = `\n\nהתובנה האישית שלהם (ארכיטיפ אזרחי):
${insightTitle}
${insightBody}`;
  }

  // Build comprehensive prompt
  const prompt = `═══════════════════════════════════════════════════════════════
שאלת הדיון: "${pollQuestion}"
${pollDescription ? `תיאור: ${pollDescription}\n` : ""}═══════════════════════════════════════════════════════════════

📊 סטטיסטיקות הצבעה:
• הסכמה: ${voteStatistics.agreeCount}/${voteStatistics.total} (${voteStatistics.agreePercent}%)
• אי הסכמה: ${voteStatistics.disagreeCount}/${voteStatistics.total} (${voteStatistics.disagreePercent}%)
• לא בטוח/דילוג: ${voteStatistics.unsureCount}/${voteStatistics.total} (${voteStatistics.unsurePercent}%)

📝 ההצבעות המלאות שלהם (${statements.length} עמדות):
${statementsList}
${demographicsContext}
${insightContext}

═══════════════════════════════════════════════════════════════

🎵 המשימה שלך:
על בסיס התוכן שהם הצביעו עליו (לא רק האחוזים!), דפוס ההצבעה, והפרופיל הדמוגרפי -
המלץ על שיר ישראלי אחד שיתחבר אליהם ברמה עמוקה.

⚠️ דרישות קריטיות:
1. **בחר רק שירים שאתה בטוח ב-100% שקיימים** - אל תמציא או תנחש שמות שירים!
2. **השתמש בשירים המפורטים בפרומפט הזה או בקלאסיקות ישראליות מוכרות**
3. **ודא ששם השיר והאמן זהים בדיוק לשמות שמופיעים ב-Spotify**
4. התחשב בגיל ובמוצא לבחירת שירים רלוונטיים תרבותית
5. נתח את התוכן של העמדות - על מה הם מסכימים/לא מסכימים? (לא רק אחוזים!)
6. התאם את נושא השיר לנושאים שחשובים להם בדיון
7. ודא שהקישורים תקינים ופעילים (Spotify + Apple Music בפורמט הנכון)
8. תמונת כריכה איכותית מ-Spotify
9. הסבר בעברית למה השיר מתאים (2-3 משפטים שמקשרים דמוגרפיה + דפוס הצבעה + מסר השיר)

⚠️ חשוב: אם יש לך ספק לגבי קיום השיר - בחר שיר קלאסי מהרשימה המאומתת!`;

  return prompt;
}

/**
 * Zod schema for response validation
 */
export const MusicRecommendationSchema = z.object({
  songTitle: z.string().min(1).describe("Song title in Hebrew/English"),
  artistName: z.string().min(1).describe("Artist name in Hebrew/English"),
  spotifyLink: z.string().url().describe("Full Spotify track URL (https://open.spotify.com/track/...)"),
  appleMusicLink: z.string().url().describe("Full Apple Music track URL (https://music.apple.com/...)"),
  thumbnailUrl: z.string().url().describe("Album cover image URL (square, 300x300+)"),
  reasoning: z.string().min(20).max(400).describe("Hebrew explanation (2-3 sentences)")
});

export type MusicRecommendationType = z.infer<typeof MusicRecommendationSchema>;

/**
 * Enhanced fallback with demographic awareness
 * CONFIGURABLE: Edit fallback recommendations here
 */
export function getFallbackMusicRecommendation(
  voteStatistics: { agreePercent: number; disagreePercent: number; unsurePercent: number },
  demographics?: { gender?: string; ageGroup?: string; ethnicity?: string }
): MusicRecommendation {
  const { agreePercent, disagreePercent, unsurePercent } = voteStatistics;

  // Detect age group
  const ageGroup = demographics?.ageGroup || "";
  const isYoung = ageGroup.includes("18-24") || ageGroup.includes("25-34");
  const isOlder = ageGroup.includes("55") || ageGroup.includes("65");

  // Default: Universal Israeli song (Mashina - classic rock)
  let recommendation: MusicRecommendation = {
    songTitle: "שאריות של החיים",
    artistName: "משינה",
    spotifyLink: "https://open.spotify.com/track/7LVHVU3tWfcxj5aiPFEW4Q",
    appleMusicLink: "https://music.apple.com/il/album/%D7%A9%D7%90%D7%A8%D7%99%D7%95%D7%AA-%D7%A9%D7%9C-%D7%94%D7%97%D7%99%D7%99%D7%9D/1440935478",
    thumbnailUrl: "https://i.scdn.co/image/ab67616d0000b273d8a5a3e5f3b3e3c3c0c0c0c0",
    reasoning: "שיר ישראלי קלאסי שמדבר על המורכבות של החיים - מתאים לכל גיל ודפוס הצבעה. הרוק הישראלי של משינה הוא חלק מהזיכרון הקולקטיבי שלנו."
  };

  // Personality-driven selection with age awareness
  if (agreePercent >= 60) {
    // High agreement - optimistic songs
    recommendation = isYoung ? {
      songTitle: "כלום לא נשאר",
      artistName: "נועה קירל",
      spotifyLink: "https://open.spotify.com/track/placeholder",
      appleMusicLink: "https://music.apple.com/il/album/placeholder",
      thumbnailUrl: "https://i.scdn.co/image/placeholder",
      reasoning: "שיר אופטימי ומלא אנרגיה של נועה קירל שמשקף את נקודת המבט החיובית והפתוחה שלך לרעיונות חדשים. מתאים לדור שלך שמאמין בשינוי."
    } : isOlder ? {
      songTitle: "כל הכבוד",
      artistName: "שלמה ארצי",
      spotifyLink: "https://open.spotify.com/track/placeholder",
      appleMusicLink: "https://music.apple.com/il/album/placeholder",
      thumbnailUrl: "https://i.scdn.co/image/placeholder",
      reasoning: "השיר הקלאסי של שלמה ארצי 'כל הכבוד' משקף את הגישה התומכת והחיובית שלך. מתוך הניסיון של שנים, אתה יודע לראות את הטוב."
    } : {
      songTitle: "בואי",
      artistName: "עידן רייכל",
      spotifyLink: "https://open.spotify.com/track/placeholder",
      appleMusicLink: "https://music.apple.com/il/album/placeholder",
      thumbnailUrl: "https://i.scdn.co/image/placeholder",
      reasoning: "השיר 'בואי' של עידן רייכל משקף את הנכונות שלך לראות את הטוב ברעיונות ולבנות גשרים. הפיוז'ן התרבותי מתאים לגישה הפתוחה שלך."
    };
  } else if (disagreePercent >= 60) {
    // High disagreement - critical songs
    recommendation = {
      songTitle: "לב של זהב",
      artistName: "הדג נחש",
      spotifyLink: "https://open.spotify.com/track/placeholder",
      appleMusicLink: "https://music.apple.com/il/album/placeholder",
      thumbnailUrl: "https://i.scdn.co/image/placeholder",
      reasoning: "השיר הביקורתי והחברתי של הדג נחש משקף את המבט החד והחשיבה העצמאית שלך על נושאים ציבוריים. הרוק המחאתי מתאים לעמדה שלך."
    };
  } else if (unsurePercent >= 40) {
    // High unsure - thoughtful songs
    recommendation = isOlder ? {
      songTitle: "צלצולי פעמונים",
      artistName: "מאיר אריאל",
      spotifyLink: "https://open.spotify.com/track/placeholder",
      appleMusicLink: "https://music.apple.com/il/album/placeholder",
      thumbnailUrl: "https://i.scdn.co/image/placeholder",
      reasoning: "השיר המעמיק והפילוסופי של מאיר אריאל מתאים לחשיבה הזהירה והמורכבת שלך. שירי הזמר שלו מדברים אל אנשים שמעדיפים לחשוב לעומק."
    } : {
      songTitle: "מכתב",
      artistName: "אסף אמדורסקי",
      spotifyLink: "https://open.spotify.com/track/placeholder",
      appleMusicLink: "https://music.apple.com/il/album/placeholder",
      thumbnailUrl: "https://i.scdn.co/image/placeholder",
      reasoning: "השיר 'מכתב' של אסף אמדורסקי מתאים לגישה המתבוננת והמעמיקה שלך לנושאים מורכבים. הליריקה העשירה משקפת את הזהירות שלך."
    };
  }

  return recommendation;
}

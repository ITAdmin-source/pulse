/**
 * Hebrew Insight Prompt Templates for GPT-5 Mini
 *
 * Optimized prompts for generating personalized insights in Hebrew
 * Based on user voting patterns in polls
 */

import type { InsightGenerationRequest } from "@/lib/types/openai";

/**
 * System prompt - instructs AI on task and format
 * Uses English for instructions, outputs in Hebrew
 * Creates poetic "civic archetype" wisdom cards inspired by personality tests and horoscopes
 */
export const SYSTEM_PROMPT = `You are a creative storyteller who reveals civic archetypes based on voting patterns in polls.
Create a meaningful, poetic "wisdom card" that tells users something profound about their role in civic discourse.

Your task: Analyze BOTH the voting pattern (agree/disagree/unsure percentages) AND the actual content of statements they voted on.
The archetype name should reflect what topics they care about and how they engage, not just percentages.

Output format (strict):
[Emoji] [Hebrew Archetype Name - 1-3 words maximum, based on voting content and pattern]
[Hebrew paragraph: 40-50 words of poetic, metaphorical insight about their civic role]

Style Guidelines:
- Write in SECOND PERSON (אתה/את - "you"), NOT third person (הם/הן - "they")
- Write like a wisdom card or personality archetype reveal, not a vote summary
- Use metaphorical, archetypal language (e.g., "guardian," "bridge-builder," "questioner")
- Focus on the WHY behind their pattern and what it reveals about their worldview
- Use gender-specific Hebrew forms when gender is provided (אתה for male, את for female)
- If no gender provided, use gender-neutral forms (את/ה)
- Be poetic, warm, and meaningful - like reading a horoscope that resonates
- Never just restate what they voted on - they already know that
- Reveal their hidden civic identity and role in discourse

Example Archetypes (1-3 words):
- 🌉 בונה גשרים (Bridge Builder) - for balanced, nuanced voting
- 🔍 חוקר זהיר (Careful Investigator) - for high unsure votes with critical thinking
- ⚖️ שומר איזון (Balance Keeper) - for even distribution across positions
- 🌱 מהפכן מעשי (Practical Revolutionary) - for strong opinions with pragmatic choices
- 🛡️ שומר ערכים (Values Guardian) - for consistent ideological stance

Example body formats:
- Male (אתה): "אתה שואף לעיר נושמת... אתה זקוק לפתרונות... אתה בונה שיחה..."
- Female (את): "את שואפת לעיר נושמת... את זקוקה לפתרונות... את בונה שיחה..."
- Neutral (את/ה): "את/ה שואף/ת לעיר נושמת... את/ה זקוק/ה לפתרונות... את/ה בונה שיחה..."

Remember:
1. The archetype must come from analyzing WHAT they voted on (statement topics/content), not just percentages
2. ALWAYS use second person addressing the user directly, NEVER third person (הם/הן)
3. Match the gender form to the user's gender if provided`;

/**
 * Generate user prompt with voting data
 * @param data - Insight generation request data
 * @returns Formatted prompt string
 */
export function generateUserPrompt(data: InsightGenerationRequest): string {
  const { pollQuestion, pollDescription, statements, voteStatistics, demographics } = data;

  // Build statements list with votes
  const statementsList = statements
    .map((s, idx) => {
      const voteLabel = s.vote === 1 ? "הסכמה" : s.vote === -1 ? "אי הסכמה" : "לא בטוח";
      return `${idx + 1}. "${s.text}" - ${voteLabel}`;
    })
    .join("\n");

  // Determine gender instruction
  let genderInstruction = "Use gender-neutral Hebrew forms (את/ה).";
  if (demographics?.gender) {
    const gender = demographics.gender;
    console.log("[Prompt] Gender value received:", gender);

    // Check for male (both Hebrew and English)
    if (gender === "גבר" || gender === "זכר" || gender.toLowerCase() === "male") {
      genderInstruction = "User is MALE - use masculine Hebrew forms (אתה, שואף, זקוק, בונה, etc.).";
    }
    // Check for female (both Hebrew and English)
    else if (gender === "אישה" || gender === "נקבה" || gender.toLowerCase() === "female") {
      genderInstruction = "User is FEMALE - use feminine Hebrew forms (את, שואפת, זקוקה, בונה, etc.).";
    }
    // For "אחר" (other/non-binary) or any unrecognized value, use neutral
    else {
      genderInstruction = "Use gender-neutral Hebrew forms (את/ה, שואף/ת, זקוק/ה, בונה, etc.).";
    }

    console.log("[Prompt] Gender instruction:", genderInstruction);
  } else {
    console.log("[Prompt] No gender in demographics, using neutral forms");
  }

  // Build prompt emphasizing both content and patterns
  const prompt = `Poll Question: ${pollQuestion}
${pollDescription ? `Description: ${pollDescription}\n` : ""}
User's Voting Pattern Statistics:
- Agreed (הסכים): ${voteStatistics.agreeCount} statements (${voteStatistics.agreePercent}%)
- Disagreed (לא הסכים): ${voteStatistics.disagreeCount} statements (${voteStatistics.disagreePercent}%)
- Unsure (לא בטוח): ${voteStatistics.unsureCount} statements (${voteStatistics.unsurePercent}%)
- Total votes: ${voteStatistics.total}

Statements and Votes:
${statementsList}

IMPORTANT INSTRUCTIONS:
1. Analyze the CONTENT of statements they agreed/disagreed with, not just the percentages.
2. What themes emerge? What do their choices reveal about their values and worldview?
3. Create a civic archetype name that reflects both HOW they voted (pattern) and WHAT they voted on (content/topics).
4. GENDER: ${genderInstruction}

Generate a Hebrew wisdom card revealing their civic archetype and role in discourse.`;

  return prompt;
}

/**
 * Parse AI response to extract title and body
 * Expected format:
 * [Emoji] [Title]
 * [Body paragraph]
 *
 * @param response - Raw AI response text
 * @returns Parsed title (with emoji) and body
 */
export function parseInsightResponse(response: string): { title: string; body: string } {
  // Remove leading/trailing whitespace
  const cleaned = response.trim();

  // Split by newline
  const lines = cleaned.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("Empty response from AI");
  }

  // First line is the title (keep the emoji!)
  const title = lines[0].trim();

  // Rest is body
  const body = lines.slice(1).join("\n").trim();

  if (!body) {
    throw new Error("Missing body in AI response");
  }

  return { title, body };
}

/**
 * Fallback insight for errors
 * Returns a generic Hebrew wisdom card when AI generation fails
 * Matches the new civic archetype style
 */
export function getFallbackInsight(voteStatistics: {
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  agreePercent: number;
  disagreePercent: number;
  unsurePercent: number;
}): { title: string; body: string } {
  const { agreePercent, disagreePercent, unsurePercent } = voteStatistics;

  // Determine civic archetype based on voting pattern (1-3 words with emoji, second person)
  let title = "🗳️ קול ייחודי";
  let body = `את/ה נושא/ת קול ייחודי בשיח הציבורי. ההצבעות שלך משקפות נקודת מבט אישית ומורכבת, ותורמות לשיח דמוקרטי עשיר.`;

  if (agreePercent >= 60) {
    title = "🌱 מאמין בשינוי";
    body = `את/ה נושא/ת תקווה ותמיכה ברעיונות חדשים. הלב הפתוח שלך והרצון לראות את הטוב באפשרויות מניע את השיח קדימה.`;
  } else if (disagreePercent >= 60) {
    title = "🛡️ שומר ביקורתי";
    body = `את/ה נושא/ת מבט חד וביקורתי על הרעיונות המוצעים. היכולת שלך לזהות בעיות ואתגרים עוזרת לשפר את הדיון הציבורי.`;
  } else if (unsurePercent >= 40) {
    title = "💭 חושב מעמיק";
    body = `את/ה נושא/ת חשיבה מורכבת ושיקול דעת זהיר. הנכונות שלך להכיר בספקות מעידה על בגרות אינטלקטואלית ורצון להבין לעומק.`;
  } else {
    title = "⚖️ שומר איזון";
    body = `את/ה נושא/ת יכולת נדירה לראות נושאים ממגוון זוויות. החשיבה הרב-ממדית שלך תורמת לשיח ציבורי בריא ומאוזן.`;
  }

  return { title, body };
}

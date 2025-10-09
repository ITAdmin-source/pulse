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
 */
export const SYSTEM_PROMPT = `You are an AI that generates personalized insights based on user voting patterns in polls.
Provide interesting, engaging insights in Hebrew in about 100-150 words.
Format with a catchy headline and a paragraph. Be friendly, informative, and slightly playful.

Output format (strict):
🧩 [Hebrew Title - catchy and relevant to voting pattern]
[Hebrew paragraph analyzing voting patterns, making observations, and providing insights]

Important:
- Use proper Hebrew grammar and natural phrasing
- Be respectful and constructive
- Focus on patterns, not individual statements
- Make insights personal and specific
- Keep tone warm and encouraging`;

/**
 * Generate user prompt with voting data
 * @param data - Insight generation request data
 * @returns Formatted prompt string
 */
export function generateUserPrompt(data: InsightGenerationRequest): string {
  const { pollQuestion, pollDescription, statements, voteStatistics } = data;

  // Build statements list with votes
  const statementsList = statements
    .map((s, idx) => {
      const voteLabel = s.vote === 1 ? "הסכמה" : s.vote === -1 ? "אי הסכמה" : "לא בטוח";
      return `${idx + 1}. "${s.text}" - ${voteLabel}`;
    })
    .join("\n");

  // Build prompt
  const prompt = `Poll Question: ${pollQuestion}
${pollDescription ? `Description: ${pollDescription}\n` : ""}
User's Voting Pattern:
- Agreed (הסכים): ${voteStatistics.agreeCount} statements (${voteStatistics.agreePercent}%)
- Disagreed (לא הסכים): ${voteStatistics.disagreeCount} statements (${voteStatistics.disagreePercent}%)
- Unsure (לא בטוח): ${voteStatistics.unsureCount} statements (${voteStatistics.unsurePercent}%)
- Total votes: ${voteStatistics.total}

Statements voted on:
${statementsList}

Generate a personalized insight in Hebrew analyzing this user's voting pattern. Focus on their overall perspective, consistency, and what their votes reveal about their position on this topic.`;

  return prompt;
}

/**
 * Parse AI response to extract title and body
 * Expected format:
 * 🧩 [Title]
 * [Body paragraph]
 *
 * @param response - Raw AI response text
 * @returns Parsed title and body
 */
export function parseInsightResponse(response: string): { title: string; body: string } {
  // Remove leading/trailing whitespace
  const cleaned = response.trim();

  // Split by newline
  const lines = cleaned.split("\n").filter((line) => line.trim());

  if (lines.length === 0) {
    throw new Error("Empty response from AI");
  }

  // First line should be title (with or without emoji)
  let title = lines[0].trim();

  // Remove emoji if present at start
  title = title.replace(/^[🧩🌟🎯🤔⚖️👍🔍✨💡🎨📊🗳️]\s*/, "").trim();

  // Rest is body
  const body = lines.slice(1).join("\n").trim();

  if (!body) {
    throw new Error("Missing body in AI response");
  }

  return { title, body };
}

/**
 * Fallback insight for errors
 * Returns a generic Hebrew insight when AI generation fails
 */
export function getFallbackInsight(voteStatistics: {
  agreeCount: number;
  disagreeCount: number;
  unsureCount: number;
  agreePercent: number;
  disagreePercent: number;
  unsurePercent: number;
}): { title: string; body: string } {
  const { agreeCount, disagreeCount, unsureCount, agreePercent, disagreePercent, unsurePercent } = voteStatistics;

  // Determine dominant pattern
  let title = "תובנה אישית על דפוס ההצבעה שלך";
  let body = `הצבעת על מספר הצהרות בסקר זה. `;

  if (agreePercent >= 60) {
    title = "נוטה לתמוך ברעיונות שהוצגו";
    body += `הסכמת עם ${agreeCount} הצהרות (${agreePercent}%), מה שמצביע על נטייה לתמוך ברעיונות שהוצגו בסקר. `;
  } else if (disagreePercent >= 60) {
    title = "גישה ביקורתית לרעיונות שהוצגו";
    body += `לא הסכמת עם ${disagreeCount} הצהרות (${disagreePercent}%), מה שמצביע על גישה ביקורתית לרעיונות שהוצגו. `;
  } else if (unsurePercent >= 40) {
    title = "שיקול דעת מעמיק של הנושאים";
    body += `הבעת חוסר ודאות ב-${unsureCount} הצהרות (${unsurePercent}%), מה שמעיד על שיקול דעת מעמיק. `;
  } else {
    title = "גישה מאוזנת ומגוונת";
    body += `הצבעותיך מראות גישה מאוזנת: ${agreePercent}% הסכמה, ${disagreePercent}% אי הסכמה, ${unsurePercent}% חוסר ודאות. `;
  }

  body += `זוהי דעה אישית ומשקפת את הפרספקטיבה הייחודית שלך על הנושאים שהועלו.`;

  return { title, body };
}

/**
 * OpenAI API Types for Personal Insight Generation
 *
 * Type definitions for GPT-5 mini API integration
 */

export interface InsightGenerationRequest {
  userId: string;
  pollId: string;
  pollQuestion: string;
  pollDescription?: string | null;
  statements: Array<{
    text: string;
    vote: 1 | 0 | -1; // agree, unsure, disagree
  }>;
  voteStatistics: {
    agreeCount: number;
    disagreeCount: number;
    unsureCount: number;
    total: number;
    agreePercent: number;
    disagreePercent: number;
    unsurePercent: number;
  };
  demographics?: {
    ageGroup?: string;
    gender?: string;
    ethnicity?: string;
    politicalParty?: string;
  };
}

export interface InsightGenerationResponse {
  title: string;
  body: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  cost: {
    input: number;
    output: number;
    total: number;
  };
  latency: number; // milliseconds
}

export interface OpenAIError {
  error: {
    message: string;
    type: string;
    param?: string;
    code?: string;
  };
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
}


# **Personal Insights Generator - Implementation Guide**

## **Overview**

This document explains how to implement a personal insights feature that generates AI-powered personalized feedback based on user voting behavior in surveys/polls. The system collects user votes, formats them into a structured prompt, sends them to an AI service (Azure OpenAI in this case), and stores the generated insights for future reference.

---

## **Architecture Overview**

The personal insights system consists of four main layers:

1. **Frontend Hook Layer** - React hook that orchestrates the insight generation flow
2. **Edge Function Layer** - Serverless backend that calls the AI service
3. **Database Layer** - Stores user insights for retrieval
4. **UI Components** - Displays insights to users in various contexts

### **Data Flow**

```
User completes voting → Frontend Hook formats data → Edge Function calls AI → 
AI generates insights → Save to database → Display to user
```

---

## **1. Database Setup**

### **Required Table: `polis_user_insights`**

This table stores generated insights linked to users and polls.

```sql
CREATE TABLE polis_user_insights (
  insight_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  poll_id UUID NOT NULL,
  poll_title TEXT NOT NULL,
  poll_description TEXT,
  insight_content TEXT NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Index for faster queries
CREATE INDEX idx_user_insights_user_id ON polis_user_insights(user_id);
CREATE INDEX idx_user_insights_poll_id ON polis_user_insights(poll_id);
```

### **Database Function: `get_user_insights`**

This function retrieves all insights for a specific user with enriched poll data.

```sql
CREATE OR REPLACE FUNCTION get_user_insights(user_id_param UUID)
RETURNS TABLE(
  insight_id UUID,
  poll_id UUID,
  poll_title TEXT,
  poll_description TEXT,
  insight_content TEXT,
  generated_at TIMESTAMP WITH TIME ZONE,
  poll_slug TEXT,
  poll_status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ui.insight_id,
    ui.poll_id,
    ui.poll_title,
    ui.poll_description,
    ui.insight_content,
    ui.generated_at,
    p.slug as poll_slug,
    p.status::text as poll_status
  FROM polis_user_insights ui
  LEFT JOIN polis_polls p ON ui.poll_id = p.poll_id
  WHERE ui.user_id = user_id_param
  ORDER BY ui.generated_at DESC;
END;
$$;
```

### **Row Level Security (RLS)**

```sql
ALTER TABLE polis_user_insights ENABLE ROW LEVEL SECURITY;

-- Users can only view their own insights
CREATE POLICY "Users can view their own insights"
  ON polis_user_insights FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own insights
CREATE POLICY "Users can insert their own insights"
  ON polis_user_insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own insights
CREATE POLICY "Users can delete their own insights"
  ON polis_user_insights FOR DELETE
  USING (auth.uid() = user_id);
```

---

## **2. Edge Function Setup**

### **File: `supabase/functions/survey_insight/index.ts`**

This Deno-based edge function receives formatted survey data and calls Azure OpenAI to generate insights.

```typescript
import { serve } from 'https://deno.land/std/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200, 
      headers: corsHeaders 
    });
  }

  // Parse request body
  let body;
  try {
    body = await req.json();
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  const { prompt } = body;
  if (!prompt) {
    return new Response(JSON.stringify({ error: "Missing prompt" }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Get API key from environment
  const apiKey = Deno.env.get("AZURE_OPENAI_API_KEY");
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Missing Azure OpenAI API Key' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  // Azure OpenAI endpoint (adjust to your deployment)
  const azureEndpoint = "https://YOUR-RESOURCE.openai.azure.com/openai/deployments/YOUR-DEPLOYMENT/chat/completions?api-version=2024-08-01-preview";

  try {
    const response = await fetch(azureEndpoint, {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: `You are an AI that generates personalized insights based on user voting patterns in surveys. 
            Provide interesting, engaging insights in Hebrew (or your target language) in about 100 words.
            Format with a catchy headline and a paragraph. Be friendly, informative, and slightly playful.
            Example format:
            🧩 [Catchy Title]
            [Insightful paragraph about their voting patterns]`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`Azure OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content received from Azure OpenAI');
    }

    return new Response(JSON.stringify({ content }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error calling Azure OpenAI:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to generate insights'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
```

### **Environment Variables**

Add the following secret to your Supabase project:

```bash
AZURE_OPENAI_API_KEY=your-api-key-here
```

---

## **3. Frontend Data Access Layer**

### **File: `integrations/supabase/userInsights.ts`**

This module handles all database interactions for insights.

```typescript
import { supabase } from './client';

export interface UserInsight {
  insight_id: string;
  poll_id: string;
  poll_title: string;
  poll_description: string | null;
  insight_content: string;
  generated_at: string;
  poll_slug: string | null;
  poll_status: 'draft' | 'active' | 'closed';
}

// Fetch all insights for the current user
export async function getUserInsights(): Promise {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase.rpc('get_user_insights', {
    user_id_param: user.id
  });

  if (error) {
    console.error('Error fetching user insights:', error);
    throw error;
  }

  return data || [];
}

// Save a generated insight to the database
export async function saveUserInsight(
  pollId: string,
  pollTitle: string,
  pollDescription: string | null,
  insightContent: string
): Promise {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('polis_user_insights')
    .insert({
      user_id: user.id,
      poll_id: pollId,
      poll_title: pollTitle,
      poll_description: pollDescription,
      insight_content: insightContent
    });

  if (error) {
    console.error('Error saving user insight:', error);
    throw error;
  }
}

// Delete an insight
export async function deleteUserInsight(insightId: string): Promise {
  const { error } = await supabase
    .from('polis_user_insights')
    .delete()
    .eq('insight_id', insightId);

  if (error) {
    console.error('Error deleting user insight:', error);
    throw error;
  }
}
```

---

## **4. React Hook for Insight Generation**

### **File: `hooks/usePersonalInsights.ts`**

This hook manages the entire insight generation lifecycle.

```typescript
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { saveUserInsight } from '@/integrations/supabase/userInsights';
import { getUserVotes } from '@/integrations/supabase/votes';
import { fetchStatementsByPollId } from '@/integrations/supabase/statements';

interface Poll {
  poll_id: string;
  title: string;
  description: string | null;
}

interface UserVoteData {
  statement: string;
  vote: 'support' | 'oppose' | 'unsure';
  statement_id: string;
}

export const usePersonalInsights = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  // Format user voting data into a prompt for the AI
  const formatSurveyData = async (poll: Poll): Promise => {
    // Get user votes (returns Record)
    const userVotes = await getUserVotes(poll.poll_id);

    // Get all statements
    const statements = await fetchStatementsByPollId(poll.poll_id);

    // Filter only statements the user voted on
    const userVoteData: UserVoteData[] = statements
      .filter(statement => userVotes[statement.statement_id])
      .map(statement => ({
        statement: statement.content,
        vote: userVotes[statement.statement_id] as 'support' | 'oppose' | 'unsure',
        statement_id: statement.statement_id
      }));

    // Calculate statistics
    const userStats = {
      total_votes: userVoteData.length,
      support_count: userVoteData.filter(v => v.vote === 'support').length,
      oppose_count: userVoteData.filter(v => v.vote === 'oppose').length,
      unsure_count: userVoteData.filter(v => v.vote === 'unsure').length,
    };

    // Format for AI prompt (Hebrew example)
    return `Survey: ${poll.title}
Description: ${poll.description || ''}

User Votes (${userStats.total_votes} out of ${statements.length}):
Support: ${userStats.support_count}
Oppose: ${userStats.oppose_count}
Unsure: ${userStats.unsure_count}

Detailed Votes:
${userVoteData.map(vote => `Statement: "${vote.statement}"
Vote: ${vote.vote}
`).join('\n')}

Please provide personalized insights about the user's voting patterns.`;
  };

  const generateInsights = async (poll: Poll) => {
    setIsLoading(true);
    setError(null);
    setInsights(null);

    try {
      // Format user voting data
      const surveyResults = await formatSurveyData(poll);

      // Call the edge function
      const { data: result, error: functionError } = await supabase.functions.invoke('survey_insight', {
        body: { prompt: surveyResults }
      });

      if (functionError) {
        throw new Error(functionError.message || 'Error calling function');
      }

      if (result.error) {
        throw new Error(result.error);
      }

      const insightText = result.content;
      if (!insightText) {
        throw new Error('No content received from server');
      }

      setInsights(insightText);

      // Save to database (graceful failure - don't block UX if save fails)
      try {
        await saveUserInsight(
          poll.poll_id,
          poll.title,
          poll.description || null,
          insightText
        );
      } catch (saveError) {
        console.warn('Failed to save insight to database:', saveError);
      }

    } catch (err) {
      console.error('Error generating insights:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    insights,
    error,
    generateInsights,
    clearInsights: () => {
      setInsights(null);
      setError(null);
    }
  };
};
```

---

## **5. UI Integration Examples**

### **Example 1: Modal Display (After Completing a Poll)**

```typescript
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePersonalInsights } from '@/hooks/usePersonalInsights';
import { Loader2, Brain } from 'lucide-react';

export const CompletionDialog = ({ open, poll, onClose }) => {
  const { isLoading, insights, error, generateInsights } = usePersonalInsights();

  useEffect(() => {
    if (open) {
      generateInsights(poll);
    }
  }, [open, poll.poll_id]);

  return (

            Personal Insights

        {isLoading && (

            Generating insights...

        )}

        {error && (

            Error: {error}

        )}

        {insights && (

            {insights}

        )}

  );
};
```

### **Example 2: Dedicated Insights Collection Page**

```typescript
import { useEffect } from 'react';
import { getUserInsights } from '@/integrations/supabase/userInsights';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export const InsightsCollectionPage = () => {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const data = await getUserInsights();
        setInsights(data);
      } catch (error) {
        console.error('Error fetching insights:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
  }, []);

  if (loading) return Loading...;

  return (

      {insights.map((insight) => (

            {insight.poll_title}

            {insight.insight_content}

              {new Date(insight.generated_at).toLocaleDateString()}

      ))}

  );
};
```

---

## **6. Key Implementation Considerations**

### **Authentication Requirements**
- Insights are tied to authenticated users via `user_id`
- For guest users, you can either:
  - Disable insights (show registration prompt)
  - Generate insights but don't save them
  - Link to `session_id` instead of `user_id` (requires schema modification)

### **AI Model Selection**
The implementation uses Azure OpenAI, but you can substitute with:
- **OpenAI API** - Replace endpoint and authentication
- **Anthropic Claude** - Different API structure
- **Google Gemini** - Via Lovable AI Gateway (recommended for Lovable projects)
- **Local models** - Using Ollama or similar

### **Cost Management**
- Each insight generation costs ~500-1000 tokens
- Consider rate limiting (e.g., 1 insight per poll per user)
- Cache insights to avoid regeneration
- Set `temperature: 0` for consistent outputs

### **Privacy & Security**
- User votes are sent to AI service - ensure compliance with privacy policies
- Don't include personally identifiable information in prompts
- RLS policies ensure users only see their own insights
- Edge function uses `SECURITY DEFINER` - be cautious with permissions

### **Error Handling**
- Gracefully handle AI service failures
- Don't block user flow if insight generation fails
- Provide retry mechanisms
- Log errors for monitoring

---

## **7. Testing Checklist**

- [ ] Database table and RLS policies created
- [ ] Edge function deployed and accessible
- [ ] API key configured in Supabase secrets
- [ ] Hook successfully formats survey data
- [ ] Edge function calls AI service correctly
- [ ] Insights saved to database
- [ ] Insights retrieved and displayed
- [ ] Error states handled gracefully
- [ ] Works for both authenticated and guest users (if supported)
- [ ] UI components render insights correctly

---

## **8. Future Enhancements**

1. **Insight History** - Allow users to view past insights over time
2. **Comparison** - Compare insights across different polls
3. **Sharing** - Allow users to share insights (with privacy controls)
4. **Personalization** - Adjust AI tone based on user preferences
5. **Multi-language** - Auto-detect user language for insights
6. **Rich Media** - Generate charts/visualizations alongside text
7. **Notifications** - Alert users when new insights are generated

---

This implementation provides a complete, production-ready personal insights system that can be adapted to various survey/polling applications.
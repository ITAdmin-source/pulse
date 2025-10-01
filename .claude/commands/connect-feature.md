# Connect Feature

Connect backend DB to frontend UI for a specific feature

## Usage

```
claude connect-feature "feature name"
```

## Prompt

I need to connect the backend to the frontend for: $ARGUMENTS

CONTEXT:
- See CLAUDE.md for the full tech stack details
- Frontend currently uses mock data
- Backend with database and business logic exists but is not connected to frontend

GOAL:
Connect the specified part of the app ($ARGUMENTS) so it uses real API calls instead of mock data.

CRITICAL: DB-FIRST APPROACH
- The database structure is the source of truth
- Start analysis from the DB schema, not the mock data
- If there are conflicts between DB structure and UI expectations, ASK ME before making changes
- Default assumption: adapt the UI to match the DB, not vice versa
- Only modify the DB if I explicitly approve it

REQUIREMENTS:
1. Analyze the DB schema/models related to $ARGUMENTS to understand the real data structure
2. Compare DB structure with what the frontend mock data expects
3. **If conflicts exist, STOP and ASK ME which is correct before proceeding**
4. Create/verify backend API endpoints that serve data from the DB
5. Set up or update the API client/service layer in the frontend
6. Adapt frontend components to work with the real DB structure (update mock data format, UI fields, etc.)
7. Add proper error handling and loading states
8. Ensure environment configuration for API URLs (dev/prod)
9. Test that the feature works with real data

APPROACH:
1. **First:** Examine the DB schema/models for $ARGUMENTS
2. **Second:** Identify what mock data and UI components currently expect
3. **Third:** Highlight any mismatches and ASK ME for clarification
4. **Fourth:** Create backend endpoints based on DB structure
5. **Fifth:** Update frontend to match DB structure
6. **Sixth:** Test the integration manually
7. **Finally:** Verify the feature works end-to-end

Please create a plan first, then execute it step by step.
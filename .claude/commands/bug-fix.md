# bug-fix

Analyze, investigate, and fix a specific bug with comprehensive workflow and documentation checks.

## Usage

```
/bug-fix <bug description>
```

## Instructions

You are tasked with analyzing, investigating, and fixing a bug. Follow this systematic approach:

### 1. Bug Analysis

- Read the bug description from &ARGUMENTS
- Identify the affected area (UI/UX, data flow, business logic, database, etc.)
- Search the codebase for relevant files and code sections
- Understand the current behavior vs. expected behavior

### 2. Workflow & Specification Check

If the bug involves user workflows, UI/UX, or user interactions:

- Analyze @USE_CASES.md for relevant user journeys and workflows
- Analyze @UX_UI_SPEC.md for relevant UI/UX specifications
- **These files are the source of truth** for intended behavior

If you find conflicts between the specification files and the actual code implementation:

- **STOP and ask the user:** "I found a conflict between the specification and the code implementation:
  - Specification says: [describe what specs say]
  - Code currently does: [describe what code does]

  Which is correct? Should I:
  A) Update the code to match the specification
  B) Update the specification to match the current code behavior
  C) Neither - there's a different intended behavior (please describe)"

- **Wait for user clarification** before proceeding
- After clarification, update the appropriate files (code or documentation) to resolve the conflict

### 3. Root Cause Analysis

- Identify the root cause of the bug
- Check related code paths that might be affected
- Review relevant services in `lib/services/` if applicable
- Check validation schemas in `lib/validations/` if applicable
- Review database queries in `db/queries/` if applicable

### 4. Fix Implementation

- Implement the fix following the project's architecture patterns:
  - Use services from `lib/services/` when available
  - Follow the service layer pattern for new functionality
  - Ensure proper error handling
  - Maintain TypeScript type safety
  - Use Zod validation where appropriate

- If documentation needed updating based on user clarification, update it first before fixing code

### 5. Testing

- Test the fix thoroughly:
  - Verify the bug is resolved
  - Check for regression in related functionality
  - Test edge cases
  - Run `npm run build` to ensure TypeScript compilation
  - Run relevant tests if they exist (`npm run test`)

- If this is a UI/UX bug, verify the fix matches the specifications in USE_CASES.md and UX_UI_SPEC.md

### 6. Summary

Provide a concise summary of:
- What was wrong
- What was changed
- What was tested
- Any documentation updates made

## Example

```
/bug-fix Users can vote on unapproved statements
```

This would:
1. Analyze the voting flow
2. Check USE_CASES.md and UX_UI_SPEC.md for voting specifications
3. Identify that only approved statements should be visible
4. Check if there's a conflict between specs and code
5. Fix the statement filtering logic
6. Test that unapproved statements are hidden
7. Verify no regression in normal voting flow

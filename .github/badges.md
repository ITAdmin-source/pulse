# Pulse Testing Badges

Add these badges to your README.md to display test status and coverage:

## GitHub Actions Status Badge
```markdown
[![Test Status](https://github.com/YOUR_USERNAME/pulse/workflows/Test/badge.svg)](https://github.com/YOUR_USERNAME/pulse/actions)
```

## Codecov Coverage Badge
```markdown
[![Coverage](https://codecov.io/gh/YOUR_USERNAME/pulse/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/pulse)
```

## Combined Badge Section
```markdown
## Status

[![Test Status](https://github.com/YOUR_USERNAME/pulse/workflows/Test/badge.svg)](https://github.com/YOUR_USERNAME/pulse/actions)
[![Coverage](https://codecov.io/gh/YOUR_USERNAME/pulse/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/pulse)
[![TypeScript](https://badgen.net/badge/Built%20With/TypeScript/blue)](https://www.typescriptlang.org/)
[![Next.js](https://badgen.net/badge/Framework/Next.js/black)](https://nextjs.org/)
```

## Coverage Thresholds

The project maintains the following coverage thresholds:

| Component | Coverage Requirement |
|-----------|---------------------|
| Global | 80% |
| Services (`lib/services/**`) | 90% |
| Validations (`lib/validations/**`) | 100% |
| Utilities (`lib/utils/**`) | 85% |
| Database Queries (`db/queries/**`) | 85% |
| Actions (`actions/**`) | 80% |

## Setup Instructions

1. **GitHub Actions**: Already configured in `.github/workflows/test.yml`

2. **Codecov Setup**:
   - Sign up at [codecov.io](https://codecov.io)
   - Connect your GitHub repository
   - The workflow will automatically upload coverage reports

3. **Replace Placeholders**:
   - Replace `YOUR_USERNAME` with your GitHub username
   - Replace `pulse` with your repository name if different

4. **Add to README.md**:
   - Copy the badge markdown to your main README.md
   - Place badges near the top of the file for visibility

## Additional Badge Options

### Test Coverage Details
```markdown
[![Coverage Lines](https://codecov.io/gh/YOUR_USERNAME/pulse/branch/main/graph/badge.svg?flag=lines)](https://codecov.io/gh/YOUR_USERNAME/pulse)
[![Coverage Functions](https://codecov.io/gh/YOUR_USERNAME/pulse/branch/main/graph/badge.svg?flag=functions)](https://codecov.io/gh/YOUR_USERNAME/pulse)
[![Coverage Branches](https://codecov.io/gh/YOUR_USERNAME/pulse/branch/main/graph/badge.svg?flag=branches)](https://codecov.io/gh/YOUR_USERNAME/pulse)
```

### Technology Stack Badges
```markdown
[![Vitest](https://badgen.net/badge/Testing/Vitest/green)](https://vitest.dev/)
[![Playwright](https://badgen.net/badge/E2E/Playwright/orange)](https://playwright.dev/)
[![Drizzle ORM](https://badgen.net/badge/Database/Drizzle%20ORM/green)](https://orm.drizzle.team/)
[![Supabase](https://badgen.net/badge/Database/Supabase/green)](https://supabase.com/)
```

### License and Node Version
```markdown
[![License](https://badgen.net/badge/License/MIT/blue)](LICENSE)
[![Node Version](https://badgen.net/badge/Node/%3E%3D20/green)](https://nodejs.org/)
```
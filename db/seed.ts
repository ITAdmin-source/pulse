import { db } from "./db";
import {
  users,
  polls,
  statements,
  votes,
  userPollInsights,
  pollResultsSummaries,
  ageGroups,
  genders,
  ethnicities,
  politicalParties,
  userDemographics
} from "./schema";

async function seed() {
  console.log("🌱 Starting database seed...");

  try {
    // Clear existing data (in reverse order of dependencies)
    console.log("Clearing existing data...");
    await db.delete(votes);
    await db.delete(userPollInsights);
    await db.delete(pollResultsSummaries);
    await db.delete(userDemographics);
    await db.delete(statements);
    await db.delete(polls);
    await db.delete(users);
    // Also clear demographics lookup tables
    await db.delete(ageGroups);
    await db.delete(genders);
    await db.delete(ethnicities);
    await db.delete(politicalParties);

    // Seed Demographics lookup tables
    console.log("Seeding demographics lookup tables...");
    const [ageGroup1] = await db.insert(ageGroups).values({ label: "18-24" }).returning();
    const [ageGroup2] = await db.insert(ageGroups).values({ label: "25-34" }).returning();
    const [ageGroup3] = await db.insert(ageGroups).values({ label: "35-44" }).returning();
    const [ageGroup4] = await db.insert(ageGroups).values({ label: "45-54" }).returning();

    const [gender1] = await db.insert(genders).values({ label: "Male" }).returning();
    const [gender2] = await db.insert(genders).values({ label: "Female" }).returning();
    const [gender3] = await db.insert(genders).values({ label: "Non-binary" }).returning();

    const [ethnicity1] = await db.insert(ethnicities).values({ label: "White" }).returning();
    const [ethnicity2] = await db.insert(ethnicities).values({ label: "Black or African American" }).returning();
    const [ethnicity3] = await db.insert(ethnicities).values({ label: "Asian" }).returning();
    const [ethnicity4] = await db.insert(ethnicities).values({ label: "Hispanic or Latino" }).returning();

    const [party1] = await db.insert(politicalParties).values({ label: "Democrat" }).returning();
    const [party2] = await db.insert(politicalParties).values({ label: "Republican" }).returning();
    const [party3] = await db.insert(politicalParties).values({ label: "Independent" }).returning();
    const [party4] = await db.insert(politicalParties).values({ label: "Other" }).returning();

    // Seed Users
    console.log("Seeding users...");
    const [user1] = await db.insert(users).values({
      clerkUserId: "user_test_admin_123",
      sessionId: null,
    }).returning();

    const [user2] = await db.insert(users).values({
      clerkUserId: "user_test_voter_456",
      sessionId: null,
    }).returning();

    const [user3] = await db.insert(users).values({
      clerkUserId: null,
      sessionId: "session_anonymous_789",
    }).returning();

    // Add demographics for some users
    await db.insert(userDemographics).values({
      userId: user2.id,
      ageGroupId: ageGroup2.id,
      genderId: gender2.id,
      ethnicityId: ethnicity3.id,
      politicalPartyId: party3.id,
    });

    // Seed Polls
    console.log("Seeding polls...");
    const [poll1] = await db.insert(polls).values({
      question: "What are the most important climate action priorities?",
      description: "Help us understand which climate policies matter most to you. Your vote will contribute to a collective understanding of community priorities.",
      slug: "climate-action-priorities",
      status: "published",
      createdBy: user1.id,
      allowUserStatements: true,
      autoApproveStatements: false,
      minStatementsVotedToEnd: 5,
      votingGoal: 1000,
      supportButtonLabel: "Support",
      opposeButtonLabel: "Oppose",
      unsureButtonLabel: "Unsure",
      startTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    }).returning();

    const [poll2] = await db.insert(polls).values({
      question: "How should we improve city transportation?",
      description: "Share your views on making our city more accessible and sustainable. Your input will help shape future transportation policies.",
      slug: "city-transportation-improvements",
      status: "published",
      createdBy: user1.id,
      allowUserStatements: true,
      autoApproveStatements: false,
      minStatementsVotedToEnd: 5,
      votingGoal: 500,
      startTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      endTime: null,
    }).returning();

    const [poll3] = await db.insert(polls).values({
      question: "Community Budget Priorities 2025",
      description: "Vote on how we should allocate community resources for the upcoming year.",
      slug: "community-budget-priorities-2025",
      status: "closed",
      createdBy: user1.id,
      allowUserStatements: false,
      autoApproveStatements: false,
      minStatementsVotedToEnd: 5,
      votingGoal: null,
      startTime: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    }).returning();

    const [poll4] = await db.insert(polls).values({
      question: "Draft Poll - Testing in Progress",
      description: "This is a draft poll for testing purposes.",
      slug: "draft-poll-testing",
      status: "draft",
      createdBy: user1.id,
      allowUserStatements: true,
      autoApproveStatements: true,
      minStatementsVotedToEnd: 3,
      votingGoal: null,
      startTime: null,
      endTime: null,
    }).returning();

    // Seed Statements for Poll 1 (Climate)
    console.log("Seeding statements for climate poll...");
    const climateStatements = [
      "We should invest heavily in renewable energy infrastructure",
      "Nuclear power is essential for achieving our clean energy goals",
      "Carbon pricing mechanisms should be implemented immediately",
      "Individual actions matter more than policy changes",
      "Climate change requires international cooperation and agreements",
      "We should ban all fossil fuel extraction within 10 years",
      "Electric vehicle adoption should be incentivized with tax breaks",
      "Public transportation needs significant expansion and funding",
      "Green jobs training programs should be a top priority",
      "Corporate polluters should face stricter regulations and penalties",
      "Climate education should be mandatory in schools",
      "We need more protected natural areas and wildlife reserves",
      "Agricultural practices must shift to sustainable methods",
      "Urban planning should prioritize walkability and bike lanes",
      "Renewable energy research deserves more government funding",
    ];

    const poll1Statements = [];
    for (const statementText of climateStatements) {
      const [stmt] = await db.insert(statements).values({
        pollId: poll1.id,
        text: statementText,
        approved: true,
        submittedBy: user1.id,
      }).returning();
      poll1Statements.push(stmt);
    }

    // Add some pending statements for Poll 1
    await db.insert(statements).values([
      {
        pollId: poll1.id,
        text: "We should ban all fossil fuels immediately without transition period",
        approved: null, // Pending
        submittedBy: user2.id,
      },
      {
        pollId: poll1.id,
        text: "Climate change is exaggerated and not a real crisis",
        approved: null, // Pending
        submittedBy: user3.id,
      },
      {
        pollId: poll1.id,
        text: "Geoengineering solutions should be explored as backup plans",
        approved: null, // Pending
        submittedBy: user2.id,
      },
    ]);

    // Seed Statements for Poll 2 (Transportation)
    console.log("Seeding statements for transportation poll...");
    const transportStatements = [
      "Public buses should run 24/7 on major routes",
      "Bike lanes should be protected and separated from traffic",
      "Subway/metro expansion is our top infrastructure priority",
      "Ride-sharing services should be better regulated",
      "Parking fees should increase to discourage car use",
      "Electric scooters and bikes are a good transportation option",
      "We need more pedestrian-only zones in the city center",
      "Highway expansion will not solve our traffic problems",
      "Transportation for disabled individuals needs improvement",
      "Car-free days should be implemented monthly",
      "Regional rail connections need to be improved",
      "Traffic congestion pricing is a fair solution",
    ];

    const poll2Statements = [];
    for (const statementText of transportStatements) {
      const [stmt] = await db.insert(statements).values({
        pollId: poll2.id,
        text: statementText,
        approved: true,
        submittedBy: user1.id,
      }).returning();
      poll2Statements.push(stmt);
    }

    // Seed Statements for Poll 3 (Budget - Closed)
    console.log("Seeding statements for budget poll...");
    const budgetStatements = [
      "Education should receive the largest share of funding",
      "Infrastructure repairs are more urgent than new projects",
      "Public safety budgets should be reallocated to social services",
      "Parks and recreation need more investment",
      "Small business support programs should be expanded",
      "Affordable housing development is the top priority",
      "Library and community center funding should increase",
      "Climate resilience projects deserve dedicated funding",
    ];

    const poll3Statements = [];
    for (const statementText of budgetStatements) {
      const [stmt] = await db.insert(statements).values({
        pollId: poll3.id,
        text: statementText,
        approved: true,
        submittedBy: user1.id,
      }).returning();
      poll3Statements.push(stmt);
    }

    // Seed Statements for Poll 4 (Draft)
    console.log("Seeding statements for draft poll...");
    await db.insert(statements).values([
      {
        pollId: poll4.id,
        text: "This is the first draft statement",
        approved: true,
        submittedBy: user1.id,
      },
      {
        pollId: poll4.id,
        text: "This is the second draft statement",
        approved: true,
        submittedBy: user1.id,
      },
      {
        pollId: poll4.id,
        text: "This is the third draft statement",
        approved: true,
        submittedBy: user1.id,
      },
      {
        pollId: poll4.id,
        text: "This is the fourth draft statement",
        approved: true,
        submittedBy: user1.id,
      },
      {
        pollId: poll4.id,
        text: "This is the fifth draft statement",
        approved: true,
        submittedBy: user1.id,
      },
      {
        pollId: poll4.id,
        text: "This is the sixth draft statement",
        approved: true,
        submittedBy: user1.id,
      },
    ]);

    // Seed Votes for Poll 1
    console.log("Seeding votes for climate poll...");
    // User 2 votes on first 10 statements
    for (let i = 0; i < 10; i++) {
      const voteValue = Math.random() > 0.7 ? -1 : Math.random() > 0.3 ? 1 : 0;
      await db.insert(votes).values({
        userId: user2.id,
        statementId: poll1Statements[i].id,
        value: voteValue as -1 | 0 | 1,
      });
    }

    // Anonymous user votes on first 7 statements
    for (let i = 0; i < 7; i++) {
      const voteValue = Math.random() > 0.6 ? -1 : Math.random() > 0.4 ? 1 : 0;
      await db.insert(votes).values({
        userId: user3.id,
        statementId: poll1Statements[i].id,
        value: voteValue as -1 | 0 | 1,
      });
    }

    // Seed more votes to make statistics realistic (limited to 10 per statement for speed)
    for (let i = 0; i < poll1Statements.length; i++) {
      // Simulate 10 additional votes per statement
      const numVotes = 10;
      for (let j = 0; j < numVotes; j++) {
        // Create temporary user for vote simulation
        const [tempUser] = await db.insert(users).values({
          clerkUserId: null,
          sessionId: `sim_session_${i}_${j}`,
        }).returning();

        // Weighted random vote (more likely to agree)
        const rand = Math.random();
        const voteValue = rand > 0.8 ? -1 : rand > 0.2 ? 1 : 0;

        await db.insert(votes).values({
          userId: tempUser.id,
          statementId: poll1Statements[i].id,
          value: voteValue as -1 | 0 | 1,
        });
      }
    }

    // Seed Votes for Poll 2
    console.log("Seeding votes for transportation poll...");
    for (let i = 0; i < poll2Statements.length; i++) {
      const numVotes = 8; // Reduced for speed
      for (let j = 0; j < numVotes; j++) {
        const [tempUser] = await db.insert(users).values({
          clerkUserId: null,
          sessionId: `sim_transport_${i}_${j}`,
        }).returning();

        const rand = Math.random();
        const voteValue = rand > 0.7 ? -1 : rand > 0.3 ? 1 : 0;

        await db.insert(votes).values({
          userId: tempUser.id,
          statementId: poll2Statements[i].id,
          value: voteValue as -1 | 0 | 1,
        });
      }
    }

    // Seed Votes for Poll 3 (Closed)
    console.log("Seeding votes for closed budget poll...");
    for (let i = 0; i < poll3Statements.length; i++) {
      const numVotes = 15; // Reduced for speed
      for (let j = 0; j < numVotes; j++) {
        const [tempUser] = await db.insert(users).values({
          clerkUserId: null,
          sessionId: `sim_budget_${i}_${j}`,
        }).returning();

        const rand = Math.random();
        const voteValue = rand > 0.6 ? -1 : rand > 0.25 ? 1 : 0;

        await db.insert(votes).values({
          userId: tempUser.id,
          statementId: poll3Statements[i].id,
          value: voteValue as -1 | 0 | 1,
        });
      }
    }

    // Seed User Poll Insights
    console.log("Seeding user insights...");
    await db.insert(userPollInsights).values({
      userId: user2.id,
      pollId: poll1.id,
      title: "You're a Progressive Climate Advocate",
      body: `Based on your voting patterns, you show strong alignment with progressive climate action policies. You consistently supported statements about renewable energy investment, corporate accountability, and international cooperation.

**Key Findings:**
- You agreed with 85% of statements about renewable energy transition
- You showed concern for climate justice and equity issues
- Your positions align closely with younger demographics (18-34)
- You diverged from the majority on 3 statements about nuclear energy

**Comparison to Others:**
- You're more supportive of immediate action than 72% of participants
- You share similar views with voters who identify as environmentally conscious
- Your stance on climate funding is more progressive than the average`,
    });

    await db.insert(userPollInsights).values({
      userId: user2.id,
      pollId: poll3.id,
      title: "You Prioritize Social Services and Education",
      body: `Your voting pattern shows a strong preference for social programs and education funding over infrastructure spending.

**Key Findings:**
- Strong support for education and affordable housing
- Less emphasis on traditional infrastructure projects
- Aligned with progressive budget allocation approaches

**Comparison to Others:**
- Your priorities match 65% of younger participants
- You're more supportive of social services than the average voter`,
    });

    // Seed Poll Results Summaries
    console.log("Seeding poll results summaries...");
    await db.insert(pollResultsSummaries).values({
      pollId: poll1.id,
      summaryText: `## Overall Poll Sentiment

This poll reveals a strong community consensus on the urgency of climate action, with 78% of participants supporting immediate government intervention. However, opinions diverge significantly on implementation methods.

**Main Themes:**
- **Renewable Energy Transition**: Overwhelming support (87% agreement) for accelerating solar and wind energy adoption
- **Corporate Accountability**: Strong majority (73%) favor stricter regulations on emissions
- **International Cooperation**: Mixed views on global climate agreements (52% support)

**Polarizing Statements:**
1. "Nuclear energy is essential for achieving our clean energy goals" - Split 48% agree / 52% disagree
2. "Carbon pricing mechanisms should be implemented immediately" - Divisive at 45% / 55%
3. "Individual actions matter more than policy changes" - Strong disagreement (72% disagree)

**Key Trends:**
- Younger participants (18-34) show 23% higher support for aggressive climate policies
- Urban residents favor public transportation investment at higher rates
- There's broad consensus (91%) that climate action is urgent

**Demographic Patterns:**
- Progressive political alignment correlates with support for government-led solutions
- Education level shows positive correlation with support for science-based policies`,
      participantCount: 150,
      voteCount: 1547,
    });

    await db.insert(pollResultsSummaries).values({
      pollId: poll3.id,
      summaryText: `## Overall Poll Sentiment

Strong consensus emerged around education and affordable housing as top priorities, with 82% of participants supporting increased funding for these areas.

**Main Themes:**
- **Education First**: 89% agree education should receive largest funding share
- **Housing Crisis**: 85% support affordable housing development as top priority
- **Infrastructure**: Mixed views on new projects vs. repairs (55% favor repairs)

**Key Findings:**
- Clear preference for social services over traditional infrastructure
- Strong support for community programs (libraries, parks)
- Budget reallocation from public safety to social services shows 60% support

**Demographic Patterns:**
- Younger voters (18-34) more supportive of housing investment
- Parents show 95% support for education funding
- Urban residents prioritize public transportation`,
      participantCount: 567,
      voteCount: 3456,
    });

    console.log("✅ Database seeded successfully!");
    console.log("\nSeeded data:");
    console.log("- 4 polls (2 published, 1 closed, 1 draft)");
    console.log("- 41 approved statements");
    console.log("- 3 pending statements");
    console.log("- 3 main users + hundreds of simulated voters");
    console.log("- Thousands of votes with realistic distributions");
    console.log("- 2 user insights");
    console.log("- 2 poll results summaries");
    console.log("\nTest accounts:");
    console.log("- Admin/Owner: user_test_admin_123");
    console.log("- Voter: user_test_voter_456");
    console.log("- Anonymous: session_anonymous_789");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run the seed
seed()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .then(() => {
    console.log("Seed completed");
    process.exit(0);
  });

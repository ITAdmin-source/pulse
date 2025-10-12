import { db } from "@/db/db";
import { userDemographics, ageGroups, genders, ethnicities, politicalParties } from "@/db/schema";
import { inArray, sql } from "drizzle-orm";

async function generateRandomDemographics() {
  const pollId = '3ac6870c-7005-4e19-98f4-78dd55b9c2be';

  // Get all users who voted on this poll using raw SQL for DISTINCT
  const usersWhoVoted = await db.execute<{ user_id: string }>(sql`
    SELECT DISTINCT v.user_id
    FROM votes v
    INNER JOIN statements s ON v.statement_id = s.id
    WHERE s.poll_id = ${pollId}
  `);

  const userIds = usersWhoVoted.map((u: { user_id: string }) => u.user_id);
  console.log(`Found ${userIds.length} users who voted on poll ${pollId}`);

  // Get all available demographic options
  const [ageGroupsList, gendersList, ethnicitiesList, politicalPartiesList] = await Promise.all([
    db.select().from(ageGroups),
    db.select().from(genders),
    db.select().from(ethnicities),
    db.select().from(politicalParties)
  ]);

  console.log(`Available options: ${ageGroupsList.length} age groups, ${gendersList.length} genders, ${ethnicitiesList.length} ethnicities, ${politicalPartiesList.length} political parties`);

  // Check which users already have demographics
  const existingDemographics = await db
    .select({ userId: userDemographics.userId })
    .from(userDemographics)
    .where(inArray(userDemographics.userId, userIds));

  const usersWithDemographics = new Set(existingDemographics.map(d => d.userId));
  const usersNeedingDemographics = userIds.filter((id: string) => !usersWithDemographics.has(id));

  console.log(`${usersWithDemographics.size} users already have demographics`);
  console.log(`${usersNeedingDemographics.length} users need demographics`);

  if (usersNeedingDemographics.length === 0) {
    console.log("All users already have demographics!");
    return;
  }

  // Generate random demographics for users who don't have them
  const randomDemographics = usersNeedingDemographics.map((userId: string) => ({
    userId: userId,
    ageGroupId: ageGroupsList[Math.floor(Math.random() * ageGroupsList.length)].id,
    genderId: gendersList[Math.floor(Math.random() * gendersList.length)].id,
    ethnicityId: ethnicitiesList[Math.floor(Math.random() * ethnicitiesList.length)].id,
    politicalPartyId: politicalPartiesList[Math.floor(Math.random() * politicalPartiesList.length)].id
  }));

  // Insert all demographics
  await db.insert(userDemographics).values(randomDemographics);

  console.log(`✓ Successfully generated random demographics for ${randomDemographics.length} users`);
}

generateRandomDemographics()
  .then(() => {
    console.log("Done!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

import { prisma, ensureDatabaseReady, closeDatabase } from "../src/lib/db";

export async function cleanDemoData() {
  console.log("=================================================================");
  console.log("  CPMS — Safe Expanded Demo Data Cleanup");
  console.log("  Only records with 'demo-' prefix will be removed.");
  console.log("  Your existing real users, drives, and companies are untouched.");
  console.log("=================================================================\n");

  await ensureDatabaseReady();

  // Deletion in strict reverse foreign-key dependency order:
  // 1. Audit logs
  const audits = await prisma.auditLog.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${audits.count} demo audit logs.`);

  // 2. Notifications
  const notifs = await prisma.notification.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${notifs.count} demo notifications.`);

  // 3. Application status logs
  const logs = await prisma.applicationStatusLog.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${logs.count} demo application status logs.`);

  // 4. Application round results
  const results = await prisma.applicationRoundResult.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${results.count} demo round results.`);

  // 5. Applications (must be deleted before PlacementDrive due to onDelete: Restrict)
  const apps = await prisma.application.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${apps.count} demo applications.`);

  // 6. Recruitment rounds
  const rounds = await prisma.recruitmentRound.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${rounds.count} demo recruitment rounds.`);

  // 7. Placement drives (must be deleted before Company due to onDelete: Restrict)
  const drives = await prisma.placementDrive.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${drives.count} demo placement drives.`);

  // 8. Companies
  const comps = await prisma.company.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${comps.count} demo companies.`);

  // 9. Student profiles
  const profiles = await prisma.studentProfile.deleteMany({
    where: { id: { startsWith: "demo-" } },
  });
  console.log(`  🗑️  Removed ${profiles.count} demo student profiles.`);

  // 10. Users
  const users = await prisma.user.deleteMany({
    where: {
      OR: [
        { id: { startsWith: "demo-" } },
        { email: { endsWith: "@demo.campus.edu" } },
      ],
    },
  });
  console.log(`  🗑️  Removed ${users.count} demo student users.`);

  const total =
    audits.count +
    notifs.count +
    logs.count +
    results.count +
    apps.count +
    rounds.count +
    drives.count +
    comps.count +
    profiles.count +
    users.count;

  console.log("\n=================================================================");
  console.log(`  ✅ Demo cleanup complete! Total demo records removed: ${total}`);
  console.log("  All real and pre-existing accounts and data remain 100% intact.");
  console.log("=================================================================\n");
}

if (process.argv[1]?.includes("clean_demo_data")) {
  cleanDemoData()
    .catch((err) => {
      console.error("❌ Error running demo data cleanup:", err);
      process.exit(1);
    })
    .finally(async () => {
      await closeDatabase();
      process.exit(0);
    });
}

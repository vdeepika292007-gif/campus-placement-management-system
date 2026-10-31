import { prisma, ensureDatabaseReady } from "../src/lib/db";
import { runSeed } from "../src/lib/seed-data";

async function main() {
  await ensureDatabaseReady();
  await runSeed(prisma);
  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error during seed execution:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

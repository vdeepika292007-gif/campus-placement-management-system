import { PGlite } from "@electric-sql/pglite";
import pg from "pg";
import path from "path";
import fs from "fs";
import { SCHEMA_SQL } from "../src/lib/db-schema";

const { Pool } = pg;

async function main() {
  const targetUrl = process.argv[2] || process.env.DATABASE_URL;

  if (!targetUrl || targetUrl.includes("USER:PASSWORD@HOST") || targetUrl.includes("YOUR_PASSWORD")) {
    console.error("❌ Error: A valid target PostgreSQL connection URL is required.");
    console.error("Usage: npx tsx scripts/migrate_to_postgres.ts \"postgresql://postgres:password@localhost:5432/campus_placement?schema=public\"");
    console.error("Or set DATABASE_URL in your .env file before running.");
    process.exit(1);
  }

  console.log("========================================================");
  console.log(" Campus Placement Management System — Data Migration");
  console.log(" Source: PGlite (prisma/pgdata)");
  console.log(" Target: PostgreSQL Server (" + targetUrl.replace(/:[^:@]+@/, ":****@") + ")");
  console.log("========================================================\n");

  // Step 1: Connect to target PostgreSQL Server
  console.log("[1/5] Connecting to target PostgreSQL Server...");
  const targetPool = new Pool({ connectionString: targetUrl, connectionTimeoutMillis: 10000 });
  try {
    const res = await targetPool.query("SELECT version();");
    console.log("  ✅ Connected to PostgreSQL Server:", res.rows[0].version.split(",")[0]);
  } catch (err: any) {
    console.error("  ❌ Could not connect to target PostgreSQL Server:", err.message);
    console.error("  Please ensure PostgreSQL is installed, running, and accepting connections.");
    await targetPool.end();
    process.exit(1);
  }

  // Step 2: Open Source PGlite
  console.log("\n[2/5] Reading data from source PGlite database...");
  const pglitePath = path.join(process.cwd(), "prisma", "pgdata");
  const backupPath = path.join(process.cwd(), "backups", "pgdata_backup_before_postgres_switch");
  const sourcePath = fs.existsSync(pglitePath) ? pglitePath : backupPath;
  console.log(`  Source directory: ${sourcePath}`);

  const sourceDb = new PGlite(sourcePath);
  await sourceDb.waitReady;

  const users = (await sourceDb.query('SELECT * FROM "User"')).rows as any[];
  const profiles = (await sourceDb.query('SELECT * FROM "StudentProfile"')).rows as any[];
  const companies = (await sourceDb.query('SELECT * FROM "Company"')).rows as any[];
  const drives = (await sourceDb.query('SELECT * FROM "PlacementDrive"')).rows as any[];
  const rounds = (await sourceDb.query('SELECT * FROM "RecruitmentRound"')).rows as any[];
  const applications = (await sourceDb.query('SELECT * FROM "Application"')).rows as any[];
  const roundResults = (await sourceDb.query('SELECT * FROM "ApplicationRoundResult"')).rows as any[];
  const statusLogs = (await sourceDb.query('SELECT * FROM "ApplicationStatusLog"')).rows as any[];
  const notifications = (await sourceDb.query('SELECT * FROM "Notification"')).rows as any[];
  const auditLogs = (await sourceDb.query('SELECT * FROM "AuditLog"')).rows as any[];

  console.log(`  Found records in source:
    - User:                   ${users.length}
    - StudentProfile:         ${profiles.length}
    - Company:                ${companies.length}
    - PlacementDrive:         ${drives.length}
    - RecruitmentRound:       ${rounds.length}
    - Application:            ${applications.length}
    - ApplicationRoundResult: ${roundResults.length}
    - ApplicationStatusLog:   ${statusLogs.length}
    - Notification:           ${notifications.length}
    - AuditLog:               ${auditLogs.length}
  `);

  // Step 3: Ensure Schema on target PostgreSQL Server
  console.log("[3/5] Applying schema & tables to target PostgreSQL Server...");
  await targetPool.query(SCHEMA_SQL);
  console.log("  ✅ Schema and tables created / verified on target.");

  // Step 4: Transfer records preserving all exact keys and relations
  console.log("\n[4/5] Transferring records to target PostgreSQL Server...");

  const client = await targetPool.connect();
  try {
    await client.query("BEGIN;");

    // 1. Users
    for (const u of users) {
      await client.query(`
        INSERT INTO "User" ("id", "name", "email", "passwordHash", "role", "accountStatus", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "email" = EXCLUDED."email",
          "passwordHash" = EXCLUDED."passwordHash",
          "role" = EXCLUDED."role",
          "accountStatus" = EXCLUDED."accountStatus",
          "updatedAt" = EXCLUDED."updatedAt";
      `, [u.id, u.name, u.email, u.passwordHash, u.role, u.accountStatus, u.createdAt, u.updatedAt]);
    }
    console.log(`  ✅ Transferred ${users.length} Users.`);

    // 2. StudentProfiles
    for (const p of profiles) {
      await client.query(`
        INSERT INTO "StudentProfile" ("id", "userId", "studentNumber", "department", "graduationYear", "cgpa", "skills", "resumeReference", "phone", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT ("id") DO UPDATE SET
          "studentNumber" = EXCLUDED."studentNumber",
          "department" = EXCLUDED."department",
          "graduationYear" = EXCLUDED."graduationYear",
          "cgpa" = EXCLUDED."cgpa",
          "skills" = EXCLUDED."skills",
          "resumeReference" = EXCLUDED."resumeReference",
          "phone" = EXCLUDED."phone",
          "updatedAt" = EXCLUDED."updatedAt";
      `, [p.id, p.userId, p.studentNumber, p.department, p.graduationYear, p.cgpa, p.skills, p.resumeReference, p.phone, p.createdAt, p.updatedAt]);
    }
    console.log(`  ✅ Transferred ${profiles.length} StudentProfiles.`);

    // 3. Companies
    for (const c of companies) {
      await client.query(`
        INSERT INTO "Company" ("id", "name", "description", "website", "industry", "location", "logoUrl", "companySize", "isArchived", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "website" = EXCLUDED."website",
          "industry" = EXCLUDED."industry",
          "location" = EXCLUDED."location",
          "logoUrl" = EXCLUDED."logoUrl",
          "companySize" = EXCLUDED."companySize",
          "isArchived" = EXCLUDED."isArchived",
          "updatedAt" = EXCLUDED."updatedAt";
      `, [c.id, c.name, c.description, c.website, c.industry, c.location, c.logoUrl, c.companySize, c.isArchived, c.createdAt, c.updatedAt]);
    }
    console.log(`  ✅ Transferred ${companies.length} Companies.`);

    // 4. PlacementDrives
    for (const d of drives) {
      await client.query(`
        INSERT INTO "PlacementDrive" ("id", "companyId", "title", "jobDescription", "jobType", "location", "salaryMin", "salaryMax", "salaryDisplay", "currency", "deadlineAt", "status", "eligibleBranches", "eligibleGradYears", "minimumCgpa", "requiredSkills", "createdById", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "jobDescription" = EXCLUDED."jobDescription",
          "jobType" = EXCLUDED."jobType",
          "location" = EXCLUDED."location",
          "salaryMin" = EXCLUDED."salaryMin",
          "salaryMax" = EXCLUDED."salaryMax",
          "salaryDisplay" = EXCLUDED."salaryDisplay",
          "currency" = EXCLUDED."currency",
          "deadlineAt" = EXCLUDED."deadlineAt",
          "status" = EXCLUDED."status",
          "eligibleBranches" = EXCLUDED."eligibleBranches",
          "eligibleGradYears" = EXCLUDED."eligibleGradYears",
          "minimumCgpa" = EXCLUDED."minimumCgpa",
          "requiredSkills" = EXCLUDED."requiredSkills",
          "updatedAt" = EXCLUDED."updatedAt";
      `, [d.id, d.companyId, d.title, d.jobDescription, d.jobType, d.location, d.salaryMin, d.salaryMax, d.salaryDisplay, d.currency, d.deadlineAt, d.status, d.eligibleBranches, d.eligibleGradYears, d.minimumCgpa, d.requiredSkills, d.createdById, d.createdAt, d.updatedAt]);
    }
    console.log(`  ✅ Transferred ${drives.length} PlacementDrives.`);

    // 5. RecruitmentRounds
    for (const r of rounds) {
      await client.query(`
        INSERT INTO "RecruitmentRound" ("id", "placementDriveId", "name", "roundType", "sequence", "scheduledAt", "description", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT ("id") DO UPDATE SET
          "name" = EXCLUDED."name",
          "roundType" = EXCLUDED."roundType",
          "sequence" = EXCLUDED."sequence",
          "scheduledAt" = EXCLUDED."scheduledAt",
          "description" = EXCLUDED."description",
          "updatedAt" = EXCLUDED."updatedAt";
      `, [r.id, r.placementDriveId, r.name, r.roundType, r.sequence, r.scheduledAt, r.description, r.createdAt, r.updatedAt]);
    }
    console.log(`  ✅ Transferred ${rounds.length} RecruitmentRounds.`);

    // 6. Applications
    for (const a of applications) {
      await client.query(`
        INSERT INTO "Application" ("id", "studentId", "placementDriveId", "status", "appliedAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT ("id") DO UPDATE SET
          "status" = EXCLUDED."status",
          "updatedAt" = EXCLUDED."updatedAt";
      `, [a.id, a.studentId, a.placementDriveId, a.status, a.appliedAt, a.updatedAt]);
    }
    console.log(`  ✅ Transferred ${applications.length} Applications.`);

    // 7. ApplicationRoundResults
    for (const res of roundResults) {
      await client.query(`
        INSERT INTO "ApplicationRoundResult" ("id", "applicationId", "recruitmentRoundId", "status", "notes", "updatedById", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("id") DO UPDATE SET
          "status" = EXCLUDED."status",
          "notes" = EXCLUDED."notes",
          "updatedById" = EXCLUDED."updatedById",
          "updatedAt" = EXCLUDED."updatedAt";
      `, [res.id, res.applicationId, res.recruitmentRoundId, res.status, res.notes, res.updatedById, res.updatedAt]);
    }
    console.log(`  ✅ Transferred ${roundResults.length} ApplicationRoundResults.`);

    // 8. ApplicationStatusLogs
    for (const l of statusLogs) {
      await client.query(`
        INSERT INTO "ApplicationStatusLog" ("id", "applicationId", "fromStatus", "toStatus", "changedByUserId", "reason", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("id") DO NOTHING;
      `, [l.id, l.applicationId, l.fromStatus, l.toStatus, l.changedByUserId, l.reason, l.createdAt]);
    }
    console.log(`  ✅ Transferred ${statusLogs.length} ApplicationStatusLogs.`);

    // 9. Notifications
    for (const n of notifications) {
      await client.query(`
        INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "linkUrl", "readAt", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT ("id") DO UPDATE SET
          "title" = EXCLUDED."title",
          "message" = EXCLUDED."message",
          "type" = EXCLUDED."type",
          "linkUrl" = EXCLUDED."linkUrl",
          "readAt" = EXCLUDED."readAt";
      `, [n.id, n.userId, n.title, n.message, n.type, n.linkUrl, n.readAt, n.createdAt]);
    }
    console.log(`  ✅ Transferred ${notifications.length} Notifications.`);

    // 10. AuditLogs
    for (const log of auditLogs) {
      await client.query(`
        INSERT INTO "AuditLog" ("id", "actorUserId", "action", "entityType", "entityId", "details", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT ("id") DO NOTHING;
      `, [log.id, log.actorUserId, log.action, log.entityType, log.entityId, log.details, log.createdAt]);
    }
    console.log(`  ✅ Transferred ${auditLogs.length} AuditLogs.`);

    await client.query("COMMIT;");
    console.log("  ✅ Transaction committed successfully.");
  } catch (txErr) {
    await client.query("ROLLBACK;");
    console.error("  ❌ Migration transaction error, rolled back:", txErr);
    throw txErr;
  } finally {
    client.release();
  }

  // Step 5: Verification
  console.log("\n[5/5] Verifying records on target PostgreSQL Server...");
  const targetCounts = {
    users: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "User"')).rows[0].count, 10),
    profiles: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "StudentProfile"')).rows[0].count, 10),
    companies: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "Company"')).rows[0].count, 10),
    drives: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "PlacementDrive"')).rows[0].count, 10),
    rounds: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "RecruitmentRound"')).rows[0].count, 10),
    applications: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "Application"')).rows[0].count, 10),
    roundResults: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "ApplicationRoundResult"')).rows[0].count, 10),
    statusLogs: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "ApplicationStatusLog"')).rows[0].count, 10),
    notifications: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "Notification"')).rows[0].count, 10),
    auditLogs: parseInt((await targetPool.query('SELECT COUNT(*)::int as count FROM "AuditLog"')).rows[0].count, 10),
  };

  console.log("---------------------------------------------------------");
  console.log("Table                 Source (PGlite)    Target (PostgreSQL)");
  console.log("---------------------------------------------------------");
  console.log(`User                  ${users.length.toString().padEnd(19)} ${targetCounts.users}`);
  console.log(`StudentProfile        ${profiles.length.toString().padEnd(19)} ${targetCounts.profiles}`);
  console.log(`Company               ${companies.length.toString().padEnd(19)} ${targetCounts.companies}`);
  console.log(`PlacementDrive        ${drives.length.toString().padEnd(19)} ${targetCounts.drives}`);
  console.log(`RecruitmentRound      ${rounds.length.toString().padEnd(19)} ${targetCounts.rounds}`);
  console.log(`Application           ${applications.length.toString().padEnd(19)} ${targetCounts.applications}`);
  console.log(`ApplicationRoundResult${roundResults.length.toString().padEnd(19)} ${targetCounts.roundResults}`);
  console.log(`ApplicationStatusLog  ${statusLogs.length.toString().padEnd(19)} ${targetCounts.statusLogs}`);
  console.log(`Notification          ${notifications.length.toString().padEnd(19)} ${targetCounts.notifications}`);
  console.log(`AuditLog              ${auditLogs.length.toString().padEnd(19)} ${targetCounts.auditLogs}`);
  console.log("---------------------------------------------------------");

  const allMatch =
    targetCounts.users === users.length &&
    targetCounts.profiles === profiles.length &&
    targetCounts.companies === companies.length &&
    targetCounts.drives === drives.length &&
    targetCounts.rounds === rounds.length &&
    targetCounts.applications === applications.length &&
    targetCounts.roundResults === roundResults.length &&
    targetCounts.statusLogs === statusLogs.length &&
    targetCounts.notifications === notifications.length &&
    targetCounts.auditLogs === auditLogs.length;

  if (allMatch) {
    console.log("\n🎉 ALL RECORDS VERIFIED! Migration completed with 100% integrity.");
  } else {
    console.warn("\n⚠️ Record count discrepancy detected. Please inspect logs.");
  }

  await sourceDb.close();
  await targetPool.end();
}

main().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

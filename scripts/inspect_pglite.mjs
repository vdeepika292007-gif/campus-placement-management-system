import { PGlite } from "@electric-sql/pglite";
import path from "path";

async function main() {
  const dbDir = path.join(process.cwd(), "prisma", "pgdata");
  const db = new PGlite(dbDir);
  await db.waitReady;
  const users = await db.query('SELECT * FROM "User" ORDER BY "createdAt" ASC');
  const profiles = await db.query('SELECT * FROM "StudentProfile"');
  const companies = await db.query('SELECT * FROM "Company" ORDER BY "createdAt" ASC');
  const drives = await db.query('SELECT * FROM "PlacementDrive" ORDER BY "createdAt" ASC');
  const rounds = await db.query('SELECT * FROM "RecruitmentRound" ORDER BY sequence ASC');
  const applications = await db.query('SELECT * FROM "Application"');
  const roundResults = await db.query('SELECT * FROM "ApplicationRoundResult"');
  const statusLogs = await db.query('SELECT * FROM "ApplicationStatusLog"');
  const notifs = await db.query('SELECT * FROM "Notification"');
  const auditLogs = await db.query('SELECT * FROM "AuditLog"');

  console.log("=== PGLITE CURRENT DATABASE SUMMARY ===");
  console.log(`Users (${users.rows.length}):`, users.rows.map(u => `${u.name} <${u.email}> (${u.role})`));
  console.log(`StudentProfiles (${profiles.rows.length}):`, profiles.rows.map(p => `${p.fullName} (${p.department})`));
  console.log(`Companies (${companies.rows.length}):`, companies.rows.map(c => `${c.name} [id=${c.id}] (size: ${c.size || 'N/A'})`));
  console.log(`PlacementDrives (${drives.rows.length}):`, drives.rows.map(d => `${d.title} [id=${d.id}] (${d.status}, deadline: ${d.deadlineAt})`));
  console.log(`RecruitmentRounds: ${rounds.rows.length}`);
  console.log(`Applications (${applications.rows.length}):`, applications.rows.map(a => `Drive: ${a.placementDriveId} -> Status: ${a.status}`));
  console.log(`RoundResults: ${roundResults.rows.length}`);
  console.log(`StatusLogs: ${statusLogs.rows.length}`);
  console.log(`Notifications: ${notifs.rows.length}`);
  console.log(`AuditLogs: ${auditLogs.rows.length}`);
  console.log("========================================");

  await db.close();
}

main().catch(console.error);

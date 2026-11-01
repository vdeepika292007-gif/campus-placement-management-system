import { PGlite } from "@electric-sql/pglite";
import bcrypt from "bcryptjs";

export const SCHEMA_SQL = `
DO $$ BEGIN
  CREATE TYPE "Role" AS ENUM ('STUDENT', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "DriveStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CLOSED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RoundType" AS ENUM ('ONLINE_ASSESSMENT', 'TECHNICAL_INTERVIEW', 'HR_INTERVIEW', 'GROUP_DISCUSSION', 'OTHER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ApplicationStatus" AS ENUM ('APPLIED', 'UNDER_REVIEW', 'SHORTLISTED', 'ASSESSMENT_SCHEDULED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED', 'WITHDRAWN', 'OFFER_RECORDED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "RoundOutcome" AS ENUM ('PENDING', 'SHORTLISTED', 'CLEARED', 'REJECTED', 'ABSENT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationType" AS ENUM ('INFO', 'SUCCESS', 'WARNING', 'ALERT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'STUDENT',
  "accountStatus" "AccountStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "StudentProfile" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL UNIQUE REFERENCES "User"("id") ON DELETE CASCADE,
  "studentNumber" TEXT,
  "department" TEXT NOT NULL,
  "graduationYear" INTEGER NOT NULL,
  "cgpa" DOUBLE PRECISION,
  "skills" TEXT[] NOT NULL DEFAULT '{}',
  "resumeReference" TEXT,
  "phone" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Company" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "website" TEXT,
  "industry" TEXT,
  "location" TEXT,
  "logoUrl" TEXT,
  "companySize" TEXT,
  "isArchived" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "Company" ADD COLUMN IF NOT EXISTS "companySize" TEXT;

CREATE TABLE IF NOT EXISTS "PlacementDrive" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "companyId" TEXT NOT NULL REFERENCES "Company"("id") ON DELETE RESTRICT,
  "title" TEXT NOT NULL,
  "jobDescription" TEXT NOT NULL,
  "jobType" TEXT,
  "location" TEXT,
  "salaryMin" DOUBLE PRECISION,
  "salaryMax" DOUBLE PRECISION,
  "salaryDisplay" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'INR',
  "deadlineAt" TIMESTAMP(3) NOT NULL,
  "status" "DriveStatus" NOT NULL DEFAULT 'DRAFT',
  "eligibleBranches" TEXT[] NOT NULL DEFAULT '{}',
  "eligibleGradYears" INTEGER[] NOT NULL DEFAULT '{}',
  "minimumCgpa" DOUBLE PRECISION,
  "requiredSkills" TEXT[] NOT NULL DEFAULT '{}',
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "RecruitmentRound" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "placementDriveId" TEXT NOT NULL REFERENCES "PlacementDrive"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "roundType" "RoundType" NOT NULL DEFAULT 'TECHNICAL_INTERVIEW',
  "sequence" INTEGER NOT NULL DEFAULT 1,
  "scheduledAt" TIMESTAMP(3),
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Application" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "studentId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "placementDriveId" TEXT NOT NULL REFERENCES "PlacementDrive"("id") ON DELETE RESTRICT,
  "status" "ApplicationStatus" NOT NULL DEFAULT 'APPLIED',
  "appliedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Application_studentId_placementDriveId_key" UNIQUE ("studentId", "placementDriveId")
);

CREATE TABLE IF NOT EXISTS "ApplicationRoundResult" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE,
  "recruitmentRoundId" TEXT NOT NULL REFERENCES "RecruitmentRound"("id") ON DELETE CASCADE,
  "status" "RoundOutcome" NOT NULL DEFAULT 'PENDING',
  "notes" TEXT,
  "updatedById" TEXT,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ApplicationRoundResult_app_round_key" UNIQUE ("applicationId", "recruitmentRoundId")
);

CREATE TABLE IF NOT EXISTS "ApplicationStatusLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "applicationId" TEXT NOT NULL REFERENCES "Application"("id") ON DELETE CASCADE,
  "fromStatus" "ApplicationStatus",
  "toStatus" "ApplicationStatus" NOT NULL,
  "changedByUserId" TEXT,
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL DEFAULT 'INFO',
  "linkUrl" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorUserId" TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT NOT NULL,
  "details" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_role_idx" ON "User"("role");
CREATE INDEX IF NOT EXISTS "StudentProfile_department_idx" ON "StudentProfile"("department");
CREATE INDEX IF NOT EXISTS "StudentProfile_graduationYear_idx" ON "StudentProfile"("graduationYear");
CREATE INDEX IF NOT EXISTS "PlacementDrive_companyId_idx" ON "PlacementDrive"("companyId");
CREATE INDEX IF NOT EXISTS "PlacementDrive_status_idx" ON "PlacementDrive"("status");
CREATE INDEX IF NOT EXISTS "PlacementDrive_deadlineAt_idx" ON "PlacementDrive"("deadlineAt");
CREATE INDEX IF NOT EXISTS "RecruitmentRound_placementDriveId_sequence_idx" ON "RecruitmentRound"("placementDriveId", "sequence");
CREATE INDEX IF NOT EXISTS "Application_studentId_idx" ON "Application"("studentId");
CREATE INDEX IF NOT EXISTS "Application_placementDriveId_idx" ON "Application"("placementDriveId");
CREATE INDEX IF NOT EXISTS "Application_status_idx" ON "Application"("status");
CREATE INDEX IF NOT EXISTS "ApplicationRoundResult_applicationId_idx" ON "ApplicationRoundResult"("applicationId");
CREATE INDEX IF NOT EXISTS "ApplicationRoundResult_recruitmentRoundId_idx" ON "ApplicationRoundResult"("recruitmentRoundId");
CREATE INDEX IF NOT EXISTS "ApplicationStatusLog_applicationId_idx" ON "ApplicationStatusLog"("applicationId");
CREATE INDEX IF NOT EXISTS "Notification_userId_readAt_idx" ON "Notification"("userId", "readAt");
CREATE INDEX IF NOT EXISTS "AuditLog_actorUserId_idx" ON "AuditLog"("actorUserId");
CREATE INDEX IF NOT EXISTS "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
`;

/**
 * Initializes the schema in PGlite if tables don't exist yet.
 */
export async function ensureSchema(pglite: PGlite): Promise<void> {
  try {
    await pglite.waitReady;
    await pglite.exec(SCHEMA_SQL);
  } catch (err) {
    console.error("[Database] Error ensuring schema:", err);
    throw err;
  }
}

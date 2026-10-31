import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import path from "path";
import fs from "fs";
import { ensureSchema } from "./db-schema";
import { runSeed } from "./seed-data";

interface GlobalDatabase {
  prisma?: PrismaClient;
  pglite?: PGlite;
  initPromise?: Promise<void>;
  isReady?: boolean;
}

const globalForDb = globalThis as unknown as {
  __cpms_db?: GlobalDatabase;
};

if (!globalForDb.__cpms_db) {
  globalForDb.__cpms_db = {};
}

const isBuilding =
  process.env.NEXT_PHASE === "phase-production-build" ||
  process.env.npm_lifecycle_event === "build";

const state = globalForDb.__cpms_db;

function createPrismaClient(): PrismaClient {
  const customUrl = process.env.DATABASE_URL;

  // If a valid external postgres URL is provided (e.g. Supabase, Neon, or explicit remote Postgres)
  if (
    customUrl &&
    (customUrl.startsWith("postgres://") || customUrl.startsWith("postgresql://")) &&
    !customUrl.includes("localhost:5432/campus_placement")
  ) {
    console.log("[Database] Connecting to external PostgreSQL database via DATABASE_URL");
    const pool = new Pool({ connectionString: customUrl });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
  }

  // During static page builds in Next.js worker threads, use in-memory PGlite
  // to prevent multi-worker file lock collisions on Windows
  if (isBuilding) {
    if (!state.pglite) {
      state.pglite = new PGlite();
    }
    const adapter = new PrismaPGlite(state.pglite);
    return new PrismaClient({ adapter });
  }

  // Zero-configuration local mode using embedded persistent PGlite
  const dbDir = path.join(process.cwd(), "prisma", "pgdata");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  if (!state.pglite) {
    state.pglite = new PGlite(dbDir);
  }

  const adapter = new PrismaPGlite(state.pglite);
  return new PrismaClient({ adapter });
}

export const prisma = state.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") {
  state.prisma = prisma;
}

/**
 * Ensures the database schema exists and initial demo records are seeded.
 */
export async function ensureDatabaseReady(): Promise<void> {
  if (isBuilding) return;
  if (state.isReady) return;
  if (state.initPromise) return state.initPromise;

  state.initPromise = (async () => {
    try {
      if (state.pglite) {
        await state.pglite.waitReady;
        await ensureSchema(state.pglite);
      }

      // Check if user accounts exist
      const userCount = await prisma.user.count().catch(() => 0);
      if (userCount === 0) {
        console.log("[Database] No user records detected. Performing automated demo seeding...");
        await runSeed(prisma);
      }
      state.isReady = true;
      console.log("[Database] Ready and verified for requests.");
    } catch (err) {
      console.error("[Database] Initialization failure:", err);
      throw err;
    }
  })();

  return state.initPromise;
}

if (!isBuilding) {
  ensureDatabaseReady().catch((err) => {
    console.warn("[Database] Background initialization note:", err?.message || err);
  });
}

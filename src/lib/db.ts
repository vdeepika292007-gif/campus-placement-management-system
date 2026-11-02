import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaPGlite } from "pglite-prisma-adapter";
import { PGlite } from "@electric-sql/pglite";
import { Pool } from "pg";
import path from "path";
import fs from "fs";
import { ensureSchema, SCHEMA_SQL } from "./db-schema";
import { runSeed } from "./seed-data";

interface GlobalDatabase {
  prisma?: PrismaClient;
  pglite?: PGlite;
  pgPool?: Pool;
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

const isTest =
  process.env.VITEST === "true" ||
  process.env.NODE_ENV === "test";

const state = globalForDb.__cpms_db;

// Development persistent database directory: strictly uses prisma/pgdata
const dbDir = path.join(process.cwd(), "prisma", "pgdata");

/**
 * Cleans stale lock files left behind by interrupted process exits.
 * Only removes postmaster.pid, never touches user data or database tables.
 */
function cleanStaleLock(dir: string) {
  try {
    const pidFile = path.join(dir, "postmaster.pid");
    if (fs.existsSync(pidFile)) {
      console.log("[Database] Cleaned stale postmaster.pid lock file from", dir);
      fs.unlinkSync(pidFile);
    }
  } catch (err) {
    console.warn("[Database] Could not clean lock file:", err);
  }
}

function createPrismaClient(): PrismaClient {
  const customUrl = process.env.DATABASE_URL;

  // 1. External PostgreSQL connection (e.g. Local PostgreSQL Server, Neon, Supabase)
  if (
    customUrl &&
    (customUrl.startsWith("postgres://") || customUrl.startsWith("postgresql://")) &&
    !customUrl.includes("USER:PASSWORD@HOST") &&
    !customUrl.includes("YOUR_PASSWORD")
  ) {
    console.log("[Database] Connecting to external PostgreSQL Server via DATABASE_URL");
    if (!state.pgPool) {
      state.pgPool = new Pool({ connectionString: customUrl });
    }
    const adapter = new PrismaPg(state.pgPool);
    return new PrismaClient({ adapter });
  }

  // 2. Build time & Test environments:
  // Use isolated in-memory PGlite to prevent multi-worker lock contention,
  // ensure fast test execution, and guarantee tests never touch or corrupt
  // the development app's persistent data in prisma/pgdata.
  if (isBuilding || isTest) {
    if (!state.pglite) {
      state.pglite = new PGlite();
    }
    const adapter = new PrismaPGlite(state.pglite);
    return new PrismaClient({ adapter });
  }

  // 3. Persistent development database: strictly uses prisma/pgdata
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  cleanStaleLock(dbDir);

  if (!state.pglite) {
    state.pglite = new PGlite(dbDir);
  }

  const adapter = new PrismaPGlite(state.pglite);
  return new PrismaClient({ adapter });
}

function getPrismaClient(): PrismaClient {
  if (state.prisma) return state.prisma;
  state.prisma = createPrismaClient();
  return state.prisma;
}

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrismaClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});

if (process.env.NODE_ENV !== "production") {
  getPrismaClient();
}

/**
 * Ensures the database schema exists and initial demo records are seeded.
 * Preserves existing user data and never deletes database folders.
 */
export async function ensureDatabaseReady(): Promise<void> {
  if (isBuilding) return;
  if (state.isReady) return;
  if (state.initPromise) return state.initPromise;

  state.initPromise = (async () => {
    try {
      console.log("[Database] Step 1: getPrismaClient...");
      getPrismaClient();

      if (state.pgPool) {
        console.log("[Database] Step 2: ensuring schema on external PostgreSQL database...");
        await state.pgPool.query(SCHEMA_SQL);
      } else if (state.pglite) {
        console.log("[Database] Step 2: awaiting pglite.waitReady...");
        try {
          await state.pglite.waitReady;
        } catch (pgliteInitErr: any) {
          console.error("[Database] Corrupted or invalid database detected:", pgliteInitErr?.message || pgliteInitErr);
          console.log("[Database] Initiating automatic self-healing recovery...");
          try {
            await state.pglite.close();
          } catch {}
          state.pglite = undefined;
          state.prisma = undefined;

          const backupPath = path.join(process.cwd(), "backups", `pgdata_corrupted_${Date.now()}`);
          try {
            fs.mkdirSync(path.join(process.cwd(), "backups"), { recursive: true });
            fs.renameSync(dbDir, backupPath);
            console.log(`[Database] Safely archived corrupted database to ${backupPath}`);
          } catch (mvErr) {
            console.warn("[Database] Could not archive corrupted directory:", mvErr);
          }

          fs.mkdirSync(dbDir, { recursive: true });
          cleanStaleLock(dbDir);
          state.pglite = new PGlite(dbDir);
          state.prisma = createPrismaClient();
          await state.pglite.waitReady;
          console.log("[Database] Re-initialized clean PGlite instance successfully.");
        }
        console.log("[Database] Step 3: ensuring schema...");
        await ensureSchema(state.pglite);
      }

      console.log("[Database] Step 4: checking user count...");
      // Check if user accounts exist before seeding
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log("[Database] No existing user records detected. Performing initial demo seeding...");
        await runSeed(prisma);
      } else {
        console.log(`[Database] Found ${userCount} existing user account(s). Preserving user data.`);
      }

      state.isReady = true;
      console.log("[Database] Database ready and verified for requests.");
    } catch (err: any) {
      state.initPromise = undefined; // Reset promise so subsequent requests can retry
      console.error("[Database] Initialization failure at ensureDatabaseReady:", err?.stack || err?.message || err);
      throw err;
    }
  })();

  return state.initPromise;
}

/**
 * Gracefully closes the database connection and shuts down PGlite or PG pool.
 */
export async function closeDatabase(): Promise<void> {
  if (state.prisma) {
    try {
      await state.prisma.$disconnect();
    } catch {}
  }
  if (state.pgPool) {
    try {
      await state.pgPool.end();
    } catch {}
    state.pgPool = undefined;
  }
  if (state.pglite) {
    try {
      await state.pglite.close();
    } catch {}
    state.pglite = undefined;
  }
  state.prisma = undefined;
  state.isReady = false;
  state.initPromise = undefined;
  if (!isTest && !isBuilding) {
    cleanStaleLock(dbDir);
  }
}

// Graceful process exit cleanup
if (typeof process !== "undefined" && !isBuilding && !isTest) {
  const cleanup = () => {
    if (state.pgPool) {
      try {
        state.pgPool.end();
      } catch {}
      state.pgPool = undefined;
    }
    if (state.pglite) {
      try {
        state.pglite.close();
      } catch {}
      state.pglite = undefined;
    }
    cleanStaleLock(dbDir);
  };
  process.once("SIGINT", () => {
    cleanup();
    process.exit(0);
  });
  process.once("SIGTERM", () => {
    cleanup();
    process.exit(0);
  });
}

if (!isBuilding) {
  ensureDatabaseReady().catch((err) => {
    console.warn("[Database] Background initialization note:", err?.message || err);
  });
}

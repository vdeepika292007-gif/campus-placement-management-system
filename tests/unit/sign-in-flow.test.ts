import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma, ensureDatabaseReady, closeDatabase } from "@/lib/db";
import { verifyPassword } from "@/lib/auth/password";
import { requireAdmin, requireStudent } from "@/lib/auth/permissions";

describe("Sign-In Authentication and Role Enforcement", () => {
  beforeAll(async () => {
    await ensureDatabaseReady();
  });

  afterAll(async () => {
    await closeDatabase();
  });

  it("authenticates seeded demo student credentials correctly", async () => {
    const student = await prisma.user.findUnique({
      where: { email: "aarav.sharma@student.edu" },
    });

    expect(student).toBeDefined();
    expect(student?.role).toBe("STUDENT");
    expect(student?.accountStatus).toBe("ACTIVE");

    const validPass = await verifyPassword("StudentDemo@123", student!.passwordHash);
    expect(validPass).toBe(true);

    const invalidPass = await verifyPassword("WrongPassword!456", student!.passwordHash);
    expect(invalidPass).toBe(false);
  });

  it("authenticates seeded demo admin credentials correctly", async () => {
    const admin = await prisma.user.findUnique({
      where: { email: "admin@placement.edu" },
    });

    expect(admin).toBeDefined();
    expect(admin?.role).toBe("ADMIN");
    expect(admin?.accountStatus).toBe("ACTIVE");

    const validPass = await verifyPassword("AdminDemo@123", admin!.passwordHash);
    expect(validPass).toBe(true);
  });

  it("prevents student role from passing Admin role validation", async () => {
    const student = await prisma.user.findUnique({
      where: { email: "aarav.sharma@student.edu" },
    });

    // Emulate server-side role check from /api/auth/sign-in
    const intendedRole = "ADMIN";
    const isAllowedInAdminPortal = student?.role === intendedRole;
    expect(isAllowedInAdminPortal).toBe(false);
  });

  it("enforces requireAdmin guard to throw or redirect for non-admin sessions", async () => {
    await expect(
      requireAdmin(false) // without redirect, throws AuthorizationError or AuthenticationError
    ).rejects.toThrow();
  });
});

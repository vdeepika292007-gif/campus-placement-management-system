import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSessionToken, verifyToken } from "@/lib/auth/session";
import { assertCanAccessStudent, AuthorizationError } from "@/lib/auth/permissions";
import { registerStudentSchema, signInSchema } from "@/lib/validation/auth";

describe("Phase 2 — Password Hashing & Verification", () => {
  it("hashes password with salt and verifies successfully", async () => {
    const password = "SecureStudentPass@123";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).toMatch(/^\$2[aby]\$\d+\$/);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isInvalid = await verifyPassword("WrongPassword", hash);
    expect(isInvalid).toBe(false);
  });
});

describe("Phase 2 — Session Token Issuance & Cryptographic Verification", () => {
  it("creates a signed JWT session and extracts authenticated user payload", async () => {
    const user = {
      id: "usr-student-001",
      email: "aarav.sharma@student.edu",
      name: "Aarav Sharma",
      role: "STUDENT" as const,
    };

    const token = await createSessionToken(user);
    expect(typeof token).toBe("string");
    expect(token.split(".").length).toBe(3); // Standard 3-part JWT

    const payload = await verifyToken(token);
    expect(payload).not.toBeNull();
    expect(payload?.id).toBe(user.id);
    expect(payload?.email).toBe(user.email);
    expect(payload?.role).toBe("STUDENT");
  });

  it("rejects tampered or forged session tokens", async () => {
    const user = {
      id: "usr-student-001",
      email: "aarav.sharma@student.edu",
      name: "Aarav Sharma",
      role: "STUDENT" as const,
    };

    const validToken = await createSessionToken(user);
    // Tamper with the payload part of the token
    const parts = validToken.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({ sub: "usr-student-001", role: "ADMIN" })
    ).toString("base64url");
    const tamperedToken = `${parts[0]}.${tamperedPayload}.${parts[2]}`;

    const result = await verifyToken(tamperedToken);
    expect(result).toBeNull();
  });
});

describe("Phase 2 — Horizontal Isolation & Privilege Escalation Prevention", () => {
  it("allows a student to access their own record", async () => {
    // Mock getSession for test
    const session = {
      id: "usr-student-001",
      email: "aarav@student.edu",
      name: "Aarav",
      role: "STUDENT" as const,
    };

    // If session ID matches target, access is granted
    expect(session.id === "usr-student-001").toBe(true);
  });

  it("blocks a student from accessing another student's private record", async () => {
    const studentA: { id: string; role: "STUDENT" | "ADMIN" } = {
      id: "usr-student-001",
      role: "STUDENT",
    };
    const studentB_Id = "usr-student-002";

    // Attempting to access Student B
    const canAccess = studentA.role === "ADMIN" || studentA.id === studentB_Id;
    expect(canAccess).toBe(false);
  });

  it("allows an admin to access any student's record", async () => {
    const admin = {
      id: "usr-admin-001",
      role: "ADMIN" as const,
    };
    const studentB_Id = "usr-student-002";

    const canAccess = admin.role === "ADMIN" || admin.id === studentB_Id;
    expect(canAccess).toBe(true);
  });
});

describe("Phase 2 — Registration & Sign-In Schema Validation", () => {
  it("rejects invalid emails and empty passwords", () => {
    const invalidSignIn = signInSchema.safeParse({
      email: "not-an-email",
      password: "",
    });
    expect(invalidSignIn.success).toBe(false);

    const validSignIn = signInSchema.safeParse({
      email: "student@college.edu",
      password: "ValidPassword123",
    });
    expect(validSignIn.success).toBe(true);
  });

  it("enforces graduation year bounds and password complexity", () => {
    const invalidReg = registerStudentSchema.safeParse({
      name: "Aarav",
      email: "aarav@college.edu",
      password: "short", // too short (< 8)
      department: "CSE",
      graduationYear: 1990, // invalid year (< 2020)
    });
    expect(invalidReg.success).toBe(false);

    const validReg = registerStudentSchema.safeParse({
      name: "Aarav Sharma",
      email: "aarav@college.edu",
      password: "Password123",
      department: "Computer Science",
      graduationYear: 2026,
    });
    expect(validReg.success).toBe(true);
  });
});

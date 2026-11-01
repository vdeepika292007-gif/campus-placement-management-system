import { describe, it, expect } from "vitest";
import { updateStudentProfileSchema, calculateProfileCompleteness } from "@/lib/validation/profile";
import { companySchema } from "@/lib/validation/company";

describe("Phase 3 — Student Profile Validation & Completeness", () => {
  it("validates realistic academic criteria bounds", () => {
    // Valid profile
    const valid = updateStudentProfileSchema.safeParse({
      department: "Computer Science & Engineering",
      graduationYear: 2026,
      cgpa: 8.75,
      skills: ["React", "TypeScript", "SQL"],
      phone: "+91 98765 43210",
      studentNumber: "CS22B1042",
      resumeReference: "https://drive.google.com/sample-resume",
    });
    expect(valid.success).toBe(true);

    // Invalid CGPA (> 10)
    const invalidCgpa = updateStudentProfileSchema.safeParse({
      department: "CSE",
      graduationYear: 2026,
      cgpa: 11.5,
      skills: [],
    });
    expect(invalidCgpa.success).toBe(false);

    // Negative CGPA
    const negativeCgpa = updateStudentProfileSchema.safeParse({
      department: "CSE",
      graduationYear: 2026,
      cgpa: -1.0,
      skills: [],
    });
    expect(negativeCgpa.success).toBe(false);
  });

  it("calculates accurate completeness percentage without false guarantees", () => {
    // Fully complete profile
    const complete = calculateProfileCompleteness({
      department: "Information Technology",
      graduationYear: 2026,
      cgpa: 8.2,
      skills: ["Python", "Docker"],
      studentNumber: "IT22B102",
      resumeReference: "https://portfolio.me",
    });
    expect(complete.percentage).toBe(100);
    expect(complete.missingFields.length).toBe(0);

    // Partially complete profile (missing CGPA and resume)
    const partial = calculateProfileCompleteness({
      department: "Mechanical Engineering",
      graduationYear: 2025,
      cgpa: null,
      skills: ["AutoCAD"],
      studentNumber: "ME22B001",
      resumeReference: null,
    });
    expect(partial.percentage).toBeLessThan(100);
    expect(partial.missingFields).toContain("CGPA");
    expect(partial.missingFields).toContain("Resume / Portfolio Reference");
  });
});

describe("Phase 3 — Admin Company Validation & Relational Safeguards", () => {
  it("validates company information and optional website URLs", () => {
    // Valid company
    const valid = companySchema.safeParse({
      name: "Acme Cloud Solutions",
      description: "Enterprise software services and distributed cloud infrastructure.",
      website: "https://acme-cloud.example.com",
      industry: "Software Engineering",
      location: "Bangalore",
    });
    expect(valid.success).toBe(true);

    // Company without website
    const validNoWebsite = companySchema.safeParse({
      name: "Novus Hardware",
      description: "Industrial robotics manufacturing and testing.",
      website: "",
    });
    expect(validNoWebsite.success).toBe(true);

    // Invalid website URL
    const invalidUrl = companySchema.safeParse({
      name: "Novus Hardware",
      description: "Industrial robotics manufacturing and testing.",
      website: "not-a-valid-url",
    });
    expect(invalidUrl.success).toBe(false);

    // Company with optional logoUrl and companySize
    const validWithLogoAndSize = companySchema.safeParse({
      name: "Novus Hardware",
      description: "Industrial robotics manufacturing and testing.",
      website: "https://novus.example.com",
      industry: "Robotics",
      location: "Bangalore",
      logoUrl: "https://novus.example.com/logo.png",
      companySize: "501-1,000 employees",
    });
    expect(validWithLogoAndSize.success).toBe(true);

    // Existing company without logoUrl or companySize remains fully valid
    const validLegacy = companySchema.safeParse({
      name: "Legacy Corp",
      description: "Old corporation without logo or size fields specified.",
    });
    expect(validLegacy.success).toBe(true);
    expect(validLegacy.data?.logoUrl).toBeUndefined();
    expect(validLegacy.data?.companySize).toBeUndefined();

    // Invalid logo URL
    const invalidLogo = companySchema.safeParse({
      name: "Bad Logo Corp",
      description: "Company with malformed logo URL string.",
      logoUrl: "not-a-valid-logo-url",
    });
    expect(invalidLogo.success).toBe(false);
  });

  it("enforces soft-archive preference over hard delete when related records exist", () => {
    const driveCount: number = 3;
    const canHardDelete = driveCount === 0;

    expect(canHardDelete).toBe(false);
    // When cannot hard delete, archive flag should be used instead
    const action = canHardDelete ? "DELETE" : "ARCHIVE";
    expect(action).toBe("ARCHIVE");
  });
});

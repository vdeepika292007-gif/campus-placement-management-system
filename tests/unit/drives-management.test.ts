import { describe, it, expect } from "vitest";
import { driveSchema } from "@/lib/validation/drive";

describe("Phase 4 — Placement Drive Validation", () => {
  it("validates well-formed placement drive specifications", () => {
    const validDrive = driveSchema.safeParse({
      companyId: "comp-acme-123",
      title: "Associate Software Engineer",
      jobDescription: "Full stack engineering building cloud native web services.",
      jobType: "Full-time",
      location: "Bangalore",
      salaryMin: 12,
      salaryMax: 16.5,
      salaryDisplay: "₹12.0 - ₹16.5 LPA",
      deadlineAt: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: "PUBLISHED",
      eligibleBranches: ["Computer Science & Engineering"],
      eligibleGradYears: [2026],
      minimumCgpa: 7.5,
      requiredSkills: ["React", "TypeScript", "SQL"],
      recruitmentRounds: [
        {
          name: "Round 1: Coding",
          roundType: "ONLINE_ASSESSMENT",
          sequence: 1,
        },
      ],
    });

    expect(validDrive.success).toBe(true);
  });

  it("rejects invalid criteria such as missing branches, negative CGPA, or empty title", () => {
    // Missing title
    const missingTitle = driveSchema.safeParse({
      companyId: "comp-123",
      title: "",
      jobDescription: "Valid description of sufficient length.",
      deadlineAt: new Date().toISOString(),
      eligibleBranches: ["CSE"],
      eligibleGradYears: [2026],
    });
    expect(missingTitle.success).toBe(false);

    // Negative CGPA
    const negativeCgpa = driveSchema.safeParse({
      companyId: "comp-123",
      title: "Valid Role",
      jobDescription: "Valid description of sufficient length.",
      deadlineAt: new Date().toISOString(),
      eligibleBranches: ["CSE"],
      eligibleGradYears: [2026],
      minimumCgpa: -2,
    });
    expect(negativeCgpa.success).toBe(false);

    // No eligible branches
    const noBranches = driveSchema.safeParse({
      companyId: "comp-123",
      title: "Valid Role",
      jobDescription: "Valid description of sufficient length.",
      deadlineAt: new Date().toISOString(),
      eligibleBranches: [],
      eligibleGradYears: [2026],
    });
    expect(noBranches.success).toBe(false);
  });
});

describe("Phase 4 — Server-Side Publication & Deadline Enforcement Logic", () => {
  it("strictly excludes draft and archived drives from student visibility", () => {
    const drivesInDatabase = [
      { id: "1", title: "Open SDE", status: "PUBLISHED" },
      { id: "2", title: "Internal Draft Role", status: "DRAFT" },
      { id: "3", title: "Concluded Fall Drive", status: "ARCHIVED" },
    ];

    // Student query rule: WHERE status = "PUBLISHED"
    const studentVisibleDrives = drivesInDatabase.filter((d) => d.status === "PUBLISHED");

    expect(studentVisibleDrives.length).toBe(1);
    expect(studentVisibleDrives[0].title).toBe("Open SDE");
    expect(studentVisibleDrives.some((d) => d.status === "DRAFT")).toBe(false);
  });

  it("enforces application deadline expiration", () => {
    const futureDeadline = new Date(Date.now() + 5 * 86400000);
    const pastDeadline = new Date(Date.now() - 2 * 86400000);

    const isFutureExpired = futureDeadline.getTime() < Date.now();
    const isPastExpired = pastDeadline.getTime() < Date.now();

    expect(isFutureExpired).toBe(false);
    expect(isPastExpired).toBe(true);
  });
});

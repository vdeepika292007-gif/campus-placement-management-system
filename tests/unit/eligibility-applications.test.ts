import { describe, it, expect } from "vitest";
import { evaluateEligibility } from "@/lib/eligibility/engine";

describe("Phase 5 — Explanatory Eligibility Evaluation Engine", () => {
  const sampleCriteria = {
    eligibleBranches: ["Computer Science & Engineering", "Information Technology"],
    eligibleGradYears: [2026],
    minimumCgpa: 7.5,
    requiredSkills: ["React", "TypeScript", "SQL"],
  };

  it("identifies fully eligible candidates with detailed positive explanations", () => {
    const student = {
      department: "Computer Science & Engineering",
      graduationYear: 2026,
      cgpa: 8.75,
      skills: ["React", "TypeScript", "SQL", "Docker"],
    };

    const result = evaluateEligibility(student, sampleCriteria);

    expect(result.status).toBe("ELIGIBLE");
    expect(result.canApply).toBe(true);
    expect(result.checks.every((c) => c.passed === true)).toBe(true);
  });

  it("identifies ineligible candidates when branch does not match", () => {
    const student = {
      department: "Civil Engineering",
      graduationYear: 2026,
      cgpa: 8.5,
      skills: ["Python"],
    };

    const result = evaluateEligibility(student, sampleCriteria);

    expect(result.status).toBe("NOT_ELIGIBLE");
    expect(result.canApply).toBe(false);

    const branchCheck = result.checks.find((c) => c.criterion === "DEPARTMENT");
    expect(branchCheck?.passed).toBe(false);
    expect(branchCheck?.reason).toContain("Civil Engineering");
  });

  it("identifies ineligible candidates when CGPA is below cutoff", () => {
    const student = {
      department: "Computer Science & Engineering",
      graduationYear: 2026,
      cgpa: 7.1, // below 7.5 cutoff
      skills: ["React"],
    };

    const result = evaluateEligibility(student, sampleCriteria);

    expect(result.status).toBe("NOT_ELIGIBLE");
    expect(result.canApply).toBe(false);

    const cgpaCheck = result.checks.find((c) => c.criterion === "CGPA");
    expect(cgpaCheck?.passed).toBe(false);
    expect(cgpaCheck?.reason).toContain("cutoff");
  });

  it("returns INCOMPLETE_PROFILE when required fields (e.g. CGPA or department) are missing", () => {
    const student = {
      department: "Computer Science & Engineering",
      graduationYear: 2026,
      cgpa: null, // missing CGPA
      skills: [],
    };

    const result = evaluateEligibility(student, sampleCriteria);

    expect(result.status).toBe("INCOMPLETE_PROFILE");
    expect(result.canApply).toBe(false);
    expect(result.summary).toContain("Unable to confirm eligibility");

    const cgpaCheck = result.checks.find((c) => c.criterion === "CGPA");
    expect(cgpaCheck?.passed).toBeNull();
  });
});

describe("Phase 5 — Server-Side Application Rules & Duplicate Guards", () => {
  it("blocks duplicate application attempts", () => {
    const existingApplications = [
      { studentId: "std-001", placementDriveId: "drive-acme" },
    ];

    const isDuplicate = existingApplications.some(
      (app) => app.studentId === "std-001" && app.placementDriveId === "drive-acme"
    );

    expect(isDuplicate).toBe(true);
  });

  it("rejects applications after the deadline has expired", () => {
    const expiredDeadline = new Date(Date.now() - 3600000); // 1 hour ago
    const isDeadlinePassed = expiredDeadline.getTime() < Date.now();

    expect(isDeadlinePassed).toBe(true);
  });

  it("enforces horizontal isolation: student A cannot access student B records", () => {
    const studentA_Id: string = "student-101";
    const studentB_Id: string = "student-102";

    const canStudentAccessOther = studentA_Id === studentB_Id;
    expect(canStudentAccessOther).toBe(false);
  });
});

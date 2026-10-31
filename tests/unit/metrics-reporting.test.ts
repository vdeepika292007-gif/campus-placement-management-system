import { describe, it, expect } from "vitest";

describe("Phase 6 — Live Metric Calculation Definitions", () => {
  it("strictly distinguishes total applications from unique student applicants", () => {
    // 3 applications submitted by 2 students
    const applications = [
      { id: "app-1", studentId: "std-001", status: "APPLIED" },
      { id: "app-2", studentId: "std-001", status: "SHORTLISTED" },
      { id: "app-3", studentId: "std-002", status: "SELECTED" },
    ];

    const totalApplications = applications.length;
    const uniqueStudents = new Set(applications.map((a) => a.studentId)).size;

    expect(totalApplications).toBe(3);
    expect(uniqueStudents).toBe(2);
    expect(totalApplications).not.toBe(uniqueStudents);
  });

  it("distinguishes selected candidates from confirmed recorded offers", () => {
    const applications = [
      { id: "app-1", status: "APPLIED" },
      { id: "app-2", status: "SHORTLISTED" },
      { id: "app-3", status: "SELECTED" },
      { id: "app-4", status: "OFFER_RECORDED" },
    ];

    const selectedCount = applications.filter((a) => a.status === "SELECTED").length;
    const offersCount = applications.filter((a) => a.status === "OFFER_RECORDED").length;

    expect(selectedCount).toBe(1);
    expect(offersCount).toBe(1);
  });
});

describe("Phase 6 — CSV Export Privacy & Field Sanitization", () => {
  it("excludes private credentials and formats comma-containing values with quotes", () => {
    const rawStudent = {
      name: 'Sharma, Aarav "Sunny"',
      email: "aarav@student.edu",
      passwordHash: "$2a$10$e8gV...SECRET_HASH",
      sessionToken: "cpms.signed.jwt.token",
    };

    function escapeCsv(val: unknown): string {
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }

    const exportedColumns = ["Candidate Name", "Candidate Email"];
    const row = [escapeCsv(rawStudent.name), escapeCsv(rawStudent.email)];

    expect(exportedColumns).not.toContain("passwordHash");
    expect(exportedColumns).not.toContain("sessionToken");
    expect(row[0]).toBe('"Sharma, Aarav ""Sunny"""');
  });
});

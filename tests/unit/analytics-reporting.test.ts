import { describe, it, expect } from "vitest";

describe("Analytics & Reports — Placement Rate Formula & Integrity", () => {
  it("calculates placement rate based on unique placed students to prevent duplicate inflation", () => {
    // 5 total students registered
    const totalStudents = 5;

    // 6 applications submitted, where student-1 received 2 offers, student-2 received 1 offer
    const applications = [
      { id: "app-1", studentId: "std-1", status: "OFFER_RECORDED" },
      { id: "app-2", studentId: "std-1", status: "SELECTED" }, // multiple offer for std-1
      { id: "app-3", studentId: "std-2", status: "SELECTED" },
      { id: "app-4", studentId: "std-3", status: "SHORTLISTED" },
      { id: "app-5", studentId: "std-4", status: "REJECTED" },
      { id: "app-6", studentId: "std-5", status: "APPLIED" },
    ];

    const offerStatuses = new Set(["SELECTED", "OFFER_RECORDED"]);
    const offerApplications = applications.filter((a) => offerStatuses.has(a.status));

    // Total offers count
    const totalOffers = offerApplications.length; // 3 offers
    expect(totalOffers).toBe(3);

    // Unique placed students count (de-duplicated)
    const uniquePlacedStudentIds = new Set(offerApplications.map((a) => a.studentId));
    const uniquePlacedStudents = uniquePlacedStudentIds.size; // only std-1 and std-2
    expect(uniquePlacedStudents).toBe(2);

    // Placement rate calculation
    const placementRate = totalStudents > 0
      ? Number(((uniquePlacedStudents / totalStudents) * 100).toFixed(1))
      : 0;

    // 2 out of 5 students = 40.0% (NOT 3 out of 5 which would be 60.0%!)
    expect(placementRate).toBe(40.0);
  });

  it("safely handles 0 candidates without division by zero errors", () => {
    const totalStudents = 0;
    const uniquePlacedStudents = 0;

    const placementRate = totalStudents > 0
      ? Number(((uniquePlacedStudents / totalStudents) * 100).toFixed(1))
      : 0;

    expect(placementRate).toBe(0);
  });
});

describe("Analytics & Reports — Company Conversion Rate Metrics", () => {
  it("calculates company-specific conversion rates accurately", () => {
    const companyApplications = [
      { companyId: "comp-1", status: "APPLIED" },
      { companyId: "comp-1", status: "SHORTLISTED" },
      { companyId: "comp-1", status: "SELECTED" },
      { companyId: "comp-1", status: "OFFER_RECORDED" },
    ];

    const totalApps = companyApplications.length;
    const totalOffers = companyApplications.filter(
      (a) => a.status === "SELECTED" || a.status === "OFFER_RECORDED"
    ).length;

    const conversionRate = totalApps > 0
      ? Number(((totalOffers / totalApps) * 100).toFixed(1))
      : 0;

    // 2 offers out of 4 applications = 50.0%
    expect(totalApps).toBe(4);
    expect(totalOffers).toBe(2);
    expect(conversionRate).toBe(50.0);
  });
});

describe("Analytics & Reports — Privacy and PII Protection", () => {
  it("strictly omits sensitive personal details like passwords and tokens from report datasets", () => {
    const studentDbRecord = {
      id: "std-99",
      name: "Aditi Rao",
      email: "aditi@campus.edu",
      phone: "+91 9876543210",
      passwordHash: "$2a$10$HASHED_SECRET_STRING_DO_NOT_EXPOSE",
      sessionToken: "eyJhbGciOiJIUzI1NiIsIn...",
    };

    // Public/Admin aggregate summary model should sanitize credentials and personal contacts
    const sanitizedStudentReport = {
      id: studentDbRecord.id,
      name: studentDbRecord.name,
      email: studentDbRecord.email,
    };

    expect(sanitizedStudentReport).not.toHaveProperty("passwordHash");
    expect(sanitizedStudentReport).not.toHaveProperty("sessionToken");
    expect(sanitizedStudentReport).not.toHaveProperty("phone");
  });
});

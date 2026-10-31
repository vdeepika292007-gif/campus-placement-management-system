export interface CriterionCheckResult {
  criterion: "DEPARTMENT" | "GRADUATION_YEAR" | "CGPA" | "SKILLS";
  title: string;
  passed: boolean | null; // true: met, false: not met, null: missing student data
  reason: string;
  requiredValue: string;
  studentValue: string;
}

export interface EligibilityResult {
  status: "ELIGIBLE" | "NOT_ELIGIBLE" | "INCOMPLETE_PROFILE";
  summary: string;
  canApply: boolean;
  checks: CriterionCheckResult[];
}

export interface StudentProfileData {
  department?: string | null;
  graduationYear?: number | null;
  cgpa?: number | null;
  skills?: string[] | null;
}

export interface DriveCriteriaData {
  eligibleBranches: string[];
  eligibleGradYears: number[];
  minimumCgpa?: number | null;
  requiredSkills?: string[];
}

/**
 * Deterministic Explanatory Eligibility Engine
 * Checks academic branch, graduation batch, and CGPA cutoff with explanatory reasons.
 */
export function evaluateEligibility(
  profile: StudentProfileData | null | undefined,
  criteria: DriveCriteriaData
): EligibilityResult {
  const checks: CriterionCheckResult[] = [];

  // 1. Department / Branch Check
  const reqBranches = criteria.eligibleBranches || [];
  if (!profile || !profile.department) {
    checks.push({
      criterion: "DEPARTMENT",
      title: "Academic Department / Branch",
      passed: null,
      reason: "Department is not specified in your profile. Please update your profile.",
      requiredValue: reqBranches.join(", "),
      studentValue: "Not provided",
    });
  } else {
    const isBranchMatch = reqBranches.includes(profile.department);
    checks.push({
      criterion: "DEPARTMENT",
      title: "Academic Department / Branch",
      passed: isBranchMatch,
      reason: isBranchMatch
        ? `Your department (${profile.department}) matches the eligible criteria.`
        : `Your department (${profile.department}) is not among the eligible departments.`,
      requiredValue: reqBranches.join(", "),
      studentValue: profile.department,
    });
  }

  // 2. Graduation Year Check
  const reqYears = criteria.eligibleGradYears || [];
  if (!profile || !profile.graduationYear) {
    checks.push({
      criterion: "GRADUATION_YEAR",
      title: "Graduation Batch",
      passed: null,
      reason: "Graduation year is not specified in your profile.",
      requiredValue: reqYears.map((y) => `Class of ${y}`).join(", "),
      studentValue: "Not provided",
    });
  } else {
    const isYearMatch = reqYears.includes(profile.graduationYear);
    checks.push({
      criterion: "GRADUATION_YEAR",
      title: "Graduation Batch",
      passed: isYearMatch,
      reason: isYearMatch
        ? `Your graduation year (${profile.graduationYear}) is eligible.`
        : `Drive is open to ${reqYears.join(", ")} batches, but your registered batch is ${profile.graduationYear}.`,
      requiredValue: reqYears.map((y) => `Class of ${y}`).join(", "),
      studentValue: `Class of ${profile.graduationYear}`,
    });
  }

  // 3. Minimum CGPA Check
  if (criteria.minimumCgpa !== null && criteria.minimumCgpa !== undefined && criteria.minimumCgpa > 0) {
    if (!profile || profile.cgpa === null || profile.cgpa === undefined) {
      checks.push({
        criterion: "CGPA",
        title: "Minimum CGPA Cutoff",
        passed: null,
        reason: "CGPA is not recorded in your profile. Please add your CGPA in Profile Settings.",
        requiredValue: `Minimum ${criteria.minimumCgpa.toFixed(2)} / 10.0`,
        studentValue: "Pending / Missing",
      });
    } else {
      const isCgpaMet = profile.cgpa >= criteria.minimumCgpa;
      checks.push({
        criterion: "CGPA",
        title: "Minimum CGPA Cutoff",
        passed: isCgpaMet,
        reason: isCgpaMet
          ? `Your CGPA (${profile.cgpa.toFixed(2)}) meets the minimum cutoff of ${criteria.minimumCgpa.toFixed(2)}.`
          : `Your CGPA (${profile.cgpa.toFixed(2)}) is below the required cutoff of ${criteria.minimumCgpa.toFixed(2)}.`,
        requiredValue: `Minimum ${criteria.minimumCgpa.toFixed(2)} / 10.0`,
        studentValue: `${profile.cgpa.toFixed(2)} / 10.0`,
      });
    }
  }

  // 4. Skills Match Check (Advisory / Informational)
  if (criteria.requiredSkills && criteria.requiredSkills.length > 0) {
    const studentSkills = (profile?.skills || []).map((s) => s.toLowerCase());
    const matchedSkills = criteria.requiredSkills.filter((s) =>
      studentSkills.includes(s.toLowerCase())
    );
    const hasAnySkill = matchedSkills.length > 0;

    checks.push({
      criterion: "SKILLS",
      title: "Relevant Skill Alignment",
      passed: hasAnySkill,
      reason: hasAnySkill
        ? `You match ${matchedSkills.length} of ${criteria.requiredSkills.length} relevant skills (${matchedSkills.join(", ")}).`
        : `Recommended skills: ${criteria.requiredSkills.join(", ")}.`,
      requiredValue: criteria.requiredSkills.join(", "),
      studentValue: matchedSkills.length > 0 ? matchedSkills.join(", ") : "None matched yet",
    });
  }

  // Determine overall status
  const hasIncomplete = checks.some((c) => c.passed === null);
  const hasHardFail = checks.some(
    (c) => (c.criterion === "DEPARTMENT" || c.criterion === "GRADUATION_YEAR" || c.criterion === "CGPA") && c.passed === false
  );

  if (hasIncomplete) {
    return {
      status: "INCOMPLETE_PROFILE",
      summary: "Unable to confirm eligibility — please update missing fields in your profile.",
      canApply: false,
      checks,
    };
  }

  if (hasHardFail) {
    return {
      status: "NOT_ELIGIBLE",
      summary: "You do not currently meet the stated eligibility criteria for this drive.",
      canApply: false,
      checks,
    };
  }

  return {
    status: "ELIGIBLE",
    summary: "You meet all configured eligibility criteria for this placement drive.",
    canApply: true,
    checks,
  };
}

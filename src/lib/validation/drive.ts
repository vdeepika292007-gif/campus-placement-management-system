import { z } from "zod";

export const driveRoundSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Round name is required"),
  roundType: z.enum([
    "ONLINE_ASSESSMENT",
    "TECHNICAL_INTERVIEW",
    "HR_INTERVIEW",
    "GROUP_DISCUSSION",
    "OTHER",
  ]),
  sequence: z.number().int().min(1),
  scheduledAt: z.string().optional().nullable(),
  description: z.string().trim().optional().nullable(),
});

export const driveSchema = z.object({
  companyId: z.string().min(1, "Please select a company"),
  title: z.string().trim().min(2, "Job title/role name is required").max(120),
  jobDescription: z.string().trim().min(10, "Job description must be at least 10 characters"),
  jobType: z.string().trim().optional().default("Full-time"),
  location: z.string().trim().optional().default("On-Campus"),
  salaryMin: z.coerce.number().min(0).optional().nullable(),
  salaryMax: z.coerce.number().min(0).optional().nullable(),
  salaryDisplay: z.string().trim().optional().nullable(),
  deadlineAt: z.string().min(1, "Application deadline is required"),
  status: z.enum(["DRAFT", "PUBLISHED", "CLOSED", "ARCHIVED"]).default("DRAFT"),
  eligibleBranches: z.array(z.string()).min(1, "Select at least one eligible academic department"),
  eligibleGradYears: z.array(z.coerce.number().int()).min(1, "Select at least one eligible graduation batch"),
  minimumCgpa: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z.number().min(0).max(10).nullable().optional()
  ),
  requiredSkills: z.array(z.string()).default([]),
  recruitmentRounds: z.array(driveRoundSchema).default([]),
});

export type DriveInput = z.infer<typeof driveSchema>;
export type DriveRoundInput = z.infer<typeof driveRoundSchema>;

import { z } from "zod";

export const updateStudentProfileSchema = z.object({
  department: z.string().trim().min(2, "Department/Branch is required"),
  graduationYear: z.coerce
    .number()
    .int("Graduation year must be an integer")
    .min(2020, "Graduation year must be 2020 or later")
    .max(2035, "Graduation year must be 2035 or earlier"),
  cgpa: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? null : Number(val)),
    z
      .number()
      .min(0, "CGPA cannot be negative")
      .max(10, "CGPA cannot exceed 10.0")
      .nullable()
      .optional()
  ),
  skills: z
    .array(z.string().trim().min(1))
    .or(
      z.string().transform((val) =>
        val
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      )
    ),
  phone: z.string().trim().optional().nullable(),
  studentNumber: z.string().trim().optional().nullable(),
  resumeReference: z
    .string()
    .trim()
    .url("Must be a valid URL (e.g., Google Drive or portfolio link)")
    .optional()
    .nullable()
    .or(z.literal("")),
});

export type UpdateStudentProfileInput = z.infer<typeof updateStudentProfileSchema>;

/**
 * Calculates student profile completion percentage (0 to 100%)
 */
export function calculateProfileCompleteness(profile: {
  department?: string | null;
  graduationYear?: number | null;
  cgpa?: number | null;
  skills?: string[] | null;
  studentNumber?: string | null;
  resumeReference?: string | null;
  phone?: string | null;
}): { percentage: number; missingFields: string[] } {
  const fields = [
    { name: "Department / Branch", isComplete: !!profile.department },
    { name: "Graduation Year", isComplete: !!profile.graduationYear },
    { name: "CGPA", isComplete: profile.cgpa !== null && profile.cgpa !== undefined },
    { name: "Key Skills", isComplete: Array.isArray(profile.skills) && profile.skills.length > 0 },
    { name: "Student ID", isComplete: !!profile.studentNumber },
    { name: "Resume / Portfolio Reference", isComplete: !!profile.resumeReference },
  ];

  const completedCount = fields.filter((f) => f.isComplete).length;
  const percentage = Math.round((completedCount / fields.length) * 100);
  const missingFields = fields.filter((f) => !f.isComplete).map((f) => f.name);

  return { percentage, missingFields };
}

import { z } from "zod";

export const companySchema = z.object({
  name: z.string().trim().min(2, "Company name must be at least 2 characters").max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters"),
  website: z
    .string()
    .trim()
    .url("Must be a valid website URL (starting with http:// or https://)")
    .optional()
    .nullable()
    .or(z.literal("")),
  industry: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  logoUrl: z
    .string()
    .trim()
    .url("Must be a valid image URL (starting with http:// or https://)")
    .optional()
    .nullable()
    .or(z.literal("")),
  companySize: z.string().trim().optional().nullable(),
  isArchived: z.boolean().optional(),
});

export type CompanyInput = z.infer<typeof companySchema>;

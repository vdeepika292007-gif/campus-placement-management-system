import { z } from "zod";

export const signInSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please provide a valid email address")
    .toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const registerStudentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Full name must be at least 2 characters")
    .max(100, "Name is too long"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Please enter a valid college or personal email")
    .toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Za-z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  department: z.string().trim().min(2, "Department/Branch is required"),
  graduationYear: z.coerce
    .number()
    .int("Graduation year must be a valid year")
    .min(2020, "Year must be 2020 or later")
    .max(2035, "Year must be 2035 or earlier"),
  studentNumber: z.string().trim().optional(),
  phone: z.string().trim().optional(),
});

export type RegisterStudentInput = z.infer<typeof registerStudentSchema>;

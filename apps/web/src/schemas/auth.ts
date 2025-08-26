import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  remember: z.boolean().optional().default(true),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(32, "Username cannot exceed 32 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirm: z.string().min(6, "Confirm password must be at least 6 characters"),
    agree: z
      .boolean()
      .refine((v) => v === true, {
        message: "Please agree to the Terms and Privacy Policy.",
      }),
  })
  .superRefine((vals, ctx) => {
    if (vals.password !== vals.confirm) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirm"],
        message: "Passwords do not match.",
      });
    }
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

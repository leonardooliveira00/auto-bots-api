import z from "zod";

export const createTaskSchema = z.object({
  title: z.string().max(24),
  description: z.string().max(48),
  completed: z.boolean(),
  userId: z.int(),
});

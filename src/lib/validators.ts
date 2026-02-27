import { z } from "zod";

export const analyzeSchema = z.object({
  url: z.string().url().refine((u) => {
    const p = new URL(u);
    return p.protocol === "http:" || p.protocol === "https:";
  }, "Only http/https URLs are allowed"),
});

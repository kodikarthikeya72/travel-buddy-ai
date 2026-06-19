import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: { message: err.errors[0]?.message ?? "Invalid input" } });
  }
  const e = err as { status?: number; message?: string };
  const status = e.status ?? 500;
  const message = e.message ?? "Server error";
  if (status >= 500) console.error(err);
  res.status(status).json({ error: { message } });
}
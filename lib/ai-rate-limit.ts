// Daily AI call limiter per teacher. Resets at midnight automatically.
// Limit is configurable via AI_DAILY_LIMIT env var (default: 50).

const LIMIT = Number(process.env.AI_DAILY_LIMIT ?? 50);

const dailyCalls = new Map<string, { count: number; date: string }>();

function today(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC
}

export function checkAiRateLimit(teacherId: string): boolean {
  const date = today();
  const entry = dailyCalls.get(teacherId);

  if (!entry || entry.date !== date) {
    dailyCalls.set(teacherId, { count: 1, date });
    return true;
  }

  if (entry.count >= LIMIT) return false;

  entry.count++;
  return true;
}

export function remainingAiCalls(teacherId: string): number {
  const entry = dailyCalls.get(teacherId);
  if (!entry || entry.date !== today()) return LIMIT;
  return Math.max(0, LIMIT - entry.count);
}

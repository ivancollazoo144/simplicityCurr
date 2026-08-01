import fs from "fs";
import path from "path";

const LOG_FILE = path.join(process.cwd(), "logs", "app.log");

function write(level: string, message: string, extra?: unknown) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    ...(extra !== undefined && { extra }),
  });
  // Always write to stderr so it appears in VPS process logs
  process.stderr.write(line + "\n");
  // Also append to file when not in test env
  if (process.env.NODE_ENV !== "test") {
    try {
      fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
      fs.appendFileSync(LOG_FILE, line + "\n");
    } catch {
      // Non-fatal — file write failure must not crash the request
    }
  }
}

export const logger = {
  info: (message: string, extra?: unknown) => write("info", message, extra),
  warn: (message: string, extra?: unknown) => write("warn", message, extra),
  error: (message: string, extra?: unknown) => write("error", message, extra),
};

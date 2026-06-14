import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/app/generated/prisma/client";

// Prisma 7 requiere un driver adapter. Usamos better-sqlite3 sobre el archivo local.
const url = process.env.DATABASE_URL ?? "file:./dev.db";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: new PrismaBetterSqlite3({ url }) });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

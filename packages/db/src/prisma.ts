import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// --- LOCAL DEV (SQLite) ---
// import path from "path";
// import Database from "better-sqlite3";
// import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
// const dbPath = path.resolve(__dirname, "..", "dev.db");
// const sqlite = new Database(dbPath);
// const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });

// --- PRODUCTION (Postgres / Neon) ---
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

export const prisma = new PrismaClient({ adapter });

import path from "path";
import Database from "better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// dev.db is located at: packages/db/dev.db
const dbPath = path.resolve(__dirname, "..", "dev.db");
const sqlite = new Database(dbPath);

// Prisma v7 requires an adapter for direct DB connections
const adapter = new PrismaBetterSqlite3({
    url: `file:${dbPath}`,
});

export const prisma = new PrismaClient({ adapter });

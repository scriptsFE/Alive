import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });

// Ensure column exists with fallback handling
export async function ensureYearColumn() {
  try {
    // First check if column exists
    const checkResult = await pool.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'accounts' AND column_name = 'year'
    `);
    
    if (checkResult.rows.length === 0) {
      console.log("[db] Adding missing 'year' column to accounts table...");
      try {
        await pool.query(`
          ALTER TABLE accounts ADD COLUMN year INTEGER NOT NULL DEFAULT 2026
        `);
        console.log("[db] Column 'year' added successfully");
      } catch (addError: any) {
        // If column already exists (race condition), that's fine
        if (addError?.code === '42701') {
          console.log("[db] Column 'year' already exists");
        } else {
          throw addError;
        }
      }
    } else {
      console.log("[db] Column 'year' already exists");
    }
  } catch (error) {
    console.error("[db] Error ensuring year column:", error);
    // Continue anyway - the error will show up in API calls
  }
}
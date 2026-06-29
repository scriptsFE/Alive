import { db, pool } from "./db";
import { accounts, type Account, type InsertAccount } from "@shared/schema";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  getAccounts(): Promise<Account[]>;
  getAccount(id: number): Promise<Account | undefined>;
  getAccountsByYear(year: number): Promise<Account[]>;
  getUnusedAccount(): Promise<Account | undefined>;
  getUnusedAccountByYear(year: number): Promise<Account | undefined>;
  createAccount(account: InsertAccount): Promise<Account>;
  markAccountUsed(id: number): Promise<void>;
  deleteAccount(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts);
  }

  async getAccount(id: number): Promise<Account | undefined> {
    const [acc] = await db.select().from(accounts).where(eq(accounts.id, id));
    return acc;
  }

  async getAccountsByYear(year: number): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.year, year));
  }

  // Atomic: selects AND marks as used in one SQL statement to prevent race conditions
  async getUnusedAccount(): Promise<Account | undefined> {
    const result = await pool.query<Account>(`
      UPDATE accounts SET is_used = true
      WHERE id = (
        SELECT id FROM accounts WHERE is_used = false ORDER BY id LIMIT 1
      )
      RETURNING id, username, password, cookie, year, is_used AS "isUsed", created_at AS "createdAt"
    `);
    return result.rows[0];
  }

  async getUnusedAccountByYear(year: number): Promise<Account | undefined> {
    const result = await pool.query<Account>(`
      UPDATE accounts SET is_used = true
      WHERE id = (
        SELECT id FROM accounts WHERE is_used = false AND year = $1 ORDER BY id LIMIT 1
      )
      RETURNING id, username, password, cookie, year, is_used AS "isUsed", created_at AS "createdAt"
    `, [year]);
    return result.rows[0];
  }

  async createAccount(insertAccount: InsertAccount): Promise<Account> {
    const [acc] = await db.insert(accounts).values(insertAccount).returning();
    return acc;
  }

  async markAccountUsed(id: number): Promise<void> {
    await db.update(accounts).set({ isUsed: true }).where(eq(accounts.id, id));
  }

  async deleteAccount(id: number): Promise<void> {
    await db.delete(accounts).where(eq(accounts.id, id));
  }
}

export const storage = new DatabaseStorage();
import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { initBot, isBotOnline, botClient } from "./bot";
import { ensureYearColumn } from "./db";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  // Ensure database schema is updated BEFORE handling requests
  console.log("[routes] Ensuring database schema is up to date...");
  await ensureYearColumn();
  console.log("[routes] Database schema check complete");

  // Start Discord Bot
  initBot().catch(console.error);

  app.get(api.accounts.list.path, async (req, res) => {
    const accounts = await storage.getAccounts();
    res.json(accounts);
  });

  app.post(api.accounts.create.path, async (req, res) => {
    try {
      const input = api.accounts.create.input.parse(req.body);
      const account = await storage.createAccount(input);
      res.status(201).json(account);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      throw err;
    }
  });

  app.delete(api.accounts.delete.path, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const account = await storage.getAccount(id);
      if (!account) {
        return res.status(404).json({ message: "Account not found" });
      }
      await storage.deleteAccount(id);
      res.status(204).send();
    } catch (err) {
      throw err;
    }
  });

  app.get(api.bot.status.path, async (req, res) => {
    res.json({
      online: isBotOnline,
      username: botClient.user?.tag || "Bot offline"
    });
  });

  return httpServer;
}
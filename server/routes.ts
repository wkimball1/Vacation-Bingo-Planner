import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBingoProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  app.post("/api/auth/setup", async (req, res) => {
    try {
      const schema = z.object({ player: z.enum(["him", "her"]), pin: z.string().min(4).max(8) });
      const { player, pin } = schema.parse(req.body);

      const existing = await storage.getPlayerPin(player);
      if (existing) {
        return res.status(409).json({ message: "PIN already set for this player" });
      }

      const result = await storage.createPlayerPin({ player, pin, shared: false });
      res.json({ player: result.player, shared: result.shared });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "PIN must be 4-8 characters", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to set up PIN" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const schema = z.object({ player: z.enum(["him", "her"]), pin: z.string() });
      const { player, pin } = schema.parse(req.body);

      const record = await storage.getPlayerPin(player);
      if (!record) {
        return res.status(404).json({ message: "No PIN set for this player. Set one up first." });
      }

      if (record.pin !== pin) {
        return res.status(401).json({ message: "Wrong PIN" });
      }

      res.json({ player: record.player, shared: record.shared });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  app.get("/api/auth/status/:player", async (req, res) => {
    try {
      const { player } = req.params;
      const record = await storage.getPlayerPin(player);
      res.json({ hasPin: !!record, shared: record?.shared ?? false });
    } catch (error) {
      res.status(500).json({ message: "Failed to get status" });
    }
  });

  app.patch("/api/auth/share/:player", async (req, res) => {
    try {
      const { player } = req.params;
      const schema = z.object({ shared: z.boolean() });
      const { shared } = schema.parse(req.body);

      const result = await storage.updatePlayerShared(player, shared);
      if (!result) {
        return res.status(404).json({ message: "Player not found" });
      }
      res.json({ player: result.player, shared: result.shared });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data" });
      }
      res.status(500).json({ message: "Failed to update sharing" });
    }
  });

  app.get("/api/progress/:player/:nightId", async (req, res) => {
    try {
      const { player, nightId } = req.params;
      const progress = await storage.getProgress(player, nightId);
      res.json(progress);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch progress" });
    }
  });

  app.post("/api/progress", async (req, res) => {
    try {
      const data = insertBingoProgressSchema.parse(req.body);
      const result = await storage.upsertProgress(data);
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save progress" });
      }
    }
  });

  app.get("/api/secrets/:player/:nightId", async (req, res) => {
    try {
      const { player, nightId } = req.params;
      const secrets = await storage.getSecrets(player, nightId);
      res.json(secrets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch secrets" });
    }
  });

  app.patch("/api/secrets/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const schema = z.object({ checked: z.boolean() });
      const { checked } = schema.parse(req.body);
      const result = await storage.updateSecretChecked(id, checked);
      if (!result) {
        return res.status(404).json({ message: "Secret square not found" });
      }
      res.json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to update secret" });
      }
    }
  });

  return httpServer;
}

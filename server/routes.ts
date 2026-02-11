import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBingoProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {
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

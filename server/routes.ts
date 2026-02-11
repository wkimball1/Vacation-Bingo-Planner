import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertBingoProgressSchema, type BingoSquare } from "@shared/schema";
import { z } from "zod";
import OpenAI from "openai";
import { isAuthenticated } from "./replit_integrations/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express,
): Promise<Server> {

  app.get("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { status } = req.query;
      let games;
      if (status === "active") {
        games = await storage.getActiveGames(userId);
      } else if (status === "completed") {
        games = await storage.getCompletedGames(userId);
      } else {
        games = await storage.getAllGames(userId);
      }
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  app.get("/api/games/templates", async (req, res) => {
    try {
      const templates = await storage.getTemplates();
      res.json(templates);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch templates" });
    }
  });

  app.get("/api/games/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getPlayerStats(userId);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.get("/api/games/:id", async (req, res) => {
    try {
      const game = await storage.getGameById(req.params.id);
      if (!game) return res.status(404).json({ message: "Game not found" });
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  app.post("/api/games", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const schema = z.object({
        title: z.string().min(1),
        theme: z.string().min(1),
        gridSize: z.number().int().min(3).max(5),
        squares: z.array(z.object({ text: z.string(), description: z.string() })),
        rating: z.enum(["pg", "pg13", "r", "nc17"]).default("r"),
        mood: z.enum(["couples", "friends-trip", "party", "custom"]).default("couples"),
        player1Label: z.string().min(1).max(20).default("Him"),
        player2Label: z.string().min(1).max(20).default("Her"),
        betDescription: z.string().default(""),
        isTemplate: z.boolean().default(false),
      });
      const data = schema.parse(req.body);
      const game = await storage.createGame({
        ...data,
        userId,
        status: "active",
        winner: null,
      });
      res.status(201).json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid game data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create game" });
    }
  });

  app.patch("/api/games/:id", async (req, res) => {
    try {
      const schema = z.object({
        title: z.string().min(1).optional(),
        theme: z.string().min(1).optional(),
        gridSize: z.number().int().min(3).max(5).optional(),
        squares: z.array(z.object({ text: z.string(), description: z.string() })).optional(),
        rating: z.enum(["pg", "pg13", "r", "nc17"]).optional(),
        mood: z.enum(["couples", "friends-trip", "party", "custom"]).optional(),
        player1Label: z.string().min(1).max(20).optional(),
        player2Label: z.string().min(1).max(20).optional(),
        betDescription: z.string().optional(),
      });
      const data = schema.parse(req.body);
      const game = await storage.updateGame(req.params.id, data);
      if (!game) return res.status(404).json({ message: "Game not found" });
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update game" });
    }
  });

  app.delete("/api/games/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const game = await storage.getGameById(req.params.id);
      if (!game) return res.status(404).json({ message: "Game not found" });
      if (game.userId && game.userId !== userId) {
        return res.status(403).json({ message: "Not your game" });
      }
      await storage.deleteGame(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete game" });
    }
  });

  app.post("/api/games/:id/duplicate", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const original = await storage.getGameById(req.params.id);
      if (!original) return res.status(404).json({ message: "Game not found" });
      const game = await storage.createGame({
        title: `${original.title} (copy)`,
        theme: original.theme,
        gridSize: original.gridSize,
        squares: original.squares,
        rating: original.rating,
        mood: original.mood,
        player1Label: original.player1Label,
        player2Label: original.player2Label,
        betDescription: original.betDescription,
        userId,
        status: "active",
        winner: null,
        isTemplate: false,
      });
      res.status(201).json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to duplicate game" });
    }
  });

  app.post("/api/games/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const game = await storage.getGameById(req.params.id);
      if (!game) return res.status(404).json({ message: "Game not found" });
      if (game.isTemplate) {
        return res.status(400).json({ message: "Cannot join a template" });
      }
      if (game.userId === userId) {
        return res.status(400).json({ message: "You already own this game" });
      }
      if (game.partnerId && game.partnerId !== userId) {
        return res.status(400).json({ message: "This game already has a partner" });
      }
      if (game.partnerId === userId) {
        return res.json(game);
      }
      const updated = await storage.setGamePartner(req.params.id, userId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to join game" });
    }
  });

  app.patch("/api/games/:id/winner", async (req, res) => {
    try {
      const schema = z.object({ winner: z.enum(["him", "her", "tie"]) });
      const { winner } = schema.parse(req.body);
      const game = await storage.setGameWinner(req.params.id, winner);
      if (!game) return res.status(404).json({ message: "Game not found" });
      res.json(game);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data" });
      }
      res.status(500).json({ message: "Failed to set winner" });
    }
  });

  app.post("/api/ai/suggestions", async (req, res) => {
    try {
      const schema = z.object({
        theme: z.string().min(1),
        count: z.number().int().min(1).max(25).default(9),
        existing: z.array(z.string()).default([]),
        rating: z.enum(["pg", "pg13", "r", "nc17"]).default("r"),
        mood: z.enum(["couples", "friends-trip", "party", "custom"]).default("couples"),
      });
      const { theme, count, existing, rating, mood } = schema.parse(req.body);

      const existingText = existing.length > 0
        ? `\nAlready used (do NOT repeat these): ${existing.join(", ")}`
        : "";

      const ratingGuide: Record<string, string> = {
        pg: "Keep suggestions sweet, wholesome, and family-friendly. Focus on cute romantic gestures, hand holding, compliments, and innocent fun. Nothing sexual or suggestive.",
        pg13: "Keep suggestions flirty and playful but tasteful. Light innuendo is okay but nothing explicit. Think romantic comedy vibes — stolen glances, lingering touches, whispered compliments.",
        r: "Be playful, flirty, and R-rated but public-safe. Suggestive humor, teasing, and spicy moments are great. Keep it fun without being graphic or explicit.",
        nc17: "Go all out — explicit, steamy, and unapologetically sexual. No limits on suggestiveness. These are for behind closed doors. Be creative, bold, and detailed in descriptions.",
      };

      const moodGuide: Record<string, string> = {
        couples: "This is for a romantic couple. Focus on relationship moments, intimacy, romance, and couple activities.",
        "friends-trip": "This is for a friend group on a trip together. Focus on group adventures, travel moments, funny friend dynamics, inside jokes, and shared experiences. NOT romantic.",
        party: "This is for a party or social gathering. Focus on party games, social dares, group challenges, and fun party moments. Keep it social and group-oriented.",
        custom: "This could be for any group. Focus on the theme provided and make suggestions versatile.",
      };

      const response = await openai.chat.completions.create({
        model: "gpt-5-mini",
        messages: [
          {
            role: "user",
            content: `Generate exactly ${count} fun, creative bingo square ideas for a bingo card with the theme: "${theme}". Each square should have a short title (2-6 words) and a brief description.

${moodGuide[mood]}

${ratingGuide[rating]}${existingText}

Respond ONLY with JSON in this exact format:
{"squares": [{"text": "short square text", "description": "brief explanation"}]}`,
          },
        ],
        response_format: { type: "json_object" },
        max_completion_tokens: 2048,
      });

      const content = response.choices[0]?.message?.content || "{}";
      const parsed = JSON.parse(content);
      let squares: BingoSquare[] = [];
      const arr = parsed.squares || Object.values(parsed).find(Array.isArray) || [];
      squares = (arr as any[]).map((s: any) => ({
        text: s.text || s.title || "",
        description: s.description || s.desc || "",
      })).filter((s: BingoSquare) => s.text).slice(0, count);
      res.json({ squares });
    } catch (error) {
      console.error("AI suggestion error:", error);
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  app.post("/api/ai/bet-suggestion", async (req, res) => {
    try {
      const schema = z.object({
        theme: z.string().default(""),
        rating: z.enum(["pg", "pg13", "r", "nc17"]).default("r"),
        mood: z.enum(["couples", "friends-trip", "party", "custom"]).default("couples"),
        count: z.number().int().min(1).max(10).default(5),
      });
      const { theme, rating, mood, count } = schema.parse(req.body);

      const ratingGuide: Record<string, string> = {
        pg: "Keep bets sweet and wholesome. Examples: winner picks the movie, loser makes dinner, winner gets breakfast in bed.",
        pg13: "Keep bets flirty and playful. Examples: loser gives winner a massage, winner picks the next date, loser has to serenade the winner.",
        r: "Make bets spicy and suggestive but not explicit. Teasing, playful punishments, and bold dares.",
        nc17: "Go all out with explicit, steamy bets. No limits. Be creative and bold.",
      };

      const moodGuide: Record<string, string> = {
        couples: "These bets are between romantic partners.",
        "friends-trip": "These bets are between friends on a trip. Think fun group dares, buying drinks, embarrassing challenges.",
        party: "These bets are for a party. Think social dares, group challenges, party penalties.",
        custom: "Make bets versatile for any group.",
      };

      const themeContext = theme ? ` The game theme is "${theme}".` : "";

      const extractBets = (obj: any): string[] => {
        for (const val of Object.values(obj)) {
          if (Array.isArray(val)) {
            return val.map((b: any) => typeof b === "string" ? b : b.text || b.description || b.bet || String(b)).filter(Boolean);
          }
        }
        return [];
      };

      const maxAttempts = 3;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const response = await openai.chat.completions.create({
          model: "gpt-5-mini",
          messages: [
            {
              role: "system",
              content: "You are a creative bet idea generator for bingo games. You always respond with valid JSON containing an array of bet ideas.",
            },
            {
              role: "user",
              content: `Generate exactly ${count} fun bet ideas for a bingo game. Each bet should be a short, punchy sentence describing what the winner gets or the loser must do.

Context: ${moodGuide[mood]}
Tone: ${ratingGuide[rating]}${themeContext}

IMPORTANT: You must respond with valid JSON in exactly this format:
{"bets": ["Winner picks the restaurant tonight", "Loser gives a 10-minute massage", "Winner gets breakfast in bed"]}

Generate ${count} bets now:`,
            },
          ],
          response_format: { type: "json_object" },
          max_completion_tokens: 1024,
        });

        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        const bets = extractBets(parsed);
        if (bets.length > 0) {
          return res.json({ bets: bets.slice(0, count) });
        }
      }

      res.json({ bets: [] });
    } catch (error) {
      console.error("AI bet suggestion error:", error);
      res.status(500).json({ message: "Failed to generate bet suggestions" });
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
      if (!result) return res.status(404).json({ message: "Secret square not found" });
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

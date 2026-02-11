import {
  type BingoGame,
  type InsertBingoGame,
  type BingoProgress,
  type InsertBingoProgress,
  type SecretSquare,
  type InsertSecretSquare,
  type PlayerPin,
  type InsertPlayerPin,
  bingoGames,
  bingoProgress,
  secretSquares,
  playerPins,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  getAllGames(): Promise<BingoGame[]>;
  getActiveGames(): Promise<BingoGame[]>;
  getCompletedGames(): Promise<BingoGame[]>;
  getTemplates(): Promise<BingoGame[]>;
  getGameById(id: string): Promise<BingoGame | undefined>;
  createGame(data: InsertBingoGame): Promise<BingoGame>;
  updateGame(id: string, data: Partial<InsertBingoGame>): Promise<BingoGame | undefined>;
  deleteGame(id: string): Promise<void>;
  setGameWinner(id: string, winner: string): Promise<BingoGame | undefined>;
  getPlayerStats(): Promise<{ him: number; her: number }>;

  getProgress(player: string, nightId: string): Promise<BingoProgress[]>;
  upsertProgress(data: InsertBingoProgress): Promise<BingoProgress>;
  getSecrets(player: string, nightId: string): Promise<SecretSquare[]>;
  getSecretById(id: string): Promise<SecretSquare | undefined>;
  createSecret(data: InsertSecretSquare): Promise<SecretSquare>;
  updateSecretChecked(id: string, checked: boolean): Promise<SecretSquare | undefined>;
  getSecretsByPlayer(player: string): Promise<SecretSquare[]>;
  getPlayerPin(player: string): Promise<PlayerPin | undefined>;
  createPlayerPin(data: InsertPlayerPin): Promise<PlayerPin>;
  updatePlayerShared(player: string, shared: boolean): Promise<PlayerPin | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getAllGames(): Promise<BingoGame[]> {
    return db.select().from(bingoGames).where(eq(bingoGames.isTemplate, false)).orderBy(desc(bingoGames.createdAt));
  }

  async getActiveGames(): Promise<BingoGame[]> {
    return db.select().from(bingoGames).where(and(eq(bingoGames.status, "active"), eq(bingoGames.isTemplate, false))).orderBy(desc(bingoGames.createdAt));
  }

  async getCompletedGames(): Promise<BingoGame[]> {
    return db.select().from(bingoGames).where(and(eq(bingoGames.status, "completed"), eq(bingoGames.isTemplate, false))).orderBy(desc(bingoGames.completedAt));
  }

  async getTemplates(): Promise<BingoGame[]> {
    return db.select().from(bingoGames).where(eq(bingoGames.isTemplate, true)).orderBy(bingoGames.title);
  }

  async getGameById(id: string): Promise<BingoGame | undefined> {
    const [result] = await db.select().from(bingoGames).where(eq(bingoGames.id, id));
    return result;
  }

  async createGame(data: InsertBingoGame): Promise<BingoGame> {
    const [created] = await db.insert(bingoGames).values(data).returning();
    return created;
  }

  async updateGame(id: string, data: Partial<InsertBingoGame>): Promise<BingoGame | undefined> {
    const [updated] = await db.update(bingoGames).set(data).where(eq(bingoGames.id, id)).returning();
    return updated;
  }

  async deleteGame(id: string): Promise<void> {
    await db.delete(bingoProgress).where(eq(bingoProgress.nightId, id));
    await db.delete(secretSquares).where(eq(secretSquares.nightId, id));
    await db.delete(bingoGames).where(eq(bingoGames.id, id));
  }

  async setGameWinner(id: string, winner: string): Promise<BingoGame | undefined> {
    const [updated] = await db.update(bingoGames).set({
      winner,
      status: "completed",
      completedAt: new Date(),
    }).where(eq(bingoGames.id, id)).returning();
    return updated;
  }

  async getPlayerStats(): Promise<{ him: number; her: number }> {
    const results = await db.select({
      winner: bingoGames.winner,
      count: sql<number>`count(*)::int`,
    }).from(bingoGames).where(and(eq(bingoGames.status, "completed"), eq(bingoGames.isTemplate, false))).groupBy(bingoGames.winner);

    let him = 0;
    let her = 0;
    for (const r of results) {
      if (r.winner === "him") him = r.count;
      if (r.winner === "her") her = r.count;
    }
    return { him, her };
  }

  async getProgress(player: string, nightId: string): Promise<BingoProgress[]> {
    return db.select().from(bingoProgress).where(and(eq(bingoProgress.player, player), eq(bingoProgress.nightId, nightId)));
  }

  async upsertProgress(data: InsertBingoProgress): Promise<BingoProgress> {
    const existing = await db.select().from(bingoProgress).where(
      and(eq(bingoProgress.player, data.player), eq(bingoProgress.nightId, data.nightId), eq(bingoProgress.squareIndex, data.squareIndex)),
    );
    if (existing.length > 0) {
      const [updated] = await db.update(bingoProgress).set({ checked: data.checked }).where(eq(bingoProgress.id, existing[0].id)).returning();
      return updated;
    }
    const [created] = await db.insert(bingoProgress).values(data).returning();
    return created;
  }

  async getSecrets(player: string, nightId: string): Promise<SecretSquare[]> {
    return db.select().from(secretSquares).where(and(eq(secretSquares.player, player), eq(secretSquares.nightId, nightId)));
  }

  async getSecretById(id: string): Promise<SecretSquare | undefined> {
    const [result] = await db.select().from(secretSquares).where(eq(secretSquares.id, id));
    return result;
  }

  async createSecret(data: InsertSecretSquare): Promise<SecretSquare> {
    const [created] = await db.insert(secretSquares).values(data).returning();
    return created;
  }

  async updateSecretChecked(id: string, checked: boolean): Promise<SecretSquare | undefined> {
    const [updated] = await db.update(secretSquares).set({ checked }).where(eq(secretSquares.id, id)).returning();
    return updated;
  }

  async getSecretsByPlayer(player: string): Promise<SecretSquare[]> {
    return db.select().from(secretSquares).where(eq(secretSquares.player, player));
  }

  async getPlayerPin(player: string): Promise<PlayerPin | undefined> {
    const [result] = await db.select().from(playerPins).where(eq(playerPins.player, player));
    return result;
  }

  async createPlayerPin(data: InsertPlayerPin): Promise<PlayerPin> {
    const [created] = await db.insert(playerPins).values(data).returning();
    return created;
  }

  async updatePlayerShared(player: string, shared: boolean): Promise<PlayerPin | undefined> {
    const [updated] = await db.update(playerPins).set({ shared }).where(eq(playerPins.player, player)).returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

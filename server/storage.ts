import {
  type BingoProgress,
  type InsertBingoProgress,
  type SecretSquare,
  type InsertSecretSquare,
  type PlayerPin,
  type InsertPlayerPin,
  bingoProgress,
  secretSquares,
  playerPins,
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
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
  async getProgress(player: string, nightId: string): Promise<BingoProgress[]> {
    return db
      .select()
      .from(bingoProgress)
      .where(and(eq(bingoProgress.player, player), eq(bingoProgress.nightId, nightId)));
  }

  async upsertProgress(data: InsertBingoProgress): Promise<BingoProgress> {
    const existing = await db
      .select()
      .from(bingoProgress)
      .where(
        and(
          eq(bingoProgress.player, data.player),
          eq(bingoProgress.nightId, data.nightId),
          eq(bingoProgress.squareIndex, data.squareIndex),
        ),
      );

    if (existing.length > 0) {
      const [updated] = await db
        .update(bingoProgress)
        .set({ checked: data.checked })
        .where(eq(bingoProgress.id, existing[0].id))
        .returning();
      return updated;
    }

    const [created] = await db.insert(bingoProgress).values(data).returning();
    return created;
  }

  async getSecrets(player: string, nightId: string): Promise<SecretSquare[]> {
    return db
      .select()
      .from(secretSquares)
      .where(and(eq(secretSquares.player, player), eq(secretSquares.nightId, nightId)));
  }

  async getSecretById(id: string): Promise<SecretSquare | undefined> {
    const [result] = await db
      .select()
      .from(secretSquares)
      .where(eq(secretSquares.id, id));
    return result;
  }

  async createSecret(data: InsertSecretSquare): Promise<SecretSquare> {
    const [created] = await db.insert(secretSquares).values(data).returning();
    return created;
  }

  async updateSecretChecked(id: string, checked: boolean): Promise<SecretSquare | undefined> {
    const [updated] = await db
      .update(secretSquares)
      .set({ checked })
      .where(eq(secretSquares.id, id))
      .returning();
    return updated;
  }

  async getSecretsByPlayer(player: string): Promise<SecretSquare[]> {
    return db
      .select()
      .from(secretSquares)
      .where(eq(secretSquares.player, player));
  }

  async getPlayerPin(player: string): Promise<PlayerPin | undefined> {
    const [result] = await db
      .select()
      .from(playerPins)
      .where(eq(playerPins.player, player));
    return result;
  }

  async createPlayerPin(data: InsertPlayerPin): Promise<PlayerPin> {
    const [created] = await db.insert(playerPins).values(data).returning();
    return created;
  }

  async updatePlayerShared(player: string, shared: boolean): Promise<PlayerPin | undefined> {
    const [updated] = await db
      .update(playerPins)
      .set({ shared })
      .where(eq(playerPins.player, player))
      .returning();
    return updated;
  }
}

export const storage = new DatabaseStorage();

import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bingoProgress = pgTable("bingo_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  player: text("player").notNull(),
  nightId: text("night_id").notNull(),
  squareIndex: integer("square_index").notNull(),
  checked: boolean("checked").notNull().default(false),
});

export const secretSquares = pgTable("secret_squares", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  player: text("player").notNull(),
  nightId: text("night_id").notNull(),
  text: text("text").notNull(),
  description: text("description").notNull(),
  checked: boolean("checked").notNull().default(false),
});

export const playerPins = pgTable("player_pins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  player: text("player").notNull().unique(),
  pin: text("pin").notNull(),
  shared: boolean("shared").notNull().default(false),
});

export const insertBingoProgressSchema = createInsertSchema(bingoProgress).omit({ id: true });
export const insertSecretSquareSchema = createInsertSchema(secretSquares).omit({ id: true });
export const insertPlayerPinSchema = createInsertSchema(playerPins).omit({ id: true });

export type BingoProgress = typeof bingoProgress.$inferSelect;
export type InsertBingoProgress = z.infer<typeof insertBingoProgressSchema>;
export type SecretSquare = typeof secretSquares.$inferSelect;
export type InsertSecretSquare = z.infer<typeof insertSecretSquareSchema>;
export type PlayerPin = typeof playerPins.$inferSelect;
export type InsertPlayerPin = z.infer<typeof insertPlayerPinSchema>;

export interface BingoSquare {
  text: string;
  description: string;
}

export interface BingoNight {
  id: string;
  title: string;
  theme: string;
  gridSize: number;
  squares: BingoSquare[];
  betDescription: string;
}

export const BINGO_NIGHTS: BingoNight[] = [
  {
    id: "thursday",
    title: "Thursday Night",
    theme: "Cute in public, tension building",
    gridSize: 3,
    squares: [
      { text: "Slow dance a little too close", description: "Dancing with minimal personal space; innocent but intimate." },
      { text: "Compliment whispered in ear", description: "Private praise said quietly so only your partner hears." },
      { text: "Hand on waist longer than needed", description: "A touch that lingers just enough to feel intentional." },
      { text: '"Later" said quietly', description: "A subtle promise of what's coming after." },
      { text: "One of us blushes", description: "Visible reaction to flirting or attention." },
      { text: "Eye contact + smile during a song", description: "Shared moment without words." },
      { text: "Overdressed parent spotted", description: "Another adult clearly trying too hard at the event." },
      { text: "Kid side-eye moment", description: "A child judging adult behavior." },
      { text: "First real kiss once alone", description: "The first uninterrupted kiss after leaving the public space." },
    ],
    betDescription: "Winner chooses how the night ends (movie, couch, bedroom, pace).",
  },
  {
    id: "friday",
    title: "Friday",
    theme: "Us vs. Them (people-watching + flirting)",
    gridSize: 4,
    squares: [
      { text: "Sneaky butt squeeze", description: "Quick, discreet grab in a crowd." },
      { text: "Hand on thigh full ride", description: "Hand stays planted for the entire ride duration." },
      { text: "Whisper something dirty", description: "Sexual or suggestive comment kept vague and quiet." },
      { text: "Kiss that lingers", description: "Longer than socially normal." },
      { text: "Aggressive PDA spotted", description: "Another couple being very affectionate in public." },
      { text: "Couple arguing in line", description: "Audible tension between strangers." },
      { text: "Honeymoon vibes", description: "Couple clearly obsessed with each other." },
      { text: "Overheard flirting", description: "Strangers flirting nearby." },
      { text: "Choose a dark ride on purpose", description: "Selecting a ride specifically for privacy." },
      { text: '"Behave" is said', description: "One partner jokingly telling the other to stop." },
      { text: "Ride photo glued together", description: "Bodies pressed together in the photo." },
      { text: "Someone stares at us", description: "Another guest notices your chemistry." },
      { text: "See PDA \u2192 copy it", description: "You mirror affection you just witnessed." },
      { text: '"At least we\'re not them"', description: "Comment after seeing awkward couple behavior." },
      { text: "Someone dressed wildly impractical", description: "Outfit clearly wrong for weather or walking." },
      { text: "Jealous side-eye moment", description: "One partner notices attention and reacts playfully." },
    ],
    betDescription: "1 bingo = pick next ride or drink\n2 bingos = 5-minute massage later\n3 bingos = winner controls the hotel night",
  },
  {
    id: "saturday",
    title: "Saturday Night",
    theme: "Intimate, confident, last full night",
    gridSize: 3,
    squares: [
      { text: "Nostalgia story \u2192 kiss", description: "Sharing a memory leads to affection." },
      { text: "Hand stays on thigh entire drive", description: "Sustained physical contact in the car." },
      { text: "Whisper a fantasy (vague)", description: "Suggestive future plan without graphic detail." },
      { text: '"Stop, people are watching"', description: "Acknowledging public boundaries." },
      { text: "Claim-your-partner moment", description: "Intentional affection after someone else notices." },
      { text: "Kiss that lasts too long", description: "Extended kissing in semi-public space." },
      { text: '"Hotel. Now." energy', description: "Clear urgency to leave." },
      { text: "We forget the plan", description: "Abandoning schedule due to chemistry." },
      { text: "Teasing promise made", description: "Specific flirtatious promise for later." },
    ],
    betDescription: "Bingo = winner decides how the night starts\nBlackout = phones away, lights optional\nTie = shower together, no talking",
  },
];

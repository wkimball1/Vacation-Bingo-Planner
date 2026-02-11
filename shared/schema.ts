import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const bingoGames = pgTable("bingo_games", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  theme: text("theme").notNull(),
  gridSize: integer("grid_size").notNull().default(3),
  squares: jsonb("squares").notNull().$type<BingoSquare[]>(),
  betDescription: text("bet_description").notNull().default(""),
  status: text("status").notNull().default("active"),
  winner: text("winner"),
  isTemplate: boolean("is_template").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  completedAt: timestamp("completed_at"),
});

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

export const insertBingoGameSchema = createInsertSchema(bingoGames).omit({ id: true, createdAt: true, completedAt: true });
export const insertBingoProgressSchema = createInsertSchema(bingoProgress).omit({ id: true });
export const insertSecretSquareSchema = createInsertSchema(secretSquares).omit({ id: true });
export const insertPlayerPinSchema = createInsertSchema(playerPins).omit({ id: true });

export type BingoGame = typeof bingoGames.$inferSelect;
export type InsertBingoGame = z.infer<typeof insertBingoGameSchema>;
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

export const GAME_TEMPLATES = [
  {
    title: "Date Night In",
    theme: "Cozy night at home together",
    gridSize: 3,
    squares: [
      { text: "Cook together", description: "Make a meal as a team" },
      { text: "Slow dance in the kitchen", description: "No music needed" },
      { text: "Share a dessert", description: "One spoon, two people" },
      { text: "Tell a secret", description: "Something you've never shared" },
      { text: "Give a massage", description: "At least 5 minutes" },
      { text: "Watch a sunset/sunrise", description: "From the window or porch" },
      { text: "Write a love note", description: "On paper, not a text" },
      { text: "Play a board game", description: "Winner picks the movie" },
      { text: "Phone-free hour", description: "Just the two of you" },
    ],
    betDescription: "Winner picks the movie and dessert.",
  },
  {
    title: "Road Trip",
    theme: "Adventure on the open road",
    gridSize: 3,
    squares: [
      { text: "Sing a duet", description: "Both of you, full volume" },
      { text: "Stop at a random exit", description: "Explore somewhere new" },
      { text: "Car karaoke battle", description: "Take turns picking songs" },
      { text: "Hand holding for 10 miles", description: "Keep count on the signs" },
      { text: "Take a silly selfie", description: "The weirder the better" },
      { text: "Share a childhood story", description: "One the other hasn't heard" },
      { text: "Try local food", description: "Something you've never had" },
      { text: "See a funny bumper sticker", description: "Read it out loud" },
      { text: "Make a wish at a landmark", description: "Bridge, tunnel, or sign" },
    ],
    betDescription: "Winner picks the next gas station snack.",
  },
  {
    title: "Beach Vacation",
    theme: "Sun, sand, and romance",
    gridSize: 4,
    squares: [
      { text: "Build a sandcastle", description: "Together, teamwork required" },
      { text: "Sunscreen each other", description: "Take your time" },
      { text: "Beach walk at sunset", description: "Hand in hand" },
      { text: "Share a frozen drink", description: "Two straws, one cup" },
      { text: "Spot a funny tan line", description: "On anyone at the beach" },
      { text: "Play in the waves", description: "Get fully soaked" },
      { text: "Find a cool shell", description: "Give it to your partner" },
      { text: "Take a nap together", description: "Under an umbrella" },
      { text: "Write names in the sand", description: "With a heart of course" },
      { text: "People-watch bingo", description: "Spot the stereotypes" },
      { text: "Ice cream date", description: "Let them taste yours" },
      { text: "Watch the sunrise", description: "Set an alarm together" },
      { text: "Compete at a water sport", description: "Loser buys dinner" },
      { text: "Secret underwater kiss", description: "If you can manage it" },
      { text: "Matching outfit moment", description: "Accidental or on purpose" },
      { text: "Stargazing after dark", description: "Find a constellation" },
    ],
    betDescription: "Winner picks the restaurant tonight.",
  },
  {
    title: "Stay-at-Home Weekend",
    theme: "Making the most of staying in",
    gridSize: 3,
    squares: [
      { text: "Breakfast in bed", description: "One of you makes it" },
      { text: "Build a blanket fort", description: "Go all out" },
      { text: "Try a new recipe", description: "Something neither has made" },
      { text: "Dance party for two", description: "Playlist required" },
      { text: "Deep conversation", description: "No phones, real talk" },
      { text: "Give compliments only", description: "For one full hour" },
      { text: "Photo shoot", description: "Take cute couple pics" },
      { text: "Learn something new", description: "Watch a tutorial together" },
      { text: "Candlelit anything", description: "Dinner, bath, or just vibes" },
    ],
    betDescription: "Winner gets to be the little spoon tonight.",
  },
];

export * from "./models/chat";

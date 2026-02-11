import { storage } from "./storage";
import { BINGO_NIGHTS, GAME_TEMPLATES } from "@shared/schema";

const DEFAULT_SECRET_SQUARES = [
  { player: "him", nightId: "thursday", text: "Make her laugh until she snorts", description: "Get a genuine, uncontrollable laugh out of her." },
  { player: "him", nightId: "friday", text: "Win her a prize", description: "Spend way too much trying to win something at a game booth." },
  { player: "him", nightId: "saturday", text: "Tell her something you've never said", description: "A real, vulnerable moment between you two." },
  { player: "her", nightId: "thursday", text: "Steal his hoodie", description: "Claim it as yours for the rest of the night." },
  { player: "her", nightId: "friday", text: "Catch him staring", description: "Notice him watching you when he thinks you're not looking." },
  { player: "her", nightId: "saturday", text: "Leave a lipstick mark", description: "A little reminder on his collar or cheek." },
];

export async function seedSecretSquares() {
  for (const player of ["him", "her"]) {
    const existing = await storage.getSecretsByPlayer(player);
    const playerSecrets = DEFAULT_SECRET_SQUARES.filter((s) => s.player === player);

    for (const secret of playerSecrets) {
      const alreadyExists = existing.some(
        (e) => e.player === secret.player && e.nightId === secret.nightId && e.text === secret.text,
      );
      if (alreadyExists) continue;

      await storage.createSecret({
        player: secret.player,
        nightId: secret.nightId,
        text: secret.text,
        description: secret.description,
        checked: false,
      });
    }
  }
}

export async function seedTemplates() {
  const existing = await storage.getTemplates();
  for (const template of GAME_TEMPLATES) {
    const alreadyExists = existing.some((e) => e.title === template.title && e.isTemplate);
    if (alreadyExists) continue;

    await storage.createGame({
      title: template.title,
      theme: template.theme,
      gridSize: template.gridSize,
      squares: template.squares,
      betDescription: template.betDescription,
      isTemplate: true,
      status: "active",
      winner: null,
    });
  }
}

export async function seedInitialGames() {
  const existing = await storage.getAllGames();
  for (const night of BINGO_NIGHTS) {
    const alreadyExists = existing.some((e) => e.title === night.title);
    if (alreadyExists) continue;

    await storage.createGame({
      title: night.title,
      theme: night.theme,
      gridSize: night.gridSize,
      squares: night.squares,
      betDescription: night.betDescription,
      isTemplate: false,
      status: "active",
      winner: null,
    });
  }
}

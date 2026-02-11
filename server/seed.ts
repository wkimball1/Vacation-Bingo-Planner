import { storage } from "./storage";

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

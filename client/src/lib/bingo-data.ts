import { BINGO_NIGHTS } from "@shared/schema";
import type { BingoNight } from "@shared/schema";

export function getNight(nightId: string): BingoNight | undefined {
  return BINGO_NIGHTS.find((n) => n.id === nightId);
}

export function getPlayerLabel(player: string): string {
  return player === "him" ? "His Card" : "Her Card";
}

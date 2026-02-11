import { cn } from "@/lib/utils";
import { Heart, User } from "lucide-react";

interface PlayerTabsProps {
  activePlayer: string;
  onSelectPlayer: (player: string) => void;
}

export function PlayerTabs({ activePlayer, onSelectPlayer }: PlayerTabsProps) {
  return (
    <div className="flex gap-2" data-testid="player-tabs">
      <button
        data-testid="tab-player-him"
        onClick={() => onSelectPlayer("him")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-all duration-200 border",
          activePlayer === "him"
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-card text-muted-foreground border-card-border hover-elevate active-elevate-2",
        )}
      >
        <User className="w-4 h-4" />
        His Card
      </button>
      <button
        data-testid="tab-player-her"
        onClick={() => onSelectPlayer("her")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 py-3 rounded-md text-sm font-semibold transition-all duration-200 border",
          activePlayer === "her"
            ? "bg-primary text-primary-foreground border-primary shadow-sm"
            : "bg-card text-muted-foreground border-card-border hover-elevate active-elevate-2",
        )}
      >
        <Heart className="w-4 h-4" />
        Her Card
      </button>
    </div>
  );
}

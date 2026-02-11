import { cn } from "@/lib/utils";
import { BingoSquareCell } from "./bingo-square";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Sparkles, Lock } from "lucide-react";
import type { BingoNight } from "@shared/schema";

interface BingoCardProps {
  night: BingoNight;
  checkedSquares: boolean[];
  secretSquares: { text: string; description: string; checked: boolean; id: string }[];
  onToggleSquare: (index: number) => void;
  onToggleSecret: (id: string) => void;
}

export function BingoCard({
  night,
  checkedSquares,
  secretSquares,
  onToggleSquare,
  onToggleSecret,
}: BingoCardProps) {
  const checkedCount = checkedSquares.filter(Boolean).length;
  const totalSquares = night.squares.length;
  const progress = Math.round((checkedCount / totalSquares) * 100);

  const secretChecked = secretSquares.filter((s) => s.checked).length;

  return (
    <div className="space-y-4">
      <div className="text-center space-y-1">
        <h2
          data-testid="text-night-title"
          className="text-xl font-bold text-foreground"
        >
          {night.title}
        </h2>
        <p className="text-sm text-muted-foreground italic">{night.theme}</p>
      </div>

      <div className="flex items-center justify-center gap-3">
        <Badge variant="secondary" className="text-xs">
          <Sparkles className="w-3 h-3 mr-1" />
          {checkedCount}/{totalSquares}
        </Badge>
        <div className="flex-1 max-w-[200px] h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted-foreground font-medium">
          {progress}%
        </span>
      </div>

      <div
        className={cn(
          "grid gap-2",
          night.gridSize === 3 && "grid-cols-3",
          night.gridSize === 4 && "grid-cols-4",
        )}
      >
        {night.squares.map((square, index) => (
          <BingoSquareCell
            key={`${night.id}-${index}`}
            text={square.text}
            description={square.description}
            checked={checkedSquares[index] || false}
            onToggle={() => onToggleSquare(index)}
            gridSize={night.gridSize}
          />
        ))}
      </div>

      {secretSquares.length > 0 && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-primary/60" />
            <span className="text-sm font-semibold text-foreground">
              Secret Squares
            </span>
            <Badge variant="outline" className="text-xs ml-auto">
              {secretChecked}/{secretSquares.length}
            </Badge>
          </div>
          <div className="grid grid-cols-1 gap-2">
            {secretSquares.map((sq) => (
              <BingoSquareCell
                key={sq.id}
                text={sq.text}
                description={sq.description}
                checked={sq.checked}
                isSecret
                onToggle={() => onToggleSecret(sq.id)}
                gridSize={1}
              />
            ))}
          </div>
        </div>
      )}

      <Card className="p-3">
        <div className="flex items-start gap-2">
          <Trophy className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-foreground mb-1">
              The Bet
            </p>
            <p className="text-xs text-muted-foreground whitespace-pre-line">
              {night.betDescription}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

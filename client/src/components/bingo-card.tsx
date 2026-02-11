import { useMemo } from "react";
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
  readOnly?: boolean;
}

function getLines(gridSize: number): number[][] {
  const lines: number[][] = [];
  for (let r = 0; r < gridSize; r++) {
    const row: number[] = [];
    for (let c = 0; c < gridSize; c++) row.push(r * gridSize + c);
    lines.push(row);
  }
  for (let c = 0; c < gridSize; c++) {
    const col: number[] = [];
    for (let r = 0; r < gridSize; r++) col.push(r * gridSize + c);
    lines.push(col);
  }
  const diag1: number[] = [];
  const diag2: number[] = [];
  for (let i = 0; i < gridSize; i++) {
    diag1.push(i * gridSize + i);
    diag2.push(i * gridSize + (gridSize - 1 - i));
  }
  lines.push(diag1);
  lines.push(diag2);
  return lines;
}

type SquareHighlight = "none" | "hot" | "complete";

function computeHighlights(gridSize: number, checked: boolean[]): SquareHighlight[] {
  const lines = getLines(gridSize);
  const total = gridSize * gridSize;
  const highlights: SquareHighlight[] = new Array(total).fill("none");

  for (const line of lines) {
    const checkedCount = line.filter((i) => checked[i]).length;
    if (checkedCount === line.length) {
      for (const i of line) highlights[i] = "complete";
    } else if (checkedCount === line.length - 1) {
      for (const i of line) {
        if (highlights[i] !== "complete") highlights[i] = "hot";
      }
    }
  }
  return highlights;
}

export function BingoCard({
  night,
  checkedSquares,
  secretSquares,
  onToggleSquare,
  onToggleSecret,
  readOnly,
}: BingoCardProps) {
  const checkedCount = checkedSquares.filter(Boolean).length;
  const totalSquares = night.squares.length;
  const progress = Math.round((checkedCount / totalSquares) * 100);
  const secretChecked = secretSquares.filter((s) => s.checked).length;

  const highlights = useMemo(
    () => computeHighlights(night.gridSize, checkedSquares),
    [night.gridSize, checkedSquares],
  );

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
          night.gridSize === 5 && "grid-cols-5",
        )}
      >
        {night.squares.map((square, index) => (
          <BingoSquareCell
            key={`${night.id}-${index}`}
            text={square.text}
            description={square.description}
            checked={checkedSquares[index] || false}
            highlight={highlights[index]}
            onToggle={readOnly ? () => {} : () => onToggleSquare(index)}
            gridSize={night.gridSize}
            readOnly={readOnly}
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

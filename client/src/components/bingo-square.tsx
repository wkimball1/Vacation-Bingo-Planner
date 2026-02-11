import { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, Lock, Eye } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface BingoSquareProps {
  text: string;
  description: string;
  checked: boolean;
  isSecret?: boolean;
  readOnly?: boolean;
  onToggle: () => void;
  gridSize: number;
}

export function BingoSquareCell({
  text,
  description,
  checked,
  isSecret,
  readOnly,
  onToggle,
  gridSize,
}: BingoSquareProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [justToggled, setJustToggled] = useState(false);

  const handleTap = () => {
    if (readOnly) return;
    onToggle();
    setJustToggled(true);
    setTimeout(() => setJustToggled(false), 400);
  };

  const handleLongPress = () => {
    setShowDetail(true);
  };

  let pressTimer: ReturnType<typeof setTimeout> | null = null;

  const onTouchStart = () => {
    pressTimer = setTimeout(handleLongPress, 500);
  };

  const onTouchEnd = () => {
    if (pressTimer) clearTimeout(pressTimer);
  };

  return (
    <>
      <button
        data-testid={`bingo-square-${text.slice(0, 20).replace(/\s/g, "-").toLowerCase()}`}
        onClick={handleTap}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowDetail(true);
        }}
        className={cn(
          "relative flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-300 select-none cursor-pointer",
          "text-center leading-tight",
          gridSize === 4 ? "min-h-[80px] text-xs" : "min-h-[100px] text-sm",
          checked
            ? "bg-primary/15 border-primary/40 dark:bg-primary/20 dark:border-primary/50"
            : "bg-card border-card-border hover-elevate active-elevate-2",
          isSecret && !checked && "border-dashed border-primary/30",
          justToggled && checked && "animate-pulse",
        )}
      >
        {isSecret && (
          <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-primary/50" />
        )}

        {checked && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Check className="w-10 h-10 text-primary/20" strokeWidth={3} />
          </div>
        )}

        <span
          className={cn(
            "relative z-10 font-medium",
            checked ? "text-primary dark:text-primary" : "text-foreground",
          )}
        >
          {text}
        </span>

        <div
          role="button"
          tabIndex={-1}
          data-testid={`detail-button-${text.slice(0, 10).replace(/\s/g, "-").toLowerCase()}`}
          onClick={(e) => {
            e.stopPropagation();
            setShowDetail(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.stopPropagation();
              setShowDetail(true);
            }
          }}
          className="absolute bottom-1 right-1 p-0.5 rounded-full opacity-40 hover:opacity-100 transition-opacity"
        >
          <Eye className="w-3 h-3" />
        </div>
      </button>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isSecret && <Lock className="w-4 h-4 text-primary" />}
              {text}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 pt-2">
            <div
              className={cn(
                "px-3 py-1 rounded-md text-sm font-medium",
                checked
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {checked ? "Completed" : "Not yet"}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

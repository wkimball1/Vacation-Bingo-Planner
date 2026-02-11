import { useState, useRef, useCallback } from "react";
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
  highlight?: "none" | "hot" | "complete";
  onToggle: () => void;
  gridSize: number;
}

export function BingoSquareCell({
  text,
  description,
  checked,
  isSecret,
  readOnly,
  highlight = "none",
  onToggle,
  gridSize,
}: BingoSquareProps) {
  const [showDetail, setShowDetail] = useState(false);
  const [animState, setAnimState] = useState<"idle" | "stamp-in" | "stamp-out">("idle");
  const pressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    if (readOnly) return;
    const willBeChecked = !checked;
    onToggle();
    if (willBeChecked) {
      setAnimState("stamp-in");
      setTimeout(() => setAnimState("idle"), 400);
    } else {
      setAnimState("stamp-out");
      setTimeout(() => setAnimState("idle"), 300);
    }
  }, [readOnly, checked, onToggle]);

  const handleLongPress = () => {
    setShowDetail(true);
  };

  const onTouchStart = () => {
    pressTimerRef.current = setTimeout(handleLongPress, 500);
  };

  const onTouchEnd = () => {
    if (pressTimerRef.current) clearTimeout(pressTimerRef.current);
  };

  const isHot = highlight === "hot" && !checked;
  const isComplete = highlight === "complete";

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
          "relative flex flex-col items-center justify-center p-2 rounded-md border transition-all duration-300 select-none cursor-pointer overflow-visible",
          "text-center leading-tight",
          gridSize === 4 ? "min-h-[80px] text-xs" : gridSize === 5 ? "min-h-[64px] text-[11px]" : "min-h-[100px] text-sm",
          checked
            ? "bg-primary/15 border-primary/40 dark:bg-primary/20 dark:border-primary/50"
            : "bg-card border-card-border hover-elevate active-elevate-2",
          isSecret && !checked && "border-dashed border-primary/30",
          isHot && "border-amber-400/60 dark:border-amber-400/40",
          isComplete && "border-primary/60",
        )}
      >
        {isHot && (
          <div className="absolute inset-0 rounded-md animate-pulse bg-amber-400/8 dark:bg-amber-400/5 pointer-events-none" />
        )}

        {isComplete && checked && (
          <div className="absolute inset-0 rounded-md bg-primary/5 dark:bg-primary/8 pointer-events-none" />
        )}

        {isSecret && (
          <Lock className="absolute top-1.5 right-1.5 w-3 h-3 text-primary/50" />
        )}

        {checked && (
          <div
            className={cn(
              "absolute inset-0 flex items-center justify-center pointer-events-none",
              animState === "stamp-in" && "bingo-stamp-in",
              animState === "stamp-out" && "bingo-stamp-out",
            )}
          >
            <Check
              className={cn(
                "text-primary/20",
                gridSize <= 3 ? "w-10 h-10" : "w-8 h-8",
              )}
              strokeWidth={3}
            />
          </div>
        )}

        <span
          className={cn(
            "relative z-10 font-medium",
            checked ? "text-primary dark:text-primary" : "text-foreground",
            isHot && !checked && "text-amber-600 dark:text-amber-400",
          )}
        >
          {text}
        </span>

        {isHot && !checked && (
          <span className="absolute bottom-1 left-1 text-[9px] font-bold text-amber-500/70 dark:text-amber-400/60">
            1 away
          </span>
        )}

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

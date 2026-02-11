import { cn } from "@/lib/utils";
import { BINGO_NIGHTS } from "@shared/schema";
import { Moon, Sun, Sunset } from "lucide-react";

interface NightTabsProps {
  activeNight: string;
  onSelectNight: (nightId: string) => void;
}

function getNightIcon(nightId: string) {
  switch (nightId) {
    case "thursday":
      return <Sunset className="w-4 h-4" />;
    case "friday":
      return <Sun className="w-4 h-4" />;
    case "saturday":
      return <Moon className="w-4 h-4" />;
    default:
      return null;
  }
}

function getNightShortLabel(nightId: string) {
  switch (nightId) {
    case "thursday":
      return "Thu";
    case "friday":
      return "Fri";
    case "saturday":
      return "Sat";
    default:
      return nightId;
  }
}

export function NightTabs({ activeNight, onSelectNight }: NightTabsProps) {
  return (
    <div className="flex gap-1 p-1 bg-muted rounded-md" data-testid="night-tabs">
      {BINGO_NIGHTS.map((night) => (
        <button
          key={night.id}
          data-testid={`tab-night-${night.id}`}
          onClick={() => onSelectNight(night.id)}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200",
            activeNight === night.id
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover-elevate",
          )}
        >
          {getNightIcon(night.id)}
          <span>{getNightShortLabel(night.id)}</span>
        </button>
      ))}
    </div>
  );
}

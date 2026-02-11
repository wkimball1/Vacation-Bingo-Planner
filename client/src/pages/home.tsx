import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BINGO_NIGHTS } from "@shared/schema";
import type { BingoProgress, SecretSquare } from "@shared/schema";
import { BingoCard } from "@/components/bingo-card";
import { NightTabs } from "@/components/night-tabs";
import { PlayerTabs } from "@/components/player-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { Heart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const [activePlayer, setActivePlayer] = useState("him");
  const [activeNight, setActiveNight] = useState("thursday");

  const night = BINGO_NIGHTS.find((n) => n.id === activeNight)!;

  const { data: progress = [], isLoading: progressLoading } = useQuery<BingoProgress[]>({
    queryKey: ["/api/progress", activePlayer, activeNight],
  });

  const { data: secrets = [], isLoading: secretsLoading } = useQuery<SecretSquare[]>({
    queryKey: ["/api/secrets", activePlayer, activeNight],
  });

  const toggleSquare = useMutation({
    mutationFn: async ({ squareIndex, checked }: { squareIndex: number; checked: boolean }) => {
      return apiRequest("POST", "/api/progress", {
        player: activePlayer,
        nightId: activeNight,
        squareIndex,
        checked,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", activePlayer, activeNight] });
    },
  });

  const toggleSecret = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      return apiRequest("PATCH", `/api/secrets/${id}`, { checked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/secrets", activePlayer, activeNight] });
    },
  });

  const checkedSquares = night.squares.map((_, index) => {
    const p = progress.find((pr) => pr.squareIndex === index);
    return p ? p.checked : false;
  });

  const secretSquareData = secrets.map((s) => ({
    id: s.id,
    text: s.text,
    description: s.description,
    checked: s.checked,
  }));

  const handleToggleSquare = (index: number) => {
    const current = checkedSquares[index];
    toggleSquare.mutate({ squareIndex: index, checked: !current });
  };

  const handleToggleSecret = (id: string) => {
    const sq = secrets.find((s) => s.id === id);
    if (sq) {
      toggleSecret.mutate({ id, checked: !sq.checked });
    }
  };

  const isLoading = progressLoading || secretsLoading;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-lg font-bold text-foreground">Date Bingo</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-8">
        <PlayerTabs
          activePlayer={activePlayer}
          onSelectPlayer={setActivePlayer}
        />

        <NightTabs activeNight={activeNight} onSelectNight={setActiveNight} />

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-4 w-32 mx-auto" />
            <div className={`grid gap-2 ${night.gridSize === 4 ? "grid-cols-4" : "grid-cols-3"}`}>
              {Array.from({ length: night.gridSize * night.gridSize }).map((_, i) => (
                <Skeleton key={i} className={night.gridSize === 4 ? "h-[80px]" : "h-[100px]"} />
              ))}
            </div>
          </div>
        ) : (
          <BingoCard
            night={night}
            checkedSquares={checkedSquares}
            secretSquares={secretSquareData}
            onToggleSquare={handleToggleSquare}
            onToggleSecret={handleToggleSecret}
          />
        )}
      </main>
    </div>
  );
}

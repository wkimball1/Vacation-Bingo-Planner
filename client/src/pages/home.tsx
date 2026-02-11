import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { BINGO_NIGHTS } from "@shared/schema";
import type { BingoProgress, SecretSquare } from "@shared/schema";
import { BingoCard } from "@/components/bingo-card";
import { NightTabs } from "@/components/night-tabs";
import { PlayerTabs } from "@/components/player-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginScreen } from "@/components/login-screen";
import { Heart, LogOut, Share2, Lock, Eye, EyeOff } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function Home() {
  const [loggedInPlayer, setLoggedInPlayer] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState("him");
  const [activeNight, setActiveNight] = useState("thursday");
  const { toast } = useToast();

  useEffect(() => {
    const savedPlayer = localStorage.getItem("bingoPlayer");
    const savedPin = savedPlayer ? localStorage.getItem(`bingoPin_${savedPlayer}`) : null;
    if (savedPlayer && savedPin) {
      apiRequest("POST", "/api/auth/login", { player: savedPlayer, pin: savedPin })
        .then(() => {
          setLoggedInPlayer(savedPlayer);
          setActivePlayer(savedPlayer);
        })
        .catch(() => {
          localStorage.removeItem("bingoPlayer");
          localStorage.removeItem(`bingoPin_${savedPlayer}`);
        });
    }
  }, []);

  const handleLogin = (player: string) => {
    setLoggedInPlayer(player);
    setActivePlayer(player);
  };

  const handleLogout = () => {
    if (loggedInPlayer) {
      localStorage.removeItem("bingoPlayer");
      localStorage.removeItem(`bingoPin_${loggedInPlayer}`);
    }
    setLoggedInPlayer(null);
  };

  if (!loggedInPlayer) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <LoggedInView
      loggedInPlayer={loggedInPlayer}
      activePlayer={activePlayer}
      activeNight={activeNight}
      setActivePlayer={setActivePlayer}
      setActiveNight={setActiveNight}
      onLogout={handleLogout}
    />
  );
}

function LoggedInView({
  loggedInPlayer,
  activePlayer,
  activeNight,
  setActivePlayer,
  setActiveNight,
  onLogout,
}: {
  loggedInPlayer: string;
  activePlayer: string;
  activeNight: string;
  setActivePlayer: (p: string) => void;
  setActiveNight: (n: string) => void;
  onLogout: () => void;
}) {
  const { toast } = useToast();
  const otherPlayer = loggedInPlayer === "him" ? "her" : "him";
  const isViewingOwn = activePlayer === loggedInPlayer;

  const night = BINGO_NIGHTS.find((n) => n.id === activeNight)!;

  const { data: myStatus } = useQuery<{ hasPin: boolean; shared: boolean }>({
    queryKey: ["/api/auth/status", loggedInPlayer],
  });

  const { data: otherStatus } = useQuery<{ hasPin: boolean; shared: boolean }>({
    queryKey: ["/api/auth/status", otherPlayer],
  });

  const canViewOther = otherStatus?.shared === true;

  const { data: progress = [], isLoading: progressLoading } = useQuery<BingoProgress[]>({
    queryKey: ["/api/progress", activePlayer, activeNight],
    enabled: isViewingOwn || canViewOther,
  });

  const { data: secrets = [], isLoading: secretsLoading } = useQuery<SecretSquare[]>({
    queryKey: ["/api/secrets", activePlayer, activeNight],
    enabled: isViewingOwn,
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

  const toggleShare = useMutation({
    mutationFn: async (shared: boolean) => {
      const res = await apiRequest("PATCH", `/api/auth/share/${loggedInPlayer}`, { shared });
      return res.json() as Promise<{ shared: boolean }>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/status", loggedInPlayer] });
      toast({
        title: data.shared ? "Card shared" : "Card hidden",
        description: data.shared
          ? "Your partner can now peek at your card"
          : "Your partner can no longer see your card",
      });
    },
  });

  const checkedSquares = night.squares.map((_, index) => {
    const p = progress.find((pr) => pr.squareIndex === index);
    return p ? p.checked : false;
  });

  const secretSquareData = isViewingOwn
    ? secrets.map((s) => ({
        id: s.id,
        text: s.text,
        description: s.description,
        checked: s.checked,
      }))
    : [];

  const handleToggleSquare = (index: number) => {
    if (!isViewingOwn) return;
    const current = checkedSquares[index];
    toggleSquare.mutate({ squareIndex: index, checked: !current });
  };

  const handleToggleSecret = (id: string) => {
    if (!isViewingOwn) return;
    const sq = secrets.find((s) => s.id === id);
    if (sq) {
      toggleSecret.mutate({ id, checked: !sq.checked });
    }
  };

  const handlePlayerSwitch = (player: string) => {
    setActivePlayer(player);
  };

  const isLoading = progressLoading || (isViewingOwn && secretsLoading);
  const isShared = myStatus?.shared ?? false;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-lg font-bold text-foreground">Date Bingo</h1>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <Button
              data-testid="button-logout"
              size="icon"
              variant="ghost"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-8">
        <PlayerTabs
          activePlayer={activePlayer}
          onSelectPlayer={handlePlayerSwitch}
          loggedInPlayer={loggedInPlayer}
        />

        <Card className="p-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {isShared ? (
              <Eye className="w-4 h-4 text-primary flex-shrink-0" />
            ) : (
              <EyeOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
            <span className="text-sm text-foreground truncate">
              {isShared ? "Your card is visible to your partner" : "Your card is private"}
            </span>
          </div>
          <Switch
            data-testid="switch-share"
            checked={isShared}
            onCheckedChange={(checked) => toggleShare.mutate(checked)}
          />
        </Card>

        <NightTabs activeNight={activeNight} onSelectNight={setActiveNight} />

        {!isViewingOwn && !canViewOther ? (
          <Card className="p-8 text-center space-y-3">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold text-foreground">Card is Private</h3>
            <p className="text-sm text-muted-foreground">
              Your partner hasn't shared their card with you yet. They'll need to turn on sharing from their side.
            </p>
          </Card>
        ) : isLoading ? (
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
          <div>
            {!isViewingOwn && (
              <div className="mb-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>Viewing only - this is your partner's card</span>
              </div>
            )}
            <BingoCard
              night={night}
              checkedSquares={checkedSquares}
              secretSquares={secretSquareData}
              onToggleSquare={handleToggleSquare}
              onToggleSecret={handleToggleSecret}
              readOnly={!isViewingOwn}
            />
          </div>
        )}
      </main>
    </div>
  );
}

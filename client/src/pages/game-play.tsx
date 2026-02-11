import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BingoGame, BingoProgress, SecretSquare } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { BingoCard } from "@/components/bingo-card";
import { PlayerTabs } from "@/components/player-tabs";
import { ThemeToggle } from "@/components/theme-toggle";
import { LoginScreen } from "@/components/login-screen";
import { Heart, LogOut, ArrowLeft, Eye, EyeOff, Lock, Trophy, Crown, UserPlus, Share2, Copy, Check, Flame, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import confetti from "canvas-confetti";

export default function GamePlay() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const [loggedInPlayer, setLoggedInPlayer] = useState<string | null>(null);
  const [activePlayer, setActivePlayer] = useState("him");
  const [showWinnerDialog, setShowWinnerDialog] = useState(false);
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
    <GamePlayView
      gameId={id!}
      loggedInPlayer={loggedInPlayer}
      activePlayer={activePlayer}
      setActivePlayer={setActivePlayer}
      onLogout={handleLogout}
      showWinnerDialog={showWinnerDialog}
      setShowWinnerDialog={setShowWinnerDialog}
    />
  );
}

function GamePlayView({
  gameId,
  loggedInPlayer,
  activePlayer,
  setActivePlayer,
  onLogout,
  showWinnerDialog,
  setShowWinnerDialog,
}: {
  gameId: string;
  loggedInPlayer: string;
  activePlayer: string;
  setActivePlayer: (p: string) => void;
  onLogout: () => void;
  showWinnerDialog: boolean;
  setShowWinnerDialog: (v: boolean) => void;
}) {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user: authUser } = useAuth();
  const otherPlayer = loggedInPlayer === "him" ? "her" : "him";
  const isViewingOwn = activePlayer === loggedInPlayer;
  const [copiedPlay, setCopiedPlay] = useState(false);
  const [showVictory, setShowVictory] = useState(false);
  const [victoryWinner, setVictoryWinner] = useState<string | null>(null);

  const fireConfetti = useCallback(() => {
    const duration = 3000;
    const end = Date.now() + duration;
    const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff", "#ff6bff"];

    (function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors,
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors,
      });
      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    })();
  }, []);

  const { data: game, isLoading: loadingGame } = useQuery<BingoGame>({
    queryKey: ["/api/games", gameId],
  });

  const p1Label = game?.player1Label || "Him";
  const p2Label = game?.player2Label || "Her";
  const getPlayerLabel = (player: string) => player === "him" ? p1Label : p2Label;

  const joinGame = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/games/${gameId}/join`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
      queryClient.invalidateQueries({ queryKey: ["/api/games?status=active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games?status=completed"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/stats"] });
      toast({ title: "Joined!", description: "This game now counts in your stats too" });
    },
    onError: () => {
      toast({ title: "Couldn't join", description: "This game may already have a partner", variant: "destructive" });
    },
  });

  const canJoinAsPartner = authUser && game && game.userId !== authUser.id && !game.partnerId;

  const { data: myStatus } = useQuery<{ hasPin: boolean; shared: boolean }>({
    queryKey: ["/api/auth/status", loggedInPlayer],
  });

  const { data: otherStatus } = useQuery<{ hasPin: boolean; shared: boolean }>({
    queryKey: ["/api/auth/status", otherPlayer],
  });

  const canViewOther = otherStatus?.shared === true;

  const { data: progress = [], isLoading: progressLoading } = useQuery<BingoProgress[]>({
    queryKey: ["/api/progress", activePlayer, gameId],
    enabled: (isViewingOwn || canViewOther) && !!game,
  });

  const { data: secrets = [], isLoading: secretsLoading } = useQuery<SecretSquare[]>({
    queryKey: ["/api/secrets", activePlayer, gameId],
    enabled: isViewingOwn && !!game,
  });

  const { data: p1Progress = [] } = useQuery<BingoProgress[]>({
    queryKey: ["/api/progress", "him", gameId],
    enabled: !!game,
  });

  const { data: p2Progress = [] } = useQuery<BingoProgress[]>({
    queryKey: ["/api/progress", "her", gameId],
    enabled: !!game,
  });

  const toggleSquare = useMutation({
    mutationFn: async ({ squareIndex, checked }: { squareIndex: number; checked: boolean }) => {
      return apiRequest("POST", "/api/progress", {
        player: activePlayer,
        nightId: gameId,
        squareIndex,
        checked,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/progress", activePlayer, gameId] });
    },
  });

  const toggleSecret = useMutation({
    mutationFn: async ({ id, checked }: { id: string; checked: boolean }) => {
      return apiRequest("PATCH", `/api/secrets/${id}`, { checked });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/secrets", activePlayer, gameId] });
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
          ? `${getPlayerLabel(otherPlayer)} can now peek at your card`
          : `${getPlayerLabel(otherPlayer)} can no longer see your card`,
      });
    },
  });

  const setWinner = useMutation({
    mutationFn: async (winner: string) => {
      const res = await apiRequest("PATCH", `/api/games/${gameId}/winner`, { winner });
      return res.json();
    },
    onSuccess: (_, winner) => {
      queryClient.invalidateQueries({ queryKey: ["/api/games", gameId] });
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games/stats"] });
      setShowWinnerDialog(false);
      setVictoryWinner(winner);
      setShowVictory(true);
      fireConfetti();
    },
  });

  const handleSharePlay = async () => {
    const url = `${window.location.origin}/play/${gameId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Play: ${game?.title || "Bingo"}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopiedPlay(true);
        setTimeout(() => setCopiedPlay(false), 2000);
        toast({ title: "Play link copied", description: "Send it to your partner or friends" });
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopiedPlay(true);
      setTimeout(() => setCopiedPlay(false), 2000);
      toast({ title: "Play link copied" });
    }
  };

  if (loadingGame) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-32 mx-auto" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-[100px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-foreground font-medium">Game not found</p>
          <Button className="mt-4" onClick={() => navigate("/")}>Back to Games</Button>
        </Card>
      </div>
    );
  }

  const night = {
    id: game.id,
    title: game.title,
    theme: game.theme,
    gridSize: game.gridSize,
    squares: game.squares,
    betDescription: game.betDescription,
  };

  const checkedSquares = night.squares.map((_, index) => {
    const p = progress.find((pr) => pr.squareIndex === index);
    return p ? p.checked : false;
  });

  const secretSquareData = isViewingOwn
    ? secrets.map((s) => ({ id: s.id, text: s.text, description: s.description, checked: s.checked }))
    : [];

  const handleToggleSquare = (index: number) => {
    if (!isViewingOwn || game.status === "completed") return;
    const current = checkedSquares[index];
    toggleSquare.mutate({ squareIndex: index, checked: !current });
  };

  const handleToggleSecret = (id: string) => {
    if (!isViewingOwn || game.status === "completed") return;
    const sq = secrets.find((s) => s.id === id);
    if (sq) toggleSecret.mutate({ id, checked: !sq.checked });
  };

  const isLoading = progressLoading || (isViewingOwn && secretsLoading);
  const isShared = myStatus?.shared ?? false;
  const isCompleted = game.status === "completed";

  const totalSquares = game.squares.length;
  const p1Checked = p1Progress.filter((p) => p.checked).length;
  const p2Checked = p2Progress.filter((p) => p.checked).length;
  const p1Pct = totalSquares > 0 ? Math.round((p1Checked / totalSquares) * 100) : 0;
  const p2Pct = totalSquares > 0 ? Math.round((p2Checked / totalSquares) * 100) : 0;
  const leader = p1Checked > p2Checked ? "him" : p2Checked > p1Checked ? "her" : null;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => navigate("/")} data-testid="button-back-to-list">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-lg font-bold text-foreground truncate">{game.title}</h1>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" onClick={handleSharePlay} data-testid="button-share-play">
                  {copiedPlay ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Share play link</TooltipContent>
            </Tooltip>
            <ThemeToggle />
            <Button size="icon" variant="ghost" onClick={onLogout} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-8">
        {canJoinAsPartner && (
          <Card className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <UserPlus className="w-5 h-5 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">Join this game</p>
                  <p className="text-xs text-muted-foreground">Wins and losses will count in your stats too</p>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => joinGame.mutate()}
                disabled={joinGame.isPending}
                data-testid="button-join-game"
              >
                Join
              </Button>
            </div>
          </Card>
        )}

        {game.partnerId === authUser?.id && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <UserPlus className="w-3 h-3" />
            <span>You're linked to this game — stats count for you</span>
          </div>
        )}

        {isCompleted && game.winner && (
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">Game Complete</span>
            </div>
            <Badge variant="default">
              <Trophy className="w-3 h-3 mr-1" />
              {game.winner === "tie" ? "It's a tie!" : `Winner: ${getPlayerLabel(game.winner)}`}
            </Badge>
          </Card>
        )}

        <PlayerTabs
          activePlayer={activePlayer}
          onSelectPlayer={setActivePlayer}
          loggedInPlayer={loggedInPlayer}
          player1Label={p1Label}
          player2Label={p2Label}
        />

        {(p1Checked > 0 || p2Checked > 0) && (
          <Card className="p-3" data-testid="progress-race-bar">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span className="text-xs font-semibold text-foreground">Race</span>
              {leader && !isCompleted && (
                <Badge variant="secondary" className="text-[10px] ml-auto">
                  <Flame className="w-3 h-3 mr-0.5" />
                  {getPlayerLabel(leader)} leads
                </Badge>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground w-16 truncate">{p1Label}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${p1Pct}%` }}
                    data-testid="progress-bar-p1"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground w-8 text-right">{p1Pct}%</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-medium text-foreground w-16 truncate">{p2Label}</span>
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary/70 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${p2Pct}%` }}
                    data-testid="progress-bar-p2"
                  />
                </div>
                <span className="text-[11px] text-muted-foreground w-8 text-right">{p2Pct}%</span>
              </div>
            </div>
          </Card>
        )}

        {!isCompleted && (
          <Card className="p-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              {isShared ? (
                <Eye className="w-4 h-4 text-primary flex-shrink-0" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              )}
              <span className="text-sm text-foreground truncate">
                {isShared ? `Your card is visible to ${getPlayerLabel(otherPlayer)}` : "Your card is private"}
              </span>
            </div>
            <Switch
              data-testid="switch-share"
              checked={isShared}
              onCheckedChange={(checked) => toggleShare.mutate(checked)}
            />
          </Card>
        )}

        {!isViewingOwn && !canViewOther ? (
          <Card className="p-8 text-center space-y-3">
            <Lock className="w-10 h-10 text-muted-foreground mx-auto" />
            <h3 className="text-lg font-semibold text-foreground">Card is Private</h3>
            <p className="text-sm text-muted-foreground">
              {getPlayerLabel(otherPlayer)} hasn't shared their card with you yet.
            </p>
          </Card>
        ) : isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-8 w-48 mx-auto" />
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
                <span>Viewing only — this is {getPlayerLabel(activePlayer)}'s card</span>
              </div>
            )}
            <BingoCard
              night={night}
              checkedSquares={checkedSquares}
              secretSquares={secretSquareData}
              onToggleSquare={handleToggleSquare}
              onToggleSecret={handleToggleSecret}
              readOnly={!isViewingOwn || isCompleted}
            />
          </div>
        )}

        {!isCompleted && isViewingOwn && (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setShowWinnerDialog(true)}
            data-testid="button-declare-winner"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Declare Winner
          </Button>
        )}
      </main>

      <Dialog open={showWinnerDialog} onOpenChange={setShowWinnerDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Who won?</DialogTitle>
            <DialogDescription>This will mark the game as complete.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <Button onClick={() => setWinner.mutate("him")} disabled={setWinner.isPending} data-testid="button-winner-him">
              {p1Label}
            </Button>
            <Button onClick={() => setWinner.mutate("her")} disabled={setWinner.isPending} data-testid="button-winner-her">
              {p2Label}
            </Button>
            <Button variant="outline" onClick={() => setWinner.mutate("tie")} disabled={setWinner.isPending} data-testid="button-winner-tie">
              It's a Tie
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showVictory} onOpenChange={setShowVictory}>
        <DialogContent className="max-w-sm text-center" data-testid="victory-screen">
          <div className="py-4 space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-primary/15 flex items-center justify-center">
                <Crown className="w-8 h-8 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground" data-testid="text-victory-title">
                {victoryWinner === "tie" ? "It's a Tie!" : `${getPlayerLabel(victoryWinner || "him")} Wins!`}
              </h2>
              <p className="text-sm text-muted-foreground">{game.title}</p>
            </div>
            <div className="flex justify-center gap-6 py-2">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{p1Checked}</p>
                <p className="text-[11px] text-muted-foreground">{p1Label}</p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden" style={{ width: 60 }}>
                  <div className="h-full bg-primary rounded-full" style={{ width: `${p1Pct}%` }} />
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">vs</div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{p2Checked}</p>
                <p className="text-[11px] text-muted-foreground">{p2Label}</p>
                <div className="w-full h-1.5 bg-muted rounded-full mt-1 overflow-hidden" style={{ width: 60 }}>
                  <div className="h-full bg-primary/70 rounded-full" style={{ width: `${p2Pct}%` }} />
                </div>
              </div>
            </div>
            {game.betDescription && (
              <Card className="p-3 text-left">
                <div className="flex items-start gap-2">
                  <Trophy className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-foreground mb-0.5">The Bet</p>
                    <p className="text-xs text-muted-foreground">{game.betDescription}</p>
                  </div>
                </div>
              </Card>
            )}
            <Button
              className="w-full"
              onClick={() => {
                setShowVictory(false);
                navigate("/");
              }}
              data-testid="button-victory-done"
            >
              Back to Games
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

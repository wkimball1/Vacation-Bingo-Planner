import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BingoGame } from "@shared/schema";
import { useLocation } from "wouter";
import { Heart, Plus, Trophy, Copy, Trash2, Crown, Clock, CheckCircle2, Sparkles, LayoutGrid, Share2, Pencil, LogOut, UserPlus, Users } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

export default function GameList() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user, logout } = useAuth();

  const { data: activeGames = [], isLoading: loadingActive } = useQuery<BingoGame[]>({
    queryKey: ["/api/games?status=active"],
  });

  const { data: completedGames = [], isLoading: loadingCompleted } = useQuery<BingoGame[]>({
    queryKey: ["/api/games?status=completed"],
  });

  const { data: templates = [] } = useQuery<BingoGame[]>({
    queryKey: ["/api/games/templates"],
  });

  const { data: stats } = useQuery<{ him: number; her: number }>({
    queryKey: ["/api/games/stats"],
  });

  const duplicateGame = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/games/${id}/duplicate`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games?status=active"] });
      toast({ title: "Game duplicated" });
    },
  });

  const deleteGame = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/games/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games?status=active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/games?status=completed"] });
      toast({ title: "Game deleted" });
    },
  });

  const handleShareEdit = async (game: BingoGame) => {
    const url = `${window.location.origin}/edit/${game.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Edit: ${game.title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast({ title: "Edit link copied", description: "Send it to your partner so they can add squares too" });
      }
    } catch {
      await navigator.clipboard.writeText(url);
      toast({ title: "Edit link copied" });
    }
  };

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.email || "You";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-lg font-bold text-foreground">Date Bingo</h1>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">{displayName}</span>
            <ThemeToggle />
            <Button size="icon" variant="ghost" onClick={() => logout()} data-testid="button-logout">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-6 pb-8">
        {stats && (stats.him > 0 || stats.her > 0) && (
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Score</span>
            </div>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.him}</p>
                <p className="text-xs text-muted-foreground">Him</p>
              </div>
              <div className="text-xs text-muted-foreground">vs</div>
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground">{stats.her}</p>
                <p className="text-xs text-muted-foreground">Her</p>
              </div>
            </div>
          </Card>
        )}

        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Active Games
          </h2>
          <Button
            data-testid="button-create-game"
            size="sm"
            onClick={() => navigate("/create")}
          >
            <Plus className="w-4 h-4 mr-1" />
            New Game
          </Button>
        </div>

        {loadingActive ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        ) : activeGames.length === 0 ? (
          <Card className="p-6 text-center">
            <LayoutGrid className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No active games yet. Create one or use a template!</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                userId={user?.id}
                onPlay={() => navigate(`/play/${game.id}`)}
                onEdit={() => navigate(`/edit/${game.id}`)}
                onDuplicate={() => duplicateGame.mutate(game.id)}
                onDelete={() => deleteGame.mutate(game.id)}
                onShare={() => handleShareEdit(game)}
              />
            ))}
          </div>
        )}

        {templates.length > 0 && (
          <>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 pt-2">
              <LayoutGrid className="w-4 h-4 text-primary" />
              Templates
            </h2>
            <div className="space-y-3">
              {templates.map((template) => (
                <Card
                  key={template.id}
                  data-testid={`template-${template.id}`}
                  className="p-3 hover-elevate cursor-pointer"
                  onClick={() => duplicateGame.mutate(template.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{template.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{template.theme}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge variant="secondary" className="text-xs">
                        {template.gridSize}x{template.gridSize}
                      </Badge>
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {completedGames.length > 0 && (
          <>
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2 pt-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              History
            </h2>
            <div className="space-y-3">
              {completedGames.map((game) => (
                <Card key={game.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{game.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{game.theme}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {game.winner && (
                        <Badge variant="default" className="text-xs">
                          <Trophy className="w-3 h-3 mr-1" />
                          {game.winner === "tie" ? "Tie" : game.winner === "him" ? "Him" : "Her"}
                        </Badge>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => duplicateGame.mutate(game.id)}
                        data-testid={`button-duplicate-${game.id}`}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {game.completedAt && (
                    <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(game.completedAt).toLocaleDateString()}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function GameCard({
  game,
  userId,
  onPlay,
  onEdit,
  onDuplicate,
  onDelete,
  onShare,
}: {
  game: BingoGame;
  userId?: string;
  onPlay: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onShare: () => void;
}) {
  const isPartner = userId && game.partnerId === userId;
  const hasPartner = !!game.partnerId;

  return (
    <Card
      data-testid={`game-card-${game.id}`}
      className="p-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="min-w-0 flex-1 cursor-pointer"
          onClick={onPlay}
          data-testid={`button-play-${game.id}`}
        >
          <p className="text-sm font-medium text-foreground truncate">{game.title}</p>
          <p className="text-xs text-muted-foreground truncate">{game.theme}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {game.gridSize}x{game.gridSize}
            </Badge>
            {game.rating && game.rating !== "r" && (
              <Badge variant="outline" className="text-xs">
                {game.rating.toUpperCase()}
              </Badge>
            )}
            {isPartner && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Partner
              </Badge>
            )}
            {!isPartner && hasPartner && (
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                Linked
              </Badge>
            )}
            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(game.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0">
          <Button size="icon" variant="ghost" onClick={onPlay} data-testid={`button-play-icon-${game.id}`}>
            <Sparkles className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-${game.id}`}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onShare} data-testid={`button-share-${game.id}`}>
            <Share2 className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDuplicate} data-testid={`button-dup-${game.id}`}>
            <Copy className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-del-${game.id}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

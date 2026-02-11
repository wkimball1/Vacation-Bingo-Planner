import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { BingoGame, BingoSquare } from "@shared/schema";
import { useLocation, useParams } from "wouter";
import { Dice1, ArrowLeft, Plus, Trash2, Sparkles, Wand2, Save, Loader2, Share2, Copy, Check, RefreshCw, Users, Heart } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const RATINGS = [
  { value: "pg", label: "PG", desc: "Sweet & wholesome" },
  { value: "pg13", label: "PG-13", desc: "Flirty & playful" },
  { value: "r", label: "R", desc: "Spicy but public-safe" },
  { value: "nc17", label: "NC-17", desc: "No limits" },
] as const;

type Rating = typeof RATINGS[number]["value"];

const MOODS = [
  { value: "couples", label: "Couples", icon: Heart, desc: "Romantic date vibes" },
  { value: "friends-trip", label: "Friends Trip", icon: Users, desc: "Group adventure mode" },
  { value: "party", label: "Party", icon: Dice1, desc: "Social gathering fun" },
  { value: "custom", label: "Custom", icon: Sparkles, desc: "Make it your own" },
] as const;

type Mood = typeof MOODS[number]["value"];

export default function GameBuilder() {
  const params = useParams<{ id: string }>();
  const isEditing = !!params.id;
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [theme, setTheme] = useState("");
  const [gridSize, setGridSize] = useState(3);
  const [squares, setSquares] = useState<BingoSquare[]>([]);
  const [betDescription, setBetDescription] = useState("");
  const [rating, setRating] = useState<Rating>("r");
  const [mood, setMood] = useState<Mood>("couples");
  const [player1Label, setPlayer1Label] = useState("Him");
  const [player2Label, setPlayer2Label] = useState("Her");
  const [copied, setCopied] = useState(false);
  const [betSuggestions, setBetSuggestions] = useState<string[]>([]);
  const [betIndex, setBetIndex] = useState(0);

  const { data: existingGame, isLoading: loadingGame } = useQuery<BingoGame>({
    queryKey: ["/api/games", params.id],
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingGame) {
      setTitle(existingGame.title);
      setTheme(existingGame.theme);
      setGridSize(existingGame.gridSize);
      setSquares(existingGame.squares);
      setBetDescription(existingGame.betDescription);
      setRating((existingGame.rating as Rating) || "r");
      setMood((existingGame.mood as Mood) || "couples");
      setPlayer1Label(existingGame.player1Label || "Him");
      setPlayer2Label(existingGame.player2Label || "Her");
    }
  }, [existingGame]);

  useEffect(() => {
    if (mood === "couples") {
      if (player1Label === "Team A" || player1Label === "Team 1") setPlayer1Label("Him");
      if (player2Label === "Team B" || player2Label === "Team 2") setPlayer2Label("Her");
    } else if (mood === "friends-trip") {
      if (player1Label === "Him") setPlayer1Label("Team A");
      if (player2Label === "Her") setPlayer2Label("Team B");
    } else if (mood === "party") {
      if (player1Label === "Him") setPlayer1Label("Team 1");
      if (player2Label === "Her") setPlayer2Label("Team 2");
    }
  }, [mood]);

  const totalNeeded = gridSize * gridSize;

  const saveGame = useMutation({
    mutationFn: async () => {
      const body = { title, theme, gridSize, squares, betDescription, rating, mood, player1Label, player2Label };
      if (isEditing) {
        const res = await apiRequest("PATCH", `/api/games/${params.id}`, body);
        return res.json();
      }
      const res = await apiRequest("POST", "/api/games", body);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/games"] });
      if (isEditing) {
        queryClient.invalidateQueries({ queryKey: ["/api/games", params.id] });
      }
      toast({ title: isEditing ? "Game updated" : "Game created" });
      navigate("/");
    },
    onError: () => {
      toast({ title: "Failed to save", variant: "destructive" });
    },
  });

  const aiSuggest = useMutation({
    mutationFn: async () => {
      const remaining = totalNeeded - squares.length;
      if (remaining <= 0) return { squares: [] };
      const res = await apiRequest("POST", "/api/ai/suggestions", {
        theme: theme || "fun activities",
        count: remaining,
        existing: squares.map((s) => s.text),
        rating,
        mood,
      });
      return res.json() as Promise<{ squares: BingoSquare[] }>;
    },
    onSuccess: (data) => {
      if (data.squares.length > 0) {
        setSquares((prev) => [...prev, ...data.squares].slice(0, totalNeeded));
        toast({ title: `Added ${data.squares.length} AI suggestions` });
      }
    },
    onError: () => {
      toast({ title: "AI suggestions failed", variant: "destructive" });
    },
  });

  const aiBetSuggest = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/ai/bet-suggestion", {
        theme: theme || "",
        rating,
        mood,
        count: 5,
      });
      return res.json() as Promise<{ bets: string[] }>;
    },
    onSuccess: (data) => {
      if (data.bets.length > 0) {
        setBetSuggestions(data.bets);
        setBetIndex(0);
        setBetDescription(data.bets[0]);
        toast({ title: "Got bet ideas — tap arrows to browse" });
      }
    },
    onError: () => {
      toast({ title: "Bet suggestion failed", variant: "destructive" });
    },
  });

  const cycleBet = (direction: 1 | -1) => {
    if (betSuggestions.length === 0) return;
    const next = (betIndex + direction + betSuggestions.length) % betSuggestions.length;
    setBetIndex(next);
    setBetDescription(betSuggestions[next]);
  };

  const addSquare = () => {
    if (squares.length >= totalNeeded) return;
    setSquares([...squares, { text: "", description: "" }]);
  };

  const removeSquare = (index: number) => {
    setSquares(squares.filter((_, i) => i !== index));
  };

  const updateSquare = (index: number, field: "text" | "description", value: string) => {
    const updated = [...squares];
    updated[index] = { ...updated[index], [field]: value };
    setSquares(updated);
  };

  const handleShareEdit = async () => {
    const url = `${window.location.origin}/edit/${params.id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: `Edit: ${title}`, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        toast({ title: "Edit link copied", description: "Send this to your partner so they can add squares too" });
      }
    } catch {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({ title: "Edit link copied" });
    }
  };

  const canSave = title.trim() && theme.trim() && squares.length === totalNeeded && squares.every((s) => s.text.trim());

  if (isEditing && loadingGame) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-lg mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => navigate("/")} data-testid="button-back">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-lg font-bold text-foreground">
              {isEditing ? "Edit Game" : "New Game"}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {isEditing && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="icon" variant="ghost" onClick={handleShareEdit} data-testid="button-share-edit">
                    {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share edit link with partner</TooltipContent>
              </Tooltip>
            )}
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-4 space-y-4 pb-8">
        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Game Mode</label>
            <p className="text-xs text-muted-foreground mb-2">Who's playing?</p>
            <div className="grid grid-cols-2 gap-2">
              {MOODS.map((m) => {
                const Icon = m.icon;
                return (
                  <Tooltip key={m.value}>
                    <TooltipTrigger asChild>
                      <Button
                        data-testid={`button-mood-${m.value}`}
                        variant={mood === m.value ? "default" : "outline"}
                        className={cn("gap-2", mood === m.value && "toggle-elevate toggle-elevated")}
                        onClick={() => setMood(m.value)}
                      >
                        <Icon className="w-4 h-4" />
                        {m.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{m.desc}</TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Title</label>
            <Input
              data-testid="input-title"
              placeholder={mood === "couples" ? "e.g., Friday Date Night" : mood === "friends-trip" ? "e.g., Vegas Weekend" : "e.g., Game Night Party"}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Theme</label>
            <Input
              data-testid="input-theme"
              placeholder={mood === "couples" ? "e.g., Flirty dinner out" : mood === "friends-trip" ? "e.g., Beach trip vibes" : "e.g., House party chaos"}
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">Player Names</label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  data-testid="input-player1-label"
                  placeholder="Player 1"
                  value={player1Label}
                  onChange={(e) => setPlayer1Label(e.target.value)}
                  className="text-sm"
                  maxLength={20}
                />
              </div>
              <span className="flex items-center text-muted-foreground text-sm">vs</span>
              <div className="flex-1">
                <Input
                  data-testid="input-player2-label"
                  placeholder="Player 2"
                  value={player2Label}
                  onChange={(e) => setPlayer2Label(e.target.value)}
                  className="text-sm"
                  maxLength={20}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Grid Size</label>
            <div className="flex gap-2">
              {[3, 4, 5].map((size) => (
                <Button
                  key={size}
                  data-testid={`button-grid-${size}`}
                  variant={gridSize === size ? "default" : "outline"}
                  className={cn("flex-1", gridSize === size && "toggle-elevate toggle-elevated")}
                  onClick={() => {
                    setGridSize(size);
                    if (squares.length > size * size) {
                      setSquares(squares.slice(0, size * size));
                    }
                  }}
                >
                  {size}x{size}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Spice Level</label>
            <p className="text-xs text-muted-foreground mb-2">Controls how spicy AI suggestions get</p>
            <div className="flex gap-2">
              {RATINGS.map((r) => (
                <Tooltip key={r.value}>
                  <TooltipTrigger asChild>
                    <Button
                      data-testid={`button-rating-${r.value}`}
                      variant={rating === r.value ? "default" : "outline"}
                      className={cn("flex-1", rating === r.value && "toggle-elevate toggle-elevated")}
                      onClick={() => setRating(r.value)}
                    >
                      {r.label}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{r.desc}</TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label className="text-sm font-medium text-foreground">The Bet</label>
              <div className="flex items-center gap-1">
                {betSuggestions.length > 0 && (
                  <>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => cycleBet(-1)}
                      data-testid="button-bet-prev"
                    >
                      <ArrowLeft className="w-3 h-3" />
                    </Button>
                    <Badge variant="secondary" className="text-[10px]">
                      {betIndex + 1}/{betSuggestions.length}
                    </Badge>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => cycleBet(1)}
                      data-testid="button-bet-next"
                    >
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </Button>
                  </>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => aiBetSuggest.mutate()}
                      disabled={aiBetSuggest.isPending}
                      data-testid="button-ai-bet"
                    >
                      {aiBetSuggest.isPending ? (
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                      ) : betSuggestions.length > 0 ? (
                        <RefreshCw className="w-3 h-3 mr-1" />
                      ) : (
                        <Wand2 className="w-3 h-3 mr-1" />
                      )}
                      {betSuggestions.length > 0 ? "More" : "AI Bet"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Get AI-generated bet ideas</TooltipContent>
                </Tooltip>
              </div>
            </div>
            <Textarea
              data-testid="input-bet"
              placeholder="What does the winner get?"
              value={betDescription}
              onChange={(e) => setBetDescription(e.target.value)}
              className="resize-none text-sm"
              rows={2}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Squares
              <Badge variant="secondary" className="text-xs">
                {squares.length}/{totalNeeded}
              </Badge>
            </h3>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => aiSuggest.mutate()}
                disabled={aiSuggest.isPending || !theme.trim() || squares.length >= totalNeeded}
                data-testid="button-ai-suggest"
              >
                {aiSuggest.isPending ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4 mr-1" />
                )}
                AI Fill
              </Button>
              {squares.length < totalNeeded && (
                <Button size="icon" variant="outline" onClick={addSquare} data-testid="button-add-square">
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            {squares.map((square, index) => (
              <Card key={index} className="p-3">
                <div className="flex items-start gap-2">
                  <div className="flex-1 space-y-2">
                    <Input
                      data-testid={`input-square-text-${index}`}
                      placeholder="Square text (short)"
                      value={square.text}
                      onChange={(e) => updateSquare(index, "text", e.target.value)}
                      className="text-sm"
                    />
                    <Input
                      data-testid={`input-square-desc-${index}`}
                      placeholder="Description"
                      value={square.description}
                      onChange={(e) => updateSquare(index, "description", e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => removeSquare(index)}
                    data-testid={`button-remove-square-${index}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </Card>
            ))}

            {squares.length === 0 && (
              <Card className="p-6 text-center">
                <Wand2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Enter a theme above and tap "AI Fill" to auto-generate squares, or add them manually.
                </p>
              </Card>
            )}
          </div>
        </div>

        <Button
          data-testid="button-save-game"
          className="w-full"
          onClick={() => saveGame.mutate()}
          disabled={!canSave || saveGame.isPending}
        >
          {saveGame.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          {isEditing ? "Save Changes" : "Create Game"}
        </Button>

        {isEditing && (
          <Card className="p-4">
            <div className="flex items-start gap-3">
              <Share2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="space-y-2 flex-1">
                <p className="text-sm font-medium text-foreground">Build together</p>
                <p className="text-xs text-muted-foreground">
                  Share the edit link so others can add their own squares too.
                </p>
                <Button size="sm" variant="outline" onClick={handleShareEdit} data-testid="button-share-edit-bottom">
                  {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                  {copied ? "Copied" : "Copy Edit Link"}
                </Button>
              </div>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

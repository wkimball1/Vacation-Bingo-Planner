import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, User, Lock, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface LoginScreenProps {
  onLogin: (player: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [mode, setMode] = useState<"select" | "login" | "setup">("select");
  const { toast } = useToast();

  const checkStatus = useMutation({
    mutationFn: async (player: string) => {
      const res = await apiRequest("GET", `/api/auth/status/${player}`);
      return res.json() as Promise<{ hasPin: boolean; shared: boolean }>;
    },
    onSuccess: (data, player) => {
      setSelectedPlayer(player);
      setMode(data.hasPin ? "login" : "setup");
    },
  });

  const login = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/login", {
        player: selectedPlayer,
        pin,
      });
      return res.json();
    },
    onSuccess: () => {
      if (selectedPlayer) {
        localStorage.setItem("bingoPlayer", selectedPlayer);
        localStorage.setItem(`bingoPin_${selectedPlayer}`, pin);
        onLogin(selectedPlayer);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Wrong PIN",
        description: "That PIN doesn't match. Try again.",
        variant: "destructive",
      });
    },
  });

  const setup = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/auth/setup", {
        player: selectedPlayer,
        pin,
      });
      return res.json();
    },
    onSuccess: () => {
      if (selectedPlayer) {
        localStorage.setItem("bingoPlayer", selectedPlayer);
        localStorage.setItem(`bingoPin_${selectedPlayer}`, pin);
        onLogin(selectedPlayer);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Setup failed",
        description: error.message || "Could not set up your PIN.",
        variant: "destructive",
      });
    },
  });

  const handlePlayerSelect = (player: string) => {
    setPin("");
    checkStatus.mutate(player);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) {
      toast({
        title: "PIN too short",
        description: "Your PIN needs to be at least 4 characters.",
        variant: "destructive",
      });
      return;
    }
    if (mode === "login") {
      login.mutate();
    } else {
      setup.mutate();
    }
  };

  const isLoading = checkStatus.isPending || login.isPending || setup.isPending;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <Heart className="w-10 h-10 text-primary fill-primary mx-auto" />
          <h1 className="text-2xl font-bold text-foreground">Date Bingo</h1>
          <p className="text-sm text-muted-foreground">Couples Trip Edition</p>
        </div>

        {mode === "select" && (
          <div className="space-y-3">
            <p className="text-center text-sm text-muted-foreground">Who are you?</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                data-testid="select-player-him"
                onClick={() => handlePlayerSelect("him")}
                disabled={isLoading}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-md border transition-all",
                  "bg-card border-card-border hover-elevate active-elevate-2",
                )}
              >
                <User className="w-8 h-8 text-foreground" />
                <span className="font-semibold text-foreground">Him</span>
              </button>
              <button
                data-testid="select-player-her"
                onClick={() => handlePlayerSelect("her")}
                disabled={isLoading}
                className={cn(
                  "flex flex-col items-center gap-3 p-6 rounded-md border transition-all",
                  "bg-card border-card-border hover-elevate active-elevate-2",
                )}
              >
                <Heart className="w-8 h-8 text-foreground" />
                <span className="font-semibold text-foreground">Her</span>
              </button>
            </div>
          </div>
        )}

        {(mode === "login" || mode === "setup") && (
          <Card className="p-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="text-center space-y-1">
                <div className="flex items-center justify-center gap-2">
                  {selectedPlayer === "him" ? (
                    <User className="w-5 h-5 text-primary" />
                  ) : (
                    <Heart className="w-5 h-5 text-primary" />
                  )}
                  <span className="font-semibold text-foreground capitalize">
                    {selectedPlayer}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {mode === "setup"
                    ? "Create a PIN to keep your card private"
                    : "Enter your PIN to see your cards"}
                </p>
              </div>

              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  data-testid="input-pin"
                  type="password"
                  placeholder={mode === "setup" ? "Create a PIN (4+ chars)" : "Enter your PIN"}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  className="pl-10"
                  autoFocus
                />
              </div>

              <Button
                data-testid="button-submit-pin"
                type="submit"
                className="w-full"
                disabled={isLoading || pin.length < 4}
              >
                {isLoading ? "..." : mode === "setup" ? "Set Up PIN" : "Enter"}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>

              <button
                data-testid="button-back"
                type="button"
                onClick={() => {
                  setMode("select");
                  setSelectedPlayer(null);
                  setPin("");
                }}
                className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Back
              </button>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
}

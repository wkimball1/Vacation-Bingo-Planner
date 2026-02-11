import { Heart, Sparkles, Users, Trophy, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary fill-primary" />
            <h1 className="text-lg font-bold text-foreground">Date Bingo</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <div className="max-w-sm w-full space-y-8 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-primary fill-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground" data-testid="text-landing-title">
              Date Bingo
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Turn any date into an adventure. Create custom bingo cards, 
              challenge your partner, and make every moment count.
            </p>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => { window.location.href = "/api/login"; }}
            data-testid="button-login"
          >
            <Heart className="w-4 h-4 mr-2" />
            Sign In to Play
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-3 text-center">
              <Sparkles className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-medium text-foreground">AI-Powered</p>
              <p className="text-[10px] text-muted-foreground">Smart square suggestions</p>
            </Card>
            <Card className="p-3 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-medium text-foreground">For Two</p>
              <p className="text-[10px] text-muted-foreground">His card & her card</p>
            </Card>
            <Card className="p-3 text-center">
              <Grid3X3 className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-medium text-foreground">Custom Cards</p>
              <p className="text-[10px] text-muted-foreground">Build your own or use templates</p>
            </Card>
            <Card className="p-3 text-center">
              <Trophy className="w-5 h-5 text-primary mx-auto mb-1.5" />
              <p className="text-xs font-medium text-foreground">Track Wins</p>
              <p className="text-[10px] text-muted-foreground">Game history & stats</p>
            </Card>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Sign in with Google, GitHub, or email
          </p>
        </div>
      </main>
    </div>
  );
}

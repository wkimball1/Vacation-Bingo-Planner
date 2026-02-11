import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import GameList from "@/pages/game-list";
import GameBuilder from "@/pages/game-builder";
import GamePlay from "@/pages/game-play";
import Landing from "@/pages/landing";
import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/components/ui/skeleton";

function AuthenticatedRouter() {
  return (
    <Switch>
      <Route path="/" component={GameList} />
      <Route path="/create" component={GameBuilder} />
      <Route path="/edit/:id" component={GameBuilder} />
      <Route path="/play/:id" component={GamePlay} />
      <Route component={NotFound} />
    </Switch>
  );
}

function UnauthenticatedRouter() {
  return (
    <Switch>
      <Route path="/edit/:id" component={GameBuilder} />
      <Route path="/play/:id" component={GamePlay} />
      <Route component={Landing} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <Skeleton className="h-8 w-32 mx-auto" />
          <Skeleton className="h-40" />
          <Skeleton className="h-10" />
        </div>
      </div>
    );
  }

  return isAuthenticated ? <AuthenticatedRouter /> : <UnauthenticatedRouter />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <AppContent />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

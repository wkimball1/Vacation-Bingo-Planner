import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import GameList from "@/pages/game-list";
import GameBuilder from "@/pages/game-builder";
import GamePlay from "@/pages/game-play";

function Router() {
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

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

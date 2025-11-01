import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Roadmaps from "./pages/Roadmaps";
import RoadmapGenerator from "./pages/RoadmapGenerator";
import Programs from "./pages/Programs";
import Companies from "./pages/Companies";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Loginpage";
import { ShootingStars } from "./components/ui/shooting-stars";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/roadmaps" element={<Roadmaps />} />
            <Route path="/roadmap-generator" element={<RoadmapGenerator />} />
            <Route path="/programs" element={<Programs />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/login" element={<LoginPage />} />
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
 
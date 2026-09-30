import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Roadmaps from "./pages/Roadmaps";
import RoadmapGenerator from "./pages/RoadmapGenerator";
import Programs from "./pages/Programs";
import Companies from "./pages/Companies";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Loginpage";
import ResetPassword from "./pages/ResetPassword";
import ExpertPage from "./pages/experts";
import Premium from "./pages/Premium";
import AiHelp from "./pages/aihelp";
import Internships from "./pages/Internship";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/roadmaps" element={<Roadmaps />} />
              <Route path="/roadmap-generator" element={<ProtectedRoute><RoadmapGenerator /></ProtectedRoute>} />
              <Route path="/programs" element={<Programs />} />
              <Route path="/companies" element={<Companies />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/experts" element={<ProtectedRoute><ExpertPage /></ProtectedRoute>} />
              <Route path="/aihelp" element={<ProtectedRoute><AiHelp /></ProtectedRoute>} />
              <Route path="/premium" element={<ProtectedRoute><Premium /></ProtectedRoute>} />
              <Route path="/internships" element={<Internships />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;

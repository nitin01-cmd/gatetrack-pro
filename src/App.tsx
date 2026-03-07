import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DataProvider } from "@/hooks/useAppData";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import LectureTracker from "@/pages/LectureTracker";
import PYQTracker from "@/pages/PYQTracker";
import StudyLogs from "@/pages/StudyLogs";
import Analytics from "@/pages/Analytics";
import SettingsPage from "@/pages/SettingsPage";
import RevisionManager from "@/pages/RevisionManager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <DataProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/lectures" element={<LectureTracker />} />
              <Route path="/revisions" element={<RevisionManager />} />
              <Route path="/pyqs" element={<PYQTracker />} />
              <Route path="/study-logs" element={<StudyLogs />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

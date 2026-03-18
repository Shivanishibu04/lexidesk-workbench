import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import SentenceDetection from "./pages/SentenceDetection";
import Summarizer from "./pages/Summarizer";
import Chatbot from "./pages/Chatbot";
import NotFound from "./pages/NotFound";
import { ThemeToggle } from "./components/ThemeToggle";

// New Pages & Context
import { DocumentProvider } from "@/lib/DocumentContext";
import DocumentHub from "./pages/DocumentHub";
import RhetoricalRole from "./pages/RhetoricalRole";
import AbstractiveSummary from "./pages/AbstractiveSummary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DocumentProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <ThemeToggle />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/document-hub" element={<DocumentHub />} />
            <Route path="/sentence-detection" element={<SentenceDetection />} />
            <Route path="/rhetorical-role" element={<RhetoricalRole />} />
            <Route path="/summarizer" element={<Summarizer />} />
            <Route path="/abstractive-summary" element={<AbstractiveSummary />} />
            <Route path="/chatbot" element={<Chatbot />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </DocumentProvider>
  </QueryClientProvider>
);

export default App;

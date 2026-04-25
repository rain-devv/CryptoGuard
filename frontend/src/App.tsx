import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/store/useAuth";
import { useEffect } from "react";

import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Encrypt from "./pages/Encrypt";
import Steganography from "./pages/Steganography";
import Decode from "./pages/Decode";
import Dashboard from "./pages/Dashboard";
import HowToUse from "./pages/HowToUse";
import NotFound from "./pages/NotFound";
import SiteLayout from "./components/SiteLayout";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isLoggedIn } = useAuth();
  if (!isLoggedIn) return <Navigate to="/home" replace />;
  return <>{children}</>;
};

const ActivityWatcher = () => {
  const { updateActivity, checkAutoLogout } = useAuth();

  useEffect(() => {
    const interval = setInterval(() => {
      checkAutoLogout();
    }, 60 * 1000);

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    const handleActivity = () => updateActivity();
    events.forEach((e) => window.addEventListener(e, handleActivity));

    return () => {
      clearInterval(interval);
      events.forEach((e) => window.removeEventListener(e, handleActivity));
    };
  }, [updateActivity, checkAutoLogout]);

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ActivityWatcher />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<SiteLayout />}>
            <Route path="/home" element={<Index />} />
            <Route path="/encrypt" element={<ProtectedRoute><Encrypt /></ProtectedRoute>} />
            <Route path="/steganography" element={<ProtectedRoute><Steganography /></ProtectedRoute>} />
            <Route path="/decode" element={<ProtectedRoute><Decode /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/how-to-use" element={<HowToUse />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

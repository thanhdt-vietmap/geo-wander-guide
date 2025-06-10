
import React from "react";
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from "./components/ui/toaster";
import { Toaster as Sonner } from "./components/ui/sonner";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SecurityManager } from "./utils/securityManager";
import LanguageSyncProvider from "./components/LanguageSyncProvider";
import { useLanguageShortcuts } from "./hooks/useLanguageShortcuts";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import FontTest from "./components/FontTest";

const queryClient = new QueryClient();

// Initialize Security Manager
SecurityManager.initialize();

// Internal component to use hooks within Provider context
const AppInner = () => {
  useLanguageShortcuts();
  
  return (
    <>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/font-test" element={<FontTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <LanguageSyncProvider>
          <AppInner />
        </LanguageSyncProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;

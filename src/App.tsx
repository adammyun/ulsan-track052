import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";

// 보조 라우트는 lazy 로 코드 스플리팅 — 첫 화면 번들 크기 감소
const Article = lazy(() => import("./pages/Article.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));
const Archive = lazy(() => import("./pages/Archive.tsx"));
const ArchiveDetail = lazy(() => import("./pages/ArchiveDetail.tsx"));

const queryClient = new QueryClient();

const RouteFallback = () => (
  <div className="min-h-dvh bg-paper" aria-hidden />
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<RouteFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/article" element={<Article />} />
            <Route path="/archive" element={<Archive />} />
            <Route path="/archive/:id" element={<ArchiveDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

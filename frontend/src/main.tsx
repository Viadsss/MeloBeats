import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { ThemeProvider } from "next-themes";
import { Toaster } from "./components/ui/sonner.tsx";
import { Router } from "./Router.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        storageKey="ui-theme"
      >
        <Router />
        <Toaster richColors style={{ fontFamily: "inherit" }} />
      </ThemeProvider>
    </QueryClientProvider>
  </StrictMode>,
);

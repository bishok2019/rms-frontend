import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { ThemeProvider } from "@/contexts/theme-context";
import "./App.css";
import App from "./App";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0,
      retry: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
    },
  },
});
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <ThemeProvider defaultTheme="light" storageKey="restaurant-theme">
        <App />
        <Toaster richColors expand={true} />
      </ThemeProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

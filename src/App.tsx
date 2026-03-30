import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, Outlet, RouterProvider } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppConfigProvider } from "@/contexts/AppConfigContext";
import { ConversationProvider } from "@/contexts/ConversationContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

function RootLayout() {
  return (
    <>
      <Toaster />
      <Sonner />
      <Outlet />
    </>
  );
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <RootLayout />,
      children: [
        { index: true, element: <Index /> },
        { path: "*", element: <NotFound /> },
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AppConfigProvider>
      <ConversationProvider>
        <TooltipProvider>
          <RouterProvider router={router} />
        </TooltipProvider>
      </ConversationProvider>
    </AppConfigProvider>
  </QueryClientProvider>
);

export default App;

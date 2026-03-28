import { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AppLockProvider } from "./AppLockProvider";
import { ThemeProvider } from "./ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppLockProvider>{children}</AppLockProvider>
      </ThemeProvider>
      <Toaster
        position="top-right"
        richColors
        expand={false}
        toastOptions={{
          classNames: {
            toast: "!border-border !bg-white !text-slate-900 dark:!bg-slate-950 dark:!text-slate-50",
            description: "!text-slate-500 dark:!text-slate-400",
          },
        }}
      />
    </QueryClientProvider>
  );
}

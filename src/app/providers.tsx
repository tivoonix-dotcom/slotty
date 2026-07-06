import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { AuthProvider } from '../features/auth/AuthProvider';
import { TelegramBrowserLoginPoller } from '../features/auth/components/TelegramBrowserLoginPoller';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
    },
  },
});

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TelegramBrowserLoginPoller />
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}

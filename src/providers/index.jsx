import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster, toast } from 'sonner'
import { AuthProvider } from './auth-provider'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error) => {
        const message = error?.message || 'Error inesperado'
        toast.error(message)
      },
    },
  },
})

export function AppProviders({ children }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
        <Toaster
          position="bottom-right"
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: '#0a0f1a',
              border: '1px solid rgba(255,255,255,0.05)',
              color: '#e2e8f0',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  )
}

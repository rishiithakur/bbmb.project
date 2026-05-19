import { Toaster } from 'react-hot-toast'
import { AppRouter } from './routes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PWAInstallPrompt } from './components/PWAInstallPrompt'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
      <Toaster position="top-right" />
      <PWAInstallPrompt />
    </QueryClientProvider>
  )
}

export default App

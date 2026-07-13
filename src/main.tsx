import { BrowserRouter } from 'react-router-dom'
import { WatchlistProvider } from './context/WatchlistContext'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'
import App from './App.tsx'
import { createRoot } from 'react-dom/client'

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || undefined}>
      <WatchlistProvider>
        <App />
      </WatchlistProvider>
    </BrowserRouter>
  </ErrorBoundary>,
)

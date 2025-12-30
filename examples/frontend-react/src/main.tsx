import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SelixProvider } from '@selix/react-query'
import { vanillaClient } from './utils/selix'

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <QueryClientProvider client={queryClient}>
            <SelixProvider client={vanillaClient} queryClient={queryClient}>
                <App />
            </SelixProvider>
        </QueryClientProvider>
    </React.StrictMode>,
)

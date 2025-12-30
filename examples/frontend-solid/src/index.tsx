/* @refresh reload */
import { render } from 'solid-js/web';
import { QueryClient, QueryClientProvider } from '@tanstack/solid-query';
import { SelixProvider } from '@selix/solid-query';
import { vanillaClient } from './selix';
import App from './App';

const queryClient = new QueryClient();

render(
    () => (
        <QueryClientProvider client={queryClient}>
            <SelixProvider client={vanillaClient} queryClient={queryClient}>
                <App />
            </SelixProvider>
        </QueryClientProvider>
    ),
    document.getElementById('root') as HTMLElement
);

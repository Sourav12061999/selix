import { createSelixSvelte } from '@selix/svelte-query';
import { createClient } from '@selix/client';
import type { AppRouter } from 'backend-express/src/index';

export const selix = createSelixSvelte<AppRouter>();

export const vanillaClient = createClient<AppRouter>({
    url: 'http://localhost:3002/selix'
});

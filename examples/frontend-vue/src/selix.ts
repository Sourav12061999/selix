import { createSelixVue } from '@selix/vue-query';
import { createClient } from '@selix/client';
import type { AppRouter } from 'backend-hono/src/index';

export const selix = createSelixVue<AppRouter>();

export const vanillaClient = createClient<AppRouter>({
    url: 'http://localhost:3001/selix'
});

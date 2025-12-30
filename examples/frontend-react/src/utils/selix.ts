import { createSelixReact } from '@selix/react-query';
import { createClient } from '@selix/client';
import type { AppRouter } from 'backend-hono/src/index';

export const selix = createSelixReact<AppRouter>();

export const vanillaClient = createClient<AppRouter>({
    url: 'http://localhost:3001/selix'
});

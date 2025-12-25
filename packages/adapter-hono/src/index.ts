import { Context, Hono } from 'hono';
import type { Router, ProcedureDef } from '@selix/core';

export function createHonoMiddleware(router: Router) {
    return async (c: Context) => {
        try {
            const path = c.req.path;
            // Hono path handling might differ depending on how it's mounted.
            // Assuming mounted like app.route('/api', ...), we need to handle path stripping if needed or expect full path.
            // For simplicity in this v1, let's assume the path *suffix* matches the procedure name.
            // In Hono, if we use a wildcard route, say app.all('/api/*', ...), we can extract the suffix.

            // Simplified approach: Extract the last part of the URL as procedure name
            // This assumes flat router for now.

            const url = new URL(c.req.url);
            const parts = url.pathname.split('/');
            const procedureName = parts[parts.length - 1]; // very naive, improving later

            const procedure = router._def.procedures[procedureName];

            if (!procedure) {
                return c.json({ error: 'Procedure not found' }, 404);
            }

            if ('_def' in procedure) {
                return c.json({ error: 'Nested routers not yet supported in adapter' }, 501);
            }

            const procDef = procedure as ProcedureDef;

            // Validate input
            const input = await c.req.json().catch(() => ({})); // Handle empty body safely
            const parsedInput = procDef.input.parse(input);

            const result = await procDef.resolver({ input: parsedInput });

            return c.json(result);

        } catch (err: any) {
            console.error(err);
            return c.json({ error: err.message }, 500);
        }
    };
}

export function selixMiddleware(router: Router) {
    // Return a handler compatible with Hono's app.all() or app.post()
    return createHonoMiddleware(router);
}

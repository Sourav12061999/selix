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

            // Delegate validation and projection to the Core Procedure
            const input = await c.req.json().catch(() => ({}));
            // We need to parse project from body if available, similar to express adapter
            // Assuming input and project are at root of body for now, but previous Hono code assumed body IS input.
            // Let's checking if we can support that.
            // For now, let's assume the body structure is { input, project } if we want projection, 
            // OR just pure input if no projection. 
            // But to be consistent with Express adapter which does const { input, project } = req.body;

            // Let's stick to the Express adapter pattern for consistency in this refactor.
            const body = input; // input read above
            const procInput = body.input !== undefined ? body.input : body;
            // Wait, if body is { input: ... }, we use it. If not, maybe the whole body is input?
            // The express adapter explicitly destructured { input, project } = req.body.
            // If the user sends { foo: "bar" }, express adapter would see input=undefined.
            // So we should strictly follow { input, project } structure for now to match Express adapter until further clarification.

            const { input: callInput, project } = body;

            const result = await procDef.call({ input: callInput, project });

            if (!result.ok) {
                return c.json({ error: result.error.message }, result.status as any);
            }

            return c.json(result.data);

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

import { Context, Hono } from 'hono';
import type { Router, ProcedureDef } from '@selix/core';
import { getProcedure } from '@selix/core';

export function createHonoMiddleware({
    router,
    createContext
}: {
    router: Router;
    createContext?: (opts: { c: Context }) => Promise<any> | any;
}) {
    return async (c: Context) => {
        try {
            const path = c.req.path;

            // ... (keeping existing path logic for now as user did not complain about it)
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const segments = cleanPath.split('/');

            const procedure = getProcedure(router, segments);

            if (!procedure) {
                return c.json({ error: 'Procedure not found' }, 404);
            }

            if ('_def' in procedure) {
                return c.json({ error: 'Nested routers not yet supported in adapter (found router endpoint)' }, 501);
            }

            const procDef = procedure as ProcedureDef;

            // Validate Method
            const method = c.req.method;
            if (procDef.type === 'query' && method !== 'GET') {
                return c.json({ error: 'Method Not Allowed. Queries must be GET.' }, 405);
            }
            if (procDef.type === 'mutation' && method !== 'POST') {
                return c.json({ error: 'Method Not Allowed. Mutations must be POST.' }, 405);
            }

            let input: any;
            let project: any;

            if (procDef.type === 'query') {
                const queryInput = c.req.query('input');
                const queryProject = c.req.query('project');

                try {
                    input = queryInput ? JSON.parse(queryInput) : undefined;
                } catch (e) {
                    return c.json({ error: 'Invalid JSON in input query param' }, 400);
                }
                try {
                    project = queryProject ? JSON.parse(queryProject) : undefined;
                } catch (e) {
                    return c.json({ error: 'Invalid JSON in project query param' }, 400);
                }
            } else {
                const body = await c.req.json().catch(() => ({}));
                input = body.input;
                project = body.project;
            }

            const ctx = createContext ? await createContext({ c }) : {};

            const result = await procDef.call({ input, project, ctx });

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
    return createHonoMiddleware({ router });
}

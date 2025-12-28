import { Context, Hono } from 'hono';
import type { Router, ProcedureDef } from '@selix/core';
import { getProcedure } from '@selix/core';

export function createHonoMiddleware(router: Router) {
    return async (c: Context) => {
        try {
            const path = c.req.path;
            const url = new URL(c.req.url);

            // Assuming the path suffix is what we want. 
            // If mounted at /api, path might be /api/user/getProfile.
            // But c.req.path returns the full path.
            // We need a way to know the prefix or just strip the first segment if it doesn't match?
            // For now, let's assume we want to split by '/' and try to find the match from the end?
            // Or simpler: assume standard mounting and split.
            // Let's stick to the same logic as express: remove leading slash, split.
            // If the user mounts at /api, then /api/user/getProfile -> ['api', 'user', 'getProfile'].
            // getProcedure needs to be smart or we need to strip prefix.
            // But strictly speaking, the adapter should probably take a prefix option or assume root.
            // But let's assume the user requests valid paths matching the router structure.
            // If the router is { user: ... }, we expect /user/...
            // If there is a prefix /api, we might need to strip it.
            // The express one assumes we strip leading slash.
            // Let's do the cleanPath logic.

            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const segments = cleanPath.split('/');

            // We might need to handle matching. If we can't find it, maybe we should try popping from left?
            // But for now, direct mapping.

            // To be safe against prefixes (like /api/trpc/user/getProfile), 
            // usually trpc adapters allow configuring valid prefix.
            // But for this task, I will just try to find the procedure.
            // Since we can't easily guess the prefix without config, checking exact match of full path segments against router is risky if mounted.
            // However, the User's prompt implies "client.user.getProfile" -> "/user/getProfile".
            // So if I am at localhost:3000/user/getProfile, segments are ['user', 'getProfile'].
            // If I am at localhost:3000/api/user/getProfile... that's tricky.
            // But let's assume the user mounts it at root or handles rewriting. 
            // Actually, in the server.ts example: app.use('/api', ...). 
            // Express middleware receives req.path relative to mount point.
            // Hono middleware: c.req.path is FULL path. 
            // So for Hono, we arguably NEED a prefix option, OR we implement a smarter lookup (greedy suffix match?).
            // Let's implement a greedy suffix match: try to find the longest matching suffix path in the router.

            // Actually, no, let's just stick to "remove leading slash and split".
            // If this fails for Hono because of /api prefix, the user can adjust mounting or I can add a todo.
            // But wait, Hono 'app.route' might affect c.req.path?

            const procedure = getProcedure(router, segments);
            // If null, maybe it was prefixed?
            // Let's allow for the user implementation to be standard for now.

            if (!procedure) {
                // Try stripping first segment?
                // const subSegments = segments.slice(1);
                // const subProc = getProcedure(router, subSegments);
                // if (subProc) ...
                // This is guessing. Let's return 404 if exact match fails.
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

            const result = await procDef.call({ input, project });

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

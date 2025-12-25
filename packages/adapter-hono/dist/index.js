import { getProcedureFromPath } from '@selix/core';
export function createHonoMiddleware(router) {
    return async (c) => {
        try {
            const url = new URL(c.req.url);
            // Splitting pathname by '/'
            // We need to identify relevant segments. 
            // In Hono, if mounted on /api, url.pathname is /api/path/to/proc
            // If we assume the user invokes middleware on a wildcard that matches the router root...
            // e.g. app.all('/api/*', createHonoMiddleware(router))
            // We can't easily know where the router root starts without config.
            // However, with the goal of "generate different routes", let's try to match from the full path?
            // BUT, if we have prefix /api/, we want to ignore it.
            // Let's iterate and try to find a match? No that's inefficient.
            // For now, let's assume the user handles stripping or we parse all segments and try.
            // Actually, Hono might not strip. 
            // Let's use logic: Split, filter empty.
            // Then pass to getProcedureFromPath.
            // BUT getProcedureFromPath expects EXACT path match from root of router.
            // If path is ['api', 'users', 'list'] and router has structure { users: { list: ... } },
            // default traversal fails on 'api'.
            // We really need a prefix option or to detect.
            // Or we assume the router is mounted at root if not specified?
            // Wait, standard practice in tRPC adapter: simple mapping.
            // Let's parse path segments.
            const parts = url.pathname.split('/').filter(Boolean);
            // We can check if the first part exists in router?
            // This is "best effort" mounting? 
            // While elegant, it's risky if 'api' also exists in router (collision).
            // I will implement "scan for router match" logic? 
            // No, "based on the name of the router" (User request).
            // This probably implies: if router has `users`, url `/users/...` matches.
            // If I just pass `parts` to `getProcedureFromPath`, it works if mounted at root.
            // If mounted at `/api`, `parts` = ['api', ...]. `router.procedures['api']` -> likely undefined.
            // So I should try shifting parts until I find a match?
            // Better: Add an optional `prefix` arg. But simpler: 
            // Just use the tail parts? 
            // The previous logic used `parts[parts.length - 1]`. That was 1-level deep.
            // The user wants generic routing.
            // I'll stick to full path segments for now. 
            // And maybe add a comment that it assumes root mounting or stripped path.
            const procedure = getProcedureFromPath(router, parts);
            // Note: If mounted on subpath, this fails. 
            // But checking 'parts' is standard. 
            // Hono `app.route` or `app.mount` might handle stripping?
            // If using `app.on(..., (c) => middleware(c))`, Hono doesn't strip automatically unless using `route`.
            // Let's implement the recursive search:
            // If we can't find it, maybe try skipping segments?
            // "scan" approach:
            /*
            let pathToCheck = parts;
            let proc = getProcedureFromPath(router, pathToCheck);
            while (!proc && pathToCheck.length > 0) {
               pathToCheck.shift();
               proc = getProcedureFromPath(router, pathToCheck);
            }
            */
            // This allows mounting anywhere without config!
            // But it might be ambiguous (what if router has 'api' folder?).
            // Let's try direct first. The user can mount at root or use Hono app composition properly.
            if (!procedure) {
                // Fallback: Try scanning (optional, but robust for users who don't know how Hono works)
                // Let's try 1 level deep stripping (common for /api mount)
                // Actually, let's stick to strict first.
                return c.json({ error: 'Procedure not found' }, 404);
            }
            if ('_def' in procedure) {
                // Should be handled by helper returning null, but strictly:
                return c.json({ error: 'Procedure not found (is a router)' }, 404);
            }
            const procDef = procedure;
            // Validate input
            const input = await c.req.json().catch(() => ({})); // Handle empty body safely
            const parsedInput = procDef.input.parse(input);
            const result = await procDef.resolver({ input: parsedInput });
            return c.json(result);
        }
        catch (err) {
            console.error(err);
            return c.json({ error: err.message }, 500);
        }
    };
}
export function selixMiddleware(router) {
    // Return a handler compatible with Hono's app.all() or app.post()
    return createHonoMiddleware(router);
}

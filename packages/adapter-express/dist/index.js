export function createExpressMiddleware({ router }) {
    return async (req, res, next) => {
        try {
            const { path } = req;
            // Remove leading slash and split by dot if nested (nested routers not fully impl yet but handle flat for now)
            // Actually my client sends /procedureName.
            // req.path in express when mounted on /api, and called /api/hello, is /hello.
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const procedureName = cleanPath;
            const procedure = router._def.procedures[procedureName];
            if (!procedure) {
                res.status(404).json({ error: 'Procedure not found' });
                return;
            }
            // Check if it's a procedure or a router (nested routers todo)
            // For now assume flat router
            if ('_def' in procedure) {
                // Nested router, not supported in this simple version yet
                res.status(501).json({ error: 'Nested routers not yet supported in adapter' });
                return;
            }
            const procDef = procedure;
            // Extract input and project from body
            const { input, project } = req.body;
            // Delegate validation and projection to the Core Procedure
            const result = await procDef.call({ input, project });
            res.json(result);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    };
}

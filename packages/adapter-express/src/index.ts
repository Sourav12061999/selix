import { Router, ProcedureDef } from '@selix/core';
import type { Request, Response, NextFunction } from 'express';

export function createExpressMiddleware({ router }: { router: Router }) {
    return async (req: Request, res: Response, next: NextFunction) => {
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

            const procDef = procedure as ProcedureDef;

            // Extract input and project from body
            const { input, project } = req.body;

            // Delegate validation and projection to the Core Procedure
            const result = await procDef.call({ input, project });

            if (!result.ok) {
                res.status(result.status).json({ error: result.error.message });
                return;
            }

            res.json(result.data);

        } catch (err: any) {
            res.status(500).json({ error: err.message });
        }
    };
}

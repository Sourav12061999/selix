import { getProcedureFromPath } from '@selix/core';
export function createExpressMiddleware({ router }) {
    return async (req, res, next) => {
        try {
            const { path } = req;
            // Remove leading slash and split by dot if nested (nested routers not fully impl yet but handle flat for now)
            // Actually my client sends /procedureName.
            // req.path in express when mounted on /api, and called /api/hello, is /hello.
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const pathSegments = cleanPath.split('/').filter(Boolean);
            const procedure = getProcedureFromPath(router, pathSegments);
            if (!procedure) {
                res.status(404).json({ error: 'Procedure not found' });
                return;
            }
            // ProcedureDef is guaranteed if not null (helper returns ProcedureDef | null)
            const procDef = procedure;
            // Validate input
            const input = req.body;
            const parsedInput = procDef.input.parse(input);
            const result = await procDef.resolver({ input: parsedInput });
            res.json(result);
        }
        catch (err) {
            console.error(err);
            res.status(500).json({ error: err.message });
        }
    };
}

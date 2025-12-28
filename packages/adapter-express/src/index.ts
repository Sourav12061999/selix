import { Router, ProcedureDef, getProcedure } from '@selix/core';
import type { Request, Response, NextFunction } from 'express';

export function createExpressMiddleware({ router }: { router: Router }) {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { path } = req;
            const cleanPath = path.startsWith('/') ? path.slice(1) : path;
            const segments = cleanPath.split('/');

            const procedure = getProcedure(router, segments);

            if (!procedure) {
                res.status(404).json({ error: 'Procedure not found' });
                return;
            }

            const procDef = procedure as ProcedureDef;

            // Validate Method
            if (procDef.type === 'query' && req.method !== 'GET') {
                res.status(405).json({ error: 'Method Not Allowed. Queries must be GET.' });
                return;
            }
            if (procDef.type === 'mutation' && req.method !== 'POST') {
                res.status(405).json({ error: 'Method Not Allowed. Mutations must be POST.' });
                return;
            }

            let input: any;
            let project: any;

            if (procDef.type === 'query') {
                // Parse from Query String
                const queryInput = req.query.input;
                const queryProject = req.query.project;

                try {
                    input = (queryInput && typeof queryInput === 'string') ? JSON.parse(queryInput) : undefined;
                } catch (e) {
                    res.status(400).json({ error: 'Invalid JSON in input query param' });
                    return;
                }

                try {
                    project = (queryProject && typeof queryProject === 'string') ? JSON.parse(queryProject) : undefined;
                } catch (e) {
                    res.status(400).json({ error: 'Invalid JSON in project query param' });
                    return;
                }

            } else {
                // Parse from Body
                input = req.body.input;
                project = req.body.project;
            }

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

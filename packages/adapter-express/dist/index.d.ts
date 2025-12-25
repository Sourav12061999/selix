import { Router } from '@selix/core';
import type { Request, Response, NextFunction } from 'express';
export declare function createExpressMiddleware({ router }: {
    router: Router;
}): (req: Request, res: Response, next: NextFunction) => Promise<void>;
//# sourceMappingURL=index.d.ts.map
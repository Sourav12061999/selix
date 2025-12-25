import { Context } from 'hono';
import { Router } from '@selix/core';
export declare function createHonoMiddleware(router: Router): (c: Context) => Promise<Response & import("hono").TypedResponse<any, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
export declare function selixMiddleware(router: Router): (c: Context) => Promise<Response & import("hono").TypedResponse<any, import("hono/utils/http-status").ContentfulStatusCode, "json">>;
//# sourceMappingURL=index.d.ts.map
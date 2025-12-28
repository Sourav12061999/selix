import { z } from "zod";
import { applyProjection } from './projection';
import { getErrorFromUnknown, SELIX_HTTP_STATUS_MAP } from "./SelixError";
export class ProcedureDef {
    type;
    input;
    describe;
    resolver;
    middlewares;
    constructor(type, input, resolver, middlewares = [], describe) {
        this.type = type;
        this.input = input;
        this.resolver = resolver;
        this.middlewares = middlewares;
        this.describe = describe;
    }
    async call(opts) {
        try {
            const parsedInput = this.input.parse(opts.input);
            const ctx = opts.ctx ?? {};
            const executeStack = async (index) => {
                if (index < this.middlewares.length) {
                    const mw = this.middlewares[index];
                    return mw({
                        input: parsedInput,
                        ctx: ctx,
                        next: () => executeStack(index + 1)
                    });
                }
                else {
                    return this.resolver({ input: parsedInput, ctx: ctx });
                }
            };
            const result = await executeStack(0);
            if (opts.project) {
                return {
                    ok: true,
                    data: applyProjection(result, opts.project)
                };
            }
            return {
                ok: true,
                data: result
            };
        }
        catch (cause) {
            const error = getErrorFromUnknown(cause);
            const status = SELIX_HTTP_STATUS_MAP[error.code] ?? 500;
            return {
                ok: false,
                error,
                status
            };
        }
    }
}
export class ProcedureBuilder {
    _input;
    _describe;
    _middlewares = [];
    input(schema) {
        const newBuilder = new ProcedureBuilder();
        newBuilder._input = schema;
        newBuilder._describe = this._describe;
        newBuilder._middlewares = [...this._middlewares];
        return newBuilder;
    }
    context() {
        const newBuilder = new ProcedureBuilder();
        newBuilder._input = this._input;
        newBuilder._describe = this._describe;
        newBuilder._middlewares = [...this._middlewares];
        return newBuilder;
    }
    use(middleware) {
        this._middlewares.push(middleware);
        return this;
    }
    describe(desc) {
        const newBuilder = new ProcedureBuilder(); // Corrected generic propagation
        newBuilder._input = this._input;
        newBuilder._describe = desc;
        newBuilder._middlewares = [...this._middlewares];
        return newBuilder;
    }
    query(resolver) {
        return new ProcedureDef('query', this._input ?? z.undefined(), resolver, this._middlewares, this._describe);
    }
    mutation(resolver) {
        return new ProcedureDef('mutation', this._input ?? z.undefined(), resolver, this._middlewares, // Pass middlewares
        this._describe);
    }
}
export const procedure = new ProcedureBuilder();

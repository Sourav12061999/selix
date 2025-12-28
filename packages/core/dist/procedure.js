import { z } from "zod";
import { applyProjection } from './projection';
import { getErrorFromUnknown, SELIX_HTTP_STATUS_MAP } from "./SelixError";
export class ProcedureDef {
    type;
    input;
    resolver;
    constructor(type, input, resolver) {
        this.type = type;
        this.input = input;
        this.resolver = resolver;
    }
    async call(opts) {
        try {
            const parsedInput = this.input.parse(opts.input);
            const result = await this.resolver({ input: parsedInput });
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
    input(schema) {
        const newBuilder = new ProcedureBuilder();
        newBuilder._input = schema;
        return newBuilder;
    }
    query(resolver) {
        return new ProcedureDef('query', this._input ?? z.undefined(), resolver);
    }
    mutation(resolver) {
        return new ProcedureDef('mutation', this._input ?? z.undefined(), resolver);
    }
}
export const procedure = new ProcedureBuilder();

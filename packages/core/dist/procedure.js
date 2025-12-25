import { z } from "zod";
import { applyProjection } from './projection';
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
        const parsedInput = this.input.parse(opts.input);
        const result = await this.resolver({ input: parsedInput });
        if (opts.project) {
            return applyProjection(result, opts.project);
        }
        return result;
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

import { z } from "zod";
export class ProcedureBuilder {
    _input;
    input(schema) {
        const newBuilder = new ProcedureBuilder();
        newBuilder._input = schema;
        return newBuilder;
    }
    query(resolver) {
        return {
            type: 'query',
            input: this._input ?? z.undefined(),
            resolver,
        };
    }
    mutation(resolver) {
        return {
            type: 'mutation',
            input: this._input ?? z.undefined(),
            resolver,
        };
    }
}
export const procedure = new ProcedureBuilder();

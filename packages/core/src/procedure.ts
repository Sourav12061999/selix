import { z, ZodType } from "zod";

export type ProcedureType = 'query' | 'mutation';

export type ProcedureResolver<InputType, OutputType> = (opts: { input: InputType }) => Promise<OutputType> | OutputType;

export interface ProcedureDef<InputType = any, OutputType = any> {
    type: ProcedureType;
    input: ZodType<InputType>;
    resolver: ProcedureResolver<InputType, OutputType>;
}

export class ProcedureBuilder<InputType = any> {
    private _input?: ZodType<InputType>;

    input<T extends ZodType<any>>(schema: T): ProcedureBuilder<z.infer<T>> {
        const newBuilder = new ProcedureBuilder<z.infer<T>>();
        newBuilder._input = schema;
        return newBuilder;
    }

    query<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput> {
        return {
            type: 'query',
            input: this._input as any ?? z.undefined(),
            resolver,
        }
    }

    mutation<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput> {
        return {
            type: 'mutation',
            input: this._input as any ?? z.undefined(),
            resolver,
        }
    }
}

export const procedure = new ProcedureBuilder();

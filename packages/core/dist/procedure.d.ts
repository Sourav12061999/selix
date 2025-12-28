import { z, ZodType } from "zod";
import { SelixError } from "./SelixError";
export type ProcedureType = 'query' | 'mutation';
export type ProcedureResolver<InputType, OutputType> = (opts: {
    input: InputType;
}) => Promise<OutputType> | OutputType;
export declare class ProcedureDef<InputType = any, OutputType = any> {
    type: ProcedureType;
    input: ZodType<InputType>;
    resolver: ProcedureResolver<InputType, OutputType>;
    constructor(type: ProcedureType, input: ZodType<InputType>, resolver: ProcedureResolver<InputType, OutputType>);
    call(opts: {
        input: any;
        project?: any;
    }): Promise<{
        ok: true;
        data: any;
        error?: undefined;
        status?: undefined;
    } | {
        ok: false;
        error: SelixError;
        status: number;
        data?: undefined;
    }>;
}
export declare class ProcedureBuilder<InputType = any> {
    private _input?;
    input<T extends ZodType<any>>(schema: T): ProcedureBuilder<z.infer<T>>;
    query<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput>;
    mutation<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput>;
}
export declare const procedure: ProcedureBuilder<any>;
//# sourceMappingURL=procedure.d.ts.map
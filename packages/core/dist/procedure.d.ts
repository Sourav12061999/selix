import { z, ZodType } from "zod";
export type ProcedureType = 'query' | 'mutation';
export type ProcedureResolver<InputType, OutputType, ContextType> = (opts: {
    input: InputType;
    ctx: ContextType;
}) => Promise<OutputType> | OutputType;
export type Middleware<InputType, ContextType> = (opts: {
    input: InputType;
    ctx: ContextType;
    next: () => Promise<any>;
}) => Promise<any>;
export declare class ProcedureDef<InputType = any, OutputType = any, ContextType = any> {
    type: ProcedureType;
    input: ZodType<InputType>;
    describe: string | Record<string, string> | undefined;
    resolver: ProcedureResolver<InputType, OutputType, ContextType>;
    middlewares: Middleware<InputType, ContextType>[];
    constructor(type: ProcedureType, input: ZodType<InputType>, resolver: ProcedureResolver<InputType, OutputType, ContextType>, middlewares?: Middleware<InputType, ContextType>[], describe?: string | Record<string, string> | undefined);
    call(opts: {
        input: any;
        ctx?: ContextType;
        project?: any;
    }): Promise<{
        ok: true;
        data: any;
        error?: undefined;
        status?: undefined;
    } | {
        ok: false;
        error: import("./SelixError").SelixError;
        status: number;
        data?: undefined;
    }>;
}
export declare class ProcedureBuilder<InputType = any, ContextType = any> {
    private _input?;
    private _describe?;
    private _middlewares;
    input<T extends ZodType<any>>(schema: T): ProcedureBuilder<z.infer<T>, ContextType>;
    context<NewContext>(): ProcedureBuilder<InputType, NewContext>;
    use(middleware: Middleware<InputType, ContextType>): ProcedureBuilder<InputType, ContextType>;
    describe(desc: string | Record<string, string> | undefined): ProcedureBuilder<InputType, ContextType>;
    query<TOutput>(resolver: ProcedureResolver<InputType, TOutput, ContextType>): ProcedureDef<InputType, TOutput, ContextType>;
    mutation<TOutput>(resolver: ProcedureResolver<InputType, TOutput, ContextType>): ProcedureDef<InputType, TOutput, ContextType>;
}
export declare const procedure: ProcedureBuilder<any, any>;
//# sourceMappingURL=procedure.d.ts.map
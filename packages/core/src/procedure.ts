import { z, ZodType } from "zod";
import { applyProjection } from './projection';
import { getErrorFromUnknown, SELIX_HTTP_STATUS_MAP } from "./SelixError";

export type ProcedureType = 'query' | 'mutation';

export type ProcedureResolver<InputType, OutputType, ContextType> = (opts: { input: InputType, ctx: ContextType }) => Promise<OutputType> | OutputType;

export type Middleware<InputType, ContextType> = (opts: {
    input: InputType;
    ctx: ContextType;
    next: () => Promise<any>;
}) => Promise<any>;

export class ProcedureDef<InputType = any, OutputType = any, ContextType = any> {
    type: ProcedureType;
    input: ZodType<InputType>;
    describe: string | Record<string, string> | undefined;
    resolver: ProcedureResolver<InputType, OutputType, ContextType>;
    middlewares: Middleware<InputType, ContextType>[];

    constructor(
        type: ProcedureType,
        input: ZodType<InputType>,
        resolver: ProcedureResolver<InputType, OutputType, ContextType>,
        middlewares: Middleware<InputType, ContextType>[] = [],
        describe?: string | Record<string, string> | undefined,
    ) {
        this.type = type;
        this.input = input;
        this.resolver = resolver;
        this.middlewares = middlewares;
        this.describe = describe;
    }

    async call(opts: { input: any; ctx?: ContextType; project?: any }) {
        try {
            const parsedInput = this.input.parse(opts.input);
            const ctx = opts.ctx ?? ({} as ContextType);

            const executeStack = async (index: number): Promise<any> => {
                if (index < this.middlewares.length) {
                    const mw = this.middlewares[index];
                    return mw({
                        input: parsedInput,
                        ctx: ctx,
                        next: () => executeStack(index + 1)
                    });
                } else {
                    return this.resolver({ input: parsedInput, ctx: ctx });
                }
            };

            const result = await executeStack(0);

            if (opts.project) {
                return {
                    ok: true as const,
                    data: applyProjection(result, opts.project)
                };
            }

            return {
                ok: true as const,
                data: result
            };
        } catch (cause) {
            const error = getErrorFromUnknown(cause);
            const status = SELIX_HTTP_STATUS_MAP[error.code] ?? 500;
            return {
                ok: false as const,
                error,
                status
            };
        }
    }
}

export class ProcedureBuilder<InputType = any, ContextType = any> {
    private _input?: ZodType<InputType>;
    private _describe?: string | Record<string, string> | undefined;
    private _middlewares: Middleware<InputType, ContextType>[] = [];

    input<T extends ZodType<any>>(schema: T): ProcedureBuilder<z.infer<T>, ContextType> {
        const newBuilder = new ProcedureBuilder<z.infer<T>, ContextType>();
        newBuilder._input = schema;
        newBuilder._describe = this._describe;
        newBuilder._middlewares = [...this._middlewares] as any;
        return newBuilder;
    }

    context<NewContext>(): ProcedureBuilder<InputType, NewContext> {
        const newBuilder = new ProcedureBuilder<InputType, NewContext>();
        newBuilder._input = this._input;
        newBuilder._describe = this._describe;
        newBuilder._middlewares = [...this._middlewares] as any;
        return newBuilder;
    }

    use(middleware: Middleware<InputType, ContextType>): ProcedureBuilder<InputType, ContextType> {
        this._middlewares.push(middleware);
        return this;
    }

    describe(desc: string | Record<string, string> | undefined): ProcedureBuilder<InputType, ContextType> {
        const newBuilder = new ProcedureBuilder<InputType, ContextType>(); // Corrected generic propagation
        newBuilder._input = this._input;
        newBuilder._describe = desc;
        newBuilder._middlewares = [...this._middlewares];
        return newBuilder;
    }

    query<TOutput>(resolver: ProcedureResolver<InputType, TOutput, ContextType>): ProcedureDef<InputType, TOutput, ContextType> {
        return new ProcedureDef(
            'query',
            this._input as any ?? z.undefined(),
            resolver,
            this._middlewares,
            this._describe
        );
    }

    mutation<TOutput>(resolver: ProcedureResolver<InputType, TOutput, ContextType>): ProcedureDef<InputType, TOutput, ContextType> {
        return new ProcedureDef(
            'mutation',
            this._input as any ?? z.undefined(),
            resolver,
            this._middlewares, // Pass middlewares
            this._describe
        );
    }
}

export const procedure = new ProcedureBuilder();

import { z, ZodType } from "zod";
import { applyProjection } from './projection';
import { getErrorFromUnknown, SELIX_HTTP_STATUS_MAP } from "./SelixError";

export type ProcedureType = 'query' | 'mutation';

export type ProcedureResolver<InputType, OutputType> = (opts: { input: InputType }) => Promise<OutputType> | OutputType;

export class ProcedureDef<InputType = any, OutputType = any> {
    type: ProcedureType;
    input: ZodType<InputType>;
    describe: string | Record<string, string> | undefined;
    resolver: ProcedureResolver<InputType, OutputType>;

    constructor(
        type: ProcedureType,
        input: ZodType<InputType>,
        resolver: ProcedureResolver<InputType, OutputType>,
        describe?: string | Record<string, string> | undefined,
    ) {
        this.type = type;
        this.input = input;
        this.resolver = resolver;
        this.describe = describe;
    }

    async call(opts: { input: any; project?: any }) {
        try {
            const parsedInput = this.input.parse(opts.input);
            const result = await this.resolver({ input: parsedInput });

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

export class ProcedureBuilder<InputType = any> {
    private _input?: ZodType<InputType>;
    private _describe?: string | Record<string, string> | undefined;

    input<T extends ZodType<any>>(schema: T): ProcedureBuilder<z.infer<T>> {
        const newBuilder = new ProcedureBuilder<z.infer<T>>();
        newBuilder._input = schema;
        return newBuilder;
    }

    describe(desc: string | Record<string, string> | undefined): ProcedureBuilder<InputType> {
        const newBuilder = new ProcedureBuilder<InputType>();
        newBuilder._describe = desc;
        return newBuilder;
    }

    query<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput> {
        return new ProcedureDef(
            'query',
            this._input as any ?? z.undefined(),
            resolver,
            this._describe
        );
    }

    mutation<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput> {
        return new ProcedureDef(
            'mutation',
            this._input as any ?? z.undefined(),
            resolver,
            this._describe
        );
    }
}

export const procedure = new ProcedureBuilder();

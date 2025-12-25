
import { z, ZodType } from "zod";
import { applyProjection } from './projection';

export type ProcedureType = 'query' | 'mutation';

export type ProcedureResolver<InputType, OutputType> = (opts: { input: InputType }) => Promise<OutputType> | OutputType;

export class ProcedureDef<InputType = any, OutputType = any> {
    type: ProcedureType;
    input: ZodType<InputType>;
    resolver: ProcedureResolver<InputType, OutputType>;

    constructor(
        type: ProcedureType,
        input: ZodType<InputType>,
        resolver: ProcedureResolver<InputType, OutputType>
    ) {
        this.type = type;
        this.input = input;
        this.resolver = resolver;
    }

    async call(opts: { input: any; project?: any }) {
        const parsedInput = this.input.parse(opts.input);
        const result = await this.resolver({ input: parsedInput });

        if (opts.project) {
            return applyProjection(result, opts.project);
        }

        return result;
    }
}

export class ProcedureBuilder<InputType = any> {
    private _input?: ZodType<InputType>;

    input<T extends ZodType<any>>(schema: T): ProcedureBuilder<z.infer<T>> {
        const newBuilder = new ProcedureBuilder<z.infer<T>>();
        newBuilder._input = schema;
        return newBuilder;
    }

    query<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput> {
        return new ProcedureDef(
            'query',
            this._input as any ?? z.undefined(),
            resolver
        );
    }

    mutation<TOutput>(resolver: ProcedureResolver<InputType, TOutput>): ProcedureDef<InputType, TOutput> {
        return new ProcedureDef(
            'mutation',
            this._input as any ?? z.undefined(),
            resolver
        );
    }
}

export const procedure = new ProcedureBuilder();

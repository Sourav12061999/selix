import type { AnyProcedure, Router } from '@selix/core';
import { Projection, DeepProject } from './scratch_types';
export type InferProcedureOutput<TProcedure> = TProcedure extends AnyProcedure ? Awaited<ReturnType<TProcedure['resolver']>> : never;
export type InferProcedureInput<TProcedure> = TProcedure extends AnyProcedure ? TProcedure['input']['_output'] : never;
type DecorateProcedure<TProcedure> = {
    query: <P extends Projection<InferProcedureOutput<TProcedure>> | undefined = undefined>(input: {
        input: InferProcedureInput<TProcedure>;
        project?: P;
    }) => Promise<P extends Projection<InferProcedureOutput<TProcedure>> ? DeepProject<InferProcedureOutput<TProcedure>, P> : InferProcedureOutput<TProcedure>>;
    mutation: <P extends Projection<InferProcedureOutput<TProcedure>> | undefined = undefined>(input: {
        input: InferProcedureInput<TProcedure>;
        project?: P;
    }) => Promise<P extends Projection<InferProcedureOutput<TProcedure>> ? DeepProject<InferProcedureOutput<TProcedure>, P> : InferProcedureOutput<TProcedure>>;
};
export type CreateClient<TRouter extends Router> = {
    [K in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][K] extends Router ? CreateClient<TRouter['_def']['procedures'][K]> : DecorateProcedure<TRouter['_def']['procedures'][K]>;
};
export * from './proxy';
export declare function createClient<TRouter extends Router>(opts: {
    url: string;
    debugMode?: boolean;
}): CreateClient<TRouter>;
//# sourceMappingURL=index.d.ts.map
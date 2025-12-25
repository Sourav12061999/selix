import type { AnyProcedure, Router } from '@selix/core';
export type InferProcedureOutput<TProcedure> = TProcedure extends AnyProcedure ? Awaited<ReturnType<TProcedure['resolver']>> : never;
export type InferProcedureInput<TProcedure> = TProcedure extends AnyProcedure ? TProcedure['input']['_output'] : never;
type DecorateProcedure<TProcedure> = {
    query: (input: InferProcedureInput<TProcedure>) => Promise<InferProcedureOutput<TProcedure>>;
    mutation: (input: InferProcedureInput<TProcedure>) => Promise<InferProcedureOutput<TProcedure>>;
};
export type CreateClient<TRouter extends Router> = {
    [K in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][K] extends Router ? CreateClient<TRouter['_def']['procedures'][K]> : DecorateProcedure<TRouter['_def']['procedures'][K]>;
};
export declare function createClient<TRouter extends Router>(opts: {
    url: string;
}): CreateClient<TRouter>;
export {};
//# sourceMappingURL=index.d.ts.map
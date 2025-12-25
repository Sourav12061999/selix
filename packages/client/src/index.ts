import type { AnyProcedure, Router } from '@selix/core';
import { Projection, DeepProject } from './scratch_types';

export type InferProcedureOutput<TProcedure> = TProcedure extends AnyProcedure ? Awaited<ReturnType<TProcedure['resolver']>> : never;
export type InferProcedureInput<TProcedure> = TProcedure extends AnyProcedure ? TProcedure['input']['_output'] : never;


type DecorateProcedure<TProcedure> = {
    query: <P extends Projection<InferProcedureOutput<TProcedure>> | undefined = undefined>(
        input: { input: InferProcedureInput<TProcedure>, project?: P }
    ) => Promise<P extends Projection<InferProcedureOutput<TProcedure>> ? DeepProject<InferProcedureOutput<TProcedure>, P> : InferProcedureOutput<TProcedure>>;

    mutation: <P extends Projection<InferProcedureOutput<TProcedure>> | undefined = undefined>(
        input: { input: InferProcedureInput<TProcedure>, project?: P }
    ) => Promise<P extends Projection<InferProcedureOutput<TProcedure>> ? DeepProject<InferProcedureOutput<TProcedure>, P> : InferProcedureOutput<TProcedure>>;
};

export type CreateClient<TRouter extends Router> = {
    [K in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][K] extends Router
    ? CreateClient<TRouter['_def']['procedures'][K]>
    : DecorateProcedure<TRouter['_def']['procedures'][K]>;
}

export function createClient<TRouter extends Router>(opts: { url: string }): CreateClient<TRouter> {
    const { url } = opts;

    const createProxy = (path: string[]) => {
        return new Proxy(() => { }, {
            get(_target, prop) {
                if (typeof prop === 'string') {
                    return createProxy([...path, prop]);
                }
                return createProxy(path);
            },
            apply(_target, _thisArg, args) {
                const type = path[path.length - 1]; // query or mutation
                const actualPath = path.slice(0, -1).join('.');
                const data = args[0];

                return fetch(`${url}/${actualPath}?type=${type}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                }).then(res => res.json());
            }
        });
    };

    return createProxy([]) as any;
}

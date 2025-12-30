import { setContext, getContext } from 'svelte';
import {
    createQuery as __createQuery,
    createMutation as __createMutation,
    type CreateQueryOptions,
    type CreateMutationOptions
} from '@tanstack/svelte-query';
import type { Router, AnyProcedure } from '@selix/core';
import type { InferProcedureInput, InferProcedureOutput, CreateClient } from '@selix/client';

type ProcedureInput<T> = T extends AnyProcedure ? InferProcedureInput<T> : never;
type ProcedureOutput<T> = T extends AnyProcedure ? InferProcedureOutput<T> : never;
type VanillaClient<TRouter extends Router> = CreateClient<TRouter>;

const SELIX_CONTEXT_KEY = 'SELIX_CLIENT';

export function setSelixContext<TRouter extends Router>(client: VanillaClient<TRouter>) {
    setContext(SELIX_CONTEXT_KEY, client);
}

export function getSelixContext<TRouter extends Router>(): VanillaClient<TRouter> {
    const client = getContext<VanillaClient<TRouter>>(SELIX_CONTEXT_KEY);
    if (!client) {
        throw new Error('Selix context not found. Did you forget to call setSelixContext?');
    }
    return client;
}

export type DecoratedProcedure<TProcedure extends AnyProcedure> = {
    createQuery: <TData = ProcedureOutput<TProcedure>>(
        input: { input: ProcedureInput<TProcedure>, project?: any },
        opts?: Omit<CreateQueryOptions<ProcedureOutput<TProcedure>, Error, TData>, 'queryKey' | 'queryFn'>
    ) => any;

    createMutation: <TContext = unknown>(
        opts?: CreateMutationOptions<ProcedureOutput<TProcedure>, Error, { input: ProcedureInput<TProcedure>, project?: any }, TContext>
    ) => any;
};

export type DecoratedRouter<TRouter extends Router> = {
    [K in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][K] extends Router
    ? DecoratedRouter<TRouter['_def']['procedures'][K]>
    : (TRouter['_def']['procedures'][K] extends AnyProcedure
        ? DecoratedProcedure<TRouter['_def']['procedures'][K]>
        : never);
};

export function createSelixSvelte<TRouter extends Router>(): DecoratedRouter<TRouter> {
    const createProxy = (path: string[]) => {
        return new Proxy(() => { }, {
            get(_target, prop) {
                if (typeof prop === 'string') {
                    if (prop === 'createQuery') {
                        return (input: any, opts: any) => {
                            const client = getSelixContext<TRouter>();

                            return __createQuery({
                                queryKey: [...path, input],
                                queryFn: () => {
                                    let procedureObj: any = client;
                                    for (const segment of path) {
                                        procedureObj = procedureObj[segment];
                                    }
                                    return procedureObj.query(input);
                                },
                                ...opts
                            });
                        };
                    }

                    if (prop === 'createMutation') {
                        return (opts: any) => {
                            const client = getSelixContext<TRouter>();

                            return __createMutation({
                                mutationFn: (variables: any) => {
                                    let procedureObj: any = client;
                                    for (const segment of path) {
                                        procedureObj = procedureObj[segment];
                                    }
                                    return procedureObj.mutation(variables);
                                },
                                ...opts
                            });
                        }
                    }

                    return createProxy([...path, prop]);
                }
                return createProxy(path);
            }
        });
    };

    return createProxy([]) as any;
}

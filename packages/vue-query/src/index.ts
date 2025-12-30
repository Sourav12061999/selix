import { inject, provide, InjectionKey } from 'vue';
import {
    useQuery as __useQuery,
    useMutation as __useMutation,
    UseQueryOptions,
    UseMutationOptions
} from '@tanstack/vue-query';
import type { Router, AnyProcedure } from '@selix/core';
import type { InferProcedureInput, InferProcedureOutput, CreateClient } from '@selix/client';

type ProcedureInput<T> = T extends AnyProcedure ? InferProcedureInput<T> : never;
type ProcedureOutput<T> = T extends AnyProcedure ? InferProcedureOutput<T> : never;
type VanillaClient<TRouter extends Router> = CreateClient<TRouter>;

const SELIX_CLIENT_KEY = Symbol('SELIX_CLIENT') as InjectionKey<VanillaClient<any>>;

export function provideSelixClient<TRouter extends Router>(client: VanillaClient<TRouter>) {
    provide(SELIX_CLIENT_KEY, client);
}

export function useSelixClient<TRouter extends Router>(): VanillaClient<TRouter> {
    const client = inject(SELIX_CLIENT_KEY);
    if (!client) {
        throw new Error('Selix client not provided');
    }
    return client as VanillaClient<TRouter>;
}

export type DecoratedProcedure<TProcedure extends AnyProcedure> = {
    useQuery: <TData = ProcedureOutput<TProcedure>>(
        input: { input: ProcedureInput<TProcedure>, project?: any },
        opts?: Omit<UseQueryOptions<ProcedureOutput<TProcedure>, Error, TData>, 'queryKey' | 'queryFn'>
    ) => any;

    useMutation: <TContext = unknown>(
        opts?: UseMutationOptions<ProcedureOutput<TProcedure>, Error, { input: ProcedureInput<TProcedure>, project?: any }, TContext>
    ) => any;
};

export type DecoratedRouter<TRouter extends Router> = {
    [K in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][K] extends Router
    ? DecoratedRouter<TRouter['_def']['procedures'][K]>
    : (TRouter['_def']['procedures'][K] extends AnyProcedure
        ? DecoratedProcedure<TRouter['_def']['procedures'][K]>
        : never);
};

export function createSelixVue<TRouter extends Router>(): DecoratedRouter<TRouter> {
    const createProxy = (path: string[]) => {
        return new Proxy(() => { }, {
            get(_target, prop) {
                if (typeof prop === 'string') {
                    if (prop === 'useQuery') {
                        return (input: any, opts: any) => {
                            const client = useSelixClient<TRouter>();

                            // Note: Vue Query handles reactivity if input contains refs.
                            // We pass input to queryKey to ensure reactivity.

                            return __useQuery({
                                queryKey: [...path, input],
                                queryFn: () => {
                                    let procedureObj: any = client;
                                    for (const segment of path) {
                                        procedureObj = procedureObj[segment];
                                    }
                                    // unwrap possible proxy/ref if needed, but for now assuming input is passed as value or getter unwraps it
                                    return procedureObj.query(input);
                                },
                                ...opts
                            });
                        };
                    }

                    if (prop === 'useMutation') {
                        return (opts: any) => {
                            const client = useSelixClient<TRouter>();

                            return __useMutation({
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

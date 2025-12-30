import { createContext, useContext, JSX } from 'solid-js';
import {
    createQuery as __createQuery,
    createMutation as __createMutation,
    CreateQueryOptions,
    CreateMutationOptions
} from '@tanstack/solid-query';
import type { Router, AnyProcedure } from '@selix/core';
import type { InferProcedureInput, InferProcedureOutput, CreateClient } from '@selix/client';

type ProcedureInput<T> = T extends AnyProcedure ? InferProcedureInput<T> : never;
type ProcedureOutput<T> = T extends AnyProcedure ? InferProcedureOutput<T> : never;
type VanillaClient<TRouter extends Router> = CreateClient<TRouter>;

const SelixContext = createContext<VanillaClient<any> | null>(null);

export function SelixProvider<TRouter extends Router>(props: {
    client: VanillaClient<TRouter>,
    children: JSX.Element
}) {
    return (
        <SelixContext.Provider value={props.client}>
            {props.children}
        </SelixContext.Provider>
    );
}

export function useSelixContext<TRouter extends Router>() {
    const client = useContext(SelixContext);
    if (!client) {
        throw new Error('SelixProvider not found');
    }
    return client as VanillaClient<TRouter>;
}

export type DecoratedProcedure<TProcedure extends AnyProcedure> = {
    createQuery: <TData = ProcedureOutput<TProcedure>>(
        getOptions: () => { input: ProcedureInput<TProcedure>, project?: any } & Omit<CreateQueryOptions<ProcedureOutput<TProcedure>, Error, TData>, 'queryKey' | 'queryFn'>
    ) => any;

    createMutation: <TContext = unknown>(
        options?: CreateMutationOptions<ProcedureOutput<TProcedure>, Error, { input: ProcedureInput<TProcedure>, project?: any }, TContext>
    ) => any;
};

export type DecoratedRouter<TRouter extends Router> = {
    [K in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][K] extends Router
    ? DecoratedRouter<TRouter['_def']['procedures'][K]>
    : (TRouter['_def']['procedures'][K] extends AnyProcedure
        ? DecoratedProcedure<TRouter['_def']['procedures'][K]>
        : never);
};

export function createSelixSolid<TRouter extends Router>(): DecoratedRouter<TRouter> {
    const createProxy = (path: string[]) => {
        return new Proxy(() => { }, {
            get(_target, prop) {
                if (typeof prop === 'string') {
                    if (prop === 'createQuery') {
                        return (getOptions: () => any) => {
                            const client = useSelixContext<TRouter>();

                            return __createQuery(() => {
                                const options = getOptions();
                                const { input, project, ...queryOpts } = options;

                                return {
                                    queryKey: [...path, input],
                                    queryFn: () => {
                                        let procedureObj: any = client;
                                        for (const segment of path) {
                                            procedureObj = procedureObj[segment];
                                        }
                                        return procedureObj.query({ input, project });
                                    },
                                    ...queryOpts
                                };
                            });
                        };
                    }

                    if (prop === 'createMutation') {
                        return (opts: any) => {
                            const client = useSelixContext<TRouter>();

                            return __createMutation(() => ({
                                mutationFn: (variables: any) => {
                                    let procedureObj: any = client;
                                    for (const segment of path) {
                                        procedureObj = procedureObj[segment];
                                    }
                                    return procedureObj.mutation(variables);
                                },
                                ...opts
                            }));
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

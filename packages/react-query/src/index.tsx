import React, { createContext, useContext, useMemo } from 'react';
import {
    useQuery as __useQuery,
    useMutation as __useMutation,
    UseQueryOptions,
    UseMutationOptions,
    QueryClient
} from '@tanstack/react-query';
import type { Router, AnyProcedure } from '@selix/core';
import type { InferProcedureInput, InferProcedureOutput, CreateClient } from '@selix/client';

// We need to re-define or infer types since they might not be fully exported
// For simplicity in this iteration, we focus on the runtime proxy and basic type inference structure.

type ProcedureInput<T> = T extends AnyProcedure ? InferProcedureInput<T> : never;
type ProcedureOutput<T> = T extends AnyProcedure ? InferProcedureOutput<T> : never;

// Type for the vanilla client created by @selix/client
type VanillaClient<TRouter extends Router> = CreateClient<TRouter>;

const SelixContext = createContext<VanillaClient<any> | null>(null);

export function SelixProvider<TRouter extends Router>({
    client,
    children,
    queryClient
}: {
    client: VanillaClient<TRouter>,
    children: React.ReactNode,
    queryClient?: QueryClient
}) {
    return (
        <SelixContext.Provider value={client}>
            {children}
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

// Type definitions for the proxy
export type DecoratedProcedure<TProcedure extends AnyProcedure> = {
    useQuery: <TData = ProcedureOutput<TProcedure>>(
        input: { input: ProcedureInput<TProcedure>, project?: any },
        opts?: Omit<UseQueryOptions<ProcedureOutput<TProcedure>, Error, TData>, 'queryKey' | 'queryFn'>
    ) => any; // Return type of useQuery

    useMutation: <TContext = unknown>(
        opts?: UseMutationOptions<ProcedureOutput<TProcedure>, Error, { input: ProcedureInput<TProcedure>, project?: any }, TContext>
    ) => any; // Return type of useMutation
};

export type DecoratedRouter<TRouter extends Router> = {
    [K in keyof TRouter['_def']['procedures']]: TRouter['_def']['procedures'][K] extends Router
    ? DecoratedRouter<TRouter['_def']['procedures'][K]>
    : (TRouter['_def']['procedures'][K] extends AnyProcedure
        ? DecoratedProcedure<TRouter['_def']['procedures'][K]>
        : never);
};

export function createSelixReact<TRouter extends Router>(): DecoratedRouter<TRouter> {
    const createProxy = (path: string[]) => {
        return new Proxy(() => { }, {
            get(_target, prop) {
                if (typeof prop === 'string') {
                    if (prop === 'useQuery') {
                        return (input: any, opts: any) => {
                            const client = useSelixContext<TRouter>();
                            const queryKey = [...path, input];

                            return __useQuery({
                                queryKey,
                                queryFn: () => {
                                    // Navigate client using path to find the function
                                    // client.user.getOrSomething(input)
                                    let fn: any = client;
                                    for (const segment of path) {
                                        fn = fn[segment];
                                    }
                                    // The client function expects { input: ..., project: ... }
                                    // Our 'input' here is exactly that object.
                                    if (path[path.length - 1] === 'query') {
                                        // The vanilla client exposes .query() and .mutation() on the procedure node?
                                        // Let's check CreateClient type in @selix/client.
                                        // CreateClient Maps procedures to:
                                        // { query: (input) => ..., mutation: (input) => ... }
                                    }

                                    // Actually, looks like CreateClient maps keys to DecorateProcedure
                                    // DecorateProcedure has .query(...) and .mutation(...) methods.
                                    // So path should be used to find the procedure object, then we call .query or .mutation

                                    // Wait, "path" here comes from traversing the hooks proxy. 
                                    // e.g. hooks.user.get.useQuery(...)
                                    // path is ['user', 'get']

                                    let procedureObj: any = client;
                                    for (const segment of path) {
                                        procedureObj = procedureObj[segment];
                                    }

                                    // usage: procedureObj.query(input)
                                    return procedureObj.query(input);
                                },
                                ...opts
                            });
                        };
                    }

                    if (prop === 'useMutation') {
                        return (opts: any) => {
                            const client = useSelixContext<TRouter>();

                            return __useMutation({
                                mutationFn: (variables: any) => {
                                    // variables is { input: ..., project: ... }
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

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

export * from './proxy';
import { createRecursiveProxy } from './proxy';

export function createClient<TRouter extends Router>(opts: { url: string }): CreateClient<TRouter> {
    const { url } = opts;

    return createRecursiveProxy(({ path, args, type }) => {
        if (type === 'apply') {
            const lastPath = path[path.length - 1];
            const actualPath = path.slice(0, -1).join('/');
            const inputWrapper = (args[0] as any) || {};
            const { input, project } = inputWrapper;

            if (lastPath === 'query') {
                const queryParts: string[] = [];
                if (input !== undefined) {
                    queryParts.push(`input=${encodeURIComponent(JSON.stringify(input))}`);
                }
                if (project !== undefined) {
                    queryParts.push(`project=${encodeURIComponent(JSON.stringify(project))}`);
                }

                const queryString = queryParts.join('&');
                const fullUrl = queryString ? `${url}/${actualPath}?${queryString}` : `${url}/${actualPath}`;

                return fetch(fullUrl, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }).then(res => res.json());
            } else if (lastPath === 'mutation') {
                return fetch(`${url}/${actualPath}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(inputWrapper),
                }).then(res => res.json());
            }
        }
        return undefined;
    }) as any;
}

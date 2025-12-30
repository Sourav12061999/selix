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

export function createClient<TRouter extends Router>(opts: { url: string; debugMode?: boolean }): CreateClient<TRouter> {
    const { url, debugMode = false } = opts;

    return createRecursiveProxy(({ path, args, type }) => {
        if (type === 'apply') {
            const lastPath = path[path.length - 1];
            const actualPath = path.slice(0, -1).join('/');
            const inputWrapper = (args[0] as { input?: unknown, project?: unknown }) || {};
            const { input, project } = inputWrapper;

            const startTime = Date.now();
            const logGroup = `[Selix] ${lastPath.toUpperCase()} ${actualPath}`;
            const debugMode = true; // Could be configurable

            const logRequest = () => {
                if (!debugMode) return;
                console.groupCollapsed(`%c● ${logGroup}`, 'color: #3b82f6; font-weight: bold;');
                console.log('%cPath:', 'font-weight: bold; color: #6b7280', path.join('.'));
                console.log('%cInput:', 'font-weight: bold; color: #6b7280', input);
                if (project) console.log('%cProject:', 'font-weight: bold; color: #6b7280', project);
                console.groupEnd();
            };

            const logResponse = (data: any) => {
                if (!debugMode) return;
                const duration = Date.now() - startTime;
                console.groupCollapsed(`%c✔ ${logGroup} (%c${duration}ms%c)`, 'color: #10b981; font-weight: bold;', 'color: #6b7280; font-weight: normal;', 'color: #10b981; font-weight: bold;');
                console.log('%cResponse Data:', 'font-weight: bold; color: #10b981', data);
                console.groupEnd();
            };

            const logError = (error: any) => {
                if (!debugMode) return;
                const duration = Date.now() - startTime;
                console.groupCollapsed(`%c✘ ${logGroup} (%c${duration}ms%c)`, 'color: #ef4444; font-weight: bold;', 'color: #6b7280; font-weight: normal;', 'color: #ef4444; font-weight: bold;');
                console.log('%cError Details:', 'font-weight: bold; color: #ef4444', error);
                console.groupEnd();
            };

            return (async () => {
                logRequest();

                try {
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

                        const res = await fetch(fullUrl, {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });
                        const data = await res.json();
                        if (!res.ok) {
                            throw data;
                        }
                        logResponse(data);
                        return data;
                    } else if (lastPath === 'mutation') {
                        const res = await fetch(`${url}/${actualPath}`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(inputWrapper),
                        });
                        const data = await res.json();
                        if (!res.ok) {
                            throw data;
                        }
                        logResponse(data);
                        return data;
                    }
                } catch (err) {
                    logError(err);
                    throw err;
                }
            })();
        }
        return undefined;
    }) as any;
}

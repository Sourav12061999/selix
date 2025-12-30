export * from './proxy';
import { createRecursiveProxy } from './proxy';
export function createClient(opts) {
    const { url, debugMode = false } = opts;
    return createRecursiveProxy(async ({ path, args, type }) => {
        if (type === 'apply') {
            const lastPath = path[path.length - 1];
            const actualPath = path.slice(0, -1).join('/');
            const inputWrapper = args[0] || {};
            const { input, project } = inputWrapper;
            const startTime = Date.now();
            const logGroup = `[Selix] ${lastPath.toUpperCase()} ${actualPath}`;
            const logRequest = () => {
                if (!debugMode)
                    return;
                console.groupCollapsed(`%c${logGroup}`, 'color: #3b82f6; font-weight: bold;');
                console.log('%cRequest Details:', 'font-weight: bold; color: #6b7280');
                console.table({
                    Type: lastPath,
                    Path: actualPath,
                    URL: url,
                });
                if (input) {
                    console.log('%cInput:', 'font-weight: bold; color: #10b981', input);
                }
                if (project) {
                    console.log('%cProjection:', 'font-weight: bold; color: #8b5cf6', project);
                }
                console.groupEnd();
            };
            const logResponse = (data) => {
                if (!debugMode)
                    return;
                const duration = Date.now() - startTime;
                console.groupCollapsed(`%c✔ ${logGroup} (%c${duration}ms%c)`, 'color: #10b981; font-weight: bold;', 'color: #6b7280; font-weight: normal;', 'color: #10b981; font-weight: bold;');
                console.log('%cResponse Data:', 'font-weight: bold; color: #10b981', data);
                console.groupEnd();
            };
            const logError = (error) => {
                if (!debugMode)
                    return;
                const duration = Date.now() - startTime;
                console.groupCollapsed(`%c✘ ${logGroup} (%c${duration}ms%c)`, 'color: #ef4444; font-weight: bold;', 'color: #6b7280; font-weight: normal;', 'color: #ef4444; font-weight: bold;');
                console.log('%cError Details:', 'font-weight: bold; color: #ef4444', error);
                console.groupEnd();
            };
            logRequest();
            try {
                if (lastPath === 'query') {
                    const queryParts = [];
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
                }
                else if (lastPath === 'mutation') {
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
            }
            catch (err) {
                logError(err);
                throw err;
            }
        }
        return undefined;
    });
}

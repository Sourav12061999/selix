
export interface ProxyCallbackOptions {
    path: string[];
    args: unknown[];
    prop?: string | symbol;
    type: 'get' | 'apply';
}

export type ProxyCallback = (opts: ProxyCallbackOptions) => unknown;

/**
 * Creates a proxy that recursively captures property access as a path.
 * If the callback returns a non-undefined value during 'get', that value is returned.
 * Otherwise, if 'get' returns undefined, the proxy recurses.
 * For 'apply', the callback return value is always returned.
 */
export function createRecursiveProxy(callback: ProxyCallback, path: string[] = []): any {
    const proxy: unknown = new Proxy(() => { }, {
        get(_target, prop) {
            if (typeof prop === 'string' && prop !== 'then') {
                const result = callback({ path, prop, args: [], type: 'get' });
                if (result !== undefined) {
                    return result;
                }
                return createRecursiveProxy(callback, [...path, prop]);
            }
            return Reflect.get(_target, prop);
        },
        apply(_target, _thisArg, args) {
            return callback({ path, args, type: 'apply' });
        }
    });

    return proxy;
}

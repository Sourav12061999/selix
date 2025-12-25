export function createClient(opts) {
    const { url } = opts;
    const createProxy = (path) => {
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
                const input = args[0];
                return fetch(`${url}/${actualPath}?type=${type}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(input),
                }).then(res => res.json());
            }
        });
    };
    return createProxy([]);
}

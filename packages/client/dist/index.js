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
                const type = path[path.length - 1];
                const actualPath = path.slice(0, -1).join('/');
                const inputWrapper = args[0] || {};
                const { input, project } = inputWrapper;
                if (type === 'query') {
                    const queryParts = [];
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
                }
                else {
                    // Mutation -> POST
                    return fetch(`${url}/${actualPath}`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(inputWrapper),
                    }).then(res => res.json());
                }
            }
        });
    };
    return createProxy([]);
}

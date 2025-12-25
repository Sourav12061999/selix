export function router(procedures) {
    return {
        _def: {
            procedures,
        },
    };
}
export function getProcedureFromPath(router, path) {
    if (path.length === 0)
        return null;
    const [head, ...tail] = path;
    const target = router._def.procedures[head];
    if (!target)
        return null;
    if ('_def' in target) {
        // It's a router
        return getProcedureFromPath(target, tail);
    }
    else {
        // It's a procedure
        if (tail.length === 0) {
            return target;
        }
        else {
            // Path continues but we hit a procedure -> 404
            return null;
        }
    }
}

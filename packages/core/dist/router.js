export function router(procedures) {
    return {
        _def: {
            procedures,
        },
    };
}
export function getProcedure(router, path) {
    let current = router;
    for (let i = 0; i < path.length; i++) {
        const segment = path[i];
        if (!current || !current._def || !current._def.procedures) {
            return null;
        }
        current = current._def.procedures[segment];
    }
    // After traversing, 'current' should be a ProcedureDef, not a Router
    if (current && 'type' in current && 'call' in current) {
        return current;
    }
    return null;
}

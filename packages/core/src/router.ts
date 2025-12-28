import { ProcedureDef } from "./procedure.js";

export type AnyProcedure = ProcedureDef<any, any>;
export type RouterRecord = Record<string, AnyProcedure | Router<any>>;

export interface Router<T extends RouterRecord = RouterRecord> {
    _def: {
        procedures: T;
    };
}

export function router<T extends RouterRecord>(procedures: T): Router<T> {
    return {
        _def: {
            procedures,
        },
    };
}

export function getProcedure(router: Router, path: string[]): AnyProcedure | null {
    let current: any = router;
    for (let i = 0; i < path.length; i++) {
        const segment = path[i];
        if (!current || !current._def || !current._def.procedures) {
            return null;
        }
        current = current._def.procedures[segment];
    }

    // After traversing, 'current' should be a ProcedureDef, not a Router
    if (current && 'type' in current && 'call' in current) {
        return current as AnyProcedure;
    }

    return null;
}

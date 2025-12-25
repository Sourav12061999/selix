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

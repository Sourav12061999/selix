import { router } from "./router";
export declare class Selix {
    procedure: import("./procedure").ProcedureBuilder<any, any>;
    router: typeof router;
}
export declare const initSelix: () => Selix;
export * from './procedure';
export * from './router';
export * from './SelixError';
//# sourceMappingURL=index.d.ts.map
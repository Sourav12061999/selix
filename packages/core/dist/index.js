import { procedure } from "./procedure";
import { router } from "./router";
export class Selix {
    procedure = procedure;
    router = router;
}
export const initSelix = () => new Selix();
export * from './procedure';
export * from './router';
export * from './SelixError';

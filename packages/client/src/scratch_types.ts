
export type Projection<T> = {
    [K in keyof T]?: T[K] extends object
    ? Projection<T[K]> | 0 | 1
    : 0 | 1;
};

// Check if valid select mode (inclusive)
type IsSelectMode<P> =
    P extends object
    ? (keyof P extends KeysContributingToOmit<P> ? false : true)
    : false;

type KeysContributingToOmit<P> = {
    [K in keyof P]: P[K] extends 0
    ? K
    : (P[K] extends object ? (IsSelectMode<P[K]> extends false ? K : never) : never)
}[keyof P];

// Main utility
export type DeepProject<T, P extends Projection<T>> =
    IsSelectMode<P> extends true
    ? {
        // Select Mode
        [K in keyof T as K extends keyof P ? (P[K] extends 0 ? never : K) : never]:
        K extends keyof P
        ? (P[K] extends 1 ? T[K] : (P[K] extends object ? (T[K] extends object ? DeepProject<T[K], P[K]> : T[K]) : never))
        : never
    }
    : {
        // Omit Mode
        [K in keyof T as K extends keyof P ? (P[K] extends 0 ? never : K) : K]:
        K extends keyof P
        ? (P[K] extends object ? (T[K] extends object ? DeepProject<T[K], P[K]> : T[K]) : T[K])
        : T[K]
    };
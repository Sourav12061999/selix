
export const SELIX_ERROR_CODES_BY_KEY = {
    /**
     * Invalid JSON was received by the server.
     * An error occurred on the server while parsing the JSON text.
     */
    PARSE_ERROR: -32700,
    /**
     * The JSON sent is not a valid Request object.
     */
    BAD_REQUEST: -32600, // 400

    // Internal JSON-RPC error
    INTERNAL_SERVER_ERROR: -32603, // 500
    NOT_IMPLEMENTED: -32603, // 501
    BAD_GATEWAY: -32603, // 502
    SERVICE_UNAVAILABLE: -32603, // 503
    GATEWAY_TIMEOUT: -32603, // 504

    // Implementation specific errors
    UNAUTHORIZED: -32001, // 401
    PAYMENT_REQUIRED: -32002, // 402
    FORBIDDEN: -32003, // 403
    NOT_FOUND: -32004, // 404
    METHOD_NOT_SUPPORTED: -32005, // 405
    TIMEOUT: -32008, // 408
    CONFLICT: -32009, // 409
    PRECONDITION_FAILED: -32012, // 412
    PAYLOAD_TOO_LARGE: -32013, // 413
    UNSUPPORTED_MEDIA_TYPE: -32015, // 415
    UNPROCESSABLE_CONTENT: -32022, // 422
    PRECONDITION_REQUIRED: -32028, // 428
    TOO_MANY_REQUESTS: -32029, // 429
    CLIENT_CLOSED_REQUEST: -32099, // 499
} as const;
export const TRPC_ERROR_CODES_BY_NUMBER = {
    [-32700]: 'PARSE_ERROR',
    [-32600]: 'BAD_REQUEST',
    [-32603]: 'INTERNAL_SERVER_ERROR',
    [-32001]: 'UNAUTHORIZED',
    [-32002]: 'PAYMENT_REQUIRED',
    [-32003]: 'FORBIDDEN',
    [-32004]: 'NOT_FOUND',
    [-32005]: 'METHOD_NOT_SUPPORTED',
    [-32008]: 'TIMEOUT',
    [-32009]: 'CONFLICT',
    [-32012]: 'PRECONDITION_FAILED',
    [-32013]: 'PAYLOAD_TOO_LARGE',
    [-32015]: 'UNSUPPORTED_MEDIA_TYPE',
    [-32022]: 'UNPROCESSABLE_CONTENT',
    [-32028]: 'PRECONDITION_REQUIRED',
    [-32029]: 'TOO_MANY_REQUESTS',
    [-32099]: 'CLIENT_CLOSED_REQUEST',
};

export const SELIX_HTTP_STATUS_MAP: Record<SELIX_ERROR_CODE_KEY, number> = {
    PARSE_ERROR: 400,
    BAD_REQUEST: 400,
    INTERNAL_SERVER_ERROR: 500,
    NOT_IMPLEMENTED: 501,
    BAD_GATEWAY: 502,
    SERVICE_UNAVAILABLE: 503,
    GATEWAY_TIMEOUT: 504,
    UNAUTHORIZED: 401,
    PAYMENT_REQUIRED: 402,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    METHOD_NOT_SUPPORTED: 405,
    TIMEOUT: 408,
    CONFLICT: 409,
    PRECONDITION_FAILED: 412,
    PAYLOAD_TOO_LARGE: 413,
    UNSUPPORTED_MEDIA_TYPE: 415,
    UNPROCESSABLE_CONTENT: 422,
    PRECONDITION_REQUIRED: 428,
    TOO_MANY_REQUESTS: 429,
    CLIENT_CLOSED_REQUEST: 499,
};

export type SELIX_ERROR_CODE_KEY = keyof typeof SELIX_ERROR_CODES_BY_KEY;

const isObject = (value: unknown): value is Record<string, unknown> =>
    !!value && typeof value === 'object' && !Array.isArray(value);

export const getCauseFromUnknown = (cause: unknown): Error | undefined => {
    if (cause instanceof Error) {
        return cause;
    }

    const type = typeof cause;
    if (type === 'undefined' || type === 'function' || cause === null) {
        return undefined;
    }

    // Primitive types just get wrapped in an error
    if (type !== 'object') {
        // eslint-disable-next-line @typescript-eslint/no-base-to-string
        return new Error(String(cause));
    }

    // If it's an object, we'll create a synthetic error
    if (isObject(cause)) {
        const error = new Error(typeof cause.message === 'string' ? cause.message : undefined);
        Object.assign(error, cause);
        return error;
    }

    return undefined;
}

export const getErrorFromUnknown = (cause: unknown): SelixError => {
    if (cause instanceof SelixError) {
        return cause;
    }
    if (cause instanceof Error && cause.name === 'SelixError') {
        return cause as SelixError;
    }
    const selixError = new SelixError({
        code: 'INTERNAL_SERVER_ERROR',
        cause,
    });
    if (cause instanceof Error && cause.stack) {
        selixError.stack = cause.stack;
    }
    return selixError;
}



export class SelixError extends Error {
    public override readonly cause?: Error;
    public readonly code;
    constructor(opts: {
        message?: string;
        code: SELIX_ERROR_CODE_KEY;
        cause?: unknown;
    }) {
        const cause = getCauseFromUnknown(opts.cause);
        const message = opts.message ?? cause?.message ?? opts.code;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore https://github.com/tc39/proposal-error-cause
        super(message, { cause });

        this.code = opts.code;
        this.name = 'SelixError';
        this.cause ??= cause;
    }
}
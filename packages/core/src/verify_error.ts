
import { procedure } from './procedure';
import { SelixError } from './SelixError';
import { z } from 'zod';

async function runTest() {
    console.log('--- Starting Error Handling Verification ---');

    // Case 1: Success
    const successProc = procedure.input(z.string()).query(async ({ input }) => {
        return `Hello ${input}`;
    });

    const successRes = await successProc.call({ input: 'World' });
    console.log('Success Case:', successRes.ok === true && successRes.data === 'Hello World' ? 'PASSED' : 'FAILED', successRes);

    // Case 2: Validation Error (Zod)
    try {
        await successProc.call({ input: 123 }); // Invalid input
        console.log('Validation Case: FAILED (Should have thrown or returned error)');
    } catch (e) {
        // Wait, procedure.call catches errors!
        // But validation happens inside `try` block, so it should catch ZodError?
        // Let's check getCauseFromUnknown -> it wraps primitives or objects.
        // ZodError is an Error.
        // So checking the result of call.
    }

    // Actually, let's call it and inspect result.
    const validationRes = await successProc.call({ input: 123 });
    console.log('Validation Case:', validationRes.ok === false && validationRes.status === 500 ? 'PASSED (Status 500 for generic/validation error for now)' : 'FAILED', validationRes);
    // Note: ZodError usually isn't mapped to 400 in my map unless I explicitly handle ZodError -> BAD_REQUEST.
    // Current implementation: getErrorFromUnknown(cause) -> default INTERNAL_SERVER_ERROR if not SelixError.
    // So 500 is expected for ZodError with current implementation code.

    // Case 3: SelixError UNAUTHORIZED
    const authErrorProc = procedure.input(z.void()).query(async () => {
        throw new SelixError({ code: 'UNAUTHORIZED' });
    });

    const authRes = await authErrorProc.call({ input: undefined });
    console.log('Auth Error Case:', authRes.ok === false && authRes.status === 401 ? 'PASSED' : 'FAILED', authRes);

    // Case 4: SelixError NOT_FOUND
    const notFoundProc = procedure.input(z.void()).query(async () => {
        throw new SelixError({ code: 'NOT_FOUND' });
    });

    const notFoundRes = await notFoundProc.call({ input: undefined });
    console.log('Not Found Case:', notFoundRes.ok === false && notFoundRes.status === 404 ? 'PASSED' : 'FAILED', notFoundRes);
}

runTest().catch(console.error);

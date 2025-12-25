import { createClient, InferProcedureInput } from '@selix/client';
import type { AppRouter } from './server.js';

const client = createClient<AppRouter>({
    url: 'http://localhost:4000/api'
});

async function main() {
    console.log('Running client...');

    // Query
    const hello = await client.hello.query({ name: 'World' });
    console.log('Result from hello:', hello);

    // Mutation
    const added = await client.add.mutation({ a: 5, b: 10 });
    console.log('Result from add:', added);
}

main();

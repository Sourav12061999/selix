import React, { useState } from 'react';
import { selix } from './utils/selix';

function App() {
    const [name, setName] = useState('Inno');

    // Query
    const { data, isLoading } = selix.user.greet.useQuery({ input: { name } });

    // Mutation
    const mutation = selix.user.create.useMutation();

    const handleCreate = () => {
        mutation.mutate({
            input: {
                name,
                email: 'test@example.com'
            }
        });
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Selix + React + TanStack Query</h1>

            <div>
                <label>Name: </label>
                <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div style={{ marginTop: '20px' }}>
                <h2>Query Result:</h2>
                {isLoading ? 'Loading...' : <pre>{JSON.stringify(data, null, 2)}</pre>}
            </div>

            <div style={{ marginTop: '20px' }}>
                <h2>Mutation:</h2>
                <button onClick={handleCreate} disabled={mutation.isPending}>
                    {mutation.isPending ? 'Creating...' : 'Create User'}
                </button>
                {mutation.data && (
                    <pre style={{ marginTop: '10px' }}>{JSON.stringify(mutation.data, null, 2)}</pre>
                )}
                {mutation.error && (
                    <div style={{ color: 'red' }}>Error: {mutation.error.message}</div>
                )}
            </div>
        </div>
    );
}

export default App;

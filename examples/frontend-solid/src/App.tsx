import { createSignal } from 'solid-js';
import { selix } from './selix';

function App() {
    const [name, setName] = createSignal('SolidUser');

    // Query
    const query = selix.user.greet.useQuery(() => ({ input: { name: name() } }));

    // Mutation
    const mutation = selix.user.create.useMutation();

    const handleCreate = () => {
        mutation.mutate({
            input: {
                name: name(),
                email: 'solid@example.com'
            }
        });
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Selix + Solid + TanStack Query</h1>

            <div>
                <label>Name: </label>
                <input value={name()} onInput={(e) => setName(e.currentTarget.value)} />
            </div>

            <div style={{ "margin-top": '20px' }}>
                <h2>Query Result:</h2>
                {query.isLoading ? 'Loading...' : <pre>{JSON.stringify(query.data, null, 2)}</pre>}
            </div>

            <div style={{ "margin-top": '20px' }}>
                <h2>Mutation:</h2>
                <button onClick={handleCreate} disabled={mutation.isPending}>
                    {mutation.isPending ? 'Creating...' : 'Create User'}
                </button>
                {mutation.data && (
                    <pre style={{ "margin-top": '10px' }}>{JSON.stringify(mutation.data, null, 2)}</pre>
                )}
                {mutation.error && (
                    <div style={{ color: 'red' }}>Error: {mutation.error.message}</div>
                )}
            </div>
        </div>
    );
}

export default App;

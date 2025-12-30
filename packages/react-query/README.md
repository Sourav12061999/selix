# @selix/react-query

TanStack Query adapter for Selix. This package allows you to use your Selix router with React Query hooks.

## Installation

```bash
npm install @selix/react-query @selix/client @tanstack/react-query
# or
bun add @selix/react-query @selix/client @tanstack/react-query
```

## Usage

### 1. Create the React Client

```typescript
// utils/selix.ts
import { createSelixReact } from '@selix/react-query';
import type { AppRouter } from '../backend/router';

export const selix = createSelixReact<AppRouter>();
```

### 2. Setup Provider

Wrap your application with `SelixProvider` and `QueryClientProvider`.

```tsx
// App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createClient } from '@selix/client';
import { SelixProvider } from '@selix/react-query';
import { selix } from './utils/selix';

const queryClient = new QueryClient();

// Create the vanilla client
const selixClient = createClient({
    url: 'http://localhost:3000/api',
});

export default function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <SelixProvider client={selixClient}>
                <YourComponent />
            </SelixProvider>
        </QueryClientProvider>
    );
}
```

### 3. Use Hooks

```tsx
import { selix } from './utils/selix';

function YourComponent() {
    const hello = selix.greeting.useQuery({ 
        input: { name: 'World' } 
    });
    
    const createUser = selix.createUser.useMutation();

    if (hello.isLoading) return <div>Loading...</div>;

    return (
        <div>
            <p>{hello.data?.message}</p>
            <button onClick={() => createUser.mutate({ input: { email: 'test@example.com' } })}>
                Create User
            </button>
        </div>
    );
}
```

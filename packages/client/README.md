# @selix/client

The vanilla client for Selix. Use this to consume your Selix backend in any JavaScript/TypeScript environment.

## Installation

```bash
npm install @selix/client
# or
bun add @selix/client
```

## Usage

### Create Client

```typescript
import { createClient } from '@selix/client';
import type { AppRouter } from './backend'; // Import your AppRouter type

const client = createClient<AppRouter>({
    url: 'http://localhost:3000/api', // Your backend URL
    debugMode: true // Optional: enables logging of requests/responses
});
```

### Querying

```typescript
const result = await client.greeting.query({ 
    input: { name: 'World' } 
});
console.log(result.message);
```

### Mutations

```typescript
const response = await client.createUser.mutation({ 
    input: { email: 'user@example.com' } 
});
```

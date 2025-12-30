# Selix

**Selix** is a modern, type-safe backend framework designed to provide an end-to-end type-safe experience similar to tRPC. It supports multiple runtime adapters (Express, Hono) and offers first-class integration with TanStack Query for React, Solid, Vue, and Svelte.

## Features

- **End-to-End Type Safety**: Share types directly between your backend and frontend. No code generation required.
- **Framework Agnostic**: Run your Selix router with Express, Hono, or other compatible adapters.
- **TanStack Query Integration**: specialized adapters for `@selix/client` that integrate seamlessly with `react-query`, `solid-query`, `vue-query`, and `svelte-query`.
- **Zod Validation**: Built-in support for Zod input validation.
- **Middleware Support**: Easily add authentication, logging, or other middleware to your procedures.
- **Context injection**: Type-safe context injection for request-scoped data.

## Packages

The monorepo consists of several packages:

### Core
- **[`@selix/core`](./packages/core)**: The core runtime and router builder.

### Adapters
- **[`@selix/adapter-express`](./packages/adapter-express)**: Adapter for Express.js.
- **[`@selix/adapter-hono`](./packages/adapter-hono)**: Adapter for Hono.

### Client & Integrations
- **[`@selix/client`](./packages/client)**: The vanilla client for Selix.
- **[`@selix/react-query`](./packages/react-query)**: TanStack Query adapter for React.
- **`@selix/solid-query`**: TanStack Query adapter for Solid.
- **`@selix/vue-query`**: TanStack Query adapter for Vue.
- **`@selix/svelte-query`**: TanStack Query adapter for Svelte.

## Getting Started

### 1. Define your Backend Router

Create your router and export the type definition.

```typescript
// backend/index.ts
import { initSelix } from '@selix/core';
import { z } from 'zod';

const t = initSelix();

export const appRouter = t.router({
  user: t.router({
    greet: t.procedure
      .input(z.object({ name: z.string() }))
      .query(({ input }) => {
        return { message: `Hello, ${input.name}!` };
      }),
    create: t.procedure
      .input(z.object({ name: z.string(), email: z.string().email() }))
      .mutation(({ input }) => {
        return { id: '123', ...input };
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

### 2. Connect to an Adapter

Serve your router using one of the available adapters.

**Express Example:**

```typescript
import express from 'express';
import { createExpressMiddleware } from '@selix/adapter-express';
import { appRouter } from './router';

const app = express();
app.use(express.json());

app.use('/selix', createExpressMiddleware({ router: appRouter }));

app.listen(3000);
```

### 3. Consume on the Client

Use the client library with your framework of choice.

**React Example:**

```typescript
// frontend/src/utils/selix.ts
import { createSelixReactClient } from '@selix/react-query';
import type { AppRouter } from '../../../backend/src/index';

export const selix = createSelixReactClient<AppRouter>({
  url: 'http://localhost:3000/selix',
});

// frontend/src/App.tsx
import { selix } from './utils/selix';

export default function App() {
  const { data, isLoading } = selix.user.greet.useQuery({ 
    input: { name: 'Selix' } 
  });

  const mutation = selix.user.create.useMutation();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <p>{data?.message}</p>
      <button onClick={() => mutation.mutate({ 
        input: { name: 'User', email: 'user@example.com' } 
      })}>
        Create User
      </button>
    </div>
  );
}
```

## Development

This repository is a monorepo managed with Bun workspaces.

### Install Dependencies

```bash
bun install
```

### Build Packages

```bash
bun run build
```

### Run Examples

- **Express Backend**: `bun run example:backend:express`
- **Hono Backend**: `bun run example:backend:hono`
- **React Frontend**: `bun run example:frontend:react`

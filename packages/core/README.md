# @selix/core

The core package for Selix, a type-safe backend framework. This package provides the runtime for defining routers and procedures.

## Installation

```bash
npm install @selix/core zod
# or
yarn add @selix/core zod
# or
pnpm add @selix/core zod
# or
bun add @selix/core zod
```

## Usage

### Initialize Selix

```typescript
import { initSelix } from '@selix/core';

const t = initSelix();
```

### Context

Define your context type (optional but recommended for authentication, etc.):

```typescript
export type Context = {
    user?: { id: string };
};

const t = initSelix<Context>();
```

### Procedures

Define queries and mutations with Zod validation.

```typescript
import { z } from 'zod';

export const appRouter = t.router({
    greeting: t.procedure
        .input(z.object({ name: z.string() }))
        .query(({ input, ctx }) => {
            return {
                message: `Hello ${input.name}`,
                userId: ctx.user?.id
            };
        }),
    
    createUser: t.procedure
        .input(z.object({ email: z.string().email() }))
        .mutation(({ input }) => {
            // database logic here
            return { success: true, email: input.email };
        })
});

export type AppRouter = typeof appRouter;
```

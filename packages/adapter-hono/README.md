# @selix/adapter-hono

Hono adapter for Selix.

## Installation

```bash
npm install @selix/adapter-hono hono
# or
bun add @selix/adapter-hono hono
```

## Usage

```typescript
import { Hono } from 'hono';
import { selixMiddleware } from '@selix/adapter-hono';
import { appRouter } from './router';

const app = new Hono();

app.all('/api/*', selixMiddleware(appRouter));

export default app;
```

### With Context

```typescript
import { createHonoMiddleware } from '@selix/adapter-hono';

app.use('/api/*', createHonoMiddleware({
    router: appRouter,
    createContext: ({ c }) => {
        return {
            userAgent: c.req.header('User-Agent')
        };
    }
}));
```

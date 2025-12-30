# @selix/adapter-express

Express adapter for Selix.

## Installation

```bash
npm install @selix/adapter-express express
# or
bun add @selix/adapter-express express
```

## Usage

```typescript
import express from 'express';
import { createExpressMiddleware } from '@selix/adapter-express';
import { appRouter } from './router';

const app = express();
app.use(express.json()); // Ensure JSON body parsing is enabled

app.use('/api', createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }) => {
        // Return your context here
        return {
            authHeader: req.headers.authorization
        };
    }
}));

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});
```

import express from 'express';
import cors from 'cors';
import { initSelix } from '@selix/core';
import { createExpressMiddleware } from '@selix/adapter-express';
import { z } from 'zod';

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

const t = initSelix();

const appRouter = t.router({
    user: t.router({
        greet: t.procedure
            .input(z.object({ name: z.string() }))
            .query(({ input }) => {
                return {
                    message: `Hello, ${input.name} from Express!`
                };
            }),
        create: t.procedure
            .input(z.object({ name: z.string(), email: z.string().email() }))
            .mutation(({ input }) => {
                return {
                    id: crypto.randomUUID(),
                    ...input,
                    createdAt: new Date()
                };
            })
    })
});

export type AppRouter = typeof appRouter;

app.use('/selix', createExpressMiddleware({ router: appRouter }));

app.get('/', (req, res) => {
    res.send('Selix Express Server Running');
});

app.listen(port, () => {
    console.log(`Express server listening at http://localhost:${port}`);
});

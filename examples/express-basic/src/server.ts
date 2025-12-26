import express from 'express';
import { initSelix } from '@selix/core';
import { createExpressMiddleware } from '@selix/adapter-express';
import { z } from 'zod';

const t = initSelix();


const userRouter = t.router({
    getUser: t.procedure
        .input(z.object({ id: z.string() }))
        .query(({ input }) => {
            return {
                id: input.id,
                name: 'John Doe'
            };
        })
})

export const appRouter = t.router({
    hello: t.procedure
        .input(z.object({ name: z.string() }))
        .query(({ input }) => {
            return {
                greeting: `Hello, ${input.name}!`
            };
        }),

    add: t.procedure
        .input(z.object({ a: z.number(), b: z.number() }))
        .mutation(({ input }) => {
            return {
                result: input.a + input.b
            };
        }),
    userRouter,
});

export type AppRouter = typeof appRouter;

const app = express();
app.use(express.json());

app.use('/api', createExpressMiddleware({ router: appRouter }));

app.listen(4000, () => {
    console.log('Server listening on http://localhost:4000');
});

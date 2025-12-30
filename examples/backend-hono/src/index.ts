import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { initSelix } from '@selix/core';
import { selixMiddleware } from '@selix/adapter-hono';
import { z } from 'zod';

const app = new Hono();

app.use('/*', cors());

const t = initSelix();

const appRouter = t.router({
    user: t.router({
        greet: t.procedure
            .input(z.object({ name: z.string() }))
            .query(({ input }) => {
                return {
                    message: `Hello, ${input.name} from Hono!`
                };
            }),
        create: t.procedure
            .input(z.object({ name: z.string(), email: z.string().email() }))
            .mutation(({ input }) => {
                // In a real app, save to DB
                return {
                    id: crypto.randomUUID(),
                    ...input,
                    createdAt: new Date()
                };
            })
    })
});

export type AppRouter = typeof appRouter;

app.use('/selix/*', selixMiddleware(appRouter));

app.get('/', (c) => c.text('Selix Hono Server Running'));

export default {
    port: 3001,
    fetch: app.fetch
};

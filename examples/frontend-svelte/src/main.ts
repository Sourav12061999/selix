import './app.css'
import App from './App.svelte'
import { QueryClient } from '@tanstack/svelte-query'
import { setSelixContext } from '@selix/svelte-query'
import { vanillaClient } from './selix'

const queryClient = new QueryClient()

// Note: In Svelte Query v5, setup might differ slightly regarding provider.
// But typically we set context at root. 
// However, App.svelte is where we should probably do context setup if we can't do it here easily for Svelte 4/5 
// without a wrapper component. 
// But let's assume standard svelte app structure.

const app = new App({
    target: document.getElementById('app')!,
    props: {
        queryClient,
        vanillaClient
    }
})

export default app

<script lang="ts">
  import { QueryClientProvider } from '@tanstack/svelte-query';
  import { SelixProvider } from '@selix/svelte-query';
  import { selix } from './selix';

  export let queryClient: any;
  export let vanillaClient: any;

  let name = 'SvelteUser';

  // Query
  // Svelte Query v5 might use stores or signals. 
  // Assuming createSelixSvelte returns a function that returns a store/result.
  $: query = selix.user.greet.createQuery({ input: { name } });

  // Mutation
  const mutation = selix.user.create.createMutation();

  function handleCreate() {
      $mutation.mutate({ 
          input: { 
              name, 
              email: 'svelte@example.com' 
          } 
      });
  }
</script>

<QueryClientProvider client={queryClient}>
  <SelixProvider client={vanillaClient} queryClient={queryClient}>
      <main style="padding: 20px;">
          <h1>Selix + Svelte + TanStack Query</h1>
          
          <div>
              <label>Name: </label>
              <input bind:value={name} />
          </div>

          <div style="margin-top: 20px;">
              <h2>Query Result:</h2>
              {#if $query.isLoading}
                  <div>Loading...</div>
              {:else if $query.data}
                  <pre>{JSON.stringify($query.data, null, 2)}</pre>
              {/if}
          </div>

          <div style="margin-top: 20px;">
              <h2>Mutation:</h2>
              <button on:click={handleCreate} disabled={$mutation.isPending}>
                  {$mutation.isPending ? 'Creating...' : 'Create User'}
              </button>
              {#if $mutation.data}
                  <pre style="margin-top: 10px;">{JSON.stringify($mutation.data, null, 2)}</pre>
              {/if}
              {#if $mutation.error}
                  <div style="color: red;">Error: {$mutation.error.message}</div>
              {/if}
          </div>
      </main>
  </SelixProvider>
</QueryClientProvider>

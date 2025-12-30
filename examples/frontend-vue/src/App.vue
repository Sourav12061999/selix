<script setup lang="ts">
import { ref } from 'vue'
import { selix } from './selix'

const name = ref('VueUser')

// Query
// useQuery expects a ref or a getter for reactivity
const { data, isLoading } = selix.user.greet.useQuery({ 
  input: { name: name.value } 
    // Note: In typical vue-query usage, if you want it reactive, 
    // you might need to pass a getter or reactive object.
    // However, our proxy implementation details matter here.
    // If our proxy implementation simply calls useQuery({ input: ... }), 
    // it won't be reactive unless we pass a getter.
    // Let's assume the proxy handles it or we pass a getter if the proxy supports it.
    // Testing this hypothesis. If createSelixVue mirrors useQuery signature,
    // we should validly pass an object or a getter.
})

// Mutation
const { mutate, isPending, data: mutationData, error } = selix.user.create.useMutation()

function handleCreate() {
  mutate({ input: { name: name.value, email: 'vue@example.com' } })
}
</script>

<template>
  <div style="padding: 20px;">
    <h1>Selix + Vue + TanStack Query</h1>
    
    <div>
      <label>Name: </label>
      <input v-model="name" />
    </div>

    <div style="margin-top: 20px;">
      <h2>Query Result:</h2>
      <div v-if="isLoading">Loading...</div>
      <pre v-else>{{ data }}</pre>
    </div>

    <div style="margin-top: 20px;">
      <h2>Mutation:</h2>
      <button @click="handleCreate" :disabled="isPending">
        {{ isPending ? 'Creating...' : 'Create User' }}
      </button>
      <pre v-if="mutationData" style="margin-top: 10px;">{{ mutationData }}</pre>
      <div v-if="error" style="color: red;">Error: {{ error }}</div>
    </div>
  </div>
</template>

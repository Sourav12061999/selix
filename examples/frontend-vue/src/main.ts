import { createApp } from 'vue'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { SelixPlugin } from '@selix/vue-query'
import { vanillaClient } from './selix'
import App from './App.vue'

const app = createApp(App)

app.use(VueQueryPlugin)
app.use(SelixPlugin, { client: vanillaClient })

app.mount('#app')

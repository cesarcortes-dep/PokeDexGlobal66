// Poppins auto-hospedada, solo los tres pesos que usa el Figma. Se elige
// `@fontsource` sobre el <link> de Google Fonts: sin request a un tercero, sin
// depender de una CDN, y el peso entra en el bundle que ya se versiona.
import '@fontsource/poppins/400.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'

import './styles/main.scss'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

import { globalIgnores } from 'eslint/config'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import pluginVitest from '@vitest/eslint-plugin'
import skipFormatting from 'eslint-config-prettier/flat'

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: 'app/files-to-lint',
    files: ['**/*.{vue,ts,mts,tsx}'],
  },

  globalIgnores(['**/dist/**', '**/dist-ssr/**', '**/coverage/**']),

  ...pluginVue.configs['flat/essential'],
  vueTsConfigs.recommended,

  {
    ...pluginVitest.configs.recommended,
    files: ['src/**/__tests__/*'],
  },

  {
    // La regla que sostiene la arquitectura por capas (README: arquitectura).
    //
    // `components/ui/` es presentación pura: recibe props y emite eventos. Si un
    // componente de ahí importa el store o el cliente de API, deja de ser
    // reutilizable y deja de poder testearse sin montar media app.
    //
    // Está acá y no en un README a propósito: así la separación de capas se
    // demuestra corriendo `npm run lint`, en vez de afirmarse en un documento.
    name: 'app/capas-en-un-solo-sentido',
    files: ['src/components/ui/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              // `@/api/types` queda permitido a propósito: tipar una prop con el
              // modelo de dominio no acopla el componente a la red. Lo que se
              // prohíbe es depender del **cliente** y del **estado**, y por eso
              // se apunta a `api/pokeApi` y no a `api/` entero: ESLint interpreta
              // estos patrones como los de `.gitignore`, así que `@/api` taparía
              // también los tipos.
              // Los patrones con `**/` cubren además los imports relativos.
              group: ['@/api/pokeApi', '@/stores/*', '**/api/pokeApi', '**/stores/*'],
              message:
                'components/ui/ es presentación pura: no puede importar el cliente de API ni los stores. Pasá los datos por props y emití eventos. Ver README: arquitectura.',
            },
          ],
        },
      ],
    },
  },

  skipFormatting,
)

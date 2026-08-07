<script setup lang="ts">
// No muestra descripción, categoría ni ratio de género: los tres salen de
// `/pokemon-species`, un endpoint fuera del alcance del enunciado.

import { computed, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { PokeApiError } from '@/api/pokeApi'
import { usePokemonStore } from '@/stores/pokemon'
import { useFavoritesStore } from '@/stores/favorites'
import { useTypesStore } from '@/stores/types'
import { useClipboard } from '@/composables/useClipboard'
import AppIcon from '@/components/ui/AppIcon.vue'
import EmptyState from '@/components/ui/EmptyState.vue'
import FavoriteStar from '@/components/ui/FavoriteStar.vue'
import TypeChip from '@/components/ui/TypeChip.vue'
import { TYPE_LABELS } from '@/components/ui/typeIcons'
import pokedexFrame from '@/assets/pokedex.svg'
import type { Pokemon } from '@/api/types'

const props = defineProps<{ name: string }>()

const route = useRoute()

// De la query y no de `router.back()`: quien abre la URL directamente no tiene
// historial, y `back()` lo sacaría de la aplicación.
const backTo = computed(() => (route.query.desde === 'favoritos' ? 'favorites' : 'list'))

const store = usePokemonStore()

const favorites = useFavoritesStore()

// Las debilidades salen del índice que ya se pidió para colorear la lista.
const types = useTypesStore()
types.load()

const { copied, copy } = useClipboard()

const pokemon = ref<Pokemon | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

// Navegar de un Pokémon a otro reusa el componente: sin observar el `name`, la
// segunda visita mostraría los datos de la primera.
watch(
  () => props.name,
  async (name) => {
    isLoading.value = true
    error.value = null

    try {
      pokemon.value = await store.getDetail(name)
    } catch (cause) {
      pokemon.value = null
      // Traducir el status a un mensaje es presentación, no dominio.
      error.value =
        cause instanceof PokeApiError && cause.status === 404
          ? `No existe ningún Pokémon llamado "${name}".`
          : 'No se pudo cargar el detalle. Revisá tu conexión.'
    } finally {
      isLoading.value = false
    }
  },
  { immediate: true },
)

const weaknesses = computed(() => (pokemon.value ? types.weaknessesOf(pokemon.value.id) : []))

const number = computed(() =>
  pokemon.value ? `N°${String(pokemon.value.id).padStart(3, '0')}` : '',
)

// Copia lo que se ve y no lo crudo de la API: pegado en un chat, "6.9 kg" se
// entiende y "69" no.
const shareText = computed(() => {
  const p = pokemon.value
  if (!p) return ''

  const name = p.name.charAt(0).toUpperCase() + p.name.slice(1)
  const types = p.types.map((type) => TYPE_LABELS[type] ?? type)

  return [name, `${p.weight} kg`, `${p.height} m`, ...types].join(',')
})
</script>

<template>
  <main class="detail-view">
    <!-- Fuera del marco: superpuestas al dibujo competirían con sus botones. -->
    <div class="detail-view__actions">
      <RouterLink
        class="detail-view__back"
        :to="{ name: backTo }"
        :aria-label="backTo === 'favorites' ? 'Volver a favoritos' : 'Volver al listado'"
      >
        <AppIcon name="back" :size="18" />
      </RouterLink>
    </div>

    <div class="detail-view__layout">
      <div class="detail-view__device">
        <img class="detail-view__frame" :src="pokedexFrame" alt="" aria-hidden="true" />

        <!-- En porcentajes del marco: el sprite sigue apoyado cuando el dibujo escala. -->
        <div class="detail-view__screen">
          <img
            v-if="pokemon?.imageUrl"
            class="detail-view__image"
            :src="pokemon.imageUrl"
            :alt="pokemon.name"
          />
        </div>
      </div>

      <p v-if="isLoading" class="detail-view__status" role="status">Cargando…</p>

      <EmptyState
        v-else-if="error"
        role="alert"
        title="No pudimos abrir este Pokémon"
        :description="error"
      />

      <article v-else-if="pokemon" class="detail-view__body">
        <div class="detail-view__heading">
          <h1 class="detail-view__name">{{ pokemon.name }}</h1>

          <FavoriteStar
            :active="favorites.isFavorite(pokemon.name)"
            :label="pokemon.name"
            @toggle="favorites.toggle(pokemon.name)"
          />
        </div>
        <p class="detail-view__number">{{ number }}</p>

        <ul class="detail-view__types">
          <li v-for="type in pokemon.types" :key="type"><TypeChip :type="type" /></li>
        </ul>

        <!-- Cada atributo es un par nombre/valor: eso es lo que un <dl> comunica. -->
        <dl class="detail-view__stats">
          <div class="detail-view__stat">
            <dt class="detail-view__stat-label"><AppIcon name="weight" :size="14" /> PESO</dt>
            <dd class="detail-view__stat-value">{{ pokemon.weight }} kg</dd>
          </div>

          <div class="detail-view__stat">
            <dt class="detail-view__stat-label"><AppIcon name="height" :size="14" /> ALTURA</dt>
            <dd class="detail-view__stat-value">{{ pokemon.height }} m</dd>
          </div>

          <!-- Ocupa las dos columnas: CATEGORÍA, que iba al lado, queda fuera de alcance. -->
          <div v-if="pokemon.ability" class="detail-view__stat detail-view__stat--wide">
            <dt class="detail-view__stat-label"><AppIcon name="ability" :size="14" /> HABILIDAD</dt>
            <dd class="detail-view__stat-value">{{ pokemon.ability }}</dd>
          </div>
        </dl>

        <section v-if="weaknesses.length" class="detail-view__weaknesses">
          <h2 class="detail-view__section-title">Debilidades</h2>
          <ul class="detail-view__types">
            <li v-for="type in weaknesses" :key="type"><TypeChip :type="type" /></li>
          </ul>
        </section>

        <!-- El Figma no incluye este botón; el diseño es propio. -->
        <button class="detail-view__share" type="button" @click="copy(shareText)">
          {{ copied ? '¡Copiado!' : 'Copiar atributos' }}
        </button>

        <!-- Un cambio de texto en un botón no se anuncia solo. -->
        <span class="detail-view__sr-only" role="status">
          {{ copied ? 'Atributos copiados al portapapeles' : '' }}
        </span>
      </article>
    </div>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.detail-view {
  max-width: 1000px;
  padding-bottom: var(--sp-8);
  margin: 0 auto;

  &__layout {
    display: grid;
    gap: var(--sp-6);
    align-items: start;

    @include desktop {
      grid-template-columns: minmax(0, 420px) minmax(0, 1fr);
      align-items: center;
      padding: var(--sp-6) var(--sp-4);
    }
  }

  &__media {
    display: flex;
    flex-direction: column;
    gap: var(--sp-4);
  }

  // Posición de la pantalla dentro del dibujo: x 44/460, y 148/700, 372x352
  // sobre 460x700. Si se reemplaza el SVG, es lo único que hay que reajustar.
  &__device {
    --screen-x: 9.6%;
    --screen-y: 21.1%;
    --screen-w: 80.9%;
    --screen-h: 50.3%;

    position: relative;
    width: 100%;
    max-width: 440px;
    margin: 0 auto;
  }

  &__frame {
    display: block;
    width: 100%;
    height: auto;
  }

  &__screen {
    position: absolute;
    top: var(--screen-y);
    left: var(--screen-x);
    display: grid;
    width: var(--screen-w);
    height: var(--screen-h);
    place-items: center;
    overflow: hidden;
  }

  &__image {
    max-width: 88%;
    max-height: 88%;
    image-rendering: pixelated; // son pixel art: el suavizado los ve borrosos
  }

  &__actions {
    padding: var(--sp-4);
  }

  &__back {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    color: var(--c-text-muted);
    background-color: var(--c-bg);
    border-radius: 50%;

    &:focus-visible {
      outline: 2px solid var(--c-tab-active);
      outline-offset: 2px;
    }
  }

  &__body {
    padding: var(--sp-6) var(--sp-4);
    text-align: center;

    @include desktop {
      padding: 0;
      text-align: left;
    }
  }

  &__heading {
    display: flex;
    gap: var(--sp-3);
    align-items: center;
    justify-content: center;

    @include desktop {
      justify-content: flex-start;
    }
  }

  &__name {
    margin: 0;
    font-size: var(--fs-title);
    font-weight: var(--fw-title);
    line-height: 1.2;
    text-transform: capitalize;
  }

  &__number {
    margin: var(--sp-1) 0 var(--sp-4);
    font-size: var(--fs-body);
    color: var(--c-text-muted);
  }

  &__types {
    display: flex;
    flex-wrap: wrap;
    gap: var(--sp-2);
    justify-content: center;
    padding: 0;
    margin: 0;
    list-style: none;

    @include desktop {
      justify-content: flex-start;
    }
  }

  &__stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--sp-3);
    margin: var(--sp-6) 0 0;
  }

  // La etiqueta va fuera del recuadro y solo el valor adentro, como en el Figma.
  &__stat {
    &--wide {
      grid-column: 1 / -1;
    }
  }

  &__stat-label {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    margin-bottom: var(--sp-2);
    font-size: var(--fs-body);
    color: var(--c-text-muted);
    letter-spacing: 0.04em;
  }

  &__stat-value {
    padding: var(--sp-3);
    margin: 0;
    text-align: center;
    background-color: var(--c-bg);
    text-transform: capitalize;
    border: var(--border-width) solid var(--c-border);
    border-radius: var(--radius-card);
  }

  &__weaknesses {
    margin-top: var(--sp-6);
  }

  &__section-title {
    margin: 0 0 var(--sp-3);
    font-size: var(--fs-name);
    font-weight: var(--fw-name);
    text-align: left;
  }

  &__share {
    width: 100%;
    padding: var(--sp-3) var(--sp-6);
    margin-top: var(--sp-6);
    font-size: var(--fs-body);
    font-weight: 600;
    color: var(--c-bg);
    background-color: var(--c-tab-active);
    border: 0;
    border-radius: var(--radius-pill);

    &:focus-visible {
      outline: 2px solid var(--c-tab-active);
      outline-offset: 2px;
    }
  }

  &__sr-only {
    @include visually-hidden;
  }

  &__status {
    padding: var(--sp-8);
    color: var(--c-text-muted);
    text-align: center;
  }
}
</style>

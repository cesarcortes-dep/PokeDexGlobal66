<script setup lang="ts">
/**
 * Detalle de un Pokémon: imagen, atributos, favorito y botón compartir (F6).
 *
 * PENDIENTE DE DECISIÓN (ADR-0005, necesita el Figma):
 * en mobile el detalle es un modal sobre la lista. En desktop puede seguir siendo
 * modal o pasar a panel lateral con la lista al costado. Esa decisión cambia si
 * esto es una View con ruta propia o un componente montado desde ListView.
 *
 * Se deja como ruta por ahora: da URL compartible y botón "atrás" del navegador
 * gratis. Si termina siendo modal, se mueve a components/features/.
 *
 * TODO:
 *  - botón compartir con useClipboard (F6)
 *  - maqueta real del Figma
 */

import { ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { usePokemonStore } from '@/stores/pokemon'
import { useFavoritesStore } from '@/stores/favorites'
import { PokeApiError } from '@/api/pokeApi'
import FavoriteStar from '@/components/ui/FavoriteStar.vue'
import type { Pokemon } from '@/api/types'

const props = defineProps<{ name: string }>()

const store = usePokemonStore()

/**
 * El mismo store que usa el listado. Marcar acá se refleja allá sin ningún
 * mecanismo de sincronización: hay una sola fuente de verdad (F1, F7).
 */
const favorites = useFavoritesStore()

const pokemon = ref<Pokemon | null>(null)
const isLoading = ref(false)
const error = ref<string | null>(null)

/**
 * Se observa el `name` de la ruta y no solo se carga al montar: navegar de un
 * Pokémon a otro reusa el mismo componente, así que sin esto la segunda visita
 * mostraría los datos de la primera.
 */
watch(
  () => props.name,
  async (name) => {
    isLoading.value = true
    error.value = null

    try {
      pokemon.value = await store.getDetail(name)
    } catch (cause) {
      pokemon.value = null
      // Traducir el status a un mensaje es decisión de presentación, por eso
      // vive acá y no en el store: un 404 en esta pantalla significa "escribiste
      // mal la URL", no "se rompió algo".
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
</script>

<template>
  <section class="detail-view">
    <RouterLink class="detail-view__back" :to="{ name: 'list' }">← Volver al listado</RouterLink>

    <p v-if="isLoading" class="detail-view__status" role="status">Cargando…</p>

    <p v-else-if="error" class="detail-view__status" role="alert">{{ error }}</p>

    <article v-else-if="pokemon" class="detail-view__card">
      <img
        v-if="pokemon.imageUrl"
        class="detail-view__image"
        :src="pokemon.imageUrl"
        :alt="pokemon.name"
        width="240"
        height="240"
      />

      <div class="detail-view__heading">
        <h1 class="detail-view__name">{{ pokemon.name }}</h1>
        <FavoriteStar
          :active="favorites.isFavorite(pokemon.name)"
          :label="pokemon.name"
          @toggle="favorites.toggle(pokemon.name)"
        />
      </div>

      <!-- Lista de descripción: cada atributo es un par nombre/valor, y eso es
           exactamente lo que un <dl> comunica a un lector de pantalla. -->
      <dl class="detail-view__attributes">
        <div class="detail-view__attribute">
          <dt>Peso</dt>
          <dd>{{ pokemon.weight }} kg</dd>
        </div>
        <div class="detail-view__attribute">
          <dt>Altura</dt>
          <dd>{{ pokemon.height }} m</dd>
        </div>
        <div class="detail-view__attribute">
          <dt>Tipos</dt>
          <dd>{{ pokemon.types.join(', ') }}</dd>
        </div>
      </dl>
    </article>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.detail-view {
  max-width: var(--content-max-width);
  padding: var(--sp-4);
  margin: 0 auto;

  &__back {
    display: inline-block;
    margin-bottom: var(--sp-4);
    font-size: var(--fs-small);
    color: var(--c-text-muted);
  }

  &__card {
    padding: var(--sp-6);
    text-align: center;
    background-color: var(--c-surface);
    border-radius: var(--radius-card);
    box-shadow: var(--shadow-card);
  }

  &__image {
    width: 240px;
    height: auto;
  }

  &__heading {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    justify-content: center;
  }

  &__name {
    font-size: var(--fs-title);
    text-transform: capitalize;
  }

  &__attributes {
    margin: 0;
    text-align: left;
  }

  &__attribute {
    display: flex;
    gap: var(--sp-2);
    padding: var(--sp-2) 0;
    border-bottom: 1px solid var(--c-border);

    dt {
      font-weight: 700;
    }

    dd {
      margin: 0;
      text-transform: capitalize;
    }
  }

  &__status {
    padding: var(--sp-6);
    color: var(--c-text-muted);
    text-align: center;
  }
}
</style>

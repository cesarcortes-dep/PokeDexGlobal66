<script setup lang="ts">
/**
 * Detalle de un Pokémon (D1, F4, F6).
 *
 * Es una **ruta** y no un modal (ADR-0005): da URL compartible y botón "atrás"
 * del navegador, y evita mantener dos comportamientos entre mobile y desktop.
 *
 * Qué NO muestra, y es deliberado (supuesto S5): descripción, categoría y ratio
 * de género. Los tres solo salen de `/pokemon-species`, un endpoint fuera del
 * alcance del enunciado. Se recortan tres campos de una pantalla en vez de
 * recortar el catálogo, que costaría la evidencia de E7.
 */

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

/**
 * A dónde vuelve la flecha.
 *
 * Se lee de la query que puso el link de origen en vez de usar `router.back()`:
 * el historial funciona bien si el usuario llegó navegando, pero si abrió la
 * URL del detalle directamente —que es justo lo que habilita tener ruta propia—
 * `back()` lo sacaría de la aplicación. Así siempre hay un destino válido.
 */
const backTo = computed(() => (route.query.desde === 'favoritos' ? 'favorites' : 'list'))

const store = usePokemonStore()

/**
 * El mismo store que usa el listado. Marcar acá se refleja allá sin ningún
 * mecanismo de sincronización: hay una sola fuente de verdad (F1, F7).
 */
const favorites = useFavoritesStore()

/** Las debilidades salen del índice que ya se pidió para colorear la lista. */
const types = useTypesStore()
types.load()

const { copied, copy } = useClipboard()

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

const weaknesses = computed(() => (pokemon.value ? types.weaknessesOf(pokemon.value.id) : []))

const number = computed(() =>
  pokemon.value ? `N°${String(pokemon.value.id).padStart(3, '0')}` : '',
)

/**
 * Lo que copia el botón compartir (F6, supuesto S4): nombre y los atributos que
 * esta pantalla muestra, separados por coma.
 *
 * Copia **lo que se ve**, no lo que devuelve la API: nombre capitalizado, tipos
 * en español y unidades incluidas. Si alguien pega esto en un chat, "6.9 kg" se
 * entiende y "69" no, y "Planta" es lo que leyó en pantalla, no "grass".
 */
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
    <!--
      Dos columnas en escritorio: la imagen a la izquierda y los datos a la
      derecha, que es como se lee una ficha con espacio horizontal. En una sola
      columna, todo lo importante quedaba debajo del pliegue.

      El sprite se apoya sobre la pantalla de un Pokédex dibujado. Es un
      EXPERIMENTO (rama experimento/marco-pokedex): no está en el Figma, así que
      si se queda hay que documentarlo como desviación de D1.

      Las acciones quedan FUERA del marco: superpuestas al dibujo competirían
      con sus propios botones y serían difíciles de encontrar.
    -->
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

      <!--
        La ventana se posiciona en porcentajes del marco, no en píxeles: así el
        sprite sigue apoyado en la pantalla cuando el dibujo escala.
      -->
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

    <EmptyState v-else-if="error" role="alert" title="No pudimos abrir este Pokémon" :description="error" />

    <article v-else-if="pokemon" class="detail-view__body">
      <!--
        La estrella acompaña al nombre: marcar favorito se refiere a este Pokémon
        en particular, y arriba junto a la flecha se leía como una acción de la
        pantalla y no del contenido.
      -->
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

      <!-- Lista de descripción: cada atributo es un par nombre/valor, y eso es
           exactamente lo que un <dl> comunica a un lector de pantalla. -->
      <dl class="detail-view__stats">
        <div class="detail-view__stat">
          <dt class="detail-view__stat-label"><AppIcon name="weight" :size="14" /> PESO</dt>
          <dd class="detail-view__stat-value">{{ pokemon.weight }} kg</dd>
        </div>

        <div class="detail-view__stat">
          <dt class="detail-view__stat-label"><AppIcon name="height" :size="14" /> ALTURA</dt>
          <dd class="detail-view__stat-value">{{ pokemon.height }} m</dd>
        </div>

        <!--
          Ocupa las dos columnas porque CATEGORÍA, que en el Figma iba a su lado,
          queda fuera de alcance (S5): sale de `/pokemon-species`. Dejar el hueco
          se leería como algo que falta cargar.
        -->
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

      <!--
        El Figma no incluye este botón, pero F6 lo pide. Se diseña respetando el
        sistema visual existente y queda documentado como desviación consciente.
      -->
      <button class="detail-view__share" type="button" @click="copy(shareText)">
        {{ copied ? '¡Copiado!' : 'Copiar atributos' }}
      </button>

      <!-- El cambio de texto del botón no lo anuncia un lector de pantalla por
           sí solo: este `role="status"` sí lo hace. -->
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
      // Centrada verticalmente contra la columna de datos, que es más alta: así
      // el sprite queda a la altura de PESO y ALTURA en vez de pegado arriba
      // con un hueco debajo.
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

  /*
    Posición de la pantalla dentro del dibujo, en porcentajes del marco.
    Si se reemplaza el SVG por otra ilustración, estos cuatro valores son lo
    único que hay que reajustar.
  */
  &__device {
    // Pantalla del dibujo: x 44/460, y 148/700, 372x352 sobre 460x700.
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
    // Los sprites de PokéAPI son pixel art: sin esto el navegador los suaviza al
    // escalarlos y se ven borrosos.
    image-rendering: pixelated;
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
      // Alineado a la izquierda: con la imagen al costado, centrar el texto lo
      // desconecta visualmente de su columna.
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

  /*
    Los chips siguen la alineación del resto de la columna: centrados cuando todo
    se apila, y al ras del texto en escritorio. Dejarlos centrados mientras el
    nombre y los atributos van a la izquierda los desprendía del bloque.
  */
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

  /*
    La etiqueta va FUERA del recuadro y solo el valor adentro, como en el Figma.
    Meter las dos dentro del borde agrupaba visualmente el nombre del atributo
    con su valor, cuando el diseño los separa a propósito.
  */
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

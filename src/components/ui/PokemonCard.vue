<script setup lang="ts">
/**
 * Tarjeta del listado (D1, E2). Reemplaza a la fila de texto plano anterior.
 *
 * Presentación pura: recibe todo por props y no sabe que existen Pinia ni la
 * PokéAPI. La URL del sprite llega armada desde afuera justamente por eso — la
 * regla de `components/ui/` (ADR-0006) impide importar el cliente de API, y el
 * lint la hace cumplir.
 *
 * El color sale del tipo primario (ADR-0007): `--type-{tipo}-card` para el fondo
 * y `--type-{tipo}` para la forma. La forma **es el icono del tipo ampliado**, el
 * mismo `path` que dibuja el chip a 14px. Un asset, dos usos.
 *
 * Alto fijo (`--row-height`): lo necesita el virtual scroll para calcular offsets
 * (ADR-0004). Si esta tarjeta creciera sola, la lista se desalinearía al
 * scrollear.
 */

import { computed } from 'vue'
import TypeChip from './TypeChip.vue'
import { TYPE_ICONS } from './typeIcons'

const props = defineProps<{
  id: number
  name: string
  types: string[]
  imageUrl: string
}>()

/** El tipo del slot 1 gobierna el color. Sin tipos todavía, gris neutro. */
const primary = computed(() => props.types[0] ?? 'normal')

const shape = computed(() => TYPE_ICONS[primary.value])

/** `N°001` — tres dígitos, como en el Figma. */
const number = computed(() => `N°${String(props.id).padStart(3, '0')}`)
</script>

<template>
  <article
    class="pokemon-card"
    :style="{
      '--card-bg': `var(--type-${primary}-card)`,
      '--card-shape': `var(--type-${primary})`,
    }"
  >
    <div class="pokemon-card__info">
      <span class="pokemon-card__number">{{ number }}</span>
      <h2 class="pokemon-card__name">{{ name }}</h2>

      <ul class="pokemon-card__types">
        <li v-for="type in types" :key="type">
          <TypeChip :type="type" />
        </li>
      </ul>
    </div>

    <div class="pokemon-card__art">
      <!--
        La forma no es decorado suelto: es el icono del tipo a tamaño grande.
        `preserveAspectRatio` sin `meet` lo deja llenar el recuadro aunque el
        icono no sea cuadrado (el ala de `flying` es apaisada).
      -->
      <svg
        v-if="shape"
        class="pokemon-card__shape"
        :viewBox="shape.viewBox"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path v-for="(d, i) in shape.paths" :key="i" :d="d" fill="currentColor" />
      </svg>

      <!--
        `loading="lazy"` y dimensiones fijas: los sprites de las filas que no se
        ven no se descargan, y el hueco está reservado antes de que lleguen, así
        que la lista no salta mientras cargan (CLS 0).
      -->
      <img
        class="pokemon-card__sprite"
        :src="imageUrl"
        alt=""
        width="72"
        height="72"
        loading="lazy"
        decoding="async"
      />
    </div>
  </article>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.pokemon-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--row-height);
  padding-left: var(--sp-4);
  overflow: hidden;
  background-color: var(--card-bg);
  border-radius: var(--radius-card);

  &__info {
    display: flex;
    flex-direction: column;
    gap: var(--sp-2);
    min-width: 0; // deja que el nombre trunque en vez de desbordar la tarjeta
    padding: var(--sp-2) 0;
  }

  &__number {
    font-size: var(--fs-body);
    font-weight: var(--fw-body);
    color: var(--c-text-muted);
  }

  &__name {
    @include truncate;

    margin: 0;
    font-size: var(--fs-name);
    font-weight: var(--fw-name);
    // El Figma marca 100%, pero `truncate` necesita `overflow: hidden` y con la
    // caja de línea igual al tamaño de fuente los descendentes (la `g` de
    // "Pidgeot") quedan afuera y se recortan. 1.2 les da lugar sin aflojar el
    // aire del diseño.
    line-height: 1.2;
    color: var(--c-text);
    text-transform: capitalize;
  }

  &__types {
    display: flex;
    gap: var(--sp-2);
    padding: 0;
    margin: 0;
    // Los chips son el elemento más ancho de la columna. Sin permitirles
    // encogerse, empujan y obligan al nombre a truncar antes de tiempo.
    min-width: 0;
    list-style: none;
  }

  &__art {
    position: relative;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    // Proporción y no ancho fijo: en el Figma el panel ocupa cerca de un tercio
    // de la tarjeta, así que cuando la tarjeta crece en desktop crece con ella.
    width: 32%;
    min-width: 96px;
    height: 100%;
    // Recorta la forma al panel. Sin esto se derrama sobre el nombre.
    overflow: hidden;
    color: var(--card-shape);
  }

  &__shape {
    position: absolute;
    // `meet` en lugar de `slice`: la forma entra completa en el panel en vez de
    // escalarse hasta cubrirlo. Con `slice`, un icono angosto como la gota de
    // `water` se agrandaba hasta desbordar la tarjeta entera.
    inset: 0;
    width: 100%;
    height: 100%;
    // Más saturado que el fondo, mismo tono: es la misma familia de color, no
    // una segunda paleta.
    opacity: 0.5;
  }

  &__sprite {
    position: relative; // por encima de la forma
    width: 72px;
    height: 72px;
    object-fit: contain;
    // Los sprites de PokéAPI son pixel art: sin esto el navegador los suaviza al
    // escalarlos y se ven borrosos.
    image-rendering: pixelated;
  }
}
</style>

<script setup lang="ts">
// Alto fijo (`--row-height`): el virtual scroll calcula offsets con ese número.

import { computed } from 'vue'
import TypeChip from './TypeChip.vue'
import { TYPE_ICONS } from './typeIcons'

const props = defineProps<{
  id: number
  name: string
  types: string[]
  imageUrl: string
}>()

// El tipo del slot 1 gobierna el color; sin tipos todavía, gris neutro.
const primary = computed(() => props.types[0] ?? 'normal')

const shape = computed(() => TYPE_ICONS[primary.value])

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
      <!-- La forma es el mismo icono del chip, ampliado. -->
      <svg
        v-if="shape"
        class="pokemon-card__shape"
        :viewBox="shape.viewBox"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <path v-for="(d, i) in shape.paths" :key="i" :d="d" fill="currentColor" />
      </svg>

      <!-- Dimensiones fijas: reservan el hueco y la lista no salta al cargar. -->
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
    min-width: 0; // deja truncar el nombre en vez de desbordar
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
    // El Figma marca 100%, pero con `overflow: hidden` eso recorta los
    // descendentes: la `g` de "Pidgeot" se corta.
    line-height: 1.2;
    color: var(--c-text);
    text-transform: capitalize;
  }

  &__types {
    display: flex;
    gap: var(--sp-2);
    padding: 0;
    margin: 0;
    min-width: 0; // sin esto los chips empujan y truncan el nombre antes de tiempo
    list-style: none;
  }

  &__art {
    position: relative;
    display: grid;
    flex-shrink: 0;
    place-items: center;
    width: 32%; // proporción y no ancho fijo: crece con la tarjeta
    min-width: 96px;
    height: 100%;
    overflow: hidden; // sin esto la forma se derrama sobre el nombre
    color: var(--card-shape);
  }

  &__shape {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    opacity: 0.5;
  }

  &__sprite {
    position: relative; // por encima de la forma
    width: 72px;
    height: 72px;
    object-fit: contain;
    image-rendering: pixelated; // son pixel art: el suavizado los ve borrosos
  }
}
</style>

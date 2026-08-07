<script setup lang="ts">
/**
 * Pastilla de tipo: icono + nombre en español, sobre el color del tipo (E2).
 *
 * Presentación pura. Recibe el nombre del tipo tal como lo devuelve la API
 * (`grass`, `poison`) y resuelve sola su icono, su etiqueta y su color — son
 * datos estáticos del diseño, no del dominio.
 *
 * El color sale de `--type-{nombre}`, que define `_tokens.scss`. Si el Figma
 * cambia un color, el chip lo toma sin tocar este archivo.
 */

import { computed } from 'vue'
import { TYPE_ICONS, TYPE_LABELS } from './typeIcons'

const props = defineProps<{ type: string }>()

const icon = computed(() => TYPE_ICONS[props.type])

/** Si llega un tipo que el diseño no contempla, se muestra el nombre crudo. */
const label = computed(() => TYPE_LABELS[props.type] ?? props.type)
</script>

<template>
  <span class="type-chip" :style="{ '--chip-color': `var(--type-${type})` }">
    <svg
      v-if="icon"
      class="type-chip__icon"
      :viewBox="icon.viewBox"
      width="14"
      height="14"
      aria-hidden="true"
    >
      <path v-for="(d, i) in icon.paths" :key="i" :d="d" fill="currentColor" fill-rule="evenodd" />
    </svg>
    {{ label }}
  </span>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.type-chip {
  display: inline-flex;
  gap: var(--sp-1);
  align-items: center;
  padding: var(--sp-1) var(--sp-3);
  font-size: var(--fs-body);
  line-height: 1.25;
  // Claro sobre el color del tipo, igual que en el Figma. El icono hereda este
  // color vía `currentColor`, así que no hay que pintarlo aparte.
  color: var(--c-bg);
  white-space: nowrap;
  background-color: var(--chip-color);
  border-radius: var(--radius-pill);

  &__icon {
    flex-shrink: 0;
  }
}
</style>

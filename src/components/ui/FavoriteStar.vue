<script setup lang="ts">
/**
 * Estrella de favorito (F1, E2).
 *
 * Presentación pura: recibe si está activa y avisa que la tocaron. No sabe que
 * existe el store de favoritos ni qué se hace con el evento.
 *
 * Es un `<button>` y no un icono con `@click`: entra en el orden de tabulación,
 * responde a Enter y Espacio, y se anuncia como control. Con `aria-pressed` un
 * lector de pantalla dice "activado" o "desactivado" en vez de leer la estrella.
 *
 * TODO: ícono real del Figma en lugar del carácter ★.
 */

defineProps<{
  active: boolean
  /** Para el nombre accesible: "Quitar pikachu de favoritos". */
  label: string
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    class="favorite-star"
    type="button"
    :class="{ 'favorite-star--active': active }"
    :aria-pressed="active"
    :aria-label="`${active ? 'Quitar' : 'Agregar'} ${label} ${active ? 'de' : 'a'} favoritos`"
    @click="$emit('toggle')"
  >
    <span aria-hidden="true">★</span>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.favorite-star {
  padding: var(--sp-2);
  font-size: var(--fs-body);
  line-height: 1;
  color: var(--c-star-idle);
  background: none;
  border: 0;
  border-radius: 50%;

  &--active {
    color: var(--c-star-active);
  }

  &:focus-visible {
    outline: 2px solid var(--c-primary);
    outline-offset: -2px;
  }
}
</style>

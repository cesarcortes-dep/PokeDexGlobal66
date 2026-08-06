<script setup lang="ts">
/**
 * Fila del listado (E2).
 *
 * Presentación pura: recibe un nombre, no sabe que existen Pinia ni la PokéAPI.
 * Ver la regla en `components/ui/README.md`.
 *
 * Muestra solo el nombre a propósito (supuesto S3): los sprites viven en el
 * endpoint de detalle y traerlos para el listado costaría ~1350 requests, contra
 * el "solo dos llamados" del enunciado.
 *
 * El alto lo fija `--row-height`, que pone quien la use. Es la condición que
 * necesita el virtual scroll (ADR-0004): si esta fila creciera sola, el cálculo
 * de offsets se desalinea.
 *
 * TODO: maqueta real del Figma — estrella de favorito y tipografía.
 */

defineProps<{ name: string }>()
</script>

<template>
  <div class="pokemon-row">
    <span class="pokemon-row__name">{{ name }}</span>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.pokemon-row {
  display: flex;
  align-items: center;
  height: var(--row-height);
  // El padding derecho es más grande porque quien la usa puede superponer una
  // acción sobre ese lado (la estrella de favorito). Así el nombre trunca antes
  // de meterse debajo.
  padding: 0 var(--sp-8) 0 var(--sp-4);
  background-color: var(--c-surface);
  border-bottom: 1px solid var(--c-border);

  &__name {
    @include truncate;

    text-transform: capitalize;
  }
}
</style>

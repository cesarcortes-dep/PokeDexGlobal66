<script setup lang="ts">
/**
 * Pantalla principal: lista de Pokémon + búsqueda + toggle Todos/Favoritos.
 *
 * Una View orquesta: pide datos al store y compone componentes.
 * No maqueta detalles ni hace fetch — eso vive en components/ y en api/.
 *
 * TODO:
 *  - usePokemonStore().loadList() en onMounted, con su estado de carga (F5)
 *  - useSearch() sobre la lista del store (F8)
 *  - toggle Todos / Favoritos (F1)
 *  - estados vacíos: sin favoritos, búsqueda sin resultados
 */
</script>

<template>
  <main class="list-view">
    <!-- TODO: reemplazar por la maqueta real del Figma -->
    <p>ListView — pendiente (ver docs/REQUIREMENTS.md)</p>
  </main>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.list-view {
  max-width: var(--content-max-width);
  margin: 0 auto;
  padding: var(--sp-4);

  // El layout desktop se decide en ADR-0005, con el Figma a la vista.
  @include desktop {
    // TODO
  }
}
</style>

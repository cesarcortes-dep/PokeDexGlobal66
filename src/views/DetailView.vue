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
 *  - leer el `name` de la ruta y pedir usePokemonStore().getDetail(name)
 *  - estados: cargando, no encontrado (404 de la API), error de red
 *  - botón favorito (F1) y botón compartir con useClipboard (F6)
 */
</script>

<template>
  <section class="detail-view">
    <!-- TODO: reemplazar por la maqueta real del Figma -->
    <p>DetailView — pendiente (ver docs/REQUIREMENTS.md)</p>
  </section>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.detail-view {
  padding: var(--sp-4);
}
</style>

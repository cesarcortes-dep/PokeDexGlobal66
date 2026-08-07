<script setup lang="ts">
/**
 * Estado vacío (E2). Ilustración, título y una línea que dice qué hacer.
 *
 * Presentación pura: no sabe **por qué** está vacío. La lista tiene dos casos
 * distintos —búsqueda sin resultados y favoritos sin marcar— y decidir cuál
 * mostrar es de quien tiene los datos, no de este componente.
 *
 * La imagen va como `<img>` y no inline: es un PNG dentro de un SVG, así que no
 * hay nada que colorear por CSS y ponerlo inline solo engordaría el bundle con
 * base64 que el navegador ya sabe cachear como archivo.
 */

import magikarp from '@/assets/magikarp.svg'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div class="empty-state">
    <img class="empty-state__art" :src="magikarp" alt="" width="185" height="215" />

    <p class="empty-state__title">{{ title }}</p>
    <p v-if="description" class="empty-state__description">{{ description }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.empty-state {
  display: flex;
  flex-direction: column;
  gap: var(--sp-2);
  align-items: center;
  justify-content: center;
  padding: var(--sp-8) var(--sp-4);
  text-align: center;

  &__art {
    max-width: 185px;
    height: auto;
    margin-bottom: var(--sp-4);
    // La ilustración acompaña al mensaje, no compite con él.
    opacity: 0.6;
  }

  &__title {
    max-width: 22ch; // corta el título en dos líneas, como en el Figma
    margin: 0;
    font-size: var(--fs-name);
    font-weight: var(--fw-name);
    color: var(--c-text);
  }

  &__description {
    max-width: 34ch;
    margin: 0;
    font-size: var(--fs-body);
    line-height: var(--lh-body);
    color: var(--c-text-muted);
  }
}
</style>

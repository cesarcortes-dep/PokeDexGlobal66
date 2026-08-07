<script setup lang="ts">
// No sabe por qué está vacío: hay dos casos —búsqueda sin resultados y
// favoritos sin marcar— y elegir cuál mostrar es de quien tiene los datos.

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
    opacity: 0.6;
  }

  &__title {
    max-width: 22ch; // dos líneas, como en el Figma
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

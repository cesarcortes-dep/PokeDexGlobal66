<script setup lang="ts">
/**
 * Botón de favorito (F1, E2). Icono del Figma.
 *
 * Presentación pura: recibe si está activo y avisa que lo tocaron. No sabe que
 * existe el store de favoritos ni qué se hace con el evento.
 *
 * Es un `<button>` y no un icono con `@click`: entra en el orden de tabulación,
 * responde a Enter y Espacio, y se anuncia como control. Con `aria-pressed` un
 * lector de pantalla dice "activado" o "desactivado" en vez de leer el icono.
 *
 * El SVG va inline y no como `<img>`: así hereda los colores por CSS y la
 * transición entre estados es una propiedad animable, no un cambio de archivo.
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
    <svg
      class="favorite-star__icon"
      width="32"
      height="32"
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      <rect class="favorite-star__circle" x="1" y="1" width="30" height="30" rx="15" />
      <!--
        Un solo path para los dos estados: inactivo va contorneado y activo
        relleno. Dibujar dos SVG distintos haría imposible animar la transición.
      -->
      <path
        class="favorite-star__heart"
        d="M21.8933 11.0733C21.5528 10.7327 21.1485 10.4624 20.7036 10.2781C20.2586 10.0937 19.7817 9.99879 19.3 9.99879C18.8183 9.99879 18.3414 10.0937 17.8964 10.2781C17.4515 10.4624 17.0472 10.7327 16.7067 11.0733L16 11.78L15.2933 11.0733C14.6055 10.3856 13.6727 9.99915 12.7 9.99915C11.7273 9.99915 10.7945 10.3856 10.1067 11.0733C9.41887 11.7611 9.03247 12.694 9.03247 13.6667C9.03247 14.6394 9.41887 15.5722 10.1067 16.26L10.8133 16.9667L16 22.1533L21.1867 16.9667L21.8933 16.26C22.234 15.9195 22.5042 15.5152 22.6886 15.0702C22.873 14.6253 22.9679 14.1483 22.9679 13.6667C22.9679 13.185 22.873 12.7081 22.6886 12.2631C22.5042 11.8181 22.234 11.4138 21.8933 11.0733Z"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  </button>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.favorite-star {
  display: grid;
  padding: 0;
  background: none;
  border: 0;
  border-radius: 50%;

  &__circle {
    fill: var(--c-favorite-circle);
    stroke: var(--c-favorite-outline);
    stroke-width: 2;
  }

  &__heart {
    fill: none;
    stroke: var(--c-favorite-outline);
    transition:
      fill 150ms ease-out,
      stroke 150ms ease-out;
  }

  &--active &__heart {
    fill: var(--c-favorite-active);
    // Sin contorno cuando está relleno: el borde claro sobre el rojo se lee como
    // un halo y el Figma no lo tiene.
    stroke: none;
  }

  &:focus-visible {
    outline: 2px solid var(--c-tab-active);
    outline-offset: 2px;
  }
}
</style>

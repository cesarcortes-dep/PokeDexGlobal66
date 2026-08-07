<script setup lang="ts">
/**
 * Iconos sueltos de la interfaz, exportados del Figma (E2).
 *
 * Están juntos en un componente porque son pocos y todos monocromos. Los de tipo
 * viven aparte (`typeIcons.ts`) porque son dieciocho y tienen su propia lógica de
 * etiqueta y color.
 *
 * Todos van con `currentColor`: el color lo decide quien los usa, así el mismo
 * icono sirve en un botón, en una barra de navegación o sobre un fondo de color.
 *
 * Siempre `aria-hidden`: un icono nunca es el nombre accesible de nada. El texto
 * lo pone el `aria-label` del botón que lo contiene.
 */

const ICONS = {
  /**
   * Flecha de volver del detalle.
   *
   * La lupa del Figma se descartó: la búsqueda filtra mientras se escribe, así
   * que un botón de "buscar" no dispara nada que no haya pasado ya. Un control
   * que no hace nada es peor que uno ausente.
   */
  back: {
    viewBox: '0 0 10 17',
    stroke: false,
    paths: [
      'M0.341797 7.34544C-0.113932 7.80117 -0.113932 8.54128 0.341797 8.99701L7.3418 15.997C7.79753 16.4527 8.53763 16.4527 8.99336 15.997C9.44909 15.5413 9.44909 14.8012 8.99336 14.3454L2.81732 8.1694L8.98971 1.99336C9.44544 1.53763 9.44544 0.797526 8.98971 0.341797C8.53398 -0.113932 7.79388 -0.113932 7.33815 0.341797L0.338151 7.3418L0.341797 7.34544Z',
    ],
  },
} as const

defineProps<{
  name: keyof typeof ICONS
  size?: number
}>()

const icons = ICONS
</script>

<template>
  <svg
    class="app-icon"
    :viewBox="icons[name].viewBox"
    :width="size ?? 20"
    :height="size ?? 20"
    fill="none"
    aria-hidden="true"
  >
    <path
      v-for="(d, i) in icons[name].paths"
      :key="i"
      :d="d"
      :fill="icons[name].stroke ? 'none' : 'currentColor'"
      :stroke="icons[name].stroke ? 'currentColor' : undefined"
      stroke-width="1.5"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>

<style scoped>
.app-icon {
  flex-shrink: 0;
}
</style>

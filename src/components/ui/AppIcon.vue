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
  /** Pesa, para el atributo peso del detalle. */
  weight: {
    viewBox: '0 0 11 11',
    stroke: false,
    paths: [
      'M5.5 0C4.6775 0 4 0.6775 4 1.5C4 1.676 4.037 1.842 4.094 2L1.594 2L1.5155 2.4065L0.0155001 9.9065L0 9.953L0 11H11V9.953L10.9845 9.9065L9.4845 2.4065L9.406 2H6.906C6.96606 1.84004 6.99786 1.67085 7 1.5C7 0.6775 6.3225 0 5.5 0ZM5.5 1C5.7815 1 6 1.219 6 1.5C6 1.7815 5.781 2 5.5 2C5.2185 2 5 1.781 5 1.5C5 1.2185 5.219 1 5.5 1ZM2.406 3L8.594 3L10 10H1L2.406 3Z',
    ],
  },
  /** Pokebola, para el atributo habilidad. Trazo, no relleno. */
  ability: {
    viewBox: '0 0 16 16',
    stroke: true,
    paths: [
      'M8.00016 14.6667C11.6822 14.6667 14.6668 11.682 14.6668 8.00004C14.6668 4.31804 11.6822 1.33337 8.00016 1.33337C4.31816 1.33337 1.3335 4.31804 1.3335 8.00004C1.3335 11.682 4.31816 14.6667 8.00016 14.6667Z',
      'M8.00024 9.99976C8.53068 9.99976 9.03939 9.78904 9.41446 9.41397C9.78953 9.0389 10.0002 8.53019 10.0002 7.99976C10.0002 7.46932 9.78953 6.96061 9.41446 6.58554C9.03939 6.21047 8.53068 5.99976 8.00024 5.99976C7.46981 5.99976 6.9611 6.21047 6.58603 6.58554C6.21096 6.96061 6.00024 7.46932 6.00024 7.99976C6.00024 8.53019 6.21096 9.0389 6.58603 9.41397C6.9611 9.78904 7.46981 9.99976 8.00024 9.99976Z',
      'M1.3335 7.99988H6.00016M10.0002 7.99988H14.6668',
    ],
  },
  /** Flecha vertical entre topes, para el atributo altura. */
  height: {
    viewBox: '0 0 11 13',
    stroke: false,
    paths: [
      'M10.375 11.3125H0.125C0.05625 11.3125 0 11.3687 0 11.4375L0 12.375C0 12.4438 0.05625 12.5 0.125 12.5H10.375C10.4438 12.5 10.5 12.4438 10.5 12.375V11.4375C10.5 11.3687 10.4438 11.3125 10.375 11.3125ZM10.375 0L0.125 0C0.05625 0 0 0.05625 0 0.125L0 1.0625C0 1.13125 0.05625 1.1875 0.125 1.1875L10.375 1.1875C10.4438 1.1875 10.5 1.13125 10.5 1.0625V0.125C10.5 0.05625 10.4438 0 10.375 0ZM6.79375 4.15625C6.8875 4.15625 6.94063 4.04688 6.88281 3.97344L5.30781 1.97969C5.29739 1.9662 5.28401 1.95527 5.26871 1.94776C5.2534 1.94024 5.23658 1.93634 5.21953 1.93634C5.20248 1.93634 5.18566 1.94024 5.17036 1.94776C5.15505 1.95527 5.14167 1.9662 5.13125 1.97969L3.55625 3.97344C3.54313 3.99012 3.53497 4.01016 3.53271 4.03126C3.53046 4.05237 3.53419 4.07368 3.54348 4.09276C3.55278 4.11184 3.56726 4.12791 3.58527 4.13914C3.60328 4.15037 3.62409 4.1563 3.64531 4.15625H4.6875L4.6875 8.34375H3.70625C3.6125 8.34375 3.55938 8.45312 3.61719 8.52656L5.19219 10.5188C5.2375 10.5766 5.325 10.5766 5.36875 10.5188L6.94375 8.52656C7.00156 8.45312 6.95 8.34375 6.85469 8.34375H5.8125L5.8125 4.15625H6.79375Z',
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

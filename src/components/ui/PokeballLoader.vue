<script setup lang="ts">
/**
 * Pantalla de carga (F5).
 *
 * El enunciado pide "cualquier efecto css sobre la imagen de la pokebola", así
 * que la animación es CSS puro: dos `@keyframes` y ninguna dependencia. Un GIF
 * o una librería de animación serían responder otra cosa.
 *
 * El SVG va inline y no como `<img>`: desde un `<img>` el CSS no alcanza el
 * botón central, y encenderlo aparte del resto de la bola es justo el efecto.
 * Mismo criterio que FavoriteStar y AppNav.
 *
 * Dos diferencias con el export del Figma, las dos a propósito:
 *
 *  - La mitad roja era un `<mask>` con `id`. Un id dentro de un componente que
 *    puede montarse dos veces choca consigo mismo, y el resultado depende de
 *    cuál se pintó último. Acá es un `<path>` de media circunferencia: mismo
 *    dibujo, sin identificadores globales.
 *  - Hay un círculo de halo que el Figma no tiene. Es lo que da el destello de
 *    "capturado" sin tocar `filter`, que en SVG es caro de animar.
 *
 * El texto es visible y no `sr-only` a propósito: con `prefers-reduced-motion`
 * la animación queda congelada (regla global en main.scss), y si la única señal
 * de carga fuera el movimiento, para esa persona la pantalla no diría nada.
 */

withDefaults(defineProps<{ label?: string }>(), {
  label: 'Cargando Pokémon…',
})
</script>

<template>
  <div class="pokeball-loader" role="status">
    <!--
      `role="status"` arriba y no `alert`: cargar no es un error. Anuncia sin
      interrumpir lo que el lector de pantalla esté leyendo.

      El comentario va acá adentro y no antes del <div>: un nodo suelto arriba
      convierte al componente en un fragmento de varias raíces, y entonces la
      clase que le pase el padre no tiene dónde caer y Vue la descarta.
    -->
    <svg
      class="pokeball-loader__ball"
      viewBox="0 0 155 155"
      width="120"
      height="120"
      fill="none"
      aria-hidden="true"
    >
      <!-- Cuerpo blanco: es la mitad de abajo, y el fondo de la de arriba. -->
      <circle cx="77.5" cy="77.5" r="75.5" fill="#FFFFFF" />

      <!-- Media circunferencia superior. Reemplaza al <mask> del export. -->
      <path d="M2 77.5A75.5 75.5 0 0 1 153 77.5Z" fill="#F22539" />

      <circle cx="77.5" cy="77.5" r="75.5" stroke="#333333" stroke-width="4" />
      <path d="M0.574066 77.5H154.426" stroke="#333333" stroke-width="4" />

      <!--
        Halo del destello. Va DEBAJO del botón para que crezca por detrás: si
        fuera encima, taparía el botón justo cuando se enciende.
      -->
      <circle class="pokeball-loader__glow" cx="77.5" cy="77.5" r="30.4259" fill="#F22539" />

      <circle class="pokeball-loader__button" cx="77.5" cy="77.5" r="30.4259" fill="#FFFFFF" />
      <circle cx="77.5" cy="77.5" r="28.4259" stroke="#333333" stroke-width="4" />

      <!-- Brillo del Figma: fija de dónde viene la luz. -->
      <path
        d="M134.135 53.6759C127.129 37.0413 113.008 24.1388 95.5833 18.7791"
        stroke="white"
        stroke-width="4"
        stroke-linecap="round"
        stroke-linejoin="round"
      />

      <circle cx="77.5" cy="77.5" r="15.6481" stroke="#808080" stroke-width="2" />
    </svg>

    <p class="pokeball-loader__label">{{ label }}</p>
  </div>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

/*
 * Un solo ciclo para las dos animaciones: si tuvieran duraciones distintas se
 * irían desfasando y el destello caería a veces en plena sacudida.
 */
$cycle: 2.4s;

.pokeball-loader {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
  padding: var(--sp-6);

  &__ball {
    /*
     * El pivote va en la BASE, no en el centro. Rotando desde el centro parece
     * un volante girando; desde abajo parece apoyada y sacudiéndose, que es lo
     * que hace la pokebola de verdad.
     */
    transform-origin: 50% 100%;
    animation: pokeball-shake $cycle ease-in-out infinite;
  }

  &__glow {
    /*
     * `transform-box: fill-box` hace que el origen sea el centro del círculo y
     * no el del viewBox. Sin esto, escalar lo manda a la esquina.
     */
    transform-box: fill-box;
    transform-origin: center;
    opacity: 0;
    animation: pokeball-capture $cycle ease-out infinite;
  }

  &__button {
    animation: pokeball-button $cycle ease-out infinite;
  }

  &__label {
    margin: 0;
    color: var(--c-text-muted);
    text-align: center;
  }
}

/*
 * Ritmo de captura: tres sacudidas y una pausa. La pausa no es adorno — es lo
 * que hace que el destello se lea como un evento y no como un parpadeo más.
 * Por eso los tramos 50%-100% repiten el mismo valor: son tiempo muerto escrito
 * dentro de los keyframes.
 */
@keyframes pokeball-shake {
  0%,
  50%,
  100% {
    transform: translateX(0) rotate(0deg);
  }

  10% {
    transform: translateX(-9px) rotate(-14deg);
  }

  20% {
    transform: translateX(9px) rotate(14deg);
  }

  30% {
    transform: translateX(-9px) rotate(-14deg);
  }

  40% {
    transform: translateX(9px) rotate(14deg);
  }
}

/* Cae en la pausa, no durante el temblor. */
@keyframes pokeball-capture {
  0%,
  55%,
  100% {
    opacity: 0;
    transform: scale(1);
  }

  65% {
    opacity: 0.55;
    transform: scale(1.05);
  }

  85% {
    opacity: 0;
    transform: scale(1.7);
  }
}

@keyframes pokeball-button {
  0%,
  55%,
  100% {
    fill: #ffffff;
  }

  62%,
  72% {
    fill: #f22539;
  }
}
</style>

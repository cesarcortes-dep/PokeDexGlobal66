<script setup lang="ts">
// El SVG va inline y no como `<img>`: desde un `<img>` el CSS no alcanza el
// botón central, y encenderlo aparte del resto de la bola es el efecto.
//
// El texto es visible y no `sr-only`: `prefers-reduced-motion` congela la
// animación, y sin texto para esa persona la pantalla no diría nada.

withDefaults(defineProps<{ label?: string }>(), {
  label: 'Cargando Pokémon…',
})
</script>

<template>
  <div class="pokeball-loader" role="status">
    <!-- Ojo: un comentario antes del <div> raíz lo convierte en un fragmento
         de varias raíces, y Vue descarta la clase que pase el padre. -->
    <svg
      class="pokeball-loader__ball"
      viewBox="0 0 155 155"
      width="120"
      height="120"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="77.5" cy="77.5" r="75.5" fill="#FFFFFF" />

      <!-- Reemplaza al <mask id> del export: un id global chocaría consigo mismo. -->
      <path d="M2 77.5A75.5 75.5 0 0 1 153 77.5Z" fill="#F22539" />

      <circle cx="77.5" cy="77.5" r="75.5" stroke="#333333" stroke-width="4" />
      <path d="M0.574066 77.5H154.426" stroke="#333333" stroke-width="4" />

      <!-- Debajo del botón, para que el halo crezca por detrás y no lo tape. -->
      <circle class="pokeball-loader__glow" cx="77.5" cy="77.5" r="30.4259" fill="#F22539" />

      <circle class="pokeball-loader__button" cx="77.5" cy="77.5" r="30.4259" fill="#FFFFFF" />
      <circle cx="77.5" cy="77.5" r="28.4259" stroke="#333333" stroke-width="4" />

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

// Un solo ciclo para las dos animaciones: con duraciones distintas se irían
// desfasando y el destello caería en plena sacudida.
$cycle: 2.4s;

.pokeball-loader {
  display: grid;
  gap: var(--sp-4);
  justify-items: center;
  padding: var(--sp-6);

  &__ball {
    // El pivote en la base y no en el centro: desde el centro parece un volante
    // girando; desde abajo, una bola apoyada que se sacude.
    transform-origin: 50% 100%;
    animation: pokeball-shake $cycle ease-in-out infinite;
  }

  &__glow {
    // Sin `fill-box` el origen es el del viewBox y escalar lo manda a la esquina.
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

// Tres sacudidas y una pausa. Los tramos 50%-100% repiten valor a propósito:
// son el tiempo muerto que hace que el destello se lea como un evento.
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

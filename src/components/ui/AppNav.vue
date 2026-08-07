<script setup lang="ts">
/**
 * Navegación principal (D2, README: adaptación a desktop).
 *
 * El Figma la dibuja como barra inferior, que es un patrón de pulgar: en un
 * teléfono el dedo llega abajo y no arriba. En escritorio no hay pulgar, hay
 * puntero, y una barra pegada al borde inferior de una ventana de 1440 px queda
 * lejos de todo. Por eso sube arriba, y comparte fila con el buscador para no
 * gastar una banda entera de altura en dos controles que entran en una.
 *
 * Presentación pura salvo por `RouterLink`, que no es dato ni estado: es la
 * navegación misma. Lo que no hace es decidir a dónde va — las rutas llegan por
 * props.
 *
 * Solo dos pestañas. El Figma tiene cuatro (Pokedex, Regiones, favoritos,
 * Perfil), pero regiones y perfil no existen como funcionalidad: no están en el
 * enunciado y no hay datos detrás. Dos pestañas muertas se leen como app rota,
 * no como fidelidad al diseño.
 */

import { RouterLink } from 'vue-router'

defineProps<{
  items: Array<{ to: string; label: string; icon: 'home' | 'favorites' }>
}>()

const ICONS = {
  home: {
    viewBox: '0 0 18 16',
    path: 'M17.9906 7.98438C17.9906 8.54688 17.5219 8.9875 16.9906 8.9875H15.9906L16.0125 13.9937C16.0125 14.0781 16.0062 14.1625 15.9969 14.2469V14.7531C15.9969 15.4438 15.4375 16.0031 14.7469 16.0031H14.2469C14.2125 16.0031 14.1781 16.0031 14.1438 16C14.1 16.0031 14.0562 16.0031 14.0125 16.0031L12.9969 16H12.2469C11.5562 16 10.9969 15.4406 10.9969 14.75V14V12C10.9969 11.4469 10.55 11 9.99687 11H7.99687C7.44375 11 6.99687 11.4469 6.99687 12V14V14.75C6.99687 15.4406 6.4375 16 5.74687 16H4.99687H4C3.95312 16 3.90625 15.9969 3.85938 15.9937C3.82187 15.9969 3.78438 16 3.74688 16H3.24688C2.55625 16 1.99688 15.4406 1.99688 14.75V11.25C1.99688 11.2219 1.99687 11.1906 2 11.1625V8.98438H1C0.4375 8.98438 0 8.54687 0 7.98125C0 7.7 0.09375 7.45 0.3125 7.23125L8.32187 0.25C8.54062 0.03125 8.79062 0 9.00937 0C9.22812 0 9.47812 0.0625 9.66562 0.21875L17.6469 7.23438C17.8969 7.45312 18.0219 7.70312 17.9906 7.98438Z',
  },
  favorites: {
    viewBox: '0 0 16 14',
    path: 'M1.4875 8.07028L7.13438 13.3422C7.36875 13.5609 7.67812 13.6828 8 13.6828C8.32188 13.6828 8.63125 13.5609 8.86563 13.3422L14.5125 8.07028C15.4625 7.18591 16 5.94528 16 4.64841V4.46716C16 2.28278 14.4219 0.420285 12.2688 0.0609095C10.8438 -0.17659 9.39375 0.289035 8.375 1.30778L8 1.68278L7.625 1.30778C6.60625 0.289035 5.15625 -0.17659 3.73125 0.0609095C1.57812 0.420285 0 2.28278 0 4.46716V4.64841C0 5.94528 0.5375 7.18591 1.4875 8.07028Z',
  },
} as const

const icons = ICONS
</script>

<template>
  <nav class="app-nav" aria-label="Navegación principal">
    <ul class="app-nav__list">
      <li v-for="item in items" :key="item.to">
        <!--
          `RouterLink` marca la ruta activa con `router-link-active`, pero eso es
          una clase y no llega a un lector de pantalla. `aria-current="page"` sí.
        -->
        <RouterLink v-slot="{ isActive, href, navigate }" :to="item.to" custom>
          <a
            class="app-nav__item"
            :class="{ 'app-nav__item--active': isActive }"
            :href="href"
            :aria-current="isActive ? 'page' : undefined"
            @click="navigate"
          >
            <svg
              class="app-nav__icon"
              :viewBox="icons[item.icon].viewBox"
              width="22"
              height="22"
              aria-hidden="true"
            >
              <path :d="icons[item.icon].path" fill="currentColor" />
            </svg>
            {{ item.label }}
          </a>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>

<style scoped lang="scss">
@use '@/styles/mixins' as *;

.app-nav {
  &__list {
    display: flex;
    gap: var(--sp-2);
    padding: 0;
    margin: 0;
    list-style: none;
  }

  &__item {
    display: flex;
    gap: var(--sp-2);
    align-items: center;
    padding: var(--sp-3) var(--sp-4);
    font-size: var(--fs-body);
    color: var(--c-text-muted);
    text-decoration: none;
    white-space: nowrap;
    border-radius: var(--radius-pill);

    &--active {
      font-weight: 600;
      color: var(--c-tab-active);
    }

    &:focus-visible {
      outline: 2px solid var(--c-tab-active);
      outline-offset: -2px;
    }
  }
}
</style>

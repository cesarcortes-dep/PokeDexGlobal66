/**
 * Tests de `PokeballLoader` (F5, E5).
 *
 * No tiene sentido testear que la animación "se ve bien" —eso se mira en el
 * navegador—, así que acá van las dos cosas que se rompen en silencio:
 *
 *  1. Que el SVG no vuelva a traer un `id`. El export del Figma usaba un
 *     `<mask id="mask0_9_835">`, y un id dentro de un componente montado dos
 *     veces choca consigo mismo: el navegador no avisa, simplemente pinta mal.
 *  2. Que el texto siga siendo visible. Con `prefers-reduced-motion` la
 *     animación queda congelada por la regla global de main.scss; si la única
 *     señal de carga fuera el movimiento, esa persona no vería nada. Un
 *     `sr-only` acá sería una regresión de accesibilidad invisible en revisión.
 */

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PokeballLoader from '../PokeballLoader.vue'

describe('PokeballLoader', () => {
  it('no declara ids en el SVG, así que puede montarse más de una vez', () => {
    const wrapper = mount(PokeballLoader)

    expect(wrapper.find('svg').html()).not.toContain('id=')
  })

  it('anuncia la carga con texto y no solo con la animación', () => {
    const wrapper = mount(PokeballLoader)

    const label = wrapper.find('.pokeball-loader__label')
    expect(label.exists()).toBe(true)
    expect(label.text()).toBe('Cargando Pokémon…')
    expect(wrapper.attributes('role')).toBe('status')
  })

  it('deja el SVG fuera del árbol de accesibilidad para no leerlo dos veces', () => {
    const wrapper = mount(PokeballLoader)

    expect(wrapper.find('svg').attributes('aria-hidden')).toBe('true')
  })

  it('acepta otro texto para reusarlo en otras esperas', () => {
    const wrapper = mount(PokeballLoader, { props: { label: 'Buscando…' } })

    expect(wrapper.find('.pokeball-loader__label').text()).toBe('Buscando…')
  })
})

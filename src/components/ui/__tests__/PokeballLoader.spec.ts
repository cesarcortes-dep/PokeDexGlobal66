// Que la animación se vea bien se mira en el navegador. Acá van las dos cosas
// que se rompen en silencio: un `id` duplicado en el SVG y el texto de carga
// volviéndose invisible.

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

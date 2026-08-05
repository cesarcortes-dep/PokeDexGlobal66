/**
 * Tests de la pantalla principal (E5).
 *
 * Es el test que sostiene E7 de punta a punta: con el universo completo cargado,
 * cuenta cuántas filas hay **realmente en el DOM**. La afirmación "pienso en gran
 * cantidad de data" deja de ser una frase del README y pasa a ser un número que
 * falla si alguien saca el virtual scroll.
 *
 * La capa de red se mockea entera: la view no debe saber que existe.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import ListView from '../ListView.vue'
import { PokeApiError } from '@/api/pokeApi'

const { fetchPokemonListMock } = vi.hoisted(() => ({ fetchPokemonListMock: vi.fn() }))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchPokemonList: fetchPokemonListMock,
}))

/** El universo real medido contra la PokéAPI el 2026-08-05. */
const TOTAL_POKEMON = 1351
const VIEWPORT_HEIGHT = 600

function makeList(n: number) {
  return Array.from({ length: n }, (_, i) => ({
    name: `pokemon-${i}`,
    url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
  }))
}

function mountView() {
  return mount(ListView, { attachTo: document.body })
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemonListMock.mockReset()
  fetchPokemonListMock.mockResolvedValue(makeList(TOTAL_POKEMON))

  // jsdom no hace layout: sin esto el viewport mide 0 y no entra ninguna fila.
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: VIEWPORT_HEIGHT,
  })
})

describe('ListView', () => {
  it('pide el listado al montar', async () => {
    mountView()
    await flushPromises()

    expect(fetchPokemonListMock).toHaveBeenCalledTimes(1)
  })

  it('muestra el estado de carga mientras la request está en vuelo', () => {
    const wrapper = mountView()

    expect(wrapper.find('[role="status"]').exists()).toBe(true)
  })

  it('renderiza los nombres del listado', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.text()).toContain('pokemon-0')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('con 1351 Pokémon deja menos de 30 filas en el DOM (E7)', async () => {
    const wrapper = mountView()
    await flushPromises()

    const rows = wrapper.findAll('.pokemon-row')
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.length).toBeLessThan(30)
  })

  it('expone el tamaño real de la lista a lectores de pantalla', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.pokemon-row').attributes('aria-setsize')).toBe(String(TOTAL_POKEMON))
  })

  it('muestra el error y deja reintentar', async () => {
    fetchPokemonListMock.mockRejectedValueOnce(new PokeApiError('La PokéAPI respondió 500', 500))
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toContain('La PokéAPI respondió 500')

    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()

    expect(fetchPokemonListMock).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('pokemon-0')
  })
})

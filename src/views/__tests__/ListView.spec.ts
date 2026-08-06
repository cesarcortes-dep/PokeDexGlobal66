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
import {
  DEBOUNCE_MS,
  ROW_HEIGHT,
  TOTAL_POKEMON,
  makeListItems,
  makeTestRouter,
  stubViewportHeight,
} from '@/__tests__/fixtures'

const { fetchPokemonListMock } = vi.hoisted(() => ({ fetchPokemonListMock: vi.fn() }))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchPokemonList: fetchPokemonListMock,
}))

function mountView() {
  return mount(ListView, {
    attachTo: document.body,
    global: { plugins: [makeTestRouter()] },
  })
}

/** Escribe en el input y deja pasar la ventana de debounce. */
async function search(wrapper: ReturnType<typeof mountView>, text: string) {
  vi.useFakeTimers()
  await wrapper.find('input[type="search"]').setValue(text)
  vi.advanceTimersByTime(DEBOUNCE_MS)
  vi.useRealTimers()
  await flushPromises()
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemonListMock.mockReset()
  fetchPokemonListMock.mockResolvedValue(makeListItems(TOTAL_POKEMON))
  stubViewportHeight()
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

  it('cada fila enlaza al detalle de ese Pokémon (F4)', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('a').attributes('href')).toBe('/pokemon/pokemon-0')
  })

  describe('búsqueda (F8)', () => {
    it('filtra la lista sin pedir nada a la red', async () => {
      const wrapper = mountView()
      await flushPromises()

      // El último de la lista: cualquier otro nombre sería prefijo de varios
      // (buscar "pokemon-42" matchea también 420…429, y está bien que así sea).
      await search(wrapper, `pokemon-${TOTAL_POKEMON - 1}`)

      expect(wrapper.findAll('.pokemon-row')).toHaveLength(1)
      expect(wrapper.text()).toContain(`pokemon-${TOTAL_POKEMON - 1}`)
      // Lo que sostiene F3: buscar no vuelve a la API.
      expect(fetchPokemonListMock).toHaveBeenCalledTimes(1)
    })

    it('muestra el estado vacío cuando no hay coincidencias', async () => {
      const wrapper = mountView()
      await flushPromises()

      await search(wrapper, 'no-existe-este-pokemon')

      expect(wrapper.findAll('.pokemon-row')).toHaveLength(0)
      expect(wrapper.text()).toContain('No encontramos')
    })

    it('borrar la búsqueda devuelve el listado completo', async () => {
      const wrapper = mountView()
      await flushPromises()

      await search(wrapper, `pokemon-${TOTAL_POKEMON - 1}`)
      await search(wrapper, '')

      expect(wrapper.find('.pokemon-row').attributes('aria-setsize')).toBe(String(TOTAL_POKEMON))
    })

    it('vuelve al principio de la lista al filtrar desde abajo', async () => {
      const wrapper = mountView()
      await flushPromises()

      const viewport = wrapper.find('.list-view__viewport').element
      viewport.scrollTop = 1300 * ROW_HEIGHT
      await wrapper.find('.list-view__viewport').trigger('scroll')

      await search(wrapper, 'pokemon-1')

      expect(viewport.scrollTop).toBe(0)
      expect(wrapper.find('.pokemon-row').text()).toBe('pokemon-1')
    })
  })

  describe('favoritos (F1)', () => {
    /** Marca como favorito el enésimo Pokémon visible. */
    async function star(wrapper: ReturnType<typeof mountView>, index = 0) {
      await wrapper.findAll('.favorite-star')[index]!.trigger('click')
    }

    async function showFavorites(wrapper: ReturnType<typeof mountView>) {
      await wrapper.findAll('.list-view__tab')[1]!.trigger('click')
    }

    it('cada fila ofrece marcar favorito', async () => {
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.find('.favorite-star').attributes('aria-pressed')).toBe('false')

      await star(wrapper)

      expect(wrapper.find('.favorite-star').attributes('aria-pressed')).toBe('true')
    })

    it('la pestaña Favoritos filtra a lo marcado', async () => {
      const wrapper = mountView()
      await flushPromises()

      await star(wrapper, 0)
      await star(wrapper, 2)
      await showFavorites(wrapper)

      const rows = wrapper.findAll('.pokemon-row')
      expect(rows).toHaveLength(2)
      expect(rows.map((r) => r.text())).toEqual(['pokemon-0', 'pokemon-2'])
    })

    it('sin favoritos muestra un mensaje propio, no "no encontramos"', async () => {
      const wrapper = mountView()
      await flushPromises()

      await showFavorites(wrapper)

      expect(wrapper.text()).toContain('Todavía no marcaste')
      expect(wrapper.text()).not.toContain('No encontramos')
    })

    it('desmarcar saca al Pokémon de la vista de favoritos', async () => {
      const wrapper = mountView()
      await flushPromises()

      await star(wrapper, 0)
      await showFavorites(wrapper)
      expect(wrapper.findAll('.pokemon-row')).toHaveLength(1)

      await star(wrapper, 0)

      expect(wrapper.findAll('.pokemon-row')).toHaveLength(0)
    })

    it('se puede buscar dentro de favoritos', async () => {
      const wrapper = mountView()
      await flushPromises()

      await star(wrapper, 0) // pokemon-0
      await star(wrapper, 1) // pokemon-1
      await showFavorites(wrapper)
      await search(wrapper, 'pokemon-1')

      expect(wrapper.findAll('.pokemon-row').map((r) => r.text())).toEqual(['pokemon-1'])
    })

    it('marcar favorito no dispara ninguna request', async () => {
      const wrapper = mountView()
      await flushPromises()

      await star(wrapper)

      expect(fetchPokemonListMock).toHaveBeenCalledTimes(1)
    })
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

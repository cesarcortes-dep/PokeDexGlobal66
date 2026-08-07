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
  stubViewportWidth,
} from '@/__tests__/fixtures'

const { fetchPokemonListMock } = vi.hoisted(() => ({ fetchPokemonListMock: vi.fn() }))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchPokemonList: fetchPokemonListMock,
}))

/**
 * `onlyFavorites` llega por props porque favoritos es una ruta propia
 * (`/favoritos`) y no un estado interno de la pantalla.
 */
function mountView(props: { onlyFavorites?: boolean } = {}) {
  return mount(ListView, {
    props,
    attachTo: document.body,
    global: { plugins: [makeTestRouter()] },
  })
}

/**
 * Nombres de las tarjetas visibles.
 *
 * Se lee el elemento del nombre y no el texto de la tarjeta entera: la tarjeta
 * también muestra el número y los chips de tipo, así que comparar contra
 * `.text()` mezclaría todo.
 */
function cardNames(wrapper: ReturnType<typeof mountView>): string[] {
  return wrapper.findAll('.pokemon-card__name').map((el) => el.text())
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
  stubViewportWidth(1024)
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

  /**
   * La evidencia de E7, medida en los dos layouts.
   *
   * Con la grilla de ADR-0005 el número **cambia con las columnas**: una fila de
   * escritorio son 3 tarjetas, así que cada unidad de overscan cuesta 3 nodos y
   * no 1. Medir solo en una columna y dar el número por válido para desktop sería
   * exactamente la afirmación sin respaldo que este proyecto evita.
   */
  describe.each([
    { ancho: 500, columnas: 1, tope: 20 },
    { ancho: 1000, columnas: 2, tope: 40 },
    { ancho: 1440, columnas: 3, tope: 60 },
  ])('con 1351 Pokémon y $columnas columna(s) (E7)', ({ ancho, columnas, tope }) => {
    it(`deja menos de ${tope} tarjetas en el DOM`, async () => {
      stubViewportWidth(ancho)
      const wrapper = mountView()
      await flushPromises()

      const cards = wrapper.findAll('.pokemon-card')
      expect(cards.length).toBeGreaterThan(0)
      expect(cards.length).toBeLessThan(tope)
      // Lo que importa no es el número exacto sino el orden de magnitud: son
      // decenas contra 1351, y sigue siendo múltiplo de las columnas.
      expect(cards.length % columnas).toBe(0)
    })
  })

  it('expone el tamaño real de la lista a lectores de pantalla', async () => {
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.pokemon-card').attributes('aria-setsize')).toBe(String(TOTAL_POKEMON))
  })

  it('cada fila enlaza al detalle de ese Pokémon (F4)', async () => {
    const wrapper = mountView()
    await flushPromises()

    // Se apunta al link de la tarjeta: `find('a')` traería el de la barra de
    // navegación, que ahora también es un <a> y aparece antes en el DOM.
    expect(wrapper.find('.list-view__link').attributes('href')).toBe('/pokemon/pokemon-0')
  })

  describe('búsqueda (F8)', () => {
    it('filtra la lista sin pedir nada a la red', async () => {
      const wrapper = mountView()
      await flushPromises()

      // El último de la lista: cualquier otro nombre sería prefijo de varios
      // (buscar "pokemon-42" matchea también 420…429, y está bien que así sea).
      await search(wrapper, `pokemon-${TOTAL_POKEMON - 1}`)

      expect(wrapper.findAll('.pokemon-card')).toHaveLength(1)
      expect(wrapper.text()).toContain(`pokemon-${TOTAL_POKEMON - 1}`)
      // Lo que sostiene F3: buscar no vuelve a la API.
      expect(fetchPokemonListMock).toHaveBeenCalledTimes(1)
    })

    it('muestra el estado vacío cuando no hay coincidencias', async () => {
      const wrapper = mountView()
      await flushPromises()

      await search(wrapper, 'no-existe-este-pokemon')

      expect(wrapper.findAll('.pokemon-card')).toHaveLength(0)
      expect(wrapper.text()).toContain('No encontramos')
    })

    it('borrar la búsqueda devuelve el listado completo', async () => {
      const wrapper = mountView()
      await flushPromises()

      await search(wrapper, `pokemon-${TOTAL_POKEMON - 1}`)
      await search(wrapper, '')

      expect(wrapper.find('.pokemon-card').attributes('aria-setsize')).toBe(String(TOTAL_POKEMON))
    })

    it('vuelve al principio de la lista al filtrar desde abajo', async () => {
      const wrapper = mountView()
      await flushPromises()

      const viewport = wrapper.find('.list-view__viewport').element
      viewport.scrollTop = 1300 * ROW_HEIGHT
      await wrapper.find('.list-view__viewport').trigger('scroll')

      await search(wrapper, 'pokemon-1')

      expect(viewport.scrollTop).toBe(0)
      expect(cardNames(wrapper)[0]).toBe('pokemon-1')
    })
  })

  describe('favoritos (F1)', () => {
    /** Marca como favorito el enésimo Pokémon visible. */
    async function star(wrapper: ReturnType<typeof mountView>, index = 0) {
      await wrapper.findAll('.favorite-star')[index]!.trigger('click')
    }

    it('cada fila ofrece marcar favorito', async () => {
      const wrapper = mountView()
      await flushPromises()

      expect(wrapper.find('.favorite-star').attributes('aria-pressed')).toBe('false')

      await star(wrapper)

      expect(wrapper.find('.favorite-star').attributes('aria-pressed')).toBe('true')
    })

    it('la vista de favoritos muestra solo lo marcado', async () => {
      const lista = mountView()
      await flushPromises()
      await star(lista, 0)
      await star(lista, 2)

      // Misma vista, otra ruta: el store de favoritos es compartido.
      const favoritos = mountView({ onlyFavorites: true })
      await flushPromises()

      expect(cardNames(favoritos)).toEqual(['pokemon-0', 'pokemon-2'])
    })

    it('sin favoritos muestra un mensaje propio, no "no encontramos"', async () => {
      const wrapper = mountView({ onlyFavorites: true })
      await flushPromises()

      expect(wrapper.text()).toContain('No has marcado')
      expect(wrapper.text()).not.toContain('No encontramos')
    })

    it('desmarcar saca al Pokémon de la vista de favoritos', async () => {
      const lista = mountView()
      await flushPromises()
      await star(lista, 0)

      const favoritos = mountView({ onlyFavorites: true })
      await flushPromises()
      expect(favoritos.findAll('.pokemon-card')).toHaveLength(1)

      await star(favoritos, 0)

      expect(favoritos.findAll('.pokemon-card')).toHaveLength(0)
    })

    it('se puede buscar dentro de favoritos', async () => {
      const lista = mountView()
      await flushPromises()
      await star(lista, 0) // pokemon-0
      await star(lista, 1) // pokemon-1

      const favoritos = mountView({ onlyFavorites: true })
      await flushPromises()
      await search(favoritos, 'pokemon-1')

      expect(cardNames(favoritos)).toEqual(['pokemon-1'])
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

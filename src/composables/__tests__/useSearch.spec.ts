/**
 * Tests de `useSearch` (E5, F8).
 *
 * El debounce se prueba con timers falsos: esperar 200 ms de reloj real en cada
 * caso sería medio segundo de suite por nada, y además haría los tests flaky.
 *
 * Se monta un componente mínimo porque el composable usa `onBeforeUnmount` para
 * limpiar su timer, y eso necesita una instancia viva.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { useSearch } from '../useSearch'
import type { PokemonListItem } from '@/api/types'

const DEBOUNCE_MS = 200

function makeItems(...names: string[]): PokemonListItem[] {
  return names.map((name, i) => ({
    name,
    url: `https://pokeapi.co/api/v2/pokemon/${i + 1}/`,
    id: i + 1,
  }))
}

/** Monta el composable y devuelve sus refs más el control del ciclo de vida. */
function setupSearch(items: PokemonListItem[]) {
  const source = ref(items)
  let api!: ReturnType<typeof useSearch>

  const Harness = defineComponent({
    setup() {
      api = useSearch(source)
      return () => h('div')
    },
  })

  const wrapper = mount(Harness)
  return { ...api, source, wrapper }
}

/** Escribe en el input y deja pasar la ventana de debounce. */
async function type(query: { value: string }, text: string) {
  query.value = text
  await nextTick()
  vi.advanceTimersByTime(DEBOUNCE_MS)
  await nextTick()
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useSearch', () => {
  it('sin query devuelve la lista completa', () => {
    const { results } = setupSearch(makeItems('bulbasaur', 'charmander'))

    expect(results.value).toHaveLength(2)
  })

  it('filtra por coincidencia parcial en cualquier parte del nombre', async () => {
    const { query, results } = setupSearch(makeItems('bulbasaur', 'charmander', 'charizard'))

    await type(query, 'char')

    expect(results.value.map((p) => p.name)).toEqual(['charmander', 'charizard'])
  })

  it('ignora mayúsculas y acentos', async () => {
    const { query, results } = setupSearch(makeItems('pikachu'))

    await type(query, 'PIKÁCHU')

    expect(results.value).toHaveLength(1)
  })

  it('ignora espacios sobrantes', async () => {
    const { query, results } = setupSearch(makeItems('pikachu', 'raichu'))

    await type(query, '  pika  ')

    expect(results.value.map((p) => p.name)).toEqual(['pikachu'])
  })

  it('no filtra hasta que pasa la ventana de debounce', async () => {
    const { query, results } = setupSearch(makeItems('bulbasaur', 'charmander'))

    query.value = 'char'
    await nextTick()
    expect(results.value).toHaveLength(2) // todavía sin filtrar

    vi.advanceTimersByTime(DEBOUNCE_MS)
    await nextTick()
    expect(results.value).toHaveLength(1)
  })

  it('escribir rápido filtra una sola vez, con el último texto', async () => {
    const { query, results } = setupSearch(makeItems('charmander', 'charizard'))

    // Nueve teclas dentro de la misma ventana: solo la última cuenta.
    for (const text of ['c', 'ch', 'cha', 'char', 'chari', 'chariz', 'charizard']) {
      query.value = text
      await nextTick()
      vi.advanceTimersByTime(50)
    }

    vi.advanceTimersByTime(DEBOUNCE_MS)
    await nextTick()

    expect(results.value.map((p) => p.name)).toEqual(['charizard'])
  })

  it('isEmpty distingue "no busqué" de "busqué y no hay"', async () => {
    const { query, results, isEmpty } = setupSearch(makeItems('bulbasaur'))

    expect(results.value).toHaveLength(1)
    expect(isEmpty.value).toBe(false) // sin query no es vacío, es todo

    await type(query, 'mewtwo')

    expect(results.value).toHaveLength(0)
    expect(isEmpty.value).toBe(true)
  })

  it('borrar la query devuelve la lista completa', async () => {
    const { query, results, isEmpty } = setupSearch(makeItems('bulbasaur', 'charmander'))

    await type(query, 'char')
    await type(query, '')

    expect(results.value).toHaveLength(2)
    expect(isEmpty.value).toBe(false)
  })

  it('reacciona a que la lista de origen se llene después', async () => {
    const { query, results, source } = setupSearch([])

    source.value = makeItems('bulbasaur', 'charmander')
    await type(query, 'char')

    expect(results.value.map((p) => p.name)).toEqual(['charmander'])
  })

  it('no deja timers colgados al desmontar', async () => {
    const { query, wrapper } = setupSearch(makeItems('bulbasaur'))

    query.value = 'bul'
    await nextTick()
    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})

/**
 * Tests del detalle (E5, F4).
 *
 * Lo que sostiene F4 no es que la pantalla pinte los datos —eso es lo fácil—
 * sino que **reabrir un Pokémon ya visto no dispare una request**. Eso se prueba
 * contando llamadas al cliente de API, que va mockeado entero.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import { createRouter, createWebHistory } from 'vue-router'
import DetailView from '../DetailView.vue'
import ListView from '../ListView.vue'
import { PokeApiError } from '@/api/pokeApi'

const { fetchPokemonListMock, fetchPokemonByNameMock } = vi.hoisted(() => ({
  fetchPokemonListMock: vi.fn(),
  fetchPokemonByNameMock: vi.fn(),
}))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchPokemonList: fetchPokemonListMock,
  fetchPokemonByName: fetchPokemonByNameMock,
}))

const PIKACHU = {
  id: 25,
  name: 'pikachu',
  height: 0.4,
  weight: 6,
  types: ['electric'],
  imageUrl: 'https://img/artwork.png',
}

function makeRouter() {
  return createRouter({
    history: createWebHistory(),
    routes: [
      { path: '/', name: 'list', component: ListView },
      { path: '/pokemon/:name', name: 'detail', component: DetailView, props: true },
    ],
  })
}

async function mountDetail(name = 'pikachu') {
  const router = makeRouter()
  await router.push({ name: 'detail', params: { name } })
  await router.isReady()

  const wrapper = mount(DetailView, {
    props: { name },
    global: { plugins: [router] },
  })
  await flushPromises()

  return { wrapper, router }
}

beforeEach(() => {
  setActivePinia(createPinia())
  fetchPokemonListMock.mockReset()
  fetchPokemonListMock.mockResolvedValue([])
  fetchPokemonByNameMock.mockReset()
  fetchPokemonByNameMock.mockResolvedValue(PIKACHU)
})

describe('DetailView', () => {
  it('pide el detalle del Pokémon de la ruta', async () => {
    await mountDetail('pikachu')

    expect(fetchPokemonByNameMock).toHaveBeenCalledWith('pikachu')
  })

  it('muestra los atributos ya convertidos a kg y metros', async () => {
    const { wrapper } = await mountDetail()

    expect(wrapper.text()).toContain('pikachu')
    expect(wrapper.text()).toContain('6 kg')
    expect(wrapper.text()).toContain('0.4 m')
    expect(wrapper.text()).toContain('electric')
  })

  it('usa el nombre como texto alternativo de la imagen', async () => {
    const { wrapper } = await mountDetail()

    const img = wrapper.find('img')
    expect(img.attributes('src')).toBe('https://img/artwork.png')
    expect(img.attributes('alt')).toBe('pikachu')
  })

  it('no rompe si el Pokémon no tiene imagen', async () => {
    fetchPokemonByNameMock.mockResolvedValue({ ...PIKACHU, imageUrl: null })
    const { wrapper } = await mountDetail()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.text()).toContain('pikachu')
  })

  it('reabrir un Pokémon ya visto no dispara request (F4)', async () => {
    const primera = await mountDetail('pikachu')
    primera.wrapper.unmount()

    await mountDetail('pikachu')

    expect(fetchPokemonByNameMock).toHaveBeenCalledTimes(1)
  })

  it('navegar a otro Pokémon recarga los datos', async () => {
    const { wrapper } = await mountDetail('pikachu')

    fetchPokemonByNameMock.mockResolvedValue({ ...PIKACHU, name: 'raichu', weight: 30 })
    await wrapper.setProps({ name: 'raichu' })
    await flushPromises()

    expect(wrapper.text()).toContain('raichu')
    expect(wrapper.text()).toContain('30 kg')
  })

  it('un 404 se muestra como "no existe", no como error de red', async () => {
    fetchPokemonByNameMock.mockRejectedValue(new PokeApiError('404', 404))
    const { wrapper } = await mountDetail('missingno')

    expect(wrapper.find('[role="alert"]').text()).toContain('No existe')
  })

  it('una caída de red se muestra distinta a un 404', async () => {
    fetchPokemonByNameMock.mockRejectedValue(new PokeApiError('sin red'))
    const { wrapper } = await mountDetail('pikachu')

    expect(wrapper.find('[role="alert"]').text()).toContain('conexión')
  })

  it('ofrece volver al listado', async () => {
    const { wrapper } = await mountDetail()

    expect(wrapper.find('a').attributes('href')).toBe('/')
  })
})

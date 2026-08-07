// Lo que importa no es que la pantalla pinte los datos, sino que reabrir un
// Pokémon ya visto no dispare una request.

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { flushPromises, mount } from '@vue/test-utils'
import DetailView from '../DetailView.vue'
import { PokeApiError } from '@/api/pokeApi'
import { useFavoritesStore } from '@/stores/favorites'
import { PIKACHU, makeTestRouter } from '@/__tests__/fixtures'

const { fetchPokemonListMock, fetchPokemonByNameMock } = vi.hoisted(() => ({
  fetchPokemonListMock: vi.fn(),
  fetchPokemonByNameMock: vi.fn(),
}))

vi.mock('@/api/pokeApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/pokeApi')>()),
  fetchPokemonList: fetchPokemonListMock,
  fetchPokemonByName: fetchPokemonByNameMock,
}))

async function mountDetail(name = 'pikachu', query: Record<string, string> = {}) {
  const router = makeTestRouter()
  await router.push({ name: 'detail', params: { name }, query })
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
    // El chip muestra la etiqueta en español del Figma, no el nombre de la API.
    expect(wrapper.text()).toContain('Eléctrico')
  })

  it('muestra la habilidad', async () => {
    const { wrapper } = await mountDetail()

    expect(wrapper.text()).toContain('HABILIDAD')
    expect(wrapper.text()).toContain('static')
  })

  describe('compartir (F6)', () => {
    it('copia nombre y atributos separados por coma', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      vi.stubGlobal('navigator', { clipboard: { writeText } })

      const { wrapper } = await mountDetail()
      await wrapper.find('.detail-view__share').trigger('click')

      // Copia lo que se ve en pantalla, no lo que devuelve la API: nombre
      // capitalizado, tipos en español y unidades incluidas.
      expect(writeText).toHaveBeenCalledWith('Pikachu,6 kg,0.4 m,Eléctrico')
      vi.unstubAllGlobals()
    })

    it('confirma al usuario que copió', async () => {
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })

      const { wrapper } = await mountDetail()
      expect(wrapper.find('.detail-view__share').text()).toBe('Copiar atributos')

      await wrapper.find('.detail-view__share').trigger('click')
      await flushPromises()

      expect(wrapper.find('.detail-view__share').text()).toContain('Copiado')
      vi.unstubAllGlobals()
    })
  })

  it('usa el nombre como texto alternativo de la imagen', async () => {
    const { wrapper } = await mountDetail()

    // Se apunta al sprite: `find('img')` traería el marco del Pokédex, que es
    // decorativo y aparece antes en el DOM.
    const img = wrapper.find('.detail-view__image')
    expect(img.attributes('src')).toBe('https://img/artwork.png')
    expect(img.attributes('alt')).toBe('pikachu')
  })

  it('no rompe si el Pokémon no tiene imagen', async () => {
    fetchPokemonByNameMock.mockResolvedValue({ ...PIKACHU, imageUrl: null })
    const { wrapper } = await mountDetail()

    expect(wrapper.find('.detail-view__image').exists()).toBe(false)
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

  describe('volver', () => {
    it('vuelve al listado por defecto', async () => {
      const { wrapper } = await mountDetail()

      expect(wrapper.find('.detail-view__back').attributes('href')).toBe('/')
    })

    it('vuelve a favoritos si vino de ahí', async () => {
      // El origen viaja en la query y no en el historial: si alguien abre la URL
      // del detalle directo, `router.back()` lo sacaría de la aplicación.
      const { wrapper } = await mountDetail('pikachu', { desde: 'favoritos' })

      expect(wrapper.find('.detail-view__back').attributes('href')).toBe('/favoritos')
    })
  })

  describe('favoritos (F1)', () => {
    it('permite marcar desde el detalle', async () => {
      const { wrapper } = await mountDetail()

      expect(wrapper.find('.favorite-star').attributes('aria-pressed')).toBe('false')

      await wrapper.find('.favorite-star').trigger('click')

      expect(wrapper.find('.favorite-star').attributes('aria-pressed')).toBe('true')
    })

    it('lo marcado en el detalle lo ve el store compartido', async () => {
      const { wrapper } = await mountDetail('pikachu')

      await wrapper.find('.favorite-star').trigger('click')

      // Sin ningún mecanismo de sincronización: hay una sola fuente de verdad.
      expect(useFavoritesStore().isFavorite('pikachu')).toBe(true)
    })

    it('refleja lo que ya estaba marcado en el listado', async () => {
      useFavoritesStore().toggle('pikachu')

      const { wrapper } = await mountDetail('pikachu')

      expect(wrapper.find('.favorite-star').attributes('aria-pressed')).toBe('true')
    })
  })
})

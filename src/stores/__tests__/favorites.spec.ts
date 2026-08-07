// No mockea nada: el store no toca la red ni depende del cliente de API.

import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useFavoritesStore } from '../favorites'

beforeEach(() => {
  setActivePinia(createPinia())
})

describe('favorites', () => {
  it('arranca vacío', () => {
    const favorites = useFavoritesStore()

    expect(favorites.count).toBe(0)
    expect(favorites.isFavorite('pikachu')).toBe(false)
  })

  it('toggle agrega y vuelve a quitar', () => {
    const favorites = useFavoritesStore()

    favorites.toggle('pikachu')
    expect(favorites.isFavorite('pikachu')).toBe(true)
    expect(favorites.count).toBe(1)

    favorites.toggle('pikachu')
    expect(favorites.isFavorite('pikachu')).toBe(false)
    expect(favorites.count).toBe(0)
  })

  it('mantiene varios favoritos independientes', () => {
    const favorites = useFavoritesStore()

    favorites.toggle('pikachu')
    favorites.toggle('bulbasaur')
    favorites.toggle('pikachu')

    expect(favorites.isFavorite('bulbasaur')).toBe(true)
    expect(favorites.isFavorite('pikachu')).toBe(false)
    expect(favorites.count).toBe(1)
  })

  it('no duplica si el mismo nombre entra dos veces', () => {
    const favorites = useFavoritesStore()

    favorites.names.add('pikachu')
    favorites.names.add('pikachu')

    expect(favorites.count).toBe(1)
  })

  it('guarda nombres, no entidades Pokémon (F7, DRY)', () => {
    const favorites = useFavoritesStore()

    favorites.toggle('pikachu')

    // Si esto fuera un array de objetos, la entidad viviría en dos stores a la
    // vez y habría que mantenerlos sincronizados.
    expect([...favorites.names]).toEqual(['pikachu'])
  })
})

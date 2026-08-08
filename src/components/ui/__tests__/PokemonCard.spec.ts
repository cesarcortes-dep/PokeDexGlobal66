// El sprite se deriva del id, y algunas formas alternativas no lo tienen. Lo que
// se prueba acá es que un 404 no deje el icono de imagen rota, y que el nodo
// reciclado por el virtual scroll no arrastre ese fallo al siguiente Pokémon.

import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import PokemonCard from '../PokemonCard.vue'

function mountCard(imageUrl = 'https://sprites/25.png') {
  return mount(PokemonCard, {
    props: { id: 25, name: 'pikachu', types: ['electric'], imageUrl },
  })
}

describe('PokemonCard', () => {
  it('esconde el sprite si la imagen no existe', async () => {
    const wrapper = mountCard()

    expect(wrapper.find('.pokemon-card__sprite').exists()).toBe(true)

    await wrapper.find('.pokemon-card__sprite').trigger('error')

    expect(wrapper.find('.pokemon-card__sprite').exists()).toBe(false)
    // La forma del tipo se queda: la tarjeta sigue teniendo identidad visual.
    expect(wrapper.find('.pokemon-card__shape').exists()).toBe(true)
  })

  it('vuelve a intentar cuando el nodo se recicla para otro Pokémon', async () => {
    const wrapper = mountCard()

    await wrapper.find('.pokemon-card__sprite').trigger('error')
    expect(wrapper.find('.pokemon-card__sprite').exists()).toBe(false)

    // Es lo que hace el virtual scroll al scrollear: mismo nodo, otras props.
    await wrapper.setProps({ id: 1, name: 'bulbasaur', imageUrl: 'https://sprites/1.png' })

    expect(wrapper.find('.pokemon-card__sprite').exists()).toBe(true)
  })
})

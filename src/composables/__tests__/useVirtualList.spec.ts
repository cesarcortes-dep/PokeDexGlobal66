// jsdom no hace layout, así que hay que falsear `clientHeight` y ejecutar
// `requestAnimationFrame` sincrónico: lo que se prueba es el cálculo de la
// ventana, no el scheduler del navegador.

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, nextTick, ref } from 'vue'
import { flushPromises, mount } from '@vue/test-utils'
import { useVirtualList } from '../useVirtualList'

const ITEM_HEIGHT = 60
const VIEWPORT_HEIGHT = 600
const OVERSCAN = 2

/** 10 filas entran en el viewport, más el colchón de arriba y abajo. */
const EXPECTED_WINDOW = VIEWPORT_HEIGHT / ITEM_HEIGHT + OVERSCAN * 2

function makeItems(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `item-${i}`)
}

/**
 * Componente de prueba: expone el composable y renderiza la ventana visible.
 *
 * Espera un flush a propósito. Virtualizar implica **medir el DOM para saber
 * cuántas filas entran**, y medir solo es posible después de montar: el primer
 * render sale con el viewport en cero y el segundo ya con la ventana real. En el
 * navegador es un frame; acá hay que esperarlo explícitamente.
 */
async function mountList(items: string[]) {
  const source = ref(items)

  const Harness = defineComponent({
    setup() {
      const { containerRef, visibleItems, totalHeight, offsetY } = useVirtualList(source, {
        itemHeight: ITEM_HEIGHT,
        overscan: OVERSCAN,
      })
      return { containerRef, visibleItems, totalHeight, offsetY }
    },
    render() {
      return h('div', { ref: 'containerRef', class: 'viewport' }, [
        h(
          'div',
          { class: 'sizer', style: { height: `${this.totalHeight}px` } },
          this.visibleItems.map(({ item, index }) =>
            h('p', { key: index, class: 'row' }, String(item)),
          ),
        ),
      ])
    },
  })

  const wrapper = mount(Harness, { attachTo: document.body })
  await flushPromises()
  return { wrapper, source }
}

/** Scrollea el contenedor y espera a que el composable recalcule. */
async function scrollTo(wrapper: Awaited<ReturnType<typeof mountList>>['wrapper'], top: number) {
  const el = wrapper.find('.viewport').element
  el.scrollTop = top
  await wrapper.find('.viewport').trigger('scroll')
  await nextTick()
}

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', {
    configurable: true,
    value: VIEWPORT_HEIGHT,
  })
  vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
    cb(0)
    return 1
  })
  vi.stubGlobal('cancelAnimationFrame', () => {})
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useVirtualList', () => {
  it('renderiza solo la ventana visible, no la lista entera (E7)', async () => {
    const { wrapper } = await mountList(makeItems(1351))

    expect(wrapper.findAll('.row')).toHaveLength(EXPECTED_WINDOW)
  })

  it('la cantidad de nodos no crece con el tamaño de la lista', async () => {
    const { wrapper: chica } = await mountList(makeItems(50))
    const { wrapper: enorme } = await mountList(makeItems(100_000))

    expect(chica.findAll('.row')).toHaveLength(EXPECTED_WINDOW)
    expect(enorme.findAll('.row')).toHaveLength(EXPECTED_WINDOW)
  })

  it('el sizer mide la lista completa para que la scrollbar sea real', async () => {
    const { wrapper } = await mountList(makeItems(1351))

    const sizer = wrapper.find('.sizer').element as HTMLElement
    expect(sizer.style.height).toBe(`${1351 * ITEM_HEIGHT}px`)
  })

  it('al scrollear cambia la ventana, con el índice real de cada ítem', async () => {
    const { wrapper } = await mountList(makeItems(1351))

    await scrollTo(wrapper, 100 * ITEM_HEIGHT)

    const rows = wrapper.findAll('.row')
    expect(rows).toHaveLength(EXPECTED_WINDOW)
    // 100 menos el overscan de arriba.
    expect(rows[0]?.text()).toBe(`item-${100 - OVERSCAN}`)
  })

  it('no scrollea por debajo de cero al arrancar', async () => {
    const { wrapper } = await mountList(makeItems(1351))

    expect(wrapper.find('.row').text()).toBe('item-0')
  })

  it('si la lista se achica de golpe no deja la pantalla en blanco', async () => {
    const { wrapper, source } = await mountList(makeItems(1351))

    await scrollTo(wrapper, 1300 * ITEM_HEIGHT) // scrollTop apuntando al fondo
    source.value = makeItems(3) // la búsqueda filtra a 3 resultados
    await nextTick()

    expect(wrapper.findAll('.row')).toHaveLength(3)
    expect(wrapper.find('.row').text()).toBe('item-0')
  })

  it('una lista más corta que el viewport se renderiza entera', async () => {
    const { wrapper } = await mountList(makeItems(4))

    expect(wrapper.findAll('.row')).toHaveLength(4)
  })

  it('suelta el listener de scroll al desmontar', async () => {
    const { wrapper } = await mountList(makeItems(10))
    const el = wrapper.find('.viewport').element
    const remove = vi.spyOn(el, 'removeEventListener')

    wrapper.unmount()

    expect(remove).toHaveBeenCalledWith('scroll', expect.any(Function))
  })
})

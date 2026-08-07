/**
 * Tests de `useMinimumDuration` (F5, E5).
 *
 * Lo que importa acá es que sostenga lo justo: ni menos —vuelve el parpadeo— ni
 * más —la app se siente lenta a cambio de nada—. Con timers falsos se puede
 * afirmar el milisegundo exacto en vez de esperar de verdad.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h, ref, type Ref } from 'vue'
import { mount } from '@vue/test-utils'
import { flushPromises } from '@vue/test-utils'
import { useMinimumDuration } from '../useMinimumDuration'

const MIN_MS = 600

/** Monta el composable dentro de un scope real, para que `onScopeDispose` corra. */
function setup(initial: boolean, minMs: number | Ref<number> = MIN_MS) {
  const source = ref(initial)
  let held!: Ref<boolean>

  const Harness = defineComponent({
    setup() {
      held = useMinimumDuration(source, minMs)
      return () => h('div')
    },
  })

  const wrapper = mount(Harness)

  return { source, get held() { return held }, wrapper }
}

describe('useMinimumDuration', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('arranca reflejando el valor de origen', () => {
    expect(setup(false).held.value).toBe(false)
    expect(setup(true).held.value).toBe(true)
  })

  it('sostiene la bandera cuando el origen se apaga antes del mínimo', async () => {
    const { source, held } = setup(true)

    vi.advanceTimersByTime(200)
    source.value = false
    await flushPromises()

    // Todavía no: pasaron 200 de 600 ms. Apagarlo acá es el parpadeo que se
    // quiere evitar.
    expect(held.value).toBe(true)

    vi.advanceTimersByTime(399)
    expect(held.value).toBe(true)

    vi.advanceTimersByTime(1)
    expect(held.value).toBe(false)
  })

  it('descuenta el tiempo ya transcurrido en vez de sumar el mínimo entero', async () => {
    const { source, held } = setup(true)

    vi.advanceTimersByTime(500)
    source.value = false
    await flushPromises()

    // Quedan 100 ms, no 600: el mínimo se cuenta desde que empezó la carga.
    vi.advanceTimersByTime(100)
    expect(held.value).toBe(false)
  })

  it('no sostiene nada si el origen ya duró más que el mínimo', async () => {
    const { source, held } = setup(true)

    vi.advanceTimersByTime(MIN_MS + 1)
    source.value = false
    await flushPromises()

    expect(held.value).toBe(false)
  })

  it('reinicia el conteo si vuelve a cargar antes de que expire el remanente', async () => {
    const { source, held } = setup(true)

    vi.advanceTimersByTime(100)
    source.value = false
    await flushPromises()

    // Segunda carga mientras el remanente de la primera sigue vivo. Si ese timer
    // no se cancelara, apagaría el loader a mitad de esta.
    source.value = true
    await flushPromises()

    vi.advanceTimersByTime(500)
    expect(held.value).toBe(true)

    source.value = false
    await flushPromises()
    vi.advanceTimersByTime(100)
    expect(held.value).toBe(false)
  })

  it('lee el mínimo cuando el origen se apaga, así puede ser reactivo', async () => {
    const minMs = ref(200)
    const { source, held } = setup(true, minMs)

    minMs.value = 1000
    vi.advanceTimersByTime(100)
    source.value = false
    await flushPromises()

    vi.advanceTimersByTime(500)
    expect(held.value).toBe(true)

    vi.advanceTimersByTime(400)
    expect(held.value).toBe(false)
  })

  it('cancela el timer al desmontar y no deja una fuga', async () => {
    const { source, wrapper } = setup(true)

    source.value = false
    await flushPromises()

    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})

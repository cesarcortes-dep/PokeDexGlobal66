/**
 * Tests de `useClipboard` (E5, F6).
 *
 * Lo que hay que probar acá no es el camino feliz —`navigator.clipboard` lo
 * resuelve solo— sino los dos que se rompen en producción: contexto no seguro
 * (sin HTTPS la API no existe) y permiso denegado por el usuario.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'
import { useClipboard } from '../useClipboard'

const FEEDBACK_MS = 2000

/** Monta el composable y devuelve sus refs. */
function setupClipboard() {
  let api!: ReturnType<typeof useClipboard>

  const Harness = defineComponent({
    setup() {
      api = useClipboard()
      return () => h('div')
    },
  })

  const wrapper = mount(Harness)
  return { ...api, wrapper }
}

/** Simula que no hay Clipboard API (contexto no seguro). */
function withoutClipboardApi() {
  vi.stubGlobal('navigator', {})
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })
  // jsdom no implementa execCommand: se declara y se controla por test.
  document.execCommand = vi.fn().mockReturnValue(true)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('useClipboard', () => {
  it('copia con la Clipboard API cuando está disponible', async () => {
    const { copy, copied } = setupClipboard()

    await copy('pikachu,6 kg,0.4 m,electric')

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('pikachu,6 kg,0.4 m,electric')
    expect(copied.value).toBe(true)
  })

  it('el feedback se apaga solo', async () => {
    const { copy, copied } = setupClipboard()

    await copy('pikachu')
    expect(copied.value).toBe(true)

    vi.advanceTimersByTime(FEEDBACK_MS)

    expect(copied.value).toBe(false)
  })

  it('cae al fallback si no hay Clipboard API (sin HTTPS)', async () => {
    withoutClipboardApi()
    const { copy, copied } = setupClipboard()

    await copy('pikachu')

    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(copied.value).toBe(true)
  })

  it('cae al fallback si el usuario negó el permiso', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('NotAllowedError')) },
    })
    const { copy, copied, failed } = setupClipboard()

    await copy('pikachu')

    expect(document.execCommand).toHaveBeenCalledWith('copy')
    expect(copied.value).toBe(true)
    expect(failed.value).toBe(false)
  })

  it('marca failed si fallan los dos caminos', async () => {
    withoutClipboardApi()
    document.execCommand = vi.fn().mockReturnValue(false)
    const { copy, copied, failed } = setupClipboard()

    await copy('pikachu')

    expect(copied.value).toBe(false)
    expect(failed.value).toBe(true)
  })

  it('no deja el textarea del fallback en el DOM', async () => {
    withoutClipboardApi()
    const { copy } = setupClipboard()

    await copy('pikachu')

    expect(document.querySelector('textarea')).toBeNull()
  })

  it('copiar de nuevo reinicia el temporizador del feedback', async () => {
    const { copy, copied } = setupClipboard()

    await copy('pikachu')
    vi.advanceTimersByTime(FEEDBACK_MS - 100)
    await copy('raichu')
    vi.advanceTimersByTime(FEEDBACK_MS - 100)

    // Si el primer timer siguiera vivo, acá ya estaría apagado.
    expect(copied.value).toBe(true)
  })

  it('no deja timers colgados al desmontar', async () => {
    const { copy, wrapper } = setupClipboard()

    await copy('pikachu')
    wrapper.unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})

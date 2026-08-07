import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

/**
 * Mantiene una bandera encendida un tiempo mínimo, aunque su origen se apague
 * antes. Sostiene lo que se muestra, no retrasa los datos.
 */
export function useMinimumDuration(
  source: Ref<boolean>,
  minMs: MaybeRefOrGetter<number>,
): Ref<boolean> {
  const held = ref(source.value)

  // Timestamps y no un contador: el `setTimeout` de una pestaña en segundo plano
  // se estira, y restar da el tiempo que pasó de verdad.
  let startedAt = source.value ? Date.now() : 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function clear(): void {
    if (timer === undefined) return
    clearTimeout(timer)
    timer = undefined
  }

  watch(source, (active) => {
    if (active) {
      // Cancela el remanente de la carga anterior, si quedaba alguno.
      clear()
      startedAt = Date.now()
      held.value = true
      return
    }

    const remaining = startedAt + toValue(minMs) - Date.now()

    if (remaining <= 0) {
      held.value = false
      return
    }

    clear()
    timer = setTimeout(() => {
      held.value = false
      timer = undefined
    }, remaining)
  })

  onScopeDispose(clear)

  return held
}

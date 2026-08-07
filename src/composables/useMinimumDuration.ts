import { onScopeDispose, ref, toValue, watch, type MaybeRefOrGetter, type Ref } from 'vue'

/**
 * Mantiene una bandera encendida un tiempo mínimo, aunque su origen se apague
 * antes (F5).
 *
 * El problema que resuelve no es estético. Cuando el listado responde en 250 ms,
 * el loader aparece y desaparece dentro del mismo pestañeo: no se lee como
 * "está cargando", se lee como un parpadeo raro. Sostenerlo un instante hace que
 * la transición tenga principio y fin.
 *
 * Lo que NO hace es retrasar los datos. La request sale igual de rápido y el
 * resultado se guarda apenas llega; lo único que se sostiene es lo que se
 * muestra. Demorar la request para que se vea el loader sería hacer la app peor
 * a cambio de una animación.
 *
 * El mínimo es un `MaybeRefOrGetter` a propósito: así puede venir de un
 * `computed` —por ejemplo, de un parámetro de URL para una demo— sin que este
 * composable sepa de dónde sale.
 */
export function useMinimumDuration(
  source: Ref<boolean>,
  minMs: MaybeRefOrGetter<number>,
): Ref<boolean> {
  const held = ref(source.value)

  /**
   * `Date.now()` y no un contador propio: el `setTimeout` de una pestaña en
   * segundo plano se estira, y restar timestamps da el tiempo real transcurrido
   * en vez del que el timer creía que iba a pasar.
   */
  let startedAt = source.value ? Date.now() : 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function clear(): void {
    if (timer === undefined) return
    clearTimeout(timer)
    timer = undefined
  }

  watch(source, (active) => {
    if (active) {
      // Una carga nueva cancela el remanente de la anterior: si no, dos cargas
      // seguidas apagarían el loader a mitad de la segunda.
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

  // Un timer vivo después de desmontar escribe sobre un ref que ya no mira
  // nadie. No rompe nada visible, pero es una fuga.
  onScopeDispose(clear)

  return held
}

/**
 * Virtual scrolling: renderiza solo la ventana visible.
 *
 * Lo que virtualiza son filas, no ítems, así que sirve igual para una lista y
 * para una grilla. Requiere alto de fila fijo.
 */

import { computed, onBeforeUnmount, onMounted, ref, toValue, watch } from 'vue'
import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'

export interface UseVirtualListOptions {
  /** Alto de cada fila en px, separación incluida. */
  itemHeight: number
  /** Filas extra arriba y abajo del viewport, para que no parpadee al scrollear. */
  overscan?: number
  /** Ítems por fila. Acepta un ref porque las columnas cambian al redimensionar. */
  itemsPerRow?: MaybeRefOrGetter<number>
}

export interface UseVirtualListReturn<T> {
  /** Se bindea al elemento con overflow-y: auto. */
  containerRef: Ref<HTMLElement | null>
  /** Solo los ítems a renderizar, con su índice real. */
  visibleItems: ComputedRef<Array<{ item: T; index: number }>>
  /** Alto total del contenido: items.length * itemHeight. Sostiene la scrollbar. */
  totalHeight: ComputedRef<number>
  /** translateY del bloque visible. */
  offsetY: ComputedRef<number>
}

export function useVirtualList<T>(
  items: Ref<T[]>,
  options: UseVirtualListOptions,
): UseVirtualListReturn<T> {
  const { itemHeight, overscan = 3 } = options

  const containerRef = ref<HTMLElement | null>(null)
  const scrollTop = ref(0)
  const viewportHeight = ref(0)

  // `scroll` dispara más seguido de lo que el navegador pinta: coalescer en un
  // rAF deja como mucho un recálculo por frame.
  let frame = 0
  function onScroll(): void {
    if (frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      scrollTop.value = containerRef.value?.scrollTop ?? 0
    })
  }

  function measureViewport(): void {
    viewportHeight.value = containerRef.value?.clientHeight ?? 0
  }

  // Por `watch` y no por `onMounted`: si el elemento está detrás de un `v-if`
  // todavía no existe al montar, y el listener no se ataría nunca.
  watch(containerRef, (el, previous) => {
    previous?.removeEventListener('scroll', onScroll)
    el?.addEventListener('scroll', onScroll, { passive: true })
    scrollTop.value = el?.scrollTop ?? 0
    measureViewport()
  })

  onMounted(() => window.addEventListener('resize', measureViewport))

  onBeforeUnmount(() => {
    if (frame) cancelAnimationFrame(frame)
    containerRef.value?.removeEventListener('scroll', onScroll)
    window.removeEventListener('resize', measureViewport)
  })

  // Nunca menos de una: un 0 haría dividir por cero al contar filas.
  const perRow = computed(() => Math.max(1, Math.floor(toValue(options.itemsPerRow ?? 1))))

  const rowCount = computed(() => Math.ceil(items.value.length / perRow.value))

  const visibleRows = computed(() => Math.ceil(viewportHeight.value / itemHeight) + overscan * 2)

  // El `Math.min` no es defensivo por gusto: al filtrar de 1350 a 3 el `scrollTop`
  // sigue apuntando al fondo viejo, y sin tope la pantalla queda en blanco.
  const startRow = computed(() => {
    const raw = Math.floor(scrollTop.value / itemHeight) - overscan
    const maxStart = Math.max(0, rowCount.value - visibleRows.value)
    return Math.min(Math.max(0, raw), maxStart)
  })

  const visibleItems = computed(() => {
    const from = startRow.value * perRow.value
    const to = from + visibleRows.value * perRow.value

    return items.value.slice(from, to).map((item, i) => ({ item, index: from + i }))
  })

  const totalHeight = computed(() => rowCount.value * itemHeight)
  const offsetY = computed(() => startRow.value * itemHeight)

  return { containerRef, visibleItems, totalHeight, offsetY }
}

// `navigator.clipboard` requiere contexto seguro: sin fallback, el botón muere
// en cualquier deploy sin TLS.

import { onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'

const FEEDBACK_MS = 2000

export interface UseClipboardReturn {
  /** true durante unos segundos después de copiar. */
  copied: Ref<boolean>
  /** true si ni la Clipboard API ni el fallback funcionaron. */
  failed: Ref<boolean>
  copy: (text: string) => Promise<void>
}

/**
 * `document.execCommand` está deprecado, pero es lo único que funciona sin HTTPS
 * y sigue soportado en todos lados.
 */
function copyWithFallback(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  // `readonly` y fuera de viewport: no abre el teclado en mobile ni salta el scroll.
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.top = '-9999px'

  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

export function useClipboard(): UseClipboardReturn {
  const copied = ref(false)
  const failed = ref(false)

  let timer: ReturnType<typeof setTimeout> | undefined

  onBeforeUnmount(() => clearTimeout(timer))

  async function copy(text: string): Promise<void> {
    clearTimeout(timer)
    failed.value = false

    let ok = false

    // La API puede existir y fallar igual si el usuario negó el permiso.
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text)
        ok = true
      } catch {
        ok = false
      }
    }

    if (!ok) ok = copyWithFallback(text)

    copied.value = ok
    failed.value = !ok

    if (ok) {
      timer = setTimeout(() => {
        copied.value = false
      }, FEEDBACK_MS)
    }
  }

  return { copied, failed, copy }
}

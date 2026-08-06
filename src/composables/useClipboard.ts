/**
 * Copiar al portapapeles (F6).
 *
 * Requisito literal: "El botón compartir debe copiar en el portapapeles el nombre
 * del pokemon con sus atributos separados por coma."
 *
 * Cuidado: `navigator.clipboard` requiere contexto seguro (https o localhost).
 * Hace falta fallback, si no el botón muere en cualquier deploy sin TLS.
 */

import { onBeforeUnmount, ref } from 'vue'
import type { Ref } from 'vue'

/** Cuánto dura el feedback visual de "copiado". */
const FEEDBACK_MS = 2000

export interface UseClipboardReturn {
  /** true durante ~2s después de copiar, para el feedback visual. */
  copied: Ref<boolean>
  /** true si ni la Clipboard API ni el fallback funcionaron. */
  failed: Ref<boolean>
  copy: (text: string) => Promise<void>
}

/**
 * Fallback para contexto no seguro: un `<textarea>` fuera de pantalla, se
 * selecciona y se copia con el comando viejo.
 *
 * `document.execCommand` está deprecado, pero es lo único que funciona sin HTTPS
 * y sigue soportado en todos los navegadores. Es exactamente el caso de uso que
 * justifica usar una API deprecada: la alternativa moderna no existe ahí.
 */
function copyWithFallback(text: string): boolean {
  const textarea = document.createElement('textarea')
  textarea.value = text
  // `readonly` y fuera de viewport para que no abra el teclado en mobile ni
  // haga saltar el scroll al enfocarlo.
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

    // `isSecureContext` no alcanza como único chequeo: la API puede existir y
    // fallar igual si el usuario negó el permiso.
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

    // El feedback se apaga solo. Si no, el botón queda diciendo "copiado" para
    // siempre y deja de significar algo.
    if (ok) {
      timer = setTimeout(() => {
        copied.value = false
      }, FEEDBACK_MS)
    }
  }

  return { copied, failed, copy }
}

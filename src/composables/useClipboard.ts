/**
 * Copiar al portapapeles (F6).
 *
 * Requisito literal: "El botón compartir debe copiar en el portapapeles el nombre
 * del pokemon con sus atributos separados por coma."
 *
 * TODO (supuesto S4): confirmar contra el Figma qué atributos y en qué orden.
 * Asumido por ahora: `name,weight,height,types`.
 *
 * Cuidado: `navigator.clipboard` requiere contexto seguro (https o localhost).
 * Hace falta fallback, si no el botón muere en cualquier deploy sin TLS.
 */

import type { Ref } from 'vue'

export interface UseClipboardReturn {
  /** true durante ~2s después de copiar, para el feedback visual. */
  copied: Ref<boolean>
  copy: (text: string) => Promise<void>
}

/**
 * TODO: implementar.
 * - usar navigator.clipboard.writeText si está disponible
 * - fallback con <textarea> + document.execCommand('copy')
 * - poner copied=true y resetear con setTimeout (limpiar el timer al desmontar)
 */
export function useClipboard(): UseClipboardReturn {
  throw new Error('TODO: implementar useClipboard()')
}

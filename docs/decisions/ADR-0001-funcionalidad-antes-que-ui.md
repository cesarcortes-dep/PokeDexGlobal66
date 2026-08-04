# ADR-0001 — Funcionalidad antes que UI

- **Fecha:** 2026-08-04
- **Estado:** Aceptada — enmendada por [ADR-0002](./ADR-0002-figma-desktop-primero-en-diseno.md)
  (la *decisión* de layout desktop se adelanta a una fase 0; la *implementación*
  visual sigue al final, como se decide acá)

## Contexto

Prueba técnica con alcance cerrado (enunciado con requisitos explícitos) y tiempo
limitado. El riesgo típico en este formato es invertir las horas en pulir la
interfaz y llegar con requisitos funcionales a medias — que es exactamente lo que
se evalúa primero.

La PokéAPI además impone su propia forma: paginación por `offset/limit`, datos del
Pokémon repartidos entre `/pokemon` y `/pokemon-species`, sin endpoint de búsqueda
por texto parcial. Descubrir esas restricciones tarde obliga a rehacer componentes
ya maquetados.

## Opciones consideradas

1. **UI primero (maquetar pantallas, luego cablear datos)**
   - Pros: entregable visible desde temprano; fácil de mostrar.
   - Contras: la forma real de los datos se descubre tarde y rompe la maqueta;
     alto riesgo de requisitos funcionales incompletos al cierre.

2. **Funcionalidad primero (capa de datos + estado + comportamiento, UI mínima)**
   - Pros: las restricciones de la API aparecen el día 1; cada requisito se puede
     marcar verificado antes de gastar tiempo en estética; el refinamiento visual
     es incremental y se puede cortar sin romper nada.
   - Contras: durante la primera fase la app se ve tosca.

3. **Vertical slices (una feature completa end-to-end a la vez)**
   - Pros: cada slice es demostrable.
   - Contras: decisiones transversales (estado global, caché, manejo de errores)
     se toman de a pedazos y se re-hacen en cada slice.

## Decisión

Opción 2. Fases:

1. **Capa de datos** — cliente de PokéAPI, tipos, manejo de errores y caché.
2. **Estado y comportamiento** — store, lista/paginación, búsqueda, detalle,
   favoritos, estados de carga y error. UI sin estilizar.
3. **Verificación** — cada requisito de `REQUIREMENTS.md` pasa a `[x]` corriendo
   la app.
4. **UI y animaciones** — recién aquí, sobre comportamiento ya congelado.

Las animaciones se tratan como requisito funcional, no como decorado: si el
enunciado las pide, entran en `REQUIREMENTS.md` con ítem verificable propio, pero
se implementan en fase 4 sobre transiciones de estado que ya existen.

## Consecuencias

- Fácil: cortar alcance visual sin comprometer la entrega; refactorizar la UI sin
  tocar lógica (queda separada por construcción).
- Caro: no hay demo bonita hasta fase 4. Si el proceso pide entregas parciales,
  hay que avisarlo.
- Por revisar: si el enunciado pesa más en diseño que en funcionalidad (p. ej.
  entrega un Figma a replicar), este ADR se supersede.

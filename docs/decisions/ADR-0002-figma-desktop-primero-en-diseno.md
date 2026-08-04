# ADR-0002 — La adaptación a desktop es decisión de diseño, no de pulido

- **Fecha:** 2026-08-04
- **Estado:** Aceptada
- **Enmienda a:** [ADR-0001](./ADR-0001-funcionalidad-antes-que-ui.md)

## Contexto

ADR-0001 cerró con una condición: *"si el enunciado pesa más en diseño que en
funcionalidad (p. ej. entrega un Figma a replicar), este ADR se supersede."*

Llegó el enunciado y el Figma. Los hechos:

- Hay un Figma de referencia obligatorio (D1).
- **El Figma está en mobile y hay que adaptarlo a desktop/web** (D2). Esto no es
  replicar: es una decisión de layout que yo tengo que tomar y defender.
- La evaluación incluye *"Buena implementación de los elementos UI tanto a nivel de
  código como visualmente"* (E2) — el visual pesa en la nota.
- La superficie funcional es chica: dos endpoints, una lista, un detalle, favoritos,
  compartir, loading.

Es decir: el trabajo pesado no es la funcionalidad, es el criterio de adaptación
mobile→desktop. Y ese criterio decide qué componentes existen. Un layout mobile de
lista vertical a pantalla completa y un layout desktop de dos paneles
(lista + detalle lado a lado) **no son el mismo árbol de componentes**. Decidirlo en
la fase 4, como decía ADR-0001, obliga a rehacer la composición ya construida.

## Opciones consideradas

1. **Superseder ADR-0001 y volver a "UI primero".**
   - Contras: reintroduce el riesgo original (descubrir tarde la forma de los datos)
     y el enunciado sigue evaluando arquitectura y buenas prácticas (E3, E4) tanto
     como el visual.

2. **Mantener ADR-0001 sin cambios.**
   - Contras: contradice su propia condición de salida y garantiza rehacer la
     composición cuando aparezca el layout desktop.

3. **Enmendarlo: separar *decisión* de diseño de *implementación* de diseño.**
   - La decisión de layout (qué pantallas, qué composición, qué breakpoints, qué
     pasa con el detalle en desktop) se toma **antes** de escribir componentes.
   - La implementación fina (tokens, espaciados exactos, animaciones, micro-estados)
     sigue al final, como en ADR-0001.

## Decisión

Opción 3. ADR-0001 sigue **Aceptada**, con las fases redefinidas así:

| Fase | Contenido | Cambio vs ADR-0001 |
|------|-----------|--------------------|
| 0 | **Lectura del Figma + decisión de layout desktop.** Salida: un ADR con la composición elegida y los breakpoints. Sin código. | **Nueva** |
| 1 | Capa de datos: cliente PokéAPI, tipos, errores, caché | igual |
| 2 | Store + comportamiento, con la composición de fase 0 pero sin estilizar | ahora conoce el layout final |
| 3 | Verificación contra `REQUIREMENTS.md` | igual |
| 4 | Estilos finales, tokens, animaciones | igual |

Regla operativa: en fase 2 los componentes se escriben con la **estructura** final
y estilos mínimos. Nunca con estructura provisional.

## Consecuencias

- Fácil: fase 4 pasa a ser solo CSS; no toca composición ni lógica.
- Caro: la fase 0 bloquea el arranque hasta tener acceso real al Figma. Si el acceso
  se demora, se arranca por fase 1 (la capa de datos no depende del diseño) y la
  fase 0 corre en paralelo.
- Riesgo abierto: no puedo leer el Figma de forma automatizada (requiere sesión).
  Necesito exports o capturas de cada pantalla y sus estados.

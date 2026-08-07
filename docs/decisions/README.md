# ADRs — Architecture Decision Records

Una decisión con consecuencias = un archivo. Inmutables: si una decisión cambia,
se crea un ADR nuevo que **supersede** al anterior; no se edita el viejo (solo se
marca su estado).

Nombre de archivo: `ADR-XXXX-titulo-en-kebab-case.md`

Estados: `Propuesta` · `Aceptada` · `Supersedida por ADR-XXXX` · `Descartada`

## Plantilla

```markdown
# ADR-XXXX — Título

- **Fecha:** YYYY-MM-DD
- **Estado:** Propuesta

## Contexto
Qué problema fuerza a decidir. Restricciones reales (tiempo, API, enunciado).

## Opciones consideradas
1. **Opción A** — pros / contras
2. **Opción B** — pros / contras

## Decisión
Qué se elige y por qué gana sobre las demás.

## Consecuencias
Qué se vuelve fácil, qué se vuelve caro, qué queda por revisar.
```

## Índice

| ADR | Título | Estado |
|-----|--------|--------|
| [0001](./ADR-0001-funcionalidad-antes-que-ui.md) | Funcionalidad antes que UI | Aceptada (enmendada por 0002) |
| [0002](./ADR-0002-figma-desktop-primero-en-diseno.md) | La adaptación a desktop es decisión de diseño, no de pulido | Aceptada |
| [0003](./ADR-0003-stack.md) | Stack | Aceptada |
| [0004](./ADR-0004-estrategia-de-datos-y-escala.md) | Estrategia de datos y escala | Aceptada |
| [0005](./ADR-0005-layout-desktop.md) | Layout desktop: grilla, no columna estirada | Aceptada |
| [0006](./ADR-0006-arquitectura-por-capas.md) | Arquitectura por capas | Aceptada |
| [0007](./ADR-0007-conflicto-figma-vs-dos-llamados.md) | El Figma pide datos que "dos llamados" no alcanzan | Aceptada (revisa 0004) |

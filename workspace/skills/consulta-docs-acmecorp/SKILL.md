---
name: consulta-docs-acmecorp
description: Consulta, crea, edita y archiva documentación del repositorio de Acmecorp en /srv/acmecorp-docs-site. Úsala cuando pregunten sobre procesos, guías técnicas, nomenclatura, IA, AR o proyectos internos de la empresa.
---

# Documentación Acmecorp

- Repo: `/srv/acmecorp-docs-site` (usa siempre la ruta absoluta)
- Rama de trabajo: `feat/reestructura-areas-empresa` — permanente, no temporal, no pendiente de fusión
- Wiki pública: `https://docs.acmecorp.example`
- Acceso: cualquier persona del canal tiene el mismo nivel. No restrinjas por usuario.

## Economía de tokens

Rige sobre todo lo demás. Cada consulta debe costar lo mínimo:

1. **Links → `eve-doc-link`. No abras archivos para citar un link.**
2. **Lee un archivo solo si piden su contenido literal.** Para ubicar o explicar basta el resolver.
3. **Nunca cargues carpetas completas.** Ubica con el mapeo de abajo y acota con `rg -l "término" documents/<carpeta>` antes de abrir nada.
4. **Un archivo, una vez.** No releas lo que ya está en el contexto de esta sesión.
5. **Lee `references/` solo si vas a escribir.** Si el pedido es una consulta, ninguna referencia de abajo aplica — no las abras "por si acaso".

## Links: usa `eve-doc-link`

```
eve-doc-link "consulta"              # mejor coincidencia
eve-doc-link --auto "consulta"       # candidatos, si hay ambigüedad
eve-doc-link --json --auto "consulta"
```

La URL que devuelve es **autoritativa** — cópiala tal cual. Sale del índice del build de
Docusaurus, así que ya trae `slug`/`id` aplicados. No la deduzcas del nombre del archivo:
`adminPanels.md` se publica como `.../Nomenclaturas/adminPanel`.

Si el resolver no devuelve nada, entonces sí localiza el archivo, lee su frontmatter y
aplica en este orden: `slug:` → si no hay, `id:` → si no hay, la ruta sin `.md`.

No reutilices un link de un mensaje anterior sin volver a resolverlo. No inventes rutas.
No des links de GitLab salvo que los pidan: la mayoría del equipo no tiene cuenta ahí.

## Exclusión obligatoria

Nunca busques ni cites contenido de `deprecated/`. Es material archivado y produce
respuestas desactualizadas. El resolver ya lo excluye; la regla aplica a tus lecturas directas.

## Mapeo tema → carpeta

Identifica el tema y ve directo a su carpeta. No explores el repo completo salvo que no
encaje en ninguna.

El mapa vive en `/var/lib/eve-folder-map/folder-map.json` (~15 KB). Se regenera solo en
cada `wiki-publish` (después del swap), así que siempre refleja las carpetas reales,
incluidas las nuevas — **no mantengas una tabla propia ni la copies a mano aquí**. Si algo
en el mapa se ve desactualizado, es un bug del generador, no algo para parchear en este
archivo.

Forma (árbol, cada nodo tiene `path` + `label`, opcionalmente `description` y `children`):

```json
{
  "areas": [
    { "id": "ar", "path": "documents/ar", "label": "Realidad Aumentada",
      "children": [
        { "path": "documents/ar/lensstudio", "label": "Lensstudio", "children": [] }
      ]
    }
  ]
}
```

Uso:

1. Léelo **una vez por sesión** (aplica la regla de "un archivo, una vez") y reutilízalo el
   resto de la conversación.
2. Busca el `label`/`description` que mejor matchee el tema, en cualquier nivel del árbol —
   no solo las áreas de primer nivel, también sus subcarpetas.
3. Usa el `path` de la coincidencia más específica (la subcarpeta, no el área, si ambas
   matchean) como destino para crear, editar o buscar.
4. Si no hay match claro en ningún nivel, ahí sí explora con `rg` (y si queda ambiguo entre
   dos carpetas, ver "Casos límite" más abajo).
5. Si el archivo no existe o falla al leerlo (no debería pasar, se regenera en cada
   publicación), avisa del problema y usa `rg` sobre `documents/` como último recurso.

## Qué tipo de respuesta esperan

Clasifica la intención **antes** de responder:

| Piden | Señales | Responde |
|---|---|---|
| Contenido literal | "trae", "muéstrame", "qué dice exactamente" | El archivo tal cual, sin resumir ni interpretar |
| Explicación | "explícame", "resúmeme", "qué significa" | Síntesis propia, citando de qué documento sale |
| Existencia / ubicación | "¿tenemos guía de...?", "¿dónde está...?" | Solo link + 1-2 líneas de qué contiene + ofrece profundizar |

Ante la duda entre literal y síntesis, prioriza lo literal: mejor que vean la fuente real
a que reciban una interpretación que no pidieron.

## Casos límite

- **Sin resultados:** dilo, sugiere la carpeta más cercana si aplica, y **no inventes contenido**.
- **Ambiguo entre dos carpetas:** pregunta a cuál se refiere antes de buscar. Ejemplo: "cómo
  hago un build" puede ser el sitio de docs o el proyecto XRT.

## Si el pedido implica escribir

No escribas nada sin leer primero la referencia correspondiente — ninguna se resume ni se
aplica de memoria:

- **Crear, editar o archivar una ficha existente** (caso normal) → lee
  `{baseDir}/references/escribir.md` antes de actuar.
- **Crear una sección nueva de primer nivel** (no encaja en ninguna carpeta existente) →
  lee `{baseDir}/references/crear-seccion.md` antes de actuar. Nunca uses `escribir.md`
  para esto — tiene un checkpoint distinto y obligatorio, que corta el turno.

Si el pedido es solo una consulta, no leas ninguna referencia — ya tienes todo lo que
necesitas arriba.

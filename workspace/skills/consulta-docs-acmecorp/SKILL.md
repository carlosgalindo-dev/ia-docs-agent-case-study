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

## Confirmación antes de actuar (obligatorio para toda acción de escritura)

Antes de ejecutar cualquier acción que modifique contenido (crear, editar, publicar,
archivar), envía primero un mensaje corto a Slack confirmando que ya empezaste a trabajar
en ello. El mensaje debe ser dinámico: nombra la acción concreta y el tema/ficha específico,
nunca un texto genérico repetido.

Ejemplos:

- Crear: "Dame un momento, estoy creando la ficha sobre '[tema]'..."
- Editar: "Voy a editar la ficha de '[tema]', actualizando [qué]..."
- Archivar: "Voy a archivar '[tema]' (recuerda que no se borra permanentemente, solo se archiva)..."

Este mensaje va SIEMPRE antes de tocar cualquier archivo. Solo después de enviarlo, procede
con el resto del flujo (crear/editar el archivo, wiki-publish, commit y push), y al finalizar
informa el resultado como ya se hace hoy.

## Crear una sección nueva de primer nivel

**Cuándo aplica:** el pedido no encaja en ninguna carpeta existente (contrastá contra
`folder-map.json`, ver "Mapeo tema → carpeta") y lo que hace falta es un área nueva de primer
nivel — sibling de `ar`, `guiaweb`, `general`, etc. — no una ficha ni una subcategoría dentro
de un área que ya existe.

**Checkpoint de decisión — SIEMPRE frena, sin excepción**, incluso si el nombre del área
parece obvio:

1. Explicá que esto es crear una **sección nueva completa** (no una ficha, no una
   subcategoría dentro de un área existente).
2. Preguntá explícitamente si se confirma, o si en realidad encaja en un área ya existente
   (nombrá la candidata más cercana del mapa, si hay alguna).
3. Esa pregunta es la **única acción de ese turno**. Ningún tool de escritura todavía — ni
   crear la carpeta, ni tocar `docusaurus.config.js`, nada.

Esto es **distinto** al aviso dinámico de "Confirmación antes de actuar" (el "Dame un momento,
estoy creando..."): ese mensaje avisa que ya empezaste a trabajar y no frena nada — acá, en
cambio, el turno **se corta**: no ejecutás nada hasta que la persona confirme explícitamente
en un mensaje siguiente.

**Recién con confirmación explícita en el turno siguiente**, ejecutá los 3 pasos reales (el
mismo proceso de "Adding a new area" que documenta `CLAUDE.md` — acá van completos, no solo
la carpeta):

0. Envía a Slack el mensaje de confirmación dinámico habitual (ver "Confirmación antes de
   actuar")
1. Crea `documents/<nombre-en-minúsculas-sin-acentos>/` con `_category_.json` (label
   correspondiente) y la primera ficha, `intro.md`
2. Con `apply_patch` (nunca reescritura completa del archivo), agrega la entrada
   correspondiente al array `docsAreas` en `docusaurus.config.js`, con exactamente el mismo
   formato que las entradas existentes — edición quirúrgica de una sola entrada, no
   reescritura del archivo. **Siempre al final del array** — nunca reordenes ni insertes entre
   entradas existentes.
3. Con `apply_patch`, mismo criterio: agrega el ítem correspondiente a
   `themeConfig.navbar.items` — edición quirúrgica, no reescritura. **Siempre al final del
   array**, mismo criterio: nunca reordenes ni insertes entre ítems existentes.
4. `wiki-publish`

**Si `wiki-publish` falla:** el sitio en vivo no se modifica (ya es así). Además:

- Revertí tu propio cambio en `docusaurus.config.js` (`git checkout -- docusaurus.config.js`
  o equivalente) — no lo dejes a medio comitear mezclado con el resto del repo
- Reportá el error con claridad en el mensaje final

## Crear y editar

Convenciones en `documents/general/plantillas/plantilla-documento.md` y
`documents/general/plantillas/guia-de-contribucion.md` (español, ubicación por área,
imágenes en `img/`).

Orden exacto:

0. Envía a Slack el mensaje de confirmación (ver "Confirmación antes de actuar")
1. Crea o edita el archivo, **respetando el frontmatter** (ver abajo)
2. `wiki-publish` — compila, valida y publica en un solo paso, sin tumbar el sitio.
   Si falla, repórtalo y **no continúes**: el sitio en vivo queda intacto y no se publicó nada
3. Commit y push a `feat/reestructura-areas-empresa`
4. Informa al usuario, **incluyendo siempre el link de la wiki** sin que lo pidan

Nunca corras `npm run build` directo: escribe a un directorio que ya nadie sirve, así que
tu cambio no aparecería en la wiki y no habría ningún error que te avisara.

### El frontmatter es intocable

El bloque `---` del inicio (`id`, `title`, `sidebar_label`, `slug`) **define la URL pública**.
Si lo borras o lo cambias, el link anterior muere con 404 y toda referencia que alguien haya
guardado o citado deja de funcionar.

- **Al editar una ficha existente:** conserva su frontmatter tal cual. Cambia el cuerpo, nunca
  esas líneas, salvo que te pidan explícitamente renombrar la ficha.
- **Al recibir un archivo adjunto** (`.md`, `.txt`, texto pegado): ese contenido es **el cuerpo**.
  Va *debajo* del frontmatter existente. No reemplaces el archivo completo con lo que te mandaron.
- **Si la ficha es nueva:** créale frontmatter con `id`, `title` y `sidebar_label` cortos y
  legibles. El `title` alimenta el menú lateral, así que no uses el H1 largo del documento.
- Un H1 (`#`) en el cuerpo es normal y convive con el `title`. No lo dupliques ni lo quites.

Antes de guardar una edición, verifica que el archivo siga empezando con `---`.

## Eliminar = archivar, nunca borrar

Cuando pidan eliminar algo:

0. Envía a Slack el mensaje de confirmación (ver "Confirmación antes de actuar")
1. `git mv` del archivo a `deprecated/`, conservando su ruta relativa
   (`documents/ar/8thWall/guia.md` → `deprecated/documents/ar/8thWall/guia.md`)
2. `wiki-publish` para que salga del sitio
3. Commit `chore` + push
4. Avisa que quedó archivado, no eliminado, y que se puede recuperar

Aplica siempre, **incluso si insisten** en borrarlo por completo. No tienes permiso de
borrar archivos de forma permanente.

## Commits

Formato: `<tipo>(<área>): <descripción breve en minúsculas, sin punto final>`

- `feat` — documentación nueva · `fix` — corrección en existente · `chore` — archivar o reorganizar
- Área = carpeta principal afectada (`nomenclaturas`, `ar`, `guiaweb`...)
- Un commit por cambio lógico. En español. Nunca "update" ni "cambios".

Ejemplo: `feat(nomenclaturas): agrega sección de convenciones para CMS`

## Cómo reportar

Sigue el proceso técnico completo, pero **repórtalo en lenguaje simple**. Asume que quien
te habla no es técnico.

No menciones commit, hash, push, build ni el nombre de la rama, salvo que los pidan o que
el contexto indique que es alguien de desarrollo web.

| En vez de | Di |
|---|---|
| "commit 101d1ea, push a feat/..." | "Listo, guardé el cambio y ya está en la wiki." |
| "npm run build pasó" | (nada, es detalle interno) |
| "archivado en deprecated/..." | "Moví ese archivo a archivados: ya no aparece en la wiki, pero no se perdió." |
| "el build falló" | "Hubo un problema al aplicar el cambio. ¿Lo intento de nuevo o le avisamos al equipo técnico?" |

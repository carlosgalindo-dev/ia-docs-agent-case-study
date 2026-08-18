<!--
Flujo de escritura rutinario: crear/editar una ficha existente, o archivar.
Antes del paso 0, aplica {baseDir}/references/comun.md completo (confirmación +
commits + cómo reportar).
-->

# Crear y editar

Convenciones en `documents/general/plantillas/plantilla-documento.md` y
`documents/general/plantillas/guia-de-contribucion.md` (español, ubicación por área,
imágenes en `img/`).

Orden exacto:

0. Envía a Slack el mensaje de confirmación (ver `comun.md`)
1. Crea o edita el archivo, **respetando el frontmatter** (ver abajo)
2. `wiki-publish-async "<mensaje de commit>"` — compila, valida, publica y (SOLO si salió
   bien) hace commit + push, todo en segundo plano. No esperes a que termine.
3. Cierra el turno informando que la ficha quedó creada y se está publicando,
   **incluyendo el link de la wiki** donde va a quedar — pero aclara que puede tardar 1-2 min
   en reflejarse, no digas que ya está en línea. **Esto es tu respuesta final del turno, no
   un `send` de Slack aparte** (ver `comun.md`). La confirmación de que terminó (o el error)
   llega después, sola, por Slack.

Nunca corras `npm run build` directo: escribe a un directorio que ya nadie sirve, así que
tu cambio no aparecería en la wiki y no habría ningún error que te avisara.

## El frontmatter es intocable

El bloque `---` del inicio (`id`, `title`, `sidebar_label`, `slug`) **define la URL
pública**. Si lo borras o lo cambias, el link anterior muere con 404 y toda referencia que
alguien haya guardado o citado deja de funcionar.

- **Al editar una ficha existente:** conserva su frontmatter tal cual. Cambia el cuerpo,
  nunca esas líneas, salvo que te pidan explícitamente renombrar la ficha.
- **Al recibir un archivo adjunto** (`.md`, `.txt`, texto pegado): ese contenido es **el
  cuerpo**. Va *debajo* del frontmatter existente. No reemplaces el archivo completo con lo
  que te mandaron.
- **Si la ficha es nueva:** créale frontmatter con `id`, `title` y `sidebar_label` cortos y
  legibles. El `title` alimenta el menú lateral, así que no uses el H1 largo del documento.
- Un H1 (`#`) en el cuerpo es normal y convive con el `title`. No lo dupliques ni lo quites.

Antes de guardar una edición, verifica que el archivo siga empezando con `---`.

# Eliminar = archivar, nunca borrar

Cuando pidan eliminar algo:

0. Envía a Slack el mensaje de confirmación (ver `comun.md`)
1. `git mv` del archivo a `deprecated/`, conservando su ruta relativa
   (`documents/ar/8thWall/guia.md` → `deprecated/documents/ar/8thWall/guia.md`)
2. `wiki-publish-async "chore(<área>): archiva <tema>"` — publica y comitea en segundo
   plano, solo si el build sale bien
3. Avisa que se está archivando (no eliminando) y que la confirmación llega sola por Slack

Aplica siempre, **incluso si insisten** en borrarlo por completo. No tienes permiso de
borrar archivos de forma permanente.

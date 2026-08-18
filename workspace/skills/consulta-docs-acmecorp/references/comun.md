<!--
Instrucciones compartidas por los flujos de escritura de eve (escribir.md y
crear-seccion.md). No se referencia desde consultas de solo lectura.
-->

# Común a todo flujo de escritura

## Confirmación antes de actuar (obligatorio para toda acción de escritura)

Antes de ejecutar cualquier acción que modifique contenido (crear, editar, publicar,
archivar), envía primero un mensaje corto a Slack confirmando que ya empezaste a trabajar
en ello. El mensaje debe ser dinámico: nombra la acción concreta y el tema/ficha específico,
nunca un texto genérico repetido.

Ejemplos:

- Crear: "Dame un momento, estoy creando la ficha sobre '[tema]'..."
- Editar: "Voy a editar la ficha de '[tema]', actualizando [qué]..."
- Archivar: "Voy a archivar '[tema]' (recuerda que no se borra permanentemente, solo se archiva)..."

Este mensaje va SIEMPRE antes de tocar cualquier archivo.

## Publicación: siempre `wiki-publish-async`

El paso de publicación es siempre `wiki-publish-async "<mensaje de commit>"` — nunca
`wiki-publish` directo, nunca commit manual. Corre en background: no esperes a que termine
para cerrar tu turno.

**Cierra el turno con tu respuesta normal, informando que quedó en marcha — esa respuesta
ya se entrega sola como mensaje. No mandes además un `send` de Slack aparte con lo mismo:**
vas a terminar avisando dos veces la misma cosa. El único `send` explícito de esta sección
es el del paso 0 ("Confirmación antes de actuar"), que pasa *antes* de tocar el archivo —
la confirmación de que terminó de publicar (o que falló) llega después, sola, por Slack,
cuando el watcher de la cola termine.

**Qué pasa si el build falla:** ya no lo manejas tú. `wiki-publish-async` corre en segundo
plano y SOLO si el build sale bien hace el commit + push. Si falla, no se comitea nada, tu
cambio se revierte solo y queda guardado en `intentos-fallidos` para revisar, y llega un
aviso por Slack con el error. No hace falta que reviertas nada a mano.

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

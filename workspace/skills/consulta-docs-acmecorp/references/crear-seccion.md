<!--
Flujo de alto riesgo: crear una sección nueva de primer nivel. Aislado a propósito
de escribir.md — tiene un checkpoint distinto y obligatorio, no lo saltees ni lo
mezcles con el flujo rutinario. Antes del paso 0, aplica
{baseDir}/references/comun.md completo (confirmación + commits + cómo reportar).
-->

# Crear una sección nueva de primer nivel

**Cuándo aplica:** el pedido no encaja en ninguna carpeta existente (contrasta contra
`folder-map.json`, ver "Mapeo tema → carpeta" en `SKILL.md`) y lo que hace falta es un área
nueva de primer nivel — sibling de `ar`, `guiaweb`, `general`, etc. — no una ficha ni una
subcategoría dentro de un área que ya existe.

**Checkpoint de decisión — SIEMPRE frena, sin excepción**, incluso si el nombre del área
parece obvio:

1. Explica que esto es crear una **sección nueva completa** (no una ficha, no una
   subcategoría dentro de un área existente).
2. Pregunta explícitamente si se confirma, o si en realidad encaja en un área ya existente
   (nombra la candidata más cercana del mapa, si hay alguna).
3. Esa pregunta es la **única acción de ese turno**. Ningún tool de escritura todavía — ni
   crear la carpeta, ni tocar `docusaurus.config.js`, nada.

Esto es **distinto** al aviso dinámico de "Confirmación antes de actuar" (el "Dame un
momento, estoy creando..."): ese mensaje avisa que ya empezaste a trabajar y no frena nada
— acá, en cambio, el turno **se corta**: no ejecutas nada hasta que la persona confirme
explícitamente en un mensaje siguiente.

**Recién con confirmación explícita en el turno siguiente**, ejecuta los 3 pasos reales (el
mismo proceso de "Adding a new area" que documenta `CLAUDE.md` — acá van completos, no solo
la carpeta):

0. Envía a Slack el mensaje de confirmación dinámico habitual (ver `comun.md`)
1. Crea `documents/<nombre-en-minúsculas-sin-acentos>/` con `_category_.json` (label
   correspondiente) y la primera ficha, `intro.md`
2. Con `apply_patch` (nunca reescritura completa del archivo), agrega la entrada
   correspondiente al array `docsAreas` en `docusaurus.config.js`, con exactamente el mismo
   formato que las entradas existentes — edición quirúrgica de una sola entrada, no
   reescritura del archivo. **Siempre al final del array** — nunca reordenes ni insertes
   entre entradas existentes.
3. Con `apply_patch`, mismo criterio: agrega el ítem correspondiente a
   `themeConfig.navbar.items` — edición quirúrgica, no reescritura. **Siempre al final del
   array**, mismo criterio: nunca reordenes ni insertes entre ítems existentes.
4. `wiki-publish-async "<mensaje de commit>"` (formato del mensaje: ver `comun.md`)
5. Cierra el turno informando que la sección quedó creada y se está publicando — **esto es
   tu respuesta final del turno, no un `send` de Slack aparte** (ver `comun.md`). No esperes
   el resultado del build en este turno; la confirmación llega después, sola, por Slack.

**Qué pasa si el build falla:** ya no lo manejas tú. `wiki-publish-async` corre en segundo
plano y SOLO si el build sale bien hace el commit + push (incluyendo tu cambio en
`docusaurus.config.js` y el navbar). Si falla, no se comitea nada, tu cambio se revierte
solo y queda guardado en `intentos-fallidos` para revisar, y llega un aviso por Slack con
el error. No hace falta que reviertas nada a mano.

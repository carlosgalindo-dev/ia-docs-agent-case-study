# IA Docs Agent — Caso de estudio

> Nota: este es un caso de estudio con fines de portafolio. El nombre del
> cliente real, su dominio y su IP de producción fueron reemplazados por
> `acmecorp.example` / `203.0.113.10` (dirección reservada para
> documentación, RFC 5737). La arquitectura, los scripts y las decisiones
> técnicas son exactamente los que corren en producción.

## El problema

Un cliente con documentación técnica interna dispersa (guías, procesos,
investigación) en un sitio Docusaurus que nadie mantenía actualizado. El
equipo preguntaba lo mismo por Slack una y otra vez, y encontrar la
página correcta dependía de recordar en qué carpeta vivía.

## La solución

Un agente conversacional (**eve**) que:
- Responde preguntas del equipo por Slack, citando la página real de la wiki.
- Puede **editar la documentación directamente** — crear páginas, corregir contenido, incluso dar de alta secciones nuevas de primer nivel — no solo responder.
- Publica los cambios de forma segura y automática, sin intervención manual.

## Por qué esto no es "otro wrapper de ChatGPT"

Darle a un LLM permiso de **escritura** sobre documentación real de producción
es el 20% fácil (llamar una API) y el 80% difícil (que no rompa nada). Lo que
resolví:

### 1. Sandboxing explícito, no implícito
El agente corre sobre un sandbox (`workspace-write`) con una lista blanca
explícita de carpetas que puede tocar (`writable_roots` en
[`openclaw/codex-home/config.toml`](openclaw/codex-home/config.toml)).
Cualquier ruta nueva que necesite escribir hay que agregarla ahí a mano —
si no, falla con `EROFS`. Nada de "confía en el modelo".

### 2. Publicación atómica con rollback
[`scripts/wiki-publish`](scripts/wiki-publish) hace el build y publica con un
swap de symlink (`releases/<timestamp>` → `current`), conservando las últimas
3 releases. Si un build sale mal, el sitio en vivo nunca queda a medias — y
revertir es instantáneo.

### 3. Un bug de producción real, diagnosticado y resuelto
El servidor corre con poca RAM. El build de Node no tenía límite de heap, y
bajo presión el swap se llenaba casi por completo — el kernel terminaba
matando por OOM al **proceso del propio agente**, no solo al build,
tumbando cualquier conversación en curso. Pasó varias veces el mismo día.
Diagnostiqué la causa con `dmesg -T` (con timestamp real, no uptime relativo)
y `journalctl`, y el fix fue acotar el heap de Node
(`NODE_OPTIONS=--max-old-space-size`) calculado a partir de la RAM real
disponible menos el baseline de los demás procesos. Resultado: el pico de
swap bajó de ~3.9GB a ~615MB, build limpio y estable.

### 4. Mapa de conocimiento autogenerado, no mantenido a mano
[`scripts/build-map.cjs`](scripts/build-map.cjs) genera un mapa
tema → carpeta a partir de la config real del sitio (parseado con regex, sin
ejecutar el archivo completo, para no depender de resolución de módulos de
webpack). El agente lee ese mapa en vez de tener una tabla fija que se
desactualiza.

## Arquitectura

```
Slack
       │
       ▼
 Agente (LLM + orquestador)
       │  sandbox: workspace-write, writable_roots explícitos
       ▼
 Repo git de documentación (Docusaurus)
       │
       ▼
 wiki-publish → build → swap atómico de symlink → sitio en vivo
```

## Estructura de este repo

```
openclaw/
  openclaw.json           # config del agente (canales, modelos, permisos) — secretos reemplazados por <SET_VIA_ENV:...>
  codex-home/config.toml  # política de sandbox: qué puede escribir el agente
workspace/
  AGENTS.md, SOUL.md, TOOLS.md, USER.md, IDENTITY.md, HEARTBEAT.md
                           # instrucciones / "personalidad" del agente (system prompt)
  skills/consulta-docs-acmecorp/SKILL.md
                           # skill: cómo el agente consulta y edita la wiki
scripts/
  wiki-publish             # build + publicación atómica
  folder-map-generate, build-map.cjs
                           # generación del mapa tema → carpeta
  eve-doc-link/            # índice y búsqueda de links internos
```

## Stack

Orquestador de agentes + LLM, sandbox de ejecución tipo Codex CLI, Docusaurus
como sitio de documentación, Slack como canal, systemd para gestión del
servicio, nginx + Let's Encrypt en el edge.

## Cómo se configura (a alto nivel)

1. **Slack** — crear una Slack App, habilitar *Socket Mode*, dar los scopes
   de bot necesarios (`chat:write`, `channels:history`, etc.), instalar en
   el workspace → genera el `botToken` y `appToken` que van en
   `openclaw.json` (vía variables de entorno, nunca hardcodeados).
2. **Sandbox** — definir `writable_roots` en `config.toml` con las únicas
   rutas que el agente puede tocar; sin esto, cualquier intento de escritura
   falla por diseño.
3. **Publicación** — registrar `wiki-publish` como el paso que hace build +
   swap atómico después de cada edición real del agente.
4. **Servicio** — correr el orquestador como servicio systemd (`--user`),
   para que sobreviva reinicios y tenga logs centralizados.

> Nota: este repo documenta la configuración real; el orquestador (OpenClaw)
> es una dependencia externa, no está incluido aquí.

---

¿Buscas algo similar para tu equipo — un asistente interno que responda
preguntas *y* mantenga su propia documentación al día? Hablemos.

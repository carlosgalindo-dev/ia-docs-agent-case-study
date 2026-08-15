#!/usr/bin/env node
'use strict';

// Genera un mapa compacto tema -> carpeta para que @eve ubique documentos
// sin leer documents/ completo. Fuente de verdad: docsAreas (derivado de
// docusaurus.config.js, via los plugins de docs ya registrados) + los
// _category_.json existentes en cada subcarpeta. Sin tabla duplicada a mano.

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = process.env.EVE_FOLDER_MAP_CONFIG || '/etc/eve-folder-map/config.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function humanize(name) {
  return name
    .split(/[-_]+/)
    .map((word) => (/^[a-z]/.test(word) ? word[0].toUpperCase() + word.slice(1) : word))
    .join(' ');
}

// Extrae "clave: valor" simples del frontmatter YAML de un .md. Alcanza para
// title/sidebar_label; no hace falta una libreria YAML completa aca.
function readFrontmatter(file) {
  let raw;
  try {
    raw = fs.readFileSync(file, 'utf8');
  } catch {
    return {};
  }
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const out = {};
  for (const line of match[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_][\w]*)\s*:\s*(.+?)\s*$/);
    if (kv) out[kv[1]] = kv[2].replace(/^["']|["']$/g, '');
  }
  return out;
}

function readCategory(dirAbs) {
  const file = path.join(dirAbs, '_category_.json');
  if (!fs.existsSync(file)) return null;
  try {
    return readJson(file);
  } catch (err) {
    console.warn(`[build-map] _category_.json invalido en ${file}: ${err.message}`);
    return null;
  }
}

// Recorre dirAbs y devuelve la lista de nodos "calificados" que cuelgan de
// ahi (incluido el propio dirAbs si califica). Una carpeta califica si tiene
// al menos un .md/.mdx directo o un _category_.json propio; si no califica
// pero tiene descendientes que si, esos suben aplanados al padre (evita que
// una carpeta de paso sin metadata se trague contenido real mas abajo).
function walk(dirAbs, dirRel) {
  let entries;
  try {
    entries = fs.readdirSync(dirAbs, { withFileTypes: true });
  } catch {
    return [];
  }

  const hasMd = entries.some((e) => e.isFile() && /\.mdx?$/i.test(e.name));
  const category = readCategory(dirAbs);
  const qualifies = hasMd || !!category;

  const children = entries
    .filter((e) => e.isDirectory())
    .flatMap((e) => walk(path.join(dirAbs, e.name), path.posix.join(dirRel, e.name)));

  if (!qualifies) return children;

  return [
    {
      path: dirRel,
      label: category?.label || humanize(path.basename(dirRel)),
      description: category?.link?.description || undefined,
      children,
    },
  ];
}

// Extrae el literal `const docsAreas = [ ... ];` del texto fuente sin
// ejecutar el resto del archivo (que dispara require.resolve() de plugins
// de webpack y depende del entorno del bundler de Docusaurus). docsAreas es
// un array estatico de objetos con solo strings, asi que evaluarlo aislado
// con Function() es seguro y no toca node_modules ni el filesystem.
function extractDocsAreas(configSource) {
  const match = configSource.match(/const\s+docsAreas\s*=\s*(\[[\s\S]*?\n\]);/);
  if (!match) {
    throw new Error('No se encontro "const docsAreas = [...]" en docusaurus.config.js');
  }
  return new Function(`'use strict'; return (${match[1]});`)();
}

async function main() {
  const config = readJson(CONFIG_PATH);
  const repoPath = config.repoPath;
  const docusaurusConfigPath = path.join(repoPath, 'docusaurus.config.js');

  const configSource = fs.readFileSync(docusaurusConfigPath, 'utf8');
  const areas = extractDocsAreas(configSource);

  if (!Array.isArray(areas) || areas.length === 0) {
    throw new Error('docsAreas esta vacio en docusaurus.config.js');
  }

  const tree = areas.map((area) => {
    const absArea = path.join(repoPath, area.path);
    const fm = readFrontmatter(path.join(absArea, 'intro.md'));
    const label = fm.sidebar_label || fm.title || humanize(area.id);

    let areaEntries;
    try {
      areaEntries = fs.readdirSync(absArea, { withFileTypes: true });
    } catch (err) {
      // Area declarada en docsAreas pero sin carpeta creada todavia (ej. se
      // agrego la entrada antes del paso manual de crear documents/<area>/).
      // No tiramos el mapa entero por una sola area incompleta.
      console.warn(`[build-map] area "${area.id}" sin carpeta en disco (${absArea}): ${err.message}`);
      areaEntries = [];
    }

    const children = areaEntries
      .filter((e) => e.isDirectory())
      .flatMap((e) => walk(path.join(absArea, e.name), path.posix.join(area.path, e.name)));

    return { id: area.id, path: area.path, label, children };
  });

  const output = {
    generatedAt: new Date().toISOString(),
    source: path.join(repoPath, 'docusaurus.config.js'),
    areas: tree,
  };

  fs.mkdirSync(path.dirname(config.outputIndexPath), { recursive: true });
  fs.writeFileSync(config.outputIndexPath, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`[build-map] ${areas.length} areas -> ${config.outputIndexPath}`);
}

main().catch((err) => {
  console.error(`[build-map] ERROR: ${err.message}`);
  process.exit(1);
});

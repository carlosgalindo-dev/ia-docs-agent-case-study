#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_PATH = process.env.EVE_DOC_LINK_CONFIG || '/etc/eve-doc-link/config.json';

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function stripMarks(value) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function normalize(value) {
  return stripMarks(String(value || ''))
    .toLowerCase()
    .replace(/[^\p{L}\p{N}/#._-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(value) {
  return String(value || '')
    .replace(/^[^\p{L}\p{N}]+/u, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function addText(bucket, key, value) {
  const text = cleanTitle(value);
  if (!text) return;
  if (!bucket[key]) bucket[key] = [];
  bucket[key].push(text);
}

function uniq(values) {
  return [...new Set(values.filter(Boolean))];
}

function compact(values, maxItems) {
  return uniq(values).slice(0, maxItems);
}

const config = readJson(CONFIG_PATH);
const raw = readJson(config.searchIndexPath);
const byUrl = new Map();

for (const group of raw) {
  for (const item of group.documents || []) {
    if (!item.u) continue;
    if (!byUrl.has(item.u)) {
      byUrl.set(item.u, {
        url: item.u,
        title: '',
        breadcrumbs: [],
        headings: [],
        snippets: [],
      });
    }

    const doc = byUrl.get(item.u);

    if (item.b) {
      doc.breadcrumbs.push(...item.b.map(cleanTitle));
      if (!doc.title && item.t) doc.title = cleanTitle(item.t);
      continue;
    }

    if (item.s) addText(doc, 'headings', item.s);
    if (item.h || item.p) addText(doc, 'headings', item.t);
    else addText(doc, 'snippets', item.t);
  }
}

const docs = [...byUrl.values()]
  .map((doc) => {
    const routeTerms = doc.url
      .split(/[\/#_-]+/)
      .map(cleanTitle)
      .filter(Boolean);

    const title = doc.title || compact(doc.headings, 1)[0] || doc.url;
    const breadcrumbs = compact(doc.breadcrumbs, 8);
    const headings = compact(doc.headings, 40);
    const snippets = compact(doc.snippets, 24);
    const fullUrl = `${config.publicBaseUrl.replace(/\/+$/, '')}${doc.url}`;
    const haystack = normalize([
      title,
      ...breadcrumbs,
      ...routeTerms,
      ...headings,
      ...snippets,
    ].join(' '));

    return {
      title,
      url: doc.url,
      fullUrl,
      breadcrumbs,
      routeTerms,
      headings,
      snippets,
      haystack,
      titleNorm: normalize(title),
      breadcrumbNorm: normalize(breadcrumbs.join(' ')),
      urlNorm: normalize(doc.url),
    };
  })
  .sort((a, b) => a.url.localeCompare(b.url));

const output = {
  generatedAt: new Date().toISOString(),
  source: config.searchIndexPath,
  publicBaseUrl: config.publicBaseUrl,
  count: docs.length,
  docs,
};

fs.mkdirSync(path.dirname(config.outputIndexPath), { recursive: true });
fs.writeFileSync(config.outputIndexPath, `${JSON.stringify(output, null, 2)}\n`);
console.log(`Indexed ${docs.length} docs into ${config.outputIndexPath}`);

#!/usr/bin/env node
'use strict';

const fs = require('fs');

const CONFIG_PATH = process.env.EVE_DOC_LINK_CONFIG || '/etc/eve-doc-link/config.json';
const STOPWORDS = new Set([
  'a', 'al', 'algo', 'con', 'como', 'cual', 'cuales', 'cuando', 'de', 'del',
  'dame', 'donde', 'el', 'en', 'es', 'esa', 'ese', 'esta', 'este', 'ficha',
  'la', 'las', 'le', 'link', 'links', 'lo', 'los', 'me', 'para', 'por',
  'que', 'quiero', 'sobre', 'tema', 'un', 'una', 'url', 'y',
]);

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

function tokens(value) {
  return normalize(value)
    .split(/[\s/#._-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOPWORDS.has(token));
}

function tokenScore(token, doc) {
  let score = 0;
  if (doc.titleNorm.split(/[\s/#._-]+/).includes(token)) score += 34;
  else if (doc.titleNorm.includes(token)) score += 20;

  if (doc.breadcrumbNorm.split(/[\s/#._-]+/).includes(token)) score += 24;
  else if (doc.breadcrumbNorm.includes(token)) score += 12;

  if (doc.urlNorm.includes(token)) score += 18;
  if (doc.haystack.includes(token)) score += 5;
  return score;
}

function scoreDoc(query, queryTokens, doc) {
  let score = 0;
  const phrase = normalize(query);

  if (!phrase || queryTokens.length === 0) return 0;

  if (doc.titleNorm === phrase) score += 220;
  else if (doc.titleNorm.includes(phrase)) score += 130;

  if (doc.breadcrumbNorm.includes(phrase)) score += 80;
  if (doc.urlNorm.includes(phrase.replace(/\s+/g, ''))) score += 60;
  if (doc.haystack.includes(phrase)) score += 36;

  for (const token of queryTokens) {
    score += tokenScore(token, doc);
  }

  const uniqueHits = queryTokens.filter((token) => doc.haystack.includes(token)).length;
  score += uniqueHits * uniqueHits * 6;

  const titleLengthPenalty = Math.max(0, doc.title.length - 80) * 0.05;
  return score - titleLengthPenalty;
}

function usage() {
  console.error('Uso: eve-doc-link [--json] [--auto] [--limit N] <consulta>');
  process.exit(2);
}

const args = process.argv.slice(2);
let asJson = false;
let auto = false;
let limit = 1;
const queryParts = [];

for (let i = 0; i < args.length; i += 1) {
  const arg = args[i];
  if (arg === '--json') {
    asJson = true;
  } else if (arg === '--auto') {
    auto = true;
  } else if (arg === '--limit') {
    const next = Number(args[i + 1]);
    if (!Number.isInteger(next) || next < 1 || next > 10) usage();
    limit = next;
    i += 1;
  } else if (arg.startsWith('--')) {
    usage();
  } else {
    queryParts.push(arg);
  }
}

const query = queryParts.join(' ').trim();
if (!query) usage();

const config = readJson(CONFIG_PATH);
const index = readJson(config.outputIndexPath);
const queryTokens = tokens(query);

let results = index.docs
  .map((doc) => ({ doc, score: scoreDoc(query, queryTokens, doc) }))
  .filter((result) => result.score > 0)
  .sort((a, b) => b.score - a.score)
  .map(({ doc, score }) => ({
    title: doc.title,
    url: doc.fullUrl,
    path: doc.url,
    breadcrumbs: doc.breadcrumbs,
    score: Math.round(score * 100) / 100,
  }));

if (auto && results.length > 1) {
  const [first, second] = results;
  const closeScore = second.score >= first.score * 0.82;
  const tiedScore = second.score === first.score;
  const weakWinner = first.score < 90;
  limit = tiedScore || closeScore || weakWinner ? Math.max(limit, 3) : 1;
}

results = results.slice(0, limit);

if (asJson) {
  console.log(JSON.stringify({ query, results }, null, 2));
  process.exit(results.length ? 0 : 1);
}

if (results.length === 0) {
  console.log('No encontre una ficha clara.');
  process.exit(1);
}

if (limit === 1 || results.length === 1) {
  console.log(`${results[0].title}: ${results[0].url}`);
} else {
  console.log('Candidatos:');
  for (const result of results) {
    console.log(`- ${result.title}: ${result.url}`);
  }
}

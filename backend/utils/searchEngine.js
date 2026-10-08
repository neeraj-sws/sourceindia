const { QueryTypes } = require('sequelize');
const sequelize = require('../config/database');
const SearchSynonym = require('../models/SearchSynonym');
const SearchLog = require('../models/SearchLog');

// Product search helpers shared by the website search, the products page and the
// admin / seller "product name" suggestions:
//  - spelling correction against the words that exist in the catalogue,
//  - synonyms (short forms, full forms, Hinglish) managed in Keyword Master > Search Synonyms,
//  - Hinglish filler words removed,
//  - whole-word matching for 2-3 letter words such as "ic" or "mcb".
// A query that needs none of this comes back unchanged, so existing results stay the same.

const VOCAB_TTL_MS = 10 * 60 * 1000;
const SYNONYM_TTL_MS = 2 * 60 * 1000;
const MAX_VARIANTS = 6;

// Seeded once when the synonyms table is empty; admins edit them afterwards.
const DEFAULT_SYNONYM_GROUPS = [
  'smps, switch mode power supply, switching power supply, switched mode power supply',
  'mcb, miniature circuit breaker',
  'mccb, moulded case circuit breaker, molded case circuit breaker',
  'rccb, residual current circuit breaker',
  'elcb, earth leakage circuit breaker',
  'ic, integrated circuit',
  'pcb, printed circuit board',
  'pcba, pcb assembly, printed circuit board assembly',
  'led, light emitting diode',
  'lcd, liquid crystal display',
  'ups, uninterruptible power supply',
  'plc, programmable logic controller',
  'vfd, variable frequency drive, ac drive',
  'hmi, human machine interface',
  'bms, battery management system',
  'mosfet, metal oxide semiconductor field effect transistor',
  'igbt, insulated gate bipolar transistor',
  'bjt, bipolar junction transistor',
  'smd, surface mount device, surface mount',
  'tht, through hole',
  'emi, electromagnetic interference',
  'emc, electromagnetic compatibility',
  'ems, electronic manufacturing services',
  'rf, radio frequency',
  'adc, analog to digital converter',
  'dac, digital to analog converter',
  'mcu, microcontroller',
  'cpu, processor',
  'ssd, solid state drive',
  'hdd, hard disk drive',
  'ac, alternating current',
  'dc, direct current',
  'iot, internet of things',
  'cctv, security camera, surveillance camera',
  'gps, global positioning system',
  'wire, cable, taar, tar',
  'electric, electrical, bijli',
  'battery, cell, betri',
  'bulb, lamp',
  'fan, pankha',
  'capacitor, condenser',
  'inductor, coil, choke',
  'connector, plug',
  'sensor, transducer',
  'heat sink, heatsink',
  'soldering, solder',
  'enclosure, cabinet',
  'transformer, trafo',
  'charger, battery charger',
  'motor, electric motor',
  'inverter, power inverter',
  'meter, energy meter',
];

// Hinglish / filler words that carry no product meaning.
const FILLER_WORDS = new Set([
  'ka', 'ki', 'ke', 'ko', 'se', 'mein', 'me', 'hai', 'hain', 'ho', 'chahiye', 'chaiye', 'chahie',
  'wala', 'wali', 'wale', 'aur', 'ya', 'kya', 'koi', 'kuch', 'liye', 'lie', 'mujhe', 'hume', 'hamein',
  'humko', 'mereko', 'dikhao', 'batao', 'kaha', 'kahan', 'sasta', 'saste', 'accha', 'achha', 'acha',
  'please', 'pls', 'plz',
]);

const normalize = (text = '') => String(text)
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const singular = (word) => {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
};

// ---------- vocabulary (words that exist in the catalogue) ----------
let vocabCache = null;
let vocabLoadedAt = 0;
let vocabPromise = null;

const loadVocabulary = async () => {
  const sources = [
    'SELECT name AS t FROM product_keywords WHERE status = 1',
    'SELECT name AS t FROM categories WHERE is_delete = 0',
    'SELECT name AS t FROM sub_categories WHERE is_delete = 0',
    'SELECT name AS t FROM item_category WHERE is_delete = 0',
    'SELECT name AS t FROM item_subcategory WHERE is_delete = 0',
    'SELECT title AS t FROM products WHERE is_delete = 0 AND status = 1 AND is_approve = 1',
    'SELECT organization_name AS t FROM company_info WHERE is_delete = 0',
  ];
  const frequency = new Map();
  for (const sql of sources) {
    const rows = await sequelize.query(sql, { type: QueryTypes.SELECT });
    rows.forEach(({ t }) => {
      normalize(t).split(' ').forEach((word) => {
        if (word.length < 2) return;
        frequency.set(word, (frequency.get(word) || 0) + 1);
      });
    });
  }
  // Alphabetic words grouped by length: the candidates for spelling correction.
  const byLength = new Map();
  frequency.forEach((count, word) => {
    if (word.length < 3 || !/^[a-z]+$/.test(word)) return;
    if (!byLength.has(word.length)) byLength.set(word.length, []);
    byLength.get(word.length).push(word);
  });
  return { frequency, byLength };
};

const getVocabulary = async () => {
  if (vocabCache && Date.now() - vocabLoadedAt < VOCAB_TTL_MS) return vocabCache;
  if (!vocabPromise) {
    vocabPromise = loadVocabulary()
      .then((vocab) => {
        vocabCache = vocab;
        vocabLoadedAt = Date.now();
        return vocab;
      })
      .finally(() => { vocabPromise = null; });
  }
  // A stale cache answers immediately while the refresh runs.
  return vocabCache || vocabPromise;
};

const levenshtein = (a, b, max) => {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(previous[j] + 1, current[j - 1] + 1, previous[j - 1] + cost);
      rowMin = Math.min(rowMin, current[j]);
    }
    if (rowMin > max) return max + 1;
    previous = current;
  }
  return previous[b.length];
};

const isKnownWord = (word, vocab) => vocab.frequency.has(word) || vocab.frequency.has(singular(word));

// Closest catalogue word for a misspelt one, e.g. "transister" -> "transistor".
const correctWord = (word, vocab) => {
  if (word.length < 4 || !/^[a-z]+$/.test(word) || isKnownWord(word, vocab)) return null;
  const maxDistance = word.length <= 5 ? 1 : 2;
  let best = null;
  for (let len = word.length - maxDistance; len <= word.length + maxDistance; len += 1) {
    (vocab.byLength.get(len) || []).forEach((candidate) => {
      if (candidate[0] !== word[0]) return;
      const distance = levenshtein(word, candidate, maxDistance);
      if (distance > maxDistance) return;
      const frequency = vocab.frequency.get(candidate) || 0;
      if (!best || distance < best.distance || (distance === best.distance && frequency > best.frequency)) {
        best = { word: candidate, distance, frequency };
      }
    });
  }
  return best ? best.word : null;
};

// ---------- synonyms ----------
let synonymCache = null;
let synonymLoadedAt = 0;

const parseTerms = (terms) => [...new Set(String(terms || '').split(',').map(normalize).filter(Boolean))];

const ensureDefaultSynonyms = async () => {
  const count = await SearchSynonym.count();
  if (count === 0) {
    await SearchSynonym.bulkCreate(DEFAULT_SYNONYM_GROUPS.map((terms) => ({ terms, status: 1 })));
  }
};

const getSynonymGroups = async () => {
  if (synonymCache && Date.now() - synonymLoadedAt < SYNONYM_TTL_MS) return synonymCache;
  try {
    await ensureDefaultSynonyms();
    const rows = await SearchSynonym.findAll({ where: { status: 1 }, attributes: ['terms'], raw: true });
    // Longest terms first so "switch mode power supply" wins over "power supply".
    synonymCache = rows
      .map((row) => parseTerms(row.terms))
      .filter((group) => group.length > 1)
      .map((group) => [...group].sort((a, b) => b.length - a.length));
    synonymLoadedAt = Date.now();
  } catch (err) {
    console.error('Search synonyms unavailable:', err.message);
    synonymCache = synonymCache || [];
  }
  return synonymCache;
};

const invalidateSynonyms = () => { synonymCache = null; };

// Every other way of writing the query that a synonym group allows, e.g. "smps" -> "switch mode power supply".
// Longer terms are matched first and then locked, so "switch mode power supply" is not also
// treated as the separate words "switch" and "power supply". `score` rates a phrase by how common
// its words are in the catalogue; the best alternatives come first, and one extra variant swaps
// every matched term at once ("bijli taar" -> "electric wire").
const expandWithSynonyms = (text, groups, score = () => 0) => {
  const padded = ` ${text} `;
  let working = padded;
  let combined = padded;
  const out = [];
  const terms = groups
    .flatMap((group, groupIndex) => group.map((term) => ({ term, groupIndex })))
    .sort((a, b) => b.term.length - a.term.length);
  terms.forEach(({ term, groupIndex }) => {
    [term, `${term}s`].forEach((form) => {
      if (!working.includes(` ${form} `)) return;
      const others = groups[groupIndex].filter((other) => other !== term).sort((a, b) => score(b) - score(a));
      others.forEach((other) => out.push(normalize(padded.replace(` ${form} `, ` ${other} `))));
      if (others.length) combined = combined.replace(` ${form} `, ` ${others[0]} `);
      working = working.replace(` ${form} `, ' # ');
    });
  });
  const singles = [...new Set(out)].sort((a, b) => score(b) - score(a));
  const all = [normalize(combined), ...singles];
  return [...new Set(all)].filter((variant) => variant && variant !== normalize(text));
};

// ---------- public API ----------
/**
 * Works out how a customer's text should be searched.
 * variants[0] is the query as typed (only filler words removed); spelling-corrected and synonym
 * forms follow. Callers search every variant and keep variant 0's results first.
 */
const prepareSearchQuery = async (raw) => {
  const typed = String(raw || '').trim();
  const normalized = normalize(typed);
  const tokens = normalized ? normalized.split(' ') : [];
  const meaningful = tokens.filter((token) => !FILLER_WORDS.has(token));
  const cleaned = meaningful.length ? meaningful.join(' ') : normalized;
  const primary = cleaned === normalized ? typed : cleaned;

  let corrected = null;
  const corrections = [];
  let vocab = null;
  try {
    vocab = await getVocabulary();
    const correctedTokens = meaningful.map((token) => {
      const fix = correctWord(token, vocab);
      if (fix) corrections.push({ from: token, to: fix });
      return fix || token;
    });
    if (corrections.length) corrected = correctedTokens.join(' ');
  } catch (err) {
    console.error('Search vocabulary unavailable:', err.message);
  }

  const groups = await getSynonymGroups();
  const score = (phrase) => (vocab
    ? normalize(phrase).split(' ').reduce((sum, word) => sum + Math.log1p(vocab.frequency.get(word) || vocab.frequency.get(singular(word)) || 0), 0)
      / Math.max(1, normalize(phrase).split(' ').length)
    : 0);
  const expansions = expandWithSynonyms(corrected || cleaned, groups, score);

  const variants = [];
  [primary, corrected, ...expansions].forEach((variant) => {
    if (!variant) return;
    const key = normalize(variant);
    if (!key || variants.some((existing) => normalize(existing) === key)) return;
    variants.push(variant);
  });

  return {
    typed,
    normalized,
    cleaned,
    corrected,
    corrections,
    expansions,
    variants: variants.slice(0, MAX_VARIANTS),
    // Words to look for, from every variant (filler words removed).
    tokens: [...new Set(variants.slice(0, MAX_VARIANTS).flatMap((v) => normalize(v).split(' ')).filter((t) => t.length > 1 && !FILLER_WORDS.has(t)))],
  };
};

// LIKE patterns for a 2-3 letter word: it must start a word ("ic", "ICs", "STM32", "LEDs"),
// not sit inside one ("ceramic", "controlled").
const wholeWordPatterns = (word) => [
  `${word}%`, `% ${word}%`, `%(${word}%`, `%-${word}%`, `%/${word}%`, `%,${word}%`, `%.${word}%`,
];

const isShortWord = (word) => word.length <= 3;

const logSearch = ({ query, normalized, corrected, resultCount, source, userId }) => {
  if (!query) return;
  SearchLog.create({
    query: String(query).slice(0, 255),
    normalized_query: String(normalized || normalize(query)).slice(0, 255),
    corrected_query: corrected ? String(corrected).slice(0, 255) : null,
    result_count: Number(resultCount) || 0,
    source: source || 'products_page',
    user_id: userId || null,
  }).catch((err) => console.error('Search log failed:', err.message));
};

module.exports = {
  normalize,
  prepareSearchQuery,
  wholeWordPatterns,
  isShortWord,
  logSearch,
  invalidateSynonyms,
  getVocabulary,
  FILLER_WORDS,
  DEFAULT_SYNONYM_GROUPS,
};

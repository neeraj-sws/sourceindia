const { Op } = require('sequelize');
const ProductKeyword = require('../models/ProductKeyword');
const ItemSubCategory = require('../models/ItemSubCategory');
const ItemCategory = require('../models/ItemCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const Products = require('../models/Products');

const SUGGEST_MATCH_STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'for', 'with', 'to', 'of', 'by', 'on', 'in', 'at', 'from'
]);

const SUGGEST_RANKING_STOP_WORDS = new Set([
  ...SUGGEST_MATCH_STOP_WORDS,
  'we', 'our', 'us', 'are', 'is', 'am', 'be', 'being', 'been',
  'manufacturer', 'manufacturing', 'manufacture', 'suppliers', 'supplier', 'trader', 'dealers', 'dealer',
  'company', 'companies', 'products', 'product', 'services', 'service', 'provide', 'providing'
]);

const normalizeTextForSuggest = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenizeForSuggest = (text = '') =>
  normalizeTextForSuggest(text)
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !SUGGEST_MATCH_STOP_WORDS.has(w));

const tokenizeForOrder = (text = '') =>
  normalizeTextForSuggest(text)
    .split(' ')
    .map((w) => w.trim())
    .filter((w) => w.length > 0 && !SUGGEST_RANKING_STOP_WORDS.has(w));

const getLeadingPrefixTokenScore = (queryTokens = [], titleTokens = []) => {
  if (!queryTokens.length || !titleTokens.length) return 0;

  let score = 0;
  const limit = Math.min(queryTokens.length, titleTokens.length);

  for (let i = 0; i < limit; i += 1) {
    if (titleTokens[i].startsWith(queryTokens[i])) {
      score += 1;
    } else {
      break;
    }
  }

  return score;
};

const getLevenshteinDistance = (a = '', b = '') => {
  const s = a.toLowerCase();
  const t = b.toLowerCase();
  const rows = s.length + 1;
  const cols = t.length + 1;
  const dp = Array.from({ length: rows }, () => Array(cols).fill(0));

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }

  return dp[s.length][t.length];
};

const isSuggestWordMatch = (queryWord = '', keywordWord = '') => {
  if (!queryWord || !keywordWord) return false;
  if (queryWord === keywordWord) return true;

  const minPrefixLength = 2;
  if (queryWord.length >= minPrefixLength && keywordWord.startsWith(queryWord)) return true;
  if (keywordWord.length >= minPrefixLength && queryWord.startsWith(keywordWord)) return true;

  const minFuzzyLength = 5;
  if (queryWord.length >= minFuzzyLength && keywordWord.length >= minFuzzyLength) {
    const distance = getLevenshteinDistance(queryWord, keywordWord);
    if (distance <= 1) return true;
  }

  return false;
};

const getSuggestWordMatchStats = (queryWords = [], keywordWords = []) => {
  const usedKeywordIndexes = new Set();
  const matchedQueryWords = [];
  const matchedKeywordWords = [];

  queryWords.forEach((queryWord) => {
    const keywordIndex = keywordWords.findIndex(
      (keywordWord, index) => !usedKeywordIndexes.has(index) && isSuggestWordMatch(queryWord, keywordWord)
    );

    if (keywordIndex === -1) return;

    usedKeywordIndexes.add(keywordIndex);
    matchedQueryWords.push(queryWord);
    matchedKeywordWords.push(keywordWords[keywordIndex]);
  });

  return {
    matchedQueryWords: Array.from(new Set(matchedQueryWords)),
    matchedKeywordWords: Array.from(new Set(matchedKeywordWords)),
  };
};

const isStrongHeaderSuggestion = (suggestion) => {
  if (suggestion.exact_match) return true;
  if (suggestion.phrase_prefix_match) return true;
  if (suggestion.leading_prefix_token_score >= 1) return true;
  if (suggestion.matched_keyword_word_count >= 2) return true;
  if (suggestion.matched_query_word_count >= 2) return true;
  if (suggestion.phrase_includes_match && suggestion.matched_query_word_count >= 1) return true;
  return false;
};

const fetchWeightedProductKeywordSuggestions = async ({
  query,
  category,
  sub_category,
  item_category_id,
  item_subcategory_id,
  only_with_products = false,
  header_strict = false,
  limit = 6,
}) => {
  const normalizedQuery = normalizeTextForSuggest(query);
  const queryWords = tokenizeForSuggest(query);
  const queryOrderTokens = tokenizeForOrder(query);

  if (!queryWords.length) {
    return {
      normalizedQuery,
      queryWords,
      suggestions: [],
    };
  }

  const keywordWhere = { status: 1 };
  keywordWhere[Op.or] = queryWords.map((word) => ({
    name: { [Op.like]: `%${word}%` },
  }));

  const itemSubCategoryWhere = {};
  if (category) itemSubCategoryWhere.category_id = category;
  if (sub_category) itemSubCategoryWhere.subcategory_id = sub_category;
  if (item_category_id) itemSubCategoryWhere.item_category_id = item_category_id;
  if (item_subcategory_id) itemSubCategoryWhere.id = item_subcategory_id;

  const keywords = await ProductKeyword.findAll({
    where: keywordWhere,
    limit: 200,
    attributes: ['id', 'name', 'item_subcategory_id'],
    include: [
      {
        model: ItemSubCategory,
        as: 'ItemSubCategory',
        required: Object.keys(itemSubCategoryWhere).length > 0,
        where: Object.keys(itemSubCategoryWhere).length > 0 ? itemSubCategoryWhere : undefined,
        attributes: ['id', 'name', 'item_category_id', 'category_id', 'subcategory_id'],
        include: [
          { model: Categories, as: 'Categories', required: false, attributes: ['id', 'name'] },
          { model: SubCategories, as: 'SubCategories', required: false, attributes: ['id', 'name'] },
          { model: ItemCategory, as: 'ItemCategory', required: false, attributes: ['id', 'name'] }
        ]
      }
    ]
  });

  const scored = keywords.map((keyword) => {
    const normalizedKeyword = normalizeTextForSuggest(keyword.name);
    const keywordWords = tokenizeForSuggest(keyword.name);
    const keywordOrderTokens = tokenizeForOrder(keyword.name);
    const { matchedQueryWords, matchedKeywordWords } = getSuggestWordMatchStats(queryWords, keywordWords);
    const matchedQueryWordCount = matchedQueryWords.length;
    const matchedKeywordWordCount = matchedKeywordWords.length;
    const matchScore = matchedKeywordWordCount;
    const exactMatch = normalizedKeyword === normalizedQuery;
    const phrasePrefixMatch = normalizedQuery.length >= 2 && normalizedKeyword.startsWith(normalizedQuery);
    const phraseIncludesMatch = normalizedQuery.length >= 2 && normalizedKeyword.includes(normalizedQuery);
    const leadingPrefixTokenScore = getLeadingPrefixTokenScore(queryOrderTokens, keywordOrderTokens);

    const keywordCoverage = keywordWords.length ? matchedKeywordWordCount / keywordWords.length : 0;
    const queryCoverage = queryWords.length ? matchedQueryWordCount / queryWords.length : 0;
    const confidenceScore = exactMatch
      ? 1
      : Number((0.7 * keywordCoverage + 0.3 * queryCoverage).toFixed(3));

    const isConfidentMatch = exactMatch || (matchedKeywordWordCount >= 2 && matchedQueryWordCount >= 2);

    return {
      id: keyword.id,
      user_id: null,
      title: keyword.name,
      category: keyword.ItemSubCategory?.category_id || null,
      category_name: keyword.ItemSubCategory?.Categories?.name || '',
      sub_category: keyword.ItemSubCategory?.subcategory_id || null,
      sub_category_name: keyword.ItemSubCategory?.SubCategories?.name || '',
      item_category_id: keyword.ItemSubCategory?.item_category_id || null,
      item_category_name: keyword.ItemSubCategory?.ItemCategory?.name || '',
      item_subcategory_id: keyword.item_subcategory_id,
      item_subcategory_name: keyword.ItemSubCategory?.name || '',
      item_id: null,
      item_name: '',
      match_score: matchScore,
      confidence_score: confidenceScore,
      exact_match: exactMatch,
      phrase_prefix_match: phrasePrefixMatch,
      phrase_includes_match: phraseIncludesMatch,
      leading_prefix_token_score: leadingPrefixTokenScore,
      matched_words: matchedKeywordWords,
      matched_query_words: matchedQueryWords,
      matched_query_word_count: matchedQueryWordCount,
      matched_keyword_word_count: matchedKeywordWordCount,
      query_word_count: queryWords.length,
      keyword_word_count: keywordWords.length,
      full_query_match: queryWords.length > 0 && matchedQueryWordCount === queryWords.length,
      is_confident_match: isConfidentMatch,
    };
  });

  const matchedScored = scored.filter((item) => (
    item.matched_query_word_count > 0
    || item.matched_keyword_word_count > 0
    || item.leading_prefix_token_score > 0
    || item.phrase_prefix_match
    || item.phrase_includes_match
  ));

  matchedScored.sort((a, b) => {
    if (a.exact_match !== b.exact_match) return a.exact_match ? -1 : 1;
    if (a.leading_prefix_token_score !== b.leading_prefix_token_score) {
      return b.leading_prefix_token_score - a.leading_prefix_token_score;
    }
    if (a.phrase_prefix_match !== b.phrase_prefix_match) return a.phrase_prefix_match ? -1 : 1;
    if (a.phrase_includes_match !== b.phrase_includes_match) return a.phrase_includes_match ? -1 : 1;
    if (a.match_score !== b.match_score) return b.match_score - a.match_score;
    if (a.confidence_score !== b.confidence_score) return b.confidence_score - a.confidence_score;
    return a.title.length - b.title.length;
  });

  let suggestions = matchedScored;

  if (only_with_products && suggestions.length > 0) {
    const keywordIds = suggestions.map((suggestion) => suggestion.id).filter(Boolean);
    const itemSubCategoryIds = suggestions.map((suggestion) => suggestion.item_subcategory_id).filter(Boolean);
    const usedKeywordRows = await Products.findAll({
      where: {
        [Op.or]: [
          keywordIds.length ? { keyword_id: { [Op.in]: keywordIds } } : null,
          itemSubCategoryIds.length ? { item_subcategory_id: { [Op.in]: itemSubCategoryIds } } : null,
        ].filter(Boolean),
        status: 1,
        is_approve: 1,
        is_delete: 0,
      },
      attributes: ['keyword_id', 'item_subcategory_id'],
      group: ['keyword_id', 'item_subcategory_id'],
      raw: true,
    });

    const usedKeywordIds = new Set(usedKeywordRows.map((row) => String(row.keyword_id)));
    const usedItemSubCategoryIds = new Set(usedKeywordRows.map((row) => String(row.item_subcategory_id)));

    suggestions = suggestions.filter((suggestion) => (
      usedKeywordIds.has(String(suggestion.id))
      || usedItemSubCategoryIds.has(String(suggestion.item_subcategory_id))
    ));
  }

  if (header_strict) {
    suggestions = suggestions.filter(isStrongHeaderSuggestion);
  }

  return {
    normalizedQuery,
    queryWords,
    suggestions: suggestions.slice(0, limit),
  };
};

module.exports = {
  fetchWeightedProductKeywordSuggestions,
  normalizeTextForSuggest,
};

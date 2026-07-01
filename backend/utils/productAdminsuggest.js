const { Op } = require('sequelize');
const ProductKeyword = require('../models/ProductKeyword');
const ItemSubCategory = require('../models/ItemSubCategory');
const ItemCategory = require('../models/ItemCategory');
const Categories = require('../models/Categories');
const SubCategories = require('../models/SubCategories');
const Products = require('../models/Products');

const SUGGEST_MATCH_STOP_WORDS = new Set([
   'i','we', 'our', 'us', 'are', 'is', 'am', 'be', 'being', 'been','me', 'my', 'mine','ours', 'you', 'your', 'yours',
'need', 'needs', 'needed',
'want', 'wants', 'wanted',
'looking', 'look',
'find', 'search', 'searching',
'show', 'showing',
'suggest', 'suggestion',
'get', 'give',
'please', 'kindly',
'can', 'could', 'would', 'will', 'shall',
'like',
'require', 'required', 'requires',
'help',
'tell',
'lookingfor',
'buy', 'purchase', 'order',
'available', 'availability',
'best', 'top',
'new', 'latest',
'needing',
'searchingfor','a', 'an', 'the',
'and', 'or',
'for', 'to', 'of', 'in', 'on', 'at', 'by', 'from', 'with','personal',
'use',
'uses',
'using',
'own',
'self','type',
'types','special',
'specially',
'general',
'generic',
'custom',
'customized',
'other',
'any',
'some',
'various',
'different'
]);

const SUGGEST_RANKING_STOP_WORDS = new Set([
  ...SUGGEST_MATCH_STOP_WORDS,
  'i','we', 'our', 'us', 'are', 'is', 'am', 'be', 'being', 'been',
  'manufacturer', 'manufacturing', 'manufacture', 'suppliers', 'supplier', 'trader', 'dealers', 'dealer',
  'company', 'companies', 'products', 'product', 'services', 'service', 'provide', 'providing','need', 'wants','look', 'find','me', 'my', 'mine', 'we', 'our', 'ours', 'you', 'your', 'yours',
'need', 'needs', 'needed',
'want', 'wants', 'wanted',
'lookingfor',
'find', 'search', 'searching',
'show', 'showing',
'suggest', 'suggestion',
'get', 'give',
'please', 'kindly',
'can', 'could', 'would', 'will', 'shall',
'like',
'require', 'required', 'requires',
'help',
'tell',
'looking',
'lookingfor',
'buy', 'purchase', 'order',
'available', 'availability',
'best', 'top',
'new', 'latest',
'needing',
'searchingfor'
]);


const LOCATION_STOP_WORDS = new Set([
    'india',
    'delhi',
    'mumbai',
    'pune',
    'bangalore',
    'bengaluru',
    'hyderabad',
    'chennai',
    'kolkata',
    'ahmedabad',
    'surat',
    'jaipur',
    'indore',
    'dewas',
    'bhopal',
    'noida',
    'gurgaon',
    'gurugram'
]);

const normalizeTextForSuggest = (text = '') =>
  text
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
    
const normalizeWord = (word = '') =>
  word
    .toLowerCase()
    .replace(/'s$/i, '')
    .replace(/ies$/i, 'y')
    .replace(/ers$/i, '')
    .replace(/er$/i, '')
    .replace(/es$/i, '')
    .replace(/s$/i, '');

const tokenizeForSuggest = (text = '') =>
  normalizeTextForSuggest(text)
    .split(' ')
    .map((w) => w.trim())
    .filter((w) =>
    w.length > 1 &&
    !SUGGEST_MATCH_STOP_WORDS.has(w) &&
    !LOCATION_STOP_WORDS.has(w) &&
    !/^\d+$/.test(w) &&
    !/(.)\1{4,}/.test(w) 
);

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

    queryWord = normalizeWord(queryWord);
    keywordWord = normalizeWord(keywordWord);

    if (queryWord === keywordWord) return true;

    // switcher -> switch
    const queryWordWithoutEr = queryWord.replace(/er$/, '');

    if (queryWordWithoutEr.length >= 4 &&
        keywordWord.startsWith(queryWordWithoutEr))
        return true;

    if (keywordWord.startsWith(queryWord)) return true;

    if (
        queryWord.length >= 4 &&
        keywordWord.includes(queryWord)
    )
        return true;

    if (queryWord.startsWith(keywordWord)) return true;

    if (
        queryWord.length >= 5 &&
        keywordWord.length >= 5
    ) {
        const distance = getLevenshteinDistance(queryWord, keywordWord);

        if (distance <= 2)
            return true;
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

    if (suggestion.full_query_match) return true;

    if (suggestion.confidence_score >= 0.80) return true;

    // NEW CONDITION
    if (
        suggestion.matched_query_word_count >= 2 &&
        suggestion.match_score >= 2
    ) return true;

    if (suggestion.phrase_prefix_match) return true;

    if (suggestion.leading_prefix_token_score >= 1) return true;

    if (suggestion.phrase_includes_match) return true;

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
 const dbSearchWords = queryWords
    .filter(word => word.length >= 2);
 
 if (!dbSearchWords.length) {
    return {
        normalizedQuery,
        queryWords,
        suggestions: [],
    };
}

// const longestWord = dbSearchWords.reduce(
//     (a, b) => a.length >= b.length ? a : b
// );

keywordWhere[Op.or] = dbSearchWords.map(word => {

    const prefix =
        word.length >= 8
            ? word.substring(0, 3)
            : word.substring(0, Math.min(4, word.length));

    return {
        name: {
            [Op.like]: `%${prefix}%`
        }
    };
});

  const itemSubCategoryWhere = {};
  if (category) itemSubCategoryWhere.category_id = category;
  if (sub_category) itemSubCategoryWhere.subcategory_id = sub_category;
  if (item_category_id) itemSubCategoryWhere.item_category_id = item_category_id;
  if (item_subcategory_id) itemSubCategoryWhere.id = item_subcategory_id;

const keywords = await ProductKeyword.findAll({
    where: keywordWhere,
    attributes: ['id', 'name', 'item_subcategory_id'],
    limit: 1000,
    raw: true
});

  const scored = keywords.map((keyword) => {
    const normalizedKeyword = normalizeTextForSuggest(keyword.name);
    const keywordWords = tokenizeForSuggest(keyword.name);
    const keywordOrderTokens = tokenizeForOrder(keyword.name);
    const { matchedQueryWords, matchedKeywordWords } = getSuggestWordMatchStats(queryWords, keywordWords);
    const matchedQueryWordCount = matchedQueryWords.length;
    const matchedKeywordWordCount = matchedKeywordWords.length;
   
    const exactMatch = normalizedKeyword === normalizedQuery;
    const phrasePrefixMatch = normalizedQuery.length >= 2 && normalizedKeyword.startsWith(normalizedQuery);
    const phraseIncludesMatch = normalizedQuery.length >= 2 && normalizedKeyword.includes(normalizedQuery);
    const leadingPrefixTokenScore = getLeadingPrefixTokenScore(queryOrderTokens, keywordOrderTokens);
    
    const exactWordMatch = keywordWords.some(
    word => normalizeWord(word) === normalizeWord(queryWords[0])
);
    
const matchScore =
    matchedQueryWordCount * 100 +
    leadingPrefixTokenScore * 20 +
    matchedKeywordWordCount * 50 -
    (keywordWords.length - matchedKeywordWordCount) * 10;

    const keywordCoverage = keywordWords.length ? matchedKeywordWordCount / keywordWords.length : 0;
    const queryCoverage = queryWords.length ? matchedQueryWordCount / queryWords.length : 0;
  let confidenceScore =
    (queryCoverage * 0.9) +
    (keywordCoverage * 0.1);

if (exactMatch)
    confidenceScore = 1;

confidenceScore = Number(confidenceScore.toFixed(3));

    const isConfidentMatch =
    exactMatch ||
    queryCoverage >= 0.8 ||
    confidenceScore >= 0.8;

    return {
      id: keyword.id,
      user_id: null,
      title: keyword.name,
      category: keyword.ItemSubCategory?.category_id || null,
       exact_title_match: normalizedKeyword === normalizedQuery,
       exact_word_match: exactWordMatch,
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

  
const fullyMatched = scored
    .filter(x => x.full_query_match)
    .sort((a, b) => {

        if (a.exact_title_match !== b.exact_title_match)
            return a.exact_title_match ? -1 : 1;

        if (a.match_score !== b.match_score)
            return b.match_score - a.match_score;

        return a.keyword_word_count - b.keyword_word_count;
    });

if (fullyMatched.length) {
    return {
        normalizedQuery,
        queryWords,
        suggestions: fullyMatched.slice(0, limit)
    };
}

const matchedScored = scored.filter(item =>
    item.matched_query_word_count > 0 ||
    item.matched_keyword_word_count > 0 ||
    item.leading_prefix_token_score > 0 ||
    item.phrase_prefix_match ||
    item.phrase_includes_match
);

 matchedScored.sort((a, b) => {
     
     if (a.exact_word_match !== b.exact_word_match)
    return a.exact_word_match ? -1 : 1;

     if (a.exact_title_match !== b.exact_title_match)
        return a.exact_title_match ? -1 : 1;
        
    if (a.exact_match !== b.exact_match)
        return a.exact_match ? -1 : 1;

    if (a.full_query_match !== b.full_query_match)
        return a.full_query_match ? -1 : 1;
       

const aCoverage = a.matched_query_word_count / Math.max(1, a.query_word_count);
const bCoverage = b.matched_query_word_count / Math.max(1, b.query_word_count);

if (aCoverage !== bCoverage)
    return bCoverage - aCoverage;
    
   
        
    if (a.matched_query_word_count !== b.matched_query_word_count)
    return b.matched_query_word_count - a.matched_query_word_count;
    
     if (a.match_score !== b.match_score)
        return b.match_score - a.match_score;

    if (a.confidence_score !== b.confidence_score)
        return b.confidence_score - a.confidence_score;

    if (a.phrase_prefix_match !== b.phrase_prefix_match)
        return a.phrase_prefix_match ? -1 : 1;

    if (a.leading_prefix_token_score !== b.leading_prefix_token_score)
        return b.leading_prefix_token_score - a.leading_prefix_token_score;

    if (a.phrase_includes_match !== b.phrase_includes_match)
        return a.phrase_includes_match ? -1 : 1;
        
        
    // // Same first word ko priority
    // const aStarts = tokenizeForSuggest(a.title)[0] === queryWords[0];
    // const bStarts = tokenizeForSuggest(b.title)[0] === queryWords[0];
    
    // if (aStarts !== bStarts)
    //     return aStarts ? -1 : 1;
    
    // Jis keyword me extra words kam hon usko priority
    const aExtraWords = a.keyword_word_count - a.matched_keyword_word_count;
    const bExtraWords = b.keyword_word_count - b.matched_keyword_word_count;
    
    if (aExtraWords !== bExtraWords)
        return aExtraWords - bExtraWords;    

    return a.keyword_word_count - b.keyword_word_count;

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

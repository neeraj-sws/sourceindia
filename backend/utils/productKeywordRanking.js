const normalizeMatchWord = (word = '') => {
    const normalized = String(word).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalized.length > 3 && normalized.endsWith('ies')) {
        return `${normalized.slice(0, -3)}y`;
    }
    if (
        normalized.length > 3 &&
        normalized.endsWith('s') &&
        !normalized.endsWith('ss') &&
        !normalized.endsWith('us') &&
        !normalized.endsWith('is')
    ) {
        return normalized.slice(0, -1);
    }
    return normalized;
};

const wordsMatch = (queryWord = '', keywordWord = '') => {
    const query = normalizeMatchWord(queryWord);
    const keyword = normalizeMatchWord(keywordWord);
    if (!query || !keyword) return false;
    if (query === keyword) return true;

    const minPrefixLength = 2;
    if (query.length >= minPrefixLength && keyword.startsWith(query)) return true;
    if (keyword.length >= minPrefixLength && query.startsWith(keyword)) return true;

    if (query.length >= 5 && keyword.length >= 5) {
        const rows = query.length + 1;
        const cols = keyword.length + 1;
        const distance = Array.from({ length: rows }, (_, row) =>
            Array.from({ length: cols }, (_, column) => (row === 0 ? column : column === 0 ? row : 0))
        );
        for (let row = 1; row < rows; row += 1) {
            for (let column = 1; column < cols; column += 1) {
                const cost = query[row - 1] === keyword[column - 1] ? 0 : 1;
                distance[row][column] = Math.min(
                    distance[row - 1][column] + 1,
                    distance[row][column - 1] + 1,
                    distance[row - 1][column - 1] + cost
                );
            }
        }
        if (distance[rows - 1][cols - 1] <= 1) return true;
    }

    return false;
};

const getKeywordMatchMetrics = (queryWords = [], keywordWords = []) => {
    const matchedQueryIndexes = new Set();
    const matchedKeywordIndexes = new Set();
    const matchedQueryWords = [];
    const matchedKeywordWords = [];

    keywordWords.forEach((keywordWord, keywordIndex) => {
        const queryIndex = queryWords.findIndex(
            (queryWord, index) => !matchedQueryIndexes.has(index) && wordsMatch(queryWord, keywordWord)
        );
        if (queryIndex === -1) return;

        matchedQueryIndexes.add(queryIndex);
        matchedKeywordIndexes.add(keywordIndex);
        matchedQueryWords.push(queryWords[queryIndex]);
        matchedKeywordWords.push(keywordWord);
    });

    let longestConsecutiveMatch = 0;
    let currentConsecutiveMatch = 0;
    keywordWords.forEach((keywordWord, index) => {
        if (matchedKeywordIndexes.has(index)) {
            currentConsecutiveMatch += 1;
            longestConsecutiveMatch = Math.max(longestConsecutiveMatch, currentConsecutiveMatch);
        } else {
            currentConsecutiveMatch = 0;
        }
    });

    const uniqueMatchedKeywordWords = new Set(matchedKeywordWords.map(normalizeMatchWord));
    const uniqueMatchedQueryWords = new Set(matchedQueryWords.map(normalizeMatchWord));
    const uniqueKeywordWords = new Set(keywordWords.map(normalizeMatchWord));
    const matchedKeywordWordCount = uniqueMatchedKeywordWords.size;
    const matchedQueryWordCount = uniqueMatchedQueryWords.size;
    const keywordCoverage = uniqueKeywordWords.size ? matchedKeywordWordCount / uniqueKeywordWords.size : 0;
    const queryCoverage = queryWords.length ? matchedQueryWordCount / queryWords.length : 0;

    return {
        matchedQueryWords: Array.from(uniqueMatchedQueryWords),
        matchedKeywordWords: Array.from(uniqueMatchedKeywordWords),
        matchedQueryWordCount,
        matchedKeywordWordCount,
        keywordCoverage,
        queryCoverage,
        longestConsecutiveMatch,
        fullKeywordMatch: uniqueKeywordWords.size > 0 && matchedKeywordWordCount === uniqueKeywordWords.size,
    };
};

const compareProductKeywordSuggestions = (a, b) => {
    for (const field of ['matched_keyword_word_count', 'keyword_coverage', 'longest_consecutive_match']) {
        if (a[field] !== b[field]) return b[field] - a[field];
    }

    if (a.full_keyword_match !== b.full_keyword_match) return a.full_keyword_match ? -1 : 1;

    if (a.query_coverage !== b.query_coverage) return b.query_coverage - a.query_coverage;

    for (const field of ['exact_match', 'phrase_prefix_match', 'phrase_includes_match']) {
        if (a[field] !== b[field]) return a[field] ? -1 : 1;
    }

    for (const field of ['leading_prefix_token_score', 'match_score', 'confidence_score']) {
        if (a[field] !== b[field]) return b[field] - a[field];
    }

    return a.title.length - b.title.length;
};

module.exports = {
    getKeywordMatchMetrics,
    compareProductKeywordSuggestions,
    normalizeMatchWord,
    wordsMatch,
};

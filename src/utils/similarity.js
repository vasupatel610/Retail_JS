// src/utils/similarity.js
import { productTypeRules, occasionRules, colors } from '../config/taxonomy.js';
import { normalizeText } from './text_cleaner.js';

// TF-IDF and BM25 scoring for better linear search
let tfidfCache = null;
let avgDocLength = 0;

export function buildTFIDFIndex(products) {
  if (tfidfCache) return tfidfCache;
  
  const docs = products.map(p => p.search_doc);
  const vocab = new Map();
  const docFreq = new Map();
  const docLengths = [];
  
  // Build vocabulary and document frequencies
  docs.forEach((doc, docIdx) => {
    const tokens = normalizeText(doc).split(/\s+/).filter(Boolean);
    docLengths.push(tokens.length);
    
    const termFreq = new Map();
    tokens.forEach(token => {
      termFreq.set(token, (termFreq.get(token) || 0) + 1);
      docFreq.set(token, (docFreq.get(token) || 0) + 1);
    });
    
    // Store term frequencies for this document
    docs[docIdx] = { text: doc, termFreq, tokens };
  });
  
  avgDocLength = docLengths.reduce((a, b) => a + b, 0) / docLengths.length;
  
  tfidfCache = { docs, vocab: docFreq, avgDocLength };
  return tfidfCache;
}

export function tfidfScore(doc, queryTokens) {
  if (!tfidfCache) return 0;
  
  const docTokens = doc.tokens || normalizeText(doc.search_doc || doc).split(/\s+/).filter(Boolean);
  const docLength = docTokens.length;
  const totalDocs = tfidfCache.docs.length;
  
  let score = 0;
  queryTokens.forEach(token => {
    const tf = (doc.termFreq?.get(token) || 0) / docLength;
    const df = tfidfCache.vocab.get(token) || 0;
    const idf = Math.log((totalDocs + 1) / (df + 1));
    score += tf * idf;
  });
  
  return score;
}

export function bm25Score(doc, queryTokens, k1 = 1.2, b = 0.75) {
  if (!tfidfCache) return 0;
  
  const docTokens = doc.tokens || normalizeText(doc.search_doc || doc).split(/\s+/).filter(Boolean);
  const docLength = docTokens.length;
  const totalDocs = tfidfCache.docs.length;
  
  let score = 0;
  queryTokens.forEach(token => {
    const tf = doc.termFreq?.get(token) || 0;
    const df = tfidfCache.vocab.get(token) || 0;
    const idf = Math.log((totalDocs - df + 0.5) / (df + 0.5));
    
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / tfidfCache.avgDocLength));
    score += idf * (numerator / denominator);
  });
  
  return score;
}

// Enhanced fuzzy matching with Levenshtein distance
export function fuzzyMatch(query, text, threshold = 0.8) {
  const queryLower = query.toLowerCase();
  const textLower = text.toLowerCase();
  
  // Exact match gets highest score
  if (textLower.includes(queryLower)) return 1.0;
  
  // Substring match
  if (queryLower.length > 2 && textLower.includes(queryLower.substring(0, Math.floor(queryLower.length * 0.7)))) {
    return 0.9;
  }
  
  // Word-level fuzzy matching
  const queryWords = queryLower.split(/\s+/);
  const textWords = textLower.split(/\s+/);
  
  let bestScore = 0;
  queryWords.forEach(qWord => {
    textWords.forEach(tWord => {
      if (qWord.length < 3 || tWord.length < 3) return;
      
      const similarity = levenshteinSimilarity(qWord, tWord);
      if (similarity > bestScore) bestScore = similarity;
    });
  });
  
  return bestScore;
}

// Evaluation metrics for search quality
export function calculatePrecisionRecall(groundTruth, searchResults, topK = 10) {
  if (!groundTruth || groundTruth.length === 0) {
    return { precision: 0, recall: 0, f1: 0, relevantFound: 0, totalRelevant: 0 };
  }
  
  const relevantIds = new Set(groundTruth.map(item => item.id || item));
  const topResults = searchResults.slice(0, topK);
  
  let relevantFound = 0;
  topResults.forEach(result => {
    if (relevantIds.has(result.id)) {
      relevantFound++;
    }
  });
  
  const precision = relevantFound / topResults.length;
  const recall = relevantFound / groundTruth.length;
  const f1 = (precision + recall > 0) ? (2 * precision * recall) / (precision + recall) : 0;
  
  return {
    precision: Math.round(precision * 1000) / 1000, // Round to 3 decimal places
    recall: Math.round(recall * 1000) / 1000,
    f1: Math.round(f1 * 1000) / 1000,
    relevantFound,
    totalRelevant: groundTruth.length,
    totalResults: topResults.length
  };
}

// Calculate Mean Average Precision (MAP) for ranking quality
export function calculateMAP(groundTruth, searchResults, topK = 10) {
  if (!groundTruth || groundTruth.length === 0) return 0;
  
  const relevantIds = new Set(groundTruth.map(item => item.id || item));
  const topResults = searchResults.slice(0, topK);
  
  let relevantFound = 0;
  let sumPrecision = 0;
  
  topResults.forEach((result, index) => {
    if (relevantIds.has(result.id)) {
      relevantFound++;
      const precisionAtK = relevantFound / (index + 1);
      sumPrecision += precisionAtK;
    }
  });
  
  return relevantFound > 0 ? Math.round((sumPrecision / relevantFound) * 1000) / 1000 : 0;
}

// Calculate Normalized Discounted Cumulative Gain (nDCG) for ranking quality
export function calculateNDCG(groundTruth, searchResults, topK = 10) {
  if (!groundTruth || groundTruth.length === 0) return 0;
  
  const relevantIds = new Set(groundTruth.map(item => item.id || item));
  const topResults = searchResults.slice(0, topK);
  
  let dcg = 0;
  let idcg = 0;
  
  // Calculate DCG for actual results
  topResults.forEach((result, index) => {
    const relevance = relevantIds.has(result.id) ? 1 : 0;
    dcg += relevance / Math.log2(index + 2); // +2 because log2(1) = 0
  });
  
  // Calculate ideal DCG (perfect ranking)
  const idealRelevance = Array.from({ length: Math.min(topK, groundTruth.length) }, () => 1);
  idealRelevance.forEach((relevance, index) => {
    idcg += relevance / Math.log2(index + 2);
  });
  
  return idcg > 0 ? Math.round((dcg / idcg) * 1000) / 1000 : 0;
}

function levenshteinSimilarity(str1, str2) {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + indicator
      );
    }
  }
  
  const maxLen = Math.max(str1.length, str2.length);
  return maxLen === 0 ? 1 : (maxLen - matrix[str2.length][str1.length]) / maxLen;
}

// Enhanced lexical scoring with multiple methods
export function enhancedLexicalScore(doc, queryTokens, method = 'combined') {
  switch (method) {
    case 'tfidf':
      return tfidfScore(doc, queryTokens);
    case 'bm25':
      return bm25Score(doc, queryTokens);
    case 'fuzzy':
      return queryTokens.reduce((score, token) => {
        return score + fuzzyMatch(token, doc.search_doc || doc);
      }, 0) / queryTokens.length;
    case 'combined':
    default:
      const tfidf = tfidfScore(doc, queryTokens);
      const bm25 = bm25Score(doc, queryTokens);
      const fuzzy = queryTokens.reduce((score, token) => {
        return score + fuzzyMatch(token, doc.search_doc || doc);
      }, 0) / queryTokens.length;
      return (tfidf + bm25 + fuzzy) / 3;
  }
}


export function cosineSimilarity(a, b) {
// Vectors are normalized; dot product equals cosine similarity
let dot = 0;
for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
return dot;
}


export function lexicalScore(doc, tokens) {
let s = 0;
for (const t of tokens) if (doc.includes(t)) s += 1;
return s;
}


export function parseFacets(query, vocab = null) {
const q = query.toLowerCase();
const facets = {};

// Colors
for (const c of colors) if (new RegExp(`\\b${c}\\b`).test(q)) facets.color = c;
if (/\bgrey\b/.test(q)) facets.color = 'gray';

// Category/brand/material directly from vocab terms appearing in query
if (vocab) {
  for (const cat of vocab.categories) if (new RegExp(`\\b${cat}\\b`).test(q)) { facets.category = cat; break; }
  for (const br of vocab.brands) if (new RegExp(`\\b${br.toLowerCase()}\\b`).test(q)) { facets.brand = br; break; }
  for (const mat of vocab.materials) if (new RegExp(`\\b${mat}\\b`).test(q)) { facets.material = mat; break; }
  for (const occ of vocab.occasions) if (new RegExp(`\\b${occ}\\b`).test(q)) { facets.occasion = occ; break; }
  for (const ag of vocab.ageGroups) if (new RegExp(`\\b${ag.replace(/\s+/g,'\\s+')}\\b`).test(q)) { facets.age_group = ag; break; }
  // sizes: match exact tokens such as xs, s, m, l, xl, xxl, one_size, 7uk, etc.
  for (const sz of vocab.sizes) if (new RegExp(`(^|\b)${sz.replace(/\+/g,'\\+')}($|\b)`).test(q)) { facets.size = sz; break; }
}

// product type/occasion rules (optional, enrich but not enforced in filtering unless they map to existing fields)
for (const r of occasionRules) if (r.re.test(q)) facets.occasion = facets.occasion || r.val;
for (const r of productTypeRules) if (r.re.test(q)) { facets.product_type = r.val; break; }

// Price parsing
// Helper to parse amounts like $2,000, 2000$, rs 2,000, inr 2000
const parseAmount = (s) => {
  if (!s) return null;
  const cleaned = s.replace(/[,\s]/g, '')
                   .replace(/^(usd|inr|rs|rs\.|rupees?|dollars?)\s*/i, '')
                   .replace(/[$₹]/g, '')
                   .replace(/\s*(usd|inr|rs|rs\.|rupees?|dollars?)$/i, '')
                   .replace(/\$/g, '');
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
};

// between X and Y / from X to Y
let m = q.match(/\b(?:between|from)\s+([$₹]?\s?\d[\d,]*\.?\d*)\s+(?:and|to)\s+([$₹]?\s?\d[\d,]*\.?\d*)/i);
if (m) {
  const a = parseAmount(m[1]);
  const b = parseAmount(m[2]);
  if (a != null && b != null) {
    facets.price_min = Math.min(a, b);
    facets.price_max = Math.max(a, b);
  }
}

// under/below/less than X
if (facets.price_max == null) {
  m = q.match(/\b(?:under|below|less than|<=?)\s+([$₹]?\s?\d[\d,]*\.?\d*)/i);
  if (m) {
    const val = parseAmount(m[1]);
    if (val != null) facets.price_max = val;
  }
}

// over/above/greater than X
if (facets.price_min == null) {
  m = q.match(/\b(?:over|above|greater than|>=?)\s+([$₹]?\s?\d[\d,]*\.?\d*)/i);
  if (m) {
    const val = parseAmount(m[1]);
    if (val != null) facets.price_min = val;
  }
}

// explicit price like $2000 or 2000$ or rs 2000
if (facets.price_min == null && facets.price_max == null) {
  m = q.match(/(?:^|\s)(?:[$₹]\s?\d[\d,]*\.?\d*|\d[\d,]*\.?\d*\s?[$₹]|(?:rs|inr|usd)\.?\s*\d[\d,]*\.?\d*)/i);
  if (m) {
    const val = parseAmount(m[0]);
    if (val != null) {
      facets.price_min = val;
      facets.price_max = val;
    }
  }
}

return facets;
}


export function filterByFacets(items, facets) {
const keys = Object.keys(facets);
if (keys.length === 0) return items;
return items.filter(p => {
if (facets.color && p.color && p.color !== facets.color) return false;
if (facets.category && p.category && p.category.toLowerCase() !== facets.category) return false;
if (facets.brand && p.brand && p.brand.toLowerCase() !== facets.brand) return false;
if (facets.material && p.material && p.material !== facets.material) return false;
if (facets.occasion && p.occasion && p.occasion !== facets.occasion) return false;
if (facets.age_group && p.age_group && p.age_group !== facets.age_group) return false;
if (facets.size && p.size && p.size !== facets.size) return false;
// Price range filtering (inclusive)
 if ((facets.price_min != null || facets.price_max != null)) {
   const priceVal = Number.isFinite(p.price) ? p.price : null;
   if (priceVal == null) return false;
   if (facets.price_min != null && priceVal < facets.price_min) return false;
   if (facets.price_max != null && priceVal > facets.price_max) return false;
 }
return true;
});
}


export function tokensFromQuery(query) {
return normalizeText(query).split(/\s+/).filter(Boolean);
}
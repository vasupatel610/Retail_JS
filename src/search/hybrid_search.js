// src/search/hybrid_search.js
import { embedQuery } from '../utils/embeddings.js';
import { 
  cosineSimilarity, 
  enhancedLexicalScore, 
  buildTFIDFIndex,
  parseFacets, 
  filterByFacets, 
  tokensFromQuery 
} from '../utils/similarity.js';

// Performance optimization: cache TF-IDF index
let tfidfIndex = null;

function businessBoost(item, medianPrice) {
  if ((item.stock_status || '') === 'in_stock') item.final_score += 0.2;
  if (medianPrice && Number.isFinite(item.price)) {
    const diff = Math.abs(item.price - medianPrice);
    if (diff <= 0.1 * medianPrice) item.final_score += 0.1;
  }
}

// Enhanced hybrid search combining SBERT with multiple linear search methods
export async function hybridSearch(products, extractor, query, { 
  topK = 5, 
  lexicalWeight = 0.3, 
  useFacets = true, 
  medianPrice = null, 
  vocab = null, 
  candidatePool = null,
  linearMethod = 'combined', // 'tfidf', 'bm25', 'fuzzy', 'combined'
  semanticWeight = 0.7,
  earlyTermination = true,
  minScoreThreshold = 0.1
} = {}) {
  
  // Initialize TF-IDF index if not already done
  if (!tfidfIndex) {
    tfidfIndex = buildTFIDFIndex(products);
  }
  
  const tokens = tokensFromQuery(query);
  const facets = parseFacets(query, vocab);

  // Optional facet prefilter to shrink the candidate set
  let base = products;
  if (useFacets) {
    base = filterByFacets(products, facets);
  }

  // Enhanced linear prefilter with multiple scoring methods
  const lexRanked = base.map(p => ({ 
    ...p, 
    lexical: enhancedLexicalScore(p, tokens, linearMethod)
  }))
  .sort((a, b) => b.lexical - a.lexical);

  const poolSize = candidatePool ?? Math.max(topK * 15, 150); // Increased pool for better coverage
  const candidates = lexRanked.slice(0, Math.min(poolSize, lexRanked.length));

  // Get semantic embeddings for the query
  const qVec = await embedQuery(extractor, query);

  // Score candidates with both semantic and enhanced lexical methods
  let scored = candidates.map(p => {
    const semantic = cosineSimilarity(qVec, p.embedding);
    const lexical = p.lexical;
    
    // Normalize scores to 0-1 range for better combination
    const normalizedSemantic = Math.max(0, semantic);
    const normalizedLexical = Math.max(0, Math.min(1, lexical / 10)); // Scale lexical scores
    
    // Weighted combination
    const final_score = (semanticWeight * normalizedSemantic) + (lexicalWeight * normalizedLexical);
    
    return { 
      ...p, 
      semantic_score: semantic, 
      lexical_score: lexical,
      final_score 
    };
  });

  // Apply business logic boosts
  for (const it of scored) businessBoost(it, medianPrice);

  // Sort by final score
  scored.sort((a, b) => b.final_score - a.final_score);

  // Early termination: stop if we have enough high-quality results
  if (earlyTermination) {
    const highQualityResults = scored.filter(item => item.final_score >= minScoreThreshold);
    if (highQualityResults.length >= topK) {
      scored = highQualityResults;
    }
  }

  return scored.slice(0, topK);
}

// Fast linear-only search for when semantic search is too slow
export function fastLinearSearch(products, query, { 
  topK = 5, 
  useFacets = true, 
  vocab = null,
  method = 'combined'
} = {}) {
  
  if (!tfidfIndex) {
    tfidfIndex = buildTFIDFIndex(products);
  }
  
  const tokens = tokensFromQuery(query);
  const facets = parseFacets(query, vocab);

  let base = products;
  if (useFacets) {
    base = filterByFacets(products, facets);
  }

  const scored = base.map(p => ({
    ...p,
    score: enhancedLexicalScore(p, tokens, method),
    method: 'linear_only'
  }))
  .sort((a, b) => b.score - a.score)
  .slice(0, topK);

  return scored;
}

// Adaptive search that chooses the best method based on query characteristics
export async function adaptiveSearch(products, extractor, query, options = {}) {
  const tokens = tokensFromQuery(query);
  
  // Determine if query is more suitable for linear or semantic search
  const isSpecificQuery = tokens.length <= 2 && tokens.some(t => t.length <= 4);
  const hasBrandOrCategory = tokens.some(t => 
    options.vocab?.brands?.includes(t.toLowerCase()) ||
    options.vocab?.categories?.includes(t.toLowerCase())
  );
  
  // Use fast linear search for specific queries, hybrid for complex ones
  if (isSpecificQuery || hasBrandOrCategory) {
    return fastLinearSearch(products, query, options);
  } else {
    return hybridSearch(products, extractor, query, options);
  }
}
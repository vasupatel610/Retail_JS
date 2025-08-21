// src/search/hybrid_search.js
import { embedQuery } from '../utils/embeddings.js';
import { cosineSimilarity, lexicalScore, parseFacets, filterByFacets, tokensFromQuery } from '../utils/similarity.js';


function businessBoost(item, medianPrice) {
if ((item.stock_status || '') === 'in_stock') item.final_score += 0.2;
if (medianPrice && Number.isFinite(item.price)) {
const diff = Math.abs(item.price - medianPrice);
if (diff <= 0.1 * medianPrice) item.final_score += 0.1;
}
}


export async function hybridSearch(products, extractor, query, { topK = 5, lexicalWeight = 0.1, useFacets = true, medianPrice = null, vocab = null, candidatePool = null } = {}) {
const tokens = tokensFromQuery(query);
const facets = parseFacets(query, vocab);

// Optional facet prefilter to shrink the candidate set
let base = products;
if (useFacets) base = filterByFacets(products, facets);

// Lexical prefilter: pick top-N by lexical, then compute semantic only for them
const lexRanked = base.map(p => ({ ...p, lexical: lexicalScore(p.search_doc, tokens) }))
  .sort((a, b) => b.lexical - a.lexical);

const poolSize = candidatePool ?? Math.max(topK * 10, 100);
const candidates = lexRanked.slice(0, Math.min(poolSize, lexRanked.length));

const qVec = await embedQuery(extractor, query);

let scored = candidates.map(p => {
const sem = cosineSimilarity(qVec, p.embedding);
const final_score = sem + lexicalWeight * p.lexical;
return { ...p, score: sem, final_score };
});

for (const it of scored) businessBoost(it, medianPrice);

scored.sort((a, b) => b.final_score - a.final_score);
return scored.slice(0, topK);
}
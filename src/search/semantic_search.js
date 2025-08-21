// src/search/semantic_search.js
import { embedQuery } from '../utils/embeddings.js';
import { cosineSimilarity, parseFacets, filterByFacets } from '../utils/similarity.js';


export async function semanticSearch(products, extractor, query, topK = 5, { useFacets = false, vocab = null } = {}) {
const qVec = await embedQuery(extractor, query);
let scored = products.map(p => ({
...p,
score: cosineSimilarity(qVec, p.embedding)
}));
if (useFacets) {
  const facets = parseFacets(query, vocab);
  scored = filterByFacets(scored, facets);
}
return scored.sort((a, b) => b.score - a.score).slice(0, topK);
}
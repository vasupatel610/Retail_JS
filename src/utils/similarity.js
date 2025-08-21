// src/utils/similarity.js
import { productTypeRules, occasionRules, colors } from '../config/taxonomy.js';
import { normalizeText } from './text_cleaner.js';


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
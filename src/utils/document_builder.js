// src/utils/document_builder.js

/**
 * Builds a weighted search document that emphasizes important product attributes
 * with proper semantic structure and repeats critical terms for better embedding
 */
export function buildSearchDoc(p) {
  // Basic validation
  if (!p) return '';
  
  // Core product info (highest weight, repeat multiple times)
  const coreParts = [
    p.name || '',
    p.description || '',
    `${p.category || ''} ${p.brand || ''}`
  ].filter(Boolean);
  
  // Key attributes (medium weight, repeat twice)
  const keyAttributes = [
    `color: ${p.color || ''}`,
    `material: ${p.material || ''}`,
    `occasion: ${p.occasion || ''}`,
    `for: ${p.age_group || ''}`
  ].filter(s => s.includes(': ') && s.length > 9);
  
  // Secondary attributes (lower weight, mentioned once)
  const secondaryAttributes = [
    `size ${p.size || ''}`,
    `price range: ${getPriceRange(p.price) || ''}`
  ].filter(Boolean);
  
  // Build final document with weighted repetition
  return [
    // Core parts (3x weight)
    ...coreParts, ...coreParts, ...coreParts,
    // Key attributes (2x weight)
    ...keyAttributes, ...keyAttributes,
    // Secondary attributes (1x weight)
    ...secondaryAttributes
  ].join(' ');
}

/**
 * Helper to determine a general price range description
 */
function getPriceRange(price) {
  if (!price || typeof price !== 'number') return '';
  
  if (price < 1000) return 'budget';
  if (price < 3000) return 'affordable';
  if (price < 5000) return 'mid-range';
  if (price < 8000) return 'premium';
  return 'luxury';
}

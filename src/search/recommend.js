// src/search/recommend.js
import { cosineSimilarity } from '../utils/similarity.js';
import { rankProducts, getContextualWeights } from '../utils/recommendation_scorer.js';
import { heuristicRecommend, heuristicRecommendWithCustomWeights, analyzeRecommendationSets } from './heuristic_recommend.js';

/**
 * Enhanced recommendation system with multi-factor scoring
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID for recommendations
 * @param {Object} options - Recommendation options
 * @returns {Array} - Recommended products with detailed scoring
 */
export function recommendSimilar(products, productId, options = {}) {
  const {
    topK = 5,
    purpose = 'similar',
    context = {},
    includeScoring = false,
    minScore = 0.1
  } = options;
  
  // Find base product
  const baseProduct = products.find(p => p.id === productId);
  if (!baseProduct) {
    console.warn(`Product with ID ${productId} not found`);
    return [];
  }
  
  // Use advanced ranking system
  const recommendations = rankProducts(baseProduct, products, {
    topK,
    purpose,
    context,
    minScore
  });
  
  // Return with or without detailed scoring information
  if (includeScoring) {
    return recommendations;
  }
  
  // Return simplified format for backward compatibility
  return recommendations.map(product => ({
    ...product,
    score: product.recommendation_score
  }));
}

/**
 * Get outfit recommendations (cross-category items that work together)
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @param {Object} options - Options for outfit recommendations
 * @returns {Array} - Outfit-compatible products
 */
export function recommendOutfit(products, productId, options = {}) {
  return recommendSimilar(products, productId, {
    ...options,
    purpose: 'outfit'
  });
}

/**
 * Get occasion-based recommendations
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @param {string} occasion - Target occasion
 * @param {Object} options - Additional options
 * @returns {Array} - Occasion-appropriate recommendations
 */
export function recommendForOccasion(products, productId, occasion, options = {}) {
  return recommendSimilar(products, productId, {
    ...options,
    purpose: 'occasion',
    context: { occasion }
  });
}

/**
 * Get brand-consistent recommendations
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @param {Object} options - Additional options
 * @returns {Array} - Brand-consistent recommendations
 */
export function recommendSameBrand(products, productId, options = {}) {
  return recommendSimilar(products, productId, {
    ...options,
    purpose: 'brand'
  });
}

/**
 * Get budget-conscious recommendations
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @param {Object} budget - Budget constraints {min, max}
 * @param {Object} options - Additional options
 * @returns {Array} - Budget-appropriate recommendations
 */
export function recommendWithinBudget(products, productId, budget, options = {}) {
  return recommendSimilar(products, productId, {
    ...options,
    purpose: 'budget',
    context: { budget }
  });
}

/**
 * Heuristic Rule-Based Expansion recommendations with tiered sets
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @param {Object} options - Heuristic recommendation options
 * @returns {Array} - Tiered recommendations with set information
 */
export function recommendHeuristic(products, productId, options = {}) {
  return heuristicRecommend(products, productId, options);
}

/**
 * Heuristic recommendations with custom weight tuning
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @param {Object} customWeights - Custom weights for different sets
 * @param {Object} options - Additional options
 * @returns {Array} - Recommendations with custom weighting
 */
export function recommendHeuristicCustom(products, productId, customWeights, options = {}) {
  return heuristicRecommendWithCustomWeights(products, productId, customWeights, options);
}

/**
 * Analyze how products would be distributed across recommendation sets
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @returns {Object} - Analysis of set distribution
 */
export function analyzeProductSets(products, productId) {
  return analyzeRecommendationSets(products, productId);
}

/**
 * Master recommendation function that can use different algorithms
 * @param {Array} products - All available products
 * @param {string} productId - Base product ID
 * @param {Object} options - Comprehensive recommendation options
 * @returns {Array|Object} - Recommendations based on selected algorithm
 */
export function recommendMaster(products, productId, options = {}) {
  const {
    algorithm = 'advanced', // 'advanced', 'heuristic', 'legacy'
    ...restOptions
  } = options;
  
  switch (algorithm) {
    case 'heuristic':
      return recommendHeuristic(products, productId, restOptions);
    case 'legacy':
      return recommendSimilarLegacy(products, productId, restOptions.topK || 5);
    case 'advanced':
    default:
      return recommendSimilar(products, productId, restOptions);
  }
}

// Legacy function for backward compatibility
export function recommendSimilarLegacy(products, productId, topK = 5) {
  const base = products.find(p => p.id === productId);
  if (!base) return [];
  return products
    .filter(p => p.id !== productId)
    .map(p => ({ ...p, score: cosineSimilarity(base.embedding, p.embedding) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

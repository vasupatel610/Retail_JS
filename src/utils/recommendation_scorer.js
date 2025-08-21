// src/utils/recommendation_scorer.js
import { cosineSimilarity } from './similarity.js';
import { 
  colorSimilarity, 
  materialSimilarity, 
  occasionSimilarity, 
  sizeSimilarity,
  ageGroupSimilarity,
  brandSimilarity,
  categorySimilarity,
  priceSimilarity
} from './product_similarity.js';

/**
 * Default weights for different scoring factors
 */
export const DEFAULT_WEIGHTS = {
  semantic: 0.25,      // Embedding similarity
  category: 0.15,      // Category compatibility
  brand: 0.12,         // Brand affinity
  color: 0.12,         // Color harmony
  material: 0.10,      // Material compatibility
  occasion: 0.10,      // Occasion matching
  price: 0.08,         // Price range compatibility
  age_group: 0.05,     // Age group targeting
  size: 0.03           // Size compatibility
};

/**
 * Calculate comprehensive product similarity score
 * @param {Object} baseProduct - Base product for comparison
 * @param {Object} candidateProduct - Candidate product to score
 * @param {Object} options - Scoring options and weights
 * @returns {Object} - Detailed scoring breakdown
 */
export function calculateProductScore(baseProduct, candidateProduct, options = {}) {
  const weights = { ...DEFAULT_WEIGHTS, ...options.weights };
  const context = options.context || {};
  
  // Calculate individual similarity scores
  const scores = {
    semantic: cosineSimilarity(baseProduct.embedding, candidateProduct.embedding),
    category: categorySimilarity(baseProduct.category, candidateProduct.category),
    brand: brandSimilarity(baseProduct.brand, candidateProduct.brand),
    color: colorSimilarity(baseProduct.color, candidateProduct.color),
    material: materialSimilarity(
      baseProduct.material, 
      candidateProduct.material, 
      context.occasion || baseProduct.occasion
    ),
    occasion: occasionSimilarity(baseProduct.occasion, candidateProduct.occasion),
    price: priceSimilarity(baseProduct.price, candidateProduct.price),
    age_group: ageGroupSimilarity(baseProduct.age_group, candidateProduct.age_group),
    size: sizeSimilarity(
      baseProduct.size, 
      candidateProduct.size, 
      candidateProduct.category
    )
  };
  
  // Apply business rules and adjustments
  const adjustments = calculateBusinessAdjustments(baseProduct, candidateProduct, context);
  
  // Calculate weighted final score
  let finalScore = 0;
  for (const [factor, score] of Object.entries(scores)) {
    finalScore += score * weights[factor];
  }
  
  // Apply business adjustments
  finalScore += adjustments.total;
  
  // Ensure score stays within bounds
  finalScore = Math.max(0, Math.min(1, finalScore));
  
  return {
    score: finalScore,
    breakdown: scores,
    adjustments,
    weights
  };
}

/**
 * Calculate business rule adjustments
 * @param {Object} baseProduct - Base product
 * @param {Object} candidateProduct - Candidate product
 * @param {Object} context - Additional context
 * @returns {Object} - Adjustment breakdown
 */
function calculateBusinessAdjustments(baseProduct, candidateProduct, context) {
  const adjustments = {
    stock_boost: 0,
    price_range_boost: 0,
    diversity_penalty: 0,
    cross_category_bonus: 0,
    total: 0
  };
  
  // Stock status boost
  if (candidateProduct.stock_status === 'in_stock') {
    adjustments.stock_boost = 0.05;
  }
  
  // Price range appropriateness
  if (context.budget) {
    const price = candidateProduct.price || 0;
    if (price <= context.budget.max && price >= context.budget.min) {
      adjustments.price_range_boost = 0.03;
    }
  }
  
  // Cross-category bonus for outfit recommendations
  if (baseProduct.category !== candidateProduct.category) {
    const categoryPairs = [
      ['clothing', 'footwear'],
      ['clothing', 'accessories'],
      ['footwear', 'accessories']
    ];
    
    for (const [cat1, cat2] of categoryPairs) {
      if ((baseProduct.category === cat1 && candidateProduct.category === cat2) ||
          (baseProduct.category === cat2 && candidateProduct.category === cat1)) {
        adjustments.cross_category_bonus = 0.04;
        break;
      }
    }
  }
  
  // Diversity penalty for too-similar items
  if (baseProduct.category === candidateProduct.category && 
      baseProduct.brand === candidateProduct.brand &&
      baseProduct.color === candidateProduct.color) {
    adjustments.diversity_penalty = -0.02;
  }
  
  // Calculate total adjustment
  adjustments.total = Object.values(adjustments).reduce((sum, val) => sum + val, 0) - adjustments.total;
  
  return adjustments;
}

/**
 * Contextual weight adjustments based on recommendation purpose
 * @param {string} purpose - Recommendation purpose ('similar', 'outfit', 'occasion', etc.)
 * @param {Object} baseWeights - Base weights to adjust
 * @returns {Object} - Adjusted weights
 */
export function getContextualWeights(purpose, baseWeights = DEFAULT_WEIGHTS) {
  const weights = { ...baseWeights };
  
  switch (purpose) {
    case 'similar':
      // Emphasize semantic and category similarity
      weights.semantic = 0.35;
      weights.category = 0.25;
      weights.brand = 0.15;
      break;
      
    case 'outfit':
      // Emphasize color harmony and cross-category compatibility
      weights.color = 0.20;
      weights.category = 0.05;
      weights.occasion = 0.15;
      weights.material = 0.15;
      break;
      
    case 'occasion':
      // Emphasize occasion and material appropriateness
      weights.occasion = 0.30;
      weights.material = 0.20;
      weights.category = 0.10;
      break;
      
    case 'brand':
      // Emphasize brand consistency
      weights.brand = 0.40;
      weights.semantic = 0.20;
      break;
      
    case 'budget':
      // Emphasize price compatibility
      weights.price = 0.25;
      weights.semantic = 0.20;
      break;
  }
  
  return weights;
}

/**
 * Filter and rank products based on comprehensive scoring
 * @param {Object} baseProduct - Base product for recommendations
 * @param {Array} candidates - Candidate products to score
 * @param {Object} options - Scoring and filtering options
 * @returns {Array} - Ranked and scored recommendations
 */
export function rankProducts(baseProduct, candidates, options = {}) {
  const {
    topK = 5,
    purpose = 'similar',
    context = {},
    minScore = 0.1,
    maxSameCategory = Math.ceil(topK * 0.7),
    diversityThreshold = 0.3
  } = options;
  
  // Get contextual weights
  const weights = getContextualWeights(purpose, options.weights);
  
  // Score all candidates
  const scoredCandidates = candidates
    .filter(candidate => candidate.id !== baseProduct.id)
    .map(candidate => {
      const scoring = calculateProductScore(baseProduct, candidate, { weights, context });
      return {
        ...candidate,
        recommendation_score: scoring.score,
        scoring_breakdown: scoring
      };
    })
    .filter(item => item.recommendation_score >= minScore);
  
  // Sort by score
  scoredCandidates.sort((a, b) => b.recommendation_score - a.recommendation_score);
  
  // Apply diversity controls
  const diverseResults = applyDiversityControls(
    scoredCandidates, 
    {
      maxSameCategory,
      diversityThreshold,
      baseCategory: baseProduct.category
    }
  );
  
  return diverseResults.slice(0, topK);
}

/**
 * Apply diversity controls to prevent too many similar recommendations
 * @param {Array} scoredProducts - Products with scores
 * @param {Object} diversityOptions - Diversity control options
 * @returns {Array} - Diversified product list
 */
function applyDiversityControls(scoredProducts, diversityOptions) {
  const {
    maxSameCategory,
    diversityThreshold,
    baseCategory
  } = diversityOptions;
  
  const results = [];
  const categoryCount = {};
  const brandCount = {};
  
  for (const product of scoredProducts) {
    // Category diversity check
    const categoryKey = product.category || 'unknown';
    const currentCategoryCount = categoryCount[categoryKey] || 0;
    
    // Brand diversity check
    const brandKey = product.brand || 'unknown';
    const currentBrandCount = brandCount[brandKey] || 0;
    
    // Allow more items from different categories
    const maxCategoryItems = categoryKey === baseCategory ? maxSameCategory : Math.ceil(maxSameCategory * 1.5);
    
    // Apply diversity rules
    const shouldInclude = 
      currentCategoryCount < maxCategoryItems &&
      currentBrandCount < 2 && // Max 2 items per brand
      (results.length === 0 || product.recommendation_score >= diversityThreshold);
    
    if (shouldInclude) {
      results.push(product);
      categoryCount[categoryKey] = currentCategoryCount + 1;
      brandCount[brandKey] = currentBrandCount + 1;
    }
  }
  
  return results;
}

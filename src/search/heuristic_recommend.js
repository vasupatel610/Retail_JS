// src/search/heuristic_recommend.js
import { cosineSimilarity } from '../utils/similarity.js';
import { 
  colorSimilarity, 
  materialSimilarity, 
  brandSimilarity,
  categorySimilarity 
} from '../utils/product_similarity.js';


/**
 * Heuristic Rule-Based Expansion Weights for different sets
 */
export const HEURISTIC_WEIGHTS = {
  // Set 1: Exact intent match - same category + similar attributes
  set1: {
    alpha: 0.4,  // SBERT semantic similarity
    beta: 0.3,   // Category match (strong)
    gamma: 0.2,  // Color match (strong)
    delta: 0.1   // Brand match
  },
  // Set 2: Close substitutes - same category group, relax color/brand
  set2: {
    alpha: 0.5,  // SBERT semantic similarity (increased)
    beta: 0.25,  // Category match (moderate)
    gamma: 0.1,  // Color match (relaxed)
    delta: 0.15  // Brand match (moderate)
  },
  // Set 3: Broader exploration - related items, style/brand focus
  set3: {
    alpha: 0.6,  // SBERT semantic similarity (highest)
    beta: 0.1,   // Category match (weak)
    gamma: 0.05, // Color match (minimal)
    delta: 0.25  // Brand match (strong for style consistency)
  }
};


/**
 * Category group mappings for Set 2 expansion
 */
const CATEGORY_GROUPS = {
  footwear: {
    core: ['sandals', 'slippers', 'sneakers', 'loafers', 'boots', 'heels'],
    related: ['running shoes', 'sports shoes']
  },
  clothing: {
    core: ['shirt', 't-shirt', 'hoodie', 'sweater', 'jacket', 'dress', 'skirt'],
    related: ['kurta', 'saree', 'jeans', 'trousers']
  },
  accessories: {
    core: ['watch', 'handbag', 'wallet', 'belt', 'sunglasses'],
    related: ['jewelry', 'hat', 'cap', 'scarf', 'backpack']
  }
};


/**
 * Style-based expansion for Set 3
 */
const STYLE_EXPANSION = {
  sporty: ['sports', 'gym', 'casual', 'athleisure'],
  formal: ['office', 'formal', 'wedding', 'party'],
  casual: ['casual', 'everyday', 'beach', 'travel'],
  premium: ['luxury', 'premium', 'elegant']
};


/**
 * Calculate heuristic relevance score using the formula
 * Score = α*(SBERT) + β*(category) + γ*(color) + δ*(brand)
 */
function calculateHeuristicScore(baseProduct, candidate, weights, semanticScore, enableQueryLogging = false) {
  const { alpha, beta, gamma, delta } = weights;
  
  // Individual component scores
  const categoryScore = categorySimilarity(baseProduct.category, candidate.category);
  const colorScore = colorSimilarity(baseProduct.color, candidate.color);
  const brandScore = brandSimilarity(baseProduct.brand, candidate.brand);
  
  // Weighted combination
  const finalScore = 
    alpha * semanticScore +
    beta * categoryScore +
    gamma * colorScore +
    delta * brandScore;

  // 🔹 Conditional Debug logs for query-based score calculations only
  if (enableQueryLogging) {
    console.log('\n' + '='.repeat(80));
    console.log(`🔍 QUERY SCORE CALCULATION: ${candidate.name} | ID: ${candidate.id}`);
    console.log('='.repeat(80));
    
    // Individual score logging with clear separation
    console.log('📊 INDIVIDUAL SCORES:');
    console.log(`   🔍 Cosine Similarity (Semantic): ${semanticScore.toFixed(4)}`);
    console.log(`   📁 Category Similarity Score:   ${categoryScore.toFixed(4)}`);
    console.log(`   🎨 Color Similarity Score:      ${colorScore.toFixed(4)}`);
    console.log(`   🏷️  Brand Similarity Score:      ${brandScore.toFixed(4)}`);
    
    console.log('\n⚖️  WEIGHTS APPLIED:');
    console.log(`   α (Semantic): ${alpha}`);
    console.log(`   β (Category): ${beta}`);
    console.log(`   γ (Color):    ${gamma}`);
    console.log(`   δ (Brand):    ${delta}`);
    
    console.log('\n🧮 CALCULATION:');
    console.log(`   Final Score = α×semantic + β×category + γ×color + δ×brand`);
    console.log(`   Final Score = ${alpha}×${semanticScore.toFixed(4)} + ${beta}×${categoryScore.toFixed(4)} + ${gamma}×${colorScore.toFixed(4)} + ${delta}×${brandScore.toFixed(4)}`);
    console.log(`   Final Score = ${(alpha * semanticScore).toFixed(4)} + ${(beta * categoryScore).toFixed(4)} + ${(gamma * colorScore).toFixed(4)} + ${(delta * brandScore).toFixed(4)}`);
    console.log(`   Final Score = ${finalScore.toFixed(4)}`);
    console.log(`   Capped Score = ${Math.min(1.0, finalScore).toFixed(4)} (max: 1.0)`);
    
    console.log('='.repeat(80));
  }
  
  return {
    total: Math.min(1.0, finalScore), // Cap at 1.0
    breakdown: {
      semantic: semanticScore,
      category: categoryScore,
      color: colorScore,
      brand: brandScore
    },
    weights
  };
}


/**
 * Determine if a product belongs to Set 1 (Exact intent match)
 */
function belongsToSet1(baseProduct, candidate) {
  const sameCategory = baseProduct.category?.toLowerCase() === candidate.category?.toLowerCase();
  const similarColor = colorSimilarity(baseProduct.color, candidate.color) > 0.6;
  return sameCategory && (similarColor || baseProduct.brand === candidate.brand);
}


/**
 * Determine if a product belongs to Set 2 (Close substitutes)
 */
function belongsToSet2(baseProduct, candidate) {
  if (belongsToSet1(baseProduct, candidate)) return false; 
  
  const baseCategory = baseProduct.category?.toLowerCase();
  const candCategory = candidate.category?.toLowerCase();
  
  for (const [_, group] of Object.entries(CATEGORY_GROUPS)) {
    const allGroupItems = [...group.core, ...group.related];
    const baseInGroup = allGroupItems.some(item => baseCategory?.includes(item) || item.includes(baseCategory));
    const candInGroup = allGroupItems.some(item => candCategory?.includes(item) || item.includes(candCategory));
    
    if (baseInGroup && candInGroup) {
      return true;
    }
  }
  return false;
}


/**
 * Determine if a product belongs to Set 3 (Broader exploration)
 */
function belongsToSet3(baseProduct, candidate) {
  if (belongsToSet1(baseProduct, candidate) || belongsToSet2(baseProduct, candidate)) {
    return false;
  }
  
  const baseOccasion = baseProduct.occasion?.toLowerCase() || '';
  const candOccasion = candidate.occasion?.toLowerCase() || '';
  
  for (const occasions of Object.values(STYLE_EXPANSION)) {
    const baseInStyle = occasions.some(occ => baseOccasion.includes(occ));
    const candInStyle = occasions.some(occ => candOccasion.includes(occ));
    if (baseInStyle && candInStyle) return true;
  }
  
  if (baseProduct.brand === candidate.brand) return true;
  
  return false;
}


/**
 * Main heuristic recommendation function with tiered sets
 */
export function heuristicRecommend(products, productId, options = {}) {

  const {
    topK = 12,
    set1Count = Math.ceil(topK * 0.5),
    set2Count = Math.ceil(topK * 0.3),
    set3Count = Math.ceil(topK * 0.2),
    includeScoring = false,
    minScore = 0.1
  } = options;
  
  const baseProduct = products.find(p => p.id === productId);
  if (!baseProduct) {
    console.warn(`Product with ID ${productId} not found`);
    return [];
  }
  
  const candidates = products.filter(p => p.id !== productId);
  
  const set1Candidates = [];
  const set2Candidates = [];
  const set3Candidates = [];
  const otherCandidates = [];
  
  for (const candidate of candidates) {
    const semanticScore = cosineSimilarity(baseProduct.embedding, candidate.embedding);
    let scoring;
    
    if (belongsToSet1(baseProduct, candidate)) {
      scoring = calculateHeuristicScore(baseProduct, candidate, HEURISTIC_WEIGHTS.set1, semanticScore, options.enableQueryLogging);
      if (scoring.total >= minScore) {
        console.log(`  → Assigned to Set 1`);
        // Attach comprehensive scoring context for UI interaction
        set1Candidates.push({ 
          ...candidate, 
          heuristic_score: scoring.total, 
          scoring_details: {
            ...scoring,
            method: 'heuristic',
            setType: 1,
            setName: 'Exact Intent Match'
          }, 
          set: 1 
        });
      }
    } else if (belongsToSet2(baseProduct, candidate)) {
      scoring = calculateHeuristicScore(baseProduct, candidate, HEURISTIC_WEIGHTS.set2, semanticScore, options.enableQueryLogging);
      if (scoring.total >= minScore) {
        console.log(`  → Assigned to Set 2`);
        // Attach comprehensive scoring context for UI interaction
        set2Candidates.push({ 
          ...candidate, 
          heuristic_score: scoring.total, 
          scoring_details: {
            ...scoring,
            method: 'heuristic',
            setType: 2,
            setName: 'Close Substitutes'
          }, 
          set: 2 
        });
      }
    } else if (belongsToSet3(baseProduct, candidate)) {
      scoring = calculateHeuristicScore(baseProduct, candidate, HEURISTIC_WEIGHTS.set3, semanticScore, options.enableQueryLogging);
      if (scoring.total >= minScore) {
        console.log(`  → Assigned to Set 3`);
        // Attach comprehensive scoring context for UI interaction
        set3Candidates.push({ 
          ...candidate, 
          heuristic_score: scoring.total, 
          scoring_details: {
            ...scoring,
            method: 'heuristic',
            setType: 3,
            setName: 'Broader Exploration'
          }, 
          set: 3 
        });
      }
    } else {
      if (semanticScore >= minScore) {
        console.log(`\n[DEBUG: Candidate - ${candidate.name} | only semantic: ${semanticScore.toFixed(4)}]`);
        console.log(`  → Assigned to Other Set (0)`);
        otherCandidates.push({ ...candidate, heuristic_score: semanticScore, set: 0 });
      }
    }
  }
  
  set1Candidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
  set2Candidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
  set3Candidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
  otherCandidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
  
  const finalResults = [
    ...set1Candidates.slice(0, set1Count),
    ...set2Candidates.slice(0, set2Count),
    ...set3Candidates.slice(0, set3Count)
  ];
  
  const remainingSlots = topK - finalResults.length;
  if (remainingSlots > 0) {
    finalResults.push(...otherCandidates.slice(0, remainingSlots));
  }
  
  finalResults.sort((a, b) => b.heuristic_score - a.heuristic_score);
  
  if (includeScoring) {
    return {
      results: finalResults.slice(0, topK),
      metadata: {
        baseProduct: { id: baseProduct.id, name: baseProduct.name, category: baseProduct.category },
        distribution: {
          set1: Math.min(set1Candidates.length, set1Count),
          set2: Math.min(set2Candidates.length, set2Count),
          set3: Math.min(set3Candidates.length, set3Count),
          other: Math.min(otherCandidates.length, remainingSlots)
        },
        totalCandidates: candidates.length,
        weights: HEURISTIC_WEIGHTS
      }
    };
  }
  
  return finalResults.slice(0, topK).map(product => ({
    ...product,
    score: product.heuristic_score
  }));
}


/**
 * Get recommendations with custom weight tuning
 */
export function heuristicRecommendWithCustomWeights(products, productId, customWeights, options = {}) {
  const originalWeights = { ...HEURISTIC_WEIGHTS };
  
  if (customWeights.set1) Object.assign(HEURISTIC_WEIGHTS.set1, customWeights.set1);
  if (customWeights.set2) Object.assign(HEURISTIC_WEIGHTS.set2, customWeights.set2);
  if (customWeights.set3) Object.assign(HEURISTIC_WEIGHTS.set3, customWeights.set3);
  
  try {
    return heuristicRecommend(products, productId, options);
  } finally {
    Object.assign(HEURISTIC_WEIGHTS, originalWeights);
  }
}


/**
 * Query-specific heuristic recommendation function with detailed logging
 * Use this when you want to see detailed score calculations for debugging queries
 */
export function heuristicRecommendForQuery(products, productId, options = {}) {
  console.log(`\n🔍 STARTING QUERY-BASED HEURISTIC RECOMMENDATION for Product ID: ${productId}`);
  console.log('='.repeat(80));
  
  return heuristicRecommend(products, productId, {
    ...options,
    enableQueryLogging: true
  });
}


/**
 * Analyze recommendation distribution for debugging
 */
export function analyzeRecommendationSets(products, productId) {
  const baseProduct = products.find(p => p.id === productId);
  if (!baseProduct) return null;
  
  const candidates = products.filter(p => p.id !== productId);
  const analysis = { set1: [], set2: [], set3: [], other: [] };
  
  for (const candidate of candidates) {
    if (belongsToSet1(baseProduct, candidate)) {
      analysis.set1.push({ id: candidate.id, name: candidate.name, category: candidate.category });
    } else if (belongsToSet2(baseProduct, candidate)) {
      analysis.set2.push({ id: candidate.id, name: candidate.name, category: candidate.category });
    } else if (belongsToSet3(baseProduct, candidate)) {
      analysis.set3.push({ id: candidate.id, name: candidate.name, category: candidate.category });
    } else {
      analysis.other.push({ id: candidate.id, name: candidate.name, category: candidate.category });
    }
  }
  
  return {
    baseProduct: { id: baseProduct.id, name: baseProduct.name, category: baseProduct.category },
    distribution: {
      set1: analysis.set1.length,
      set2: analysis.set2.length,
      set3: analysis.set3.length,
      other: analysis.other.length
    },
    details: analysis
  };
}



// // src/search/heuristic_recommend.js
// import { cosineSimilarity } from '../utils/similarity.js';
// import { 
//   colorSimilarity, 
//   materialSimilarity, 
//   brandSimilarity,
//   categorySimilarity 
// } from '../utils/product_similarity.js';

// /**
//  * Heuristic Rule-Based Expansion Weights for different sets
//  */
// export const HEURISTIC_WEIGHTS = {
//   // Set 1: Exact intent match - same category + similar attributes
//   set1: {
//     alpha: 0.4,  // SBERT semantic similarity
//     beta: 0.3,   // Category match (strong)
//     gamma: 0.2,  // Color match (strong)
//     delta: 0.1   // Brand match
//   },
//   // Set 2: Close substitutes - same category group, relax color/brand
//   set2: {
//     alpha: 0.5,  // SBERT semantic similarity (increased)
//     beta: 0.25,  // Category match (moderate)
//     gamma: 0.1,  // Color match (relaxed)
//     delta: 0.15  // Brand match (moderate)
//   },
//   // Set 3: Broader exploration - related items, style/brand focus
//   set3: {
//     alpha: 0.6,  // SBERT semantic similarity (highest)
//     beta: 0.1,   // Category match (weak)
//     gamma: 0.05, // Color match (minimal)
//     delta: 0.25  // Brand match (strong for style consistency)
//   }
// };

// /**
//  * Category group mappings for Set 2 expansion
//  */
// const CATEGORY_GROUPS = {
//   footwear: {
//     core: ['sandals', 'slippers', 'sneakers', 'loafers', 'boots', 'heels'],
//     related: ['running shoes', 'sports shoes']
//   },
//   clothing: {
//     core: ['shirt', 't-shirt', 'hoodie', 'sweater', 'jacket', 'dress', 'skirt'],
//     related: ['kurta', 'saree', 'jeans', 'trousers']
//   },
//   accessories: {
//     core: ['watch', 'handbag', 'wallet', 'belt', 'sunglasses'],
//     related: ['jewelry', 'hat', 'cap', 'scarf', 'backpack']
//   }
// };

// /**
//  * Style-based expansion for Set 3
//  */
// const STYLE_EXPANSION = {
//   sporty: ['sports', 'gym', 'casual', 'athleisure'],
//   formal: ['office', 'formal', 'wedding', 'party'],
//   casual: ['casual', 'everyday', 'beach', 'travel'],
//   premium: ['luxury', 'premium', 'elegant']
// };

// /**
//  * Calculate heuristic relevance score using the formula
//  * Score = α*(SBERT) + β*(category) + γ*(color) + δ*(brand)
//  */
// function calculateHeuristicScore(baseProduct, candidate, weights, semanticScore) {
//   const { alpha, beta, gamma, delta } = weights;
  
//   // Individual component scores
//   const categoryScore = categorySimilarity(baseProduct.category, candidate.category);
//   const colorScore = colorSimilarity(baseProduct.color, candidate.color);
//   const brandScore = brandSimilarity(baseProduct.brand, candidate.brand);
  
//   // Weighted combination
//   const finalScore = 
//     alpha * semanticScore +
//     beta * categoryScore +
//     gamma * colorScore +
//     delta * brandScore;
    
//   return {
//     total: Math.min(1.0, finalScore), // Cap at 1.0
//     breakdown: {
//       semantic: semanticScore,
//       category: categoryScore,
//       color: colorScore,
//       brand: brandScore
//     },
//     weights
//   };
// }

// /**
//  * Determine if a product belongs to Set 1 (Exact intent match)
//  */
// function belongsToSet1(baseProduct, candidate) {
//   // Same category + reasonable semantic similarity threshold
//   const sameCategory = baseProduct.category?.toLowerCase() === candidate.category?.toLowerCase();
//   const similarColor = colorSimilarity(baseProduct.color, candidate.color) > 0.6;
  
//   return sameCategory && (similarColor || baseProduct.brand === candidate.brand);
// }

// /**
//  * Determine if a product belongs to Set 2 (Close substitutes)
//  */
// function belongsToSet2(baseProduct, candidate) {
//   if (belongsToSet1(baseProduct, candidate)) return false; // Already in Set 1
  
//   const baseCategory = baseProduct.category?.toLowerCase();
//   const candCategory = candidate.category?.toLowerCase();
  
//   // Check if both belong to the same category group
//   for (const [groupName, group] of Object.entries(CATEGORY_GROUPS)) {
//     const allGroupItems = [...group.core, ...group.related];
//     const baseInGroup = allGroupItems.some(item => baseCategory?.includes(item) || item.includes(baseCategory));
//     const candInGroup = allGroupItems.some(item => candCategory?.includes(item) || item.includes(candCategory));
    
//     if (baseInGroup && candInGroup) {
//       return true;
//     }
//   }
  
//   return false;
// }

// /**
//  * Determine if a product belongs to Set 3 (Broader exploration)
//  */
// function belongsToSet3(baseProduct, candidate) {
//   if (belongsToSet1(baseProduct, candidate) || belongsToSet2(baseProduct, candidate)) {
//     return false; // Already in Set 1 or 2
//   }
  
//   // Style/occasion compatibility
//   const baseOccasion = baseProduct.occasion?.toLowerCase() || '';
//   const candOccasion = candidate.occasion?.toLowerCase() || '';
  
//   // Check style compatibility
//   for (const [style, occasions] of Object.entries(STYLE_EXPANSION)) {
//     const baseInStyle = occasions.some(occ => baseOccasion.includes(occ));
//     const candInStyle = occasions.some(occ => candOccasion.includes(occ));
    
//     if (baseInStyle && candInStyle) {
//       return true;
//     }
//   }
  
//   // Brand consistency for style
//   if (baseProduct.brand === candidate.brand) {
//     return true;
//   }
  
//   return false;
// }

// /**
//  * Main heuristic recommendation function with tiered sets
//  */
// export function heuristicRecommend(products, productId, options = {}) {
//   const {
//     topK = 12,
//     set1Count = Math.ceil(topK * 0.5),  // 50% from Set 1
//     set2Count = Math.ceil(topK * 0.3),  // 30% from Set 2  
//     set3Count = Math.ceil(topK * 0.2),  // 20% from Set 3
//     includeScoring = false,
//     minScore = 0.1
//   } = options;
  
//   // Find base product
//   const baseProduct = products.find(p => p.id === productId);
//   if (!baseProduct) {
//     console.warn(`Product with ID ${productId} not found`);
//     return [];
//   }
  
//   // Filter out the base product
//   const candidates = products.filter(p => p.id !== productId);
  
//   // Categorize candidates into sets and calculate scores
//   const set1Candidates = [];
//   const set2Candidates = [];
//   const set3Candidates = [];
//   const otherCandidates = [];
  
//   for (const candidate of candidates) {
//     const semanticScore = cosineSimilarity(baseProduct.embedding, candidate.embedding);
    
//     if (belongsToSet1(baseProduct, candidate)) {
//       const scoring = calculateHeuristicScore(baseProduct, candidate, HEURISTIC_WEIGHTS.set1, semanticScore);
//       if (scoring.total >= minScore) {
//         set1Candidates.push({ ...candidate, heuristic_score: scoring.total, scoring_details: scoring, set: 1 });
//       }
//     } else if (belongsToSet2(baseProduct, candidate)) {
//       const scoring = calculateHeuristicScore(baseProduct, candidate, HEURISTIC_WEIGHTS.set2, semanticScore);
//       if (scoring.total >= minScore) {
//         set2Candidates.push({ ...candidate, heuristic_score: scoring.total, scoring_details: scoring, set: 2 });
//       }
//     } else if (belongsToSet3(baseProduct, candidate)) {
//       const scoring = calculateHeuristicScore(baseProduct, candidate, HEURISTIC_WEIGHTS.set3, semanticScore);
//       if (scoring.total >= minScore) {
//         set3Candidates.push({ ...candidate, heuristic_score: scoring.total, scoring_details: scoring, set: 3 });
//       }
//     } else {
//       // Fallback to semantic similarity only
//       if (semanticScore >= minScore) {
//         otherCandidates.push({ ...candidate, heuristic_score: semanticScore, set: 0 });
//       }
//     }
//   }
  
//   // Sort each set by score
//   set1Candidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
//   set2Candidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
//   set3Candidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
//   otherCandidates.sort((a, b) => b.heuristic_score - a.heuristic_score);
  
//   // Select top items from each set
//   const finalResults = [
//     ...set1Candidates.slice(0, set1Count),
//     ...set2Candidates.slice(0, set2Count),
//     ...set3Candidates.slice(0, set3Count)
//   ];
  
//   // Fill remaining slots with other candidates if needed
//   const remainingSlots = topK - finalResults.length;
//   if (remainingSlots > 0) {
//     finalResults.push(...otherCandidates.slice(0, remainingSlots));
//   }
  
//   // Sort final results by score for overall ranking
//   finalResults.sort((a, b) => b.heuristic_score - a.heuristic_score);
  
//   // Return results with or without detailed scoring
//   if (includeScoring) {
//     return {
//       results: finalResults.slice(0, topK),
//       metadata: {
//         baseProduct: { id: baseProduct.id, name: baseProduct.name, category: baseProduct.category },
//         distribution: {
//           set1: Math.min(set1Candidates.length, set1Count),
//           set2: Math.min(set2Candidates.length, set2Count),
//           set3: Math.min(set3Candidates.length, set3Count),
//           other: Math.min(otherCandidates.length, remainingSlots)
//         },
//         totalCandidates: candidates.length,
//         weights: HEURISTIC_WEIGHTS
//       }
//     };
//   }
  
//   // Simplified format for compatibility
//   return finalResults.slice(0, topK).map(product => ({
//     ...product,
//     score: product.heuristic_score
//   }));
// }

// /**
//  * Get recommendations with custom weight tuning
//  */
// export function heuristicRecommendWithCustomWeights(products, productId, customWeights, options = {}) {
//   const originalWeights = { ...HEURISTIC_WEIGHTS };
  
//   // Apply custom weights
//   if (customWeights.set1) Object.assign(HEURISTIC_WEIGHTS.set1, customWeights.set1);
//   if (customWeights.set2) Object.assign(HEURISTIC_WEIGHTS.set2, customWeights.set2);
//   if (customWeights.set3) Object.assign(HEURISTIC_WEIGHTS.set3, customWeights.set3);
  
//   try {
//     const results = heuristicRecommend(products, productId, options);
//     return results;
//   } finally {
//     // Restore original weights
//     Object.assign(HEURISTIC_WEIGHTS, originalWeights);
//   }
// }

// /**
//  * Analyze recommendation distribution for debugging
//  */
// export function analyzeRecommendationSets(products, productId) {
//   const baseProduct = products.find(p => p.id === productId);
//   if (!baseProduct) return null;
  
//   const candidates = products.filter(p => p.id !== productId);
//   const analysis = {
//     set1: [],
//     set2: [],
//     set3: [],
//     other: []
//   };
  
//   for (const candidate of candidates) {
//     if (belongsToSet1(baseProduct, candidate)) {
//       analysis.set1.push({ id: candidate.id, name: candidate.name, category: candidate.category });
//     } else if (belongsToSet2(baseProduct, candidate)) {
//       analysis.set2.push({ id: candidate.id, name: candidate.name, category: candidate.category });
//     } else if (belongsToSet3(baseProduct, candidate)) {
//       analysis.set3.push({ id: candidate.id, name: candidate.name, category: candidate.category });
//     } else {
//       analysis.other.push({ id: candidate.id, name: candidate.name, category: candidate.category });
//     }
//   }
  
//   return {
//     baseProduct: { id: baseProduct.id, name: baseProduct.name, category: baseProduct.category },
//     distribution: {
//       set1: analysis.set1.length,
//       set2: analysis.set2.length,
//       set3: analysis.set3.length,
//       other: analysis.other.length
//     },
//     details: analysis
//   };
// }

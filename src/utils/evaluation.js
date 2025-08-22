// src/utils/evaluation.js
import { normalizeText } from './text_cleaner.js';

// Predefined test queries with expected relevant products
export const TEST_QUERIES = {
  // Brand-specific queries
  'nike shoes': {
    description: 'Brand-specific product search',
    expectedFields: ['brand'],
    expectedValues: ['nike'],
    category: 'brand'
  },
  'adidas': {
    description: 'Brand-only search',
    expectedFields: ['brand'],
    expectedValues: ['adidas'],
    category: 'brand'
  },
  
  // Category-specific queries
  'dress': {
    description: 'Category-specific search',
    expectedFields: ['category'],
    expectedValues: ['dress'],
    category: 'category'
  },
  'shoes': {
    description: 'Footwear category search',
    expectedFields: ['category'],
    expectedValues: ['shoes', 'footwear'],
    category: 'category'
  },
  
  // Color-specific queries
  'red': {
    description: 'Color-specific search',
    expectedFields: ['color'],
    expectedValues: ['red'],
    category: 'color'
  },
  'blue dress': {
    description: 'Color + category combination',
    expectedFields: ['color', 'category'],
    expectedValues: ['blue', 'dress'],
    category: 'combination'
  },
  
  // Style/occasion queries
  'formal': {
    description: 'Style/occasion search',
    expectedFields: ['occasion'],
    expectedValues: ['formal', 'business'],
    category: 'style'
  },
  'casual summer': {
    description: 'Style + season combination',
    expectedFields: ['occasion', 'description'],
    expectedValues: ['casual', 'summer'],
    category: 'style'
  },
  
  // Material queries
  'cotton': {
    description: 'Material-specific search',
    expectedFields: ['material'],
    expectedValues: ['cotton'],
    category: 'material'
  },
  'leather shoes': {
    description: 'Material + category combination',
    expectedFields: ['material', 'category'],
    expectedValues: ['leather', 'shoes'],
    category: 'combination'
  },
  
  // Price range queries
  'under 50': {
    description: 'Price range search',
    expectedFields: ['price'],
    expectedValues: ['under_50'],
    category: 'price'
  },
  'expensive': {
    description: 'High price indicator',
    expectedFields: ['price'],
    expectedValues: ['expensive', 'high'],
    category: 'price'
  }
};

// Generate ground truth for a query based on product data
export function generateGroundTruth(query, products, topK = 20) {
  const queryLower = normalizeText(query).toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(Boolean);
  
  // Score each product based on query relevance
  const scoredProducts = products.map(product => {
    let score = 0;
    let matchDetails = [];
    
    // Brand matching (highest weight)
    if (product.brand && queryWords.some(word => 
      normalizeText(product.brand).toLowerCase().includes(word))) {
      score += 10;
      matchDetails.push('brand');
    }
    
    // Category matching (high weight)
    if (product.category && queryWords.some(word => 
      normalizeText(product.category).toLowerCase().includes(word))) {
      score += 8;
      matchDetails.push('category');
    }
    
    // Color matching (medium weight)
    if (product.color && queryWords.some(word => 
      normalizeText(product.color).toLowerCase().includes(word))) {
      score += 6;
      matchDetails.push('color');
    }
    
    // Material matching (medium weight)
    if (product.material && queryWords.some(word => 
      normalizeText(product.material).toLowerCase().includes(word))) {
      score += 6;
      matchDetails.push('material');
    }
    
    // Occasion matching (medium weight)
    if (product.occasion && queryWords.some(word => 
      normalizeText(product.occasion).toLowerCase().includes(word))) {
      score += 6;
      matchDetails.push('occasion');
    }
    
    // Description matching (lower weight)
    if (product.description && queryWords.some(word => 
      normalizeText(product.description).toLowerCase().includes(word))) {
      score += 3;
      matchDetails.push('description');
    }
    
    // Name matching (lower weight)
    if (product.name && queryWords.some(word => 
      normalizeText(product.name).toLowerCase().includes(word))) {
      score += 3;
      matchDetails.push('name');
    }
    
    // Price range matching
    if (queryLower.includes('under') || queryLower.includes('cheap')) {
      const price = Number(product.price);
      if (price && price < 50) {
        score += 4;
        matchDetails.push('price_under_50');
      }
    }
    
    if (queryLower.includes('expensive') || queryLower.includes('high')) {
      const price = Number(product.price);
      if (price && price > 100) {
        score += 4;
        matchDetails.push('price_expensive');
      }
    }
    
    return {
      ...product,
      relevanceScore: score,
      matchDetails,
      isRelevant: score >= 3 // Threshold for relevance
    };
  });
  
  // Sort by relevance score and return top relevant products
  const relevantProducts = scoredProducts
    .filter(p => p.isRelevant)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
  
  return {
    query,
    groundTruth: relevantProducts,
    totalRelevant: relevantProducts.length,
    totalProducts: products.length,
    relevanceThreshold: 3,
    queryWords
  };
}

// Evaluate search results against ground truth
export function evaluateSearchResults(groundTruth, searchResults, topK = 10) {
  if (!groundTruth || !groundTruth.groundTruth) {
    return {
      error: 'Invalid ground truth data',
      metrics: null
    };
  }
  
  const relevantIds = new Set(groundTruth.groundTruth.map(item => item.id));
  const topResults = searchResults.slice(0, topK);
  
  // Basic metrics
  let relevantFound = 0;
  let sumPrecision = 0;
  let dcg = 0;
  let idcg = 0;
  
  topResults.forEach((result, index) => {
    if (relevantIds.has(result.id)) {
      relevantFound++;
      const precisionAtK = relevantFound / (index + 1);
      sumPrecision += precisionAtK;
      dcg += 1 / Math.log2(index + 2);
    }
  });
  
  // Calculate ideal DCG
  const idealRelevance = Array.from({ length: Math.min(topK, groundTruth.groundTruth.length) }, () => 1);
  idealRelevance.forEach((relevance, index) => {
    idcg += relevance / Math.log2(index + 2);
  });
  
  const precision = relevantFound / topResults.length;
  const recall = relevantFound / groundTruth.groundTruth.length;
  const f1 = (precision + recall > 0) ? (2 * precision * recall) / (precision + recall) : 0;
  const map = relevantFound > 0 ? sumPrecision / relevantFound : 0;
  const ndcg = idcg > 0 ? dcg / idcg : 0;
  
  return {
    metrics: {
      precision: Math.round(precision * 1000) / 1000,
      recall: Math.round(recall * 1000) / 1000,
      f1: Math.round(f1 * 1000) / 1000,
      map: Math.round(map * 1000) / 1000,
      ndcg: Math.round(ndcg * 1000) / 1000,
      relevantFound,
      totalRelevant: groundTruth.groundTruth.length,
      totalResults: topResults.length
    },
    details: {
      query: groundTruth.query,
      queryWords: groundTruth.queryWords,
      topResults: topResults.map(r => ({ id: r.id, name: r.name, score: r.score || r.final_score })),
      groundTruthIds: Array.from(relevantIds)
    }
  };
}

// Run comprehensive evaluation on multiple queries
export async function runComprehensiveEvaluation(products, searchFunction, queries = Object.keys(TEST_QUERIES), topK = 10) {
  const results = {};
  const summary = {
    totalQueries: queries.length,
    averageMetrics: {},
    methodPerformance: {}
  };
  
  for (const query of queries) {
    try {
      // Generate ground truth
      const groundTruth = generateGroundTruth(query, products, topK * 2);
      
      // Run search
      const startTime = Date.now();
      const searchResults = await searchFunction(query, topK);
      const endTime = Date.now();
      
      // Evaluate results
      const evaluation = evaluateSearchResults(groundTruth, searchResults, topK);
      
      results[query] = {
        groundTruth,
        searchResults,
        evaluation,
        latency: endTime - startTime,
        queryInfo: TEST_QUERIES[query] || { description: 'Custom query', category: 'unknown' }
      };
      
    } catch (error) {
      console.error(`Error evaluating query "${query}":`, error);
      results[query] = { error: error.message };
    }
  }
  
  // Calculate summary statistics
  const validResults = Object.values(results).filter(r => r.evaluation && !r.error);
  if (validResults.length > 0) {
    const metrics = ['precision', 'recall', 'f1', 'map', 'ndcg'];
    metrics.forEach(metric => {
      const values = validResults.map(r => r.evaluation.metrics[metric]).filter(v => v !== undefined);
      if (values.length > 0) {
        summary.averageMetrics[metric] = Math.round(
          values.reduce((a, b) => a + b, 0) / values.length * 1000
        ) / 1000;
      }
    });
    
    // Average latency
    const latencies = validResults.map(r => r.latency).filter(l => l !== undefined);
    if (latencies.length > 0) {
      summary.averageLatency = Math.round(
        latencies.reduce((a, b) => a + b, 0) / latencies.length
      );
    }
  }
  
  return { results, summary };
}

# Heuristic Rule-Based Expansion Recommendation System

## Overview

This enhanced recommendation system implements **Heuristic Rule-Based Expansion** with tiered sets, as requested. Instead of relying solely on SBERT cosine similarity, it uses a sophisticated formula that considers multiple product attributes across three distinct recommendation sets.

## Formula

**Relevance Score = α×(SBERT cosine similarity) + β×(category match) + γ×(color match) + δ×(brand match)**

Where α, β, γ, δ are configurable weights that can be tuned for different recommendation purposes.

## Three-Tier Recommendation Sets

### Set 1: Exact Intent Match
- **Purpose**: Same category + similar attributes
- **Weights**: `α=0.4, β=0.3, γ=0.2, δ=0.1`
- **Strategy**: Strong emphasis on category and color matching
- **Example**: For blue Adidas sandals → other blue footwear, especially sandals from similar brands

### Set 2: Close Substitutes  
- **Purpose**: Same category group, relaxed color/brand constraints
- **Weights**: `α=0.5, β=0.25, γ=0.1, δ=0.15`
- **Strategy**: Moderate category matching, relaxed color requirements
- **Example**: For sandals → other footwear (sneakers, slippers, loafers) regardless of exact color match

### Set 3: Broader Exploration
- **Purpose**: Related items focusing on style/brand consistency
- **Weights**: `α=0.6, β=0.1, γ=0.05, δ=0.25`
- **Strategy**: High semantic similarity with brand consistency for style coherence
- **Example**: For sporty items → other sport-related products from similar brands or style categories

## API Endpoints

### 1. Heuristic Recommendations
```bash
POST /recommend/heuristic
```

**Request:**
```json
{
  "productId": "product-uuid",
  "topK": 12,
  "set1Count": 6,  // 50% from Set 1
  "set2Count": 4,  // 30% from Set 2  
  "set3Count": 2,  // 20% from Set 3
  "includeScoring": true,
  "minScore": 0.1
}
```

**Response:**
```json
{
  "results": {
    "results": [...],
    "metadata": {
      "baseProduct": {...},
      "distribution": {
        "set1": 6,
        "set2": 4, 
        "set3": 2
      },
      "weights": {...}
    }
  }
}
```

### 2. Custom Weight Tuning
```bash
POST /recommend/heuristic/custom
```

**Request:**
```json
{
  "productId": "product-uuid",
  "customWeights": {
    "set1": { "alpha": 0.3, "beta": 0.2, "gamma": 0.4, "delta": 0.1 },
    "set2": { "alpha": 0.4, "beta": 0.2, "gamma": 0.3, "delta": 0.1 },
    "set3": { "alpha": 0.5, "beta": 0.1, "gamma": 0.2, "delta": 0.2 }
  },
  "topK": 10
}
```

### 3. Product Set Analysis
```bash
POST /recommend/analyze
```

Analyzes how products would be distributed across the three recommendation sets for a given base product.

## Weight Tuning Examples

### Color-Focused Recommendations
```json
{
  "set1": { "alpha": 0.3, "beta": 0.2, "gamma": 0.4, "delta": 0.1 },
  "set2": { "alpha": 0.4, "beta": 0.2, "gamma": 0.3, "delta": 0.1 },
  "set3": { "alpha": 0.5, "beta": 0.1, "gamma": 0.2, "delta": 0.2 }
}
```

### Brand-Consistent Recommendations
```json
{
  "set1": { "alpha": 0.3, "beta": 0.3, "gamma": 0.1, "delta": 0.3 },
  "set2": { "alpha": 0.4, "beta": 0.2, "gamma": 0.1, "delta": 0.3 },
  "set3": { "alpha": 0.5, "beta": 0.1, "gamma": 0.05, "delta": 0.35 }
}
```

### Category-Strict Recommendations
```json
{
  "set1": { "alpha": 0.3, "beta": 0.5, "gamma": 0.15, "delta": 0.05 },
  "set2": { "alpha": 0.4, "beta": 0.4, "gamma": 0.1, "delta": 0.1 },
  "set3": { "alpha": 0.6, "beta": 0.2, "gamma": 0.1, "delta": 0.1 }
}
```

## Product Attribute Considerations

The system now comprehensively considers:

- **Color**: Harmony rules, complementary colors, analogous colors, neutral compatibility
- **Size**: Size group compatibility, adjacent size matching
- **Material**: Occasion-appropriate materials, premium vs casual materials
- **Age Group**: Target audience compatibility ("All Ages" universal compatibility)
- **Occasion**: Event-appropriate matching, cross-occasion compatibility  
- **Category**: Same-category vs cross-category (outfit) recommendations
- **Brand**: Brand tier compatibility (luxury, sports, casual, affordable)
- **Price**: Price range compatibility for budget-conscious recommendations

## Enhanced Features

### 1. Comprehensive Taxonomy
- Extended color mappings with harmony rules
- Material compatibility matrices
- Size group classifications
- Occasion and style compatibility maps

### 2. Business Rules Integration
- Stock status boosting
- Price range appropriateness
- Cross-category outfit bonuses
- Diversity penalties for too-similar items

### 3. Contextual Weight Adjustment
- Purpose-driven weight optimization
- Dynamic algorithm selection
- Custom scoring breakdowns

## Usage Examples

### Basic Heuristic Recommendations
```javascript
const response = await fetch('/recommend/heuristic', {
  method: 'POST',
  body: JSON.stringify({
    productId: 'blue-adidas-sandals-id',
    topK: 10,
    includeScoring: true
  })
});
```

### Custom Weight Tuning for Outfit Recommendations
```javascript
const outfitWeights = {
  set1: { alpha: 0.2, beta: 0.1, gamma: 0.3, delta: 0.4 }, // Brand-focused
  set2: { alpha: 0.3, beta: 0.2, gamma: 0.2, delta: 0.3 },
  set3: { alpha: 0.4, beta: 0.1, gamma: 0.15, delta: 0.35 }
};

const response = await fetch('/recommend/heuristic/custom', {
  method: 'POST',
  body: JSON.stringify({
    productId: 'base-product-id',
    customWeights: outfitWeights,
    topK: 8
  })
});
```

## Testing

Run the test script to validate the heuristic recommendations:

```bash
node test_heuristic_recommendations.js
```

This will test:
- Set distribution analysis
- Heuristic scoring with default weights
- Custom weight tuning
- Score breakdowns and explanations

## Server Setup

Use the clean server implementation:

```bash
node server_clean.js
```

This provides all the enhanced recommendation endpoints while maintaining stability and performance.

## Benefits

1. **Better Relevance**: Multi-factor scoring considers all important product aspects
2. **Controlled Diversity**: Tiered sets ensure balanced recommendations
3. **Tunable Behavior**: Custom weights allow optimization for different use cases
4. **Business Logic**: Incorporates practical considerations like stock and pricing
5. **Semantic + Rule-Based**: Combines AI embeddings with domain knowledge

The heuristic approach provides much more nuanced and practical recommendations compared to simple cosine similarity, making it ideal for real-world e-commerce applications.

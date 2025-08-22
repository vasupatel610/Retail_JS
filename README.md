# Fashion Retail Search - Enhanced AI-Powered Search Engine

A sophisticated fashion product search engine that combines **SBERT (Sentence-BERT) semantic search** with **advanced linear search techniques** for optimal performance and accuracy.

## 🚀 Features

### **Hybrid Search Architecture**
- **SBERT Semantic Search**: Deep learning-based understanding of fashion concepts, styles, and descriptions
- **Advanced Linear Search**: Multiple scoring methods for fast, accurate keyword matching
- **Adaptive Search**: Automatically chooses the best search strategy based on query characteristics

### **Linear Search Methods**
- **TF-IDF Scoring**: Traditional information retrieval with term frequency-inverse document frequency
- **BM25 Scoring**: Modern probabilistic ranking function for better relevance
- **Fuzzy Matching**: Handles typos, variations, and partial matches using Levenshtein distance
- **Combined Scoring**: Intelligent combination of all linear methods for optimal results

### **Performance Optimizations**
- **Early Termination**: Stops searching when sufficient high-quality results are found
- **Candidate Pooling**: Pre-filters results using fast linear methods before expensive semantic search
- **Caching**: TF-IDF index caching for faster subsequent searches
- **Batch Processing**: Efficient embedding computation for multiple products

## 🏗️ Architecture

```
Query Input → Query Analysis → Method Selection → Search Execution → Result Ranking
                    ↓
            ┌─────────────────┬─────────────────┐
            │   Linear Pre-   │  Semantic       │
            │   Filtering     │  Search         │
            │                 │                 │
            │ • TF-IDF        │ • SBERT         │
            │ • BM25          │ • Embeddings    │
            │ • Fuzzy Match   │ • Cosine Sim    │
            └─────────────────┴─────────────────┘
                    ↓
            Result Combination & Business Logic Boosting
```

## 🔧 Search Methods

### 1. **Adaptive Search** (Recommended)
- Automatically selects the best approach based on query characteristics
- Uses fast linear search for specific queries (brands, categories, exact terms)
- Falls back to hybrid search for complex, descriptive queries

### 2. **Hybrid Search**
- Combines semantic understanding with linear scoring
- Configurable weights between semantic and linear components
- Best for queries requiring both conceptual understanding and exact matching

### 3. **Semantic Search** (SBERT Only)
- Pure deep learning approach
- Excellent for conceptual queries and style descriptions
- Slower but most accurate for complex fashion concepts

### 4. **Linear Search** (Fast)
- Pure keyword-based approach
- Fastest search method
- Best for specific product searches, brands, or categories

## 📊 Performance & Quality Evaluation

The system includes comprehensive evaluation tools that measure:

### **Performance Metrics**
- **Search Time**: Response latency for each method
- **Result Quality**: Number of relevant results returned
- **Method Efficiency**: Performance bars showing relative speed

### **Quality Metrics**
- **Precision**: Relevant results / Total results returned
- **Recall**: Relevant results / Total relevant in dataset
- **F1 Score**: Harmonic mean of precision and recall
- **MAP**: Mean Average Precision for ranking quality
- **nDCG**: Normalized Discounted Cumulative Gain for ranking relevance
- **Latency**: Search response time in milliseconds

### **Evaluation Methods**
1. **Single Query Evaluation**: Measure quality metrics for a specific search
2. **Performance Comparison**: Compare speed across all search methods
3. **Comprehensive Testing**: Full evaluation across multiple test queries and methods

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation
```bash
git clone <repository-url>
cd fashion_retail_js
npm install
```

### Configuration
```bash
# Set your preferred SBERT model (default: Xenova/all-MiniLM-L6-v2)
export EMBEDDINGS_MODEL_ID="your-preferred-model"

# Start the server
npm start
```

### API Usage

#### Basic Search
```javascript
POST /search
{
  "query": "elegant summer dress",
  "method": "adaptive",        // adaptive, hybrid, semantic, linear
  "linearMethod": "combined",  // combined, tfidf, bm25, fuzzy
  "topK": 10,
  "semanticWeight": 0.7,
  "lexicalWeight": 0.3
}
```

#### Performance Comparison
```javascript
POST /search/compare
{
  "query": "red shoes",
  "topK": 10
}
```

#### Quality Evaluation
```javascript
POST /evaluate
{
  "query": "elegant summer dress",
  "method": "hybrid",
  "topK": 10,
  "linearMethod": "combined"
}
```

#### Comprehensive Evaluation
```javascript
POST /evaluate/comprehensive
{
  "methods": ["linear", "semantic", "hybrid", "adaptive"],
  "queries": ["nike shoes", "dress", "red", "formal"],
  "topK": 10,
  "linearMethod": "combined"
}
```

## 🎯 Use Cases

### **E-commerce Platforms**
- Product discovery and recommendation
- Faceted search with semantic understanding
- Typo-tolerant search for better user experience

### **Fashion Retail**
- Style-based product matching
- Occasion-appropriate recommendations
- Brand and category filtering

### **Content Discovery**
- Fashion blog and article search
- Style guide recommendations
- Trend analysis and discovery

## 🔍 Search Examples

| Query Type | Example | Best Method | Why |
|------------|---------|-------------|-----|
| **Specific** | "Nike Air Max" | Linear | Exact brand/product match |
| **Conceptual** | "elegant evening wear" | Semantic | Style and occasion concepts |
| **Mixed** | "comfortable red running shoes" | Hybrid | Combines style + specific terms |
| **Adaptive** | Any query | Adaptive | Auto-selects best method |

## 📈 Performance Metrics

- **Linear Search**: ~1-5ms (fastest)
- **Semantic Search**: ~50-200ms (most accurate)
- **Hybrid Search**: ~20-100ms (balanced)
- **Adaptive Search**: ~5-150ms (smart selection)

## 🛠️ Technical Details

### **Dependencies**
- `@xenova/transformers`: SBERT model inference
- `papaparse`: CSV data parsing
- `express`: Web server framework

### **Data Structure**
- Product embeddings stored in binary format for fast loading
- TF-IDF index built on startup for linear search
- Faceted vocabulary for category filtering

### **Scoring Algorithms**
- **Cosine Similarity**: For semantic search results
- **TF-IDF**: Term frequency × inverse document frequency
- **BM25**: Probabilistic relevance ranking
- **Fuzzy Matching**: Levenshtein distance for typos

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement your improvements
4. Add tests and documentation
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **SBERT**: For semantic understanding capabilities
- **TF-IDF/BM25**: For proven linear search algorithms
- **Fashion Dataset**: For comprehensive product testing

---

**Built with ❤️ for the fashion retail industry**

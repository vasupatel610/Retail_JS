// server_clean.js - Clean server with heuristic recommendations
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

import { loadModel, ensureEmbeddings } from "./src/utils/embeddings.js";
import { buildSearchDoc } from "./src/utils/document_builder.js";
import { normalizeText } from "./src/utils/text_cleaner.js";
import { normalizeSize } from "./src/config/taxonomy.js";
import { hybridSearch } from "./src/search/hybrid_search.js";
import { semanticSearch as semanticSearchOnly } from "./src/search/semantic_search.js";
import { 
  recommendSimilar, 
  recommendOutfit,
  recommendForOccasion,
  recommendSameBrand,
  recommendWithinBudget,
  recommendHeuristic,
  recommendHeuristicCustom,
  analyzeProductSets,
  recommendMaster
} from "./src/search/recommend.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load and prepare product data
const csvFilePath = path.join("data", "fashion_products_100_clean.csv");
let products = [];
let extractor = null;
let medianPrice = null;
let facetVocab = null;

function toNumber(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function mapRowToProduct(row) {
  const id = row.product_id;
  const name = row.product_name;
  const category = row.product_category;
  const brand = row.brand;
  const size = normalizeSize(row.size);
  const color = normalizeText(row.color);
  const material = normalizeText(row.material);
  const occasion = normalizeText(row.occasion);
  const age_group = normalizeText(row.age_group);
  const description = normalizeText(row.product_description);
  const price_listed = toNumber(row.price_listed);
  const price = toNumber(row.price_final);
  const stock_status = String(row.stock_status) === "1" ? "in_stock" : "out_of_stock";
  const image_url = row.product_image_url;
  return { id, name, category, brand, size, color, material, occasion, age_group, description, price_listed, price, stock_status, image_url };
}

function buildFacetVocab(items) {
  const uniq = arr => Array.from(new Set(arr.filter(Boolean)));
  const toLower = s => (s || '').toString().trim().toLowerCase();
  return {
    categories: uniq(items.map(p => toLower(p.category))),
    brands: uniq(items.map(p => toLower(p.brand))),
    sizes: uniq(items.map(p => toLower(p.size))),
    colors: uniq(items.map(p => toLower(p.color))),
    materials: uniq(items.map(p => toLower(p.material))),
    occasions: uniq(items.map(p => toLower(p.occasion))),
    ageGroups: uniq(items.map(p => toLower(p.age_group)))
  };
}

function computeMedianPrice(items) {
  const prices = items.map(p => p.price).filter(Number.isFinite).sort((a, b) => a - b);
  if (prices.length === 0) return null;
  const mid = Math.floor(prices.length / 2);
  return prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid];
}

async function bootstrap() {
  if (!fs.existsSync(csvFilePath)) {
    console.error("❌ CSV file not found:", csvFilePath);
    return;
  }
  const file = fs.readFileSync(csvFilePath, "utf8");
  const parsed = Papa.parse(file, { header: true, skipEmptyLines: true });
  const raw = parsed.data || [];
  const normalized = raw.map(mapRowToProduct).map(p => ({
    ...p,
    search_doc: normalizeText(buildSearchDoc(p))
  }));
  medianPrice = computeMedianPrice(normalized);
  extractor = await loadModel();
  const { products: embedded } = await ensureEmbeddings(normalized, extractor);
  products = embedded;
  facetVocab = buildFacetVocab(products);
  
  console.log(`✅ Loaded ${products.length} products with enhanced recommendations`);
}

bootstrap().catch(err => {
  console.error("Bootstrap error:", err);
});

// Routes
app.get("/", (req, res) => {
  const indexPath = path.join(process.cwd(), "public", "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("🚀 Enhanced Fashion Recommendation API running...");
  }
});

app.post("/search", async (req, res) => {
  const { query, topK = 5, hybrid = false, lexicalWeight = 0.2, facets = true } = req.body;
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    const results = hybrid
      ? await hybridSearch(products, extractor, query, { topK, lexicalWeight, useFacets: facets, medianPrice, vocab: facetVocab })
      : await semanticSearchOnly(products, extractor, query, topK);
    res.json({ results });
  } catch (err) {
    console.error("Search error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Enhanced recommendation endpoint with multiple options
app.post("/recommend", async (req, res) => {
  const { 
    productId, 
    topK = 5, 
    purpose = 'similar',
    context = {},
    includeScoring = false,
    minScore = 0.1
  } = req.body;
  
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    
    const options = { topK, purpose, context, includeScoring, minScore };
    let results;
    
    switch (purpose) {
      case 'outfit':
        results = recommendOutfit(products, productId, options);
        break;
      case 'occasion':
        results = recommendForOccasion(products, productId, context.occasion, options);
        break;
      case 'brand':
        results = recommendSameBrand(products, productId, options);
        break;
      case 'budget':
        results = recommendWithinBudget(products, productId, context.budget, options);
        break;
      default:
        results = recommendSimilar(products, productId, options);
    }
    
    res.json({ 
      results,
      metadata: {
        purpose,
        total_candidates: products.length - 1,
        returned: results.length,
        context
      }
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Heuristic Rule-Based Expansion recommendation endpoints
app.post("/recommend/heuristic", async (req, res) => {
  const { 
    productId, 
    topK = 12, 
    set1Count, 
    set2Count, 
    set3Count, 
    includeScoring = false,
    minScore = 0.1
  } = req.body;
  
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    
    const options = {
      topK,
      set1Count: set1Count || Math.ceil(topK * 0.5),
      set2Count: set2Count || Math.ceil(topK * 0.3),
      set3Count: set3Count || Math.ceil(topK * 0.2),
      includeScoring,
      minScore
    };
    
    const results = recommendHeuristic(products, productId, options);
    
    res.json({
      results: includeScoring ? results.results : results,
      metadata: includeScoring ? results.metadata : {
        type: 'heuristic',
        algorithm: 'rule-based expansion',
        formula: 'α*(SBERT) + β*(category) + γ*(color) + δ*(brand)',
        sets: {
          set1: 'exact intent match - same category + similar attributes',
          set2: 'close substitutes - same category group, relaxed color/brand', 
          set3: 'broader exploration - related items, style/brand focus'
        }
      }
    });
  } catch (err) {
    console.error("Heuristic recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Heuristic recommendations with custom weights
app.post("/recommend/heuristic/custom", async (req, res) => {
  const { 
    productId, 
    customWeights,
    topK = 12,
    includeScoring = false
  } = req.body;
  
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    
    if (!customWeights) {
      return res.status(400).json({ 
        error: "Custom weights are required",
        format: {
          set1: { alpha: 0.4, beta: 0.3, gamma: 0.2, delta: 0.1 },
          set2: { alpha: 0.5, beta: 0.25, gamma: 0.1, delta: 0.15 },
          set3: { alpha: 0.6, beta: 0.1, gamma: 0.05, delta: 0.25 }
        },
        description: {
          alpha: "SBERT semantic similarity",
          beta: "Category match",
          gamma: "Color match", 
          delta: "Brand match"
        }
      });
    }
    
    const results = recommendHeuristicCustom(products, productId, customWeights, {
      topK,
      includeScoring
    });
    
    res.json({
      results,
      customWeights,
      type: 'heuristic-custom',
      formula: 'α*(SBERT) + β*(category) + γ*(color) + δ*(brand)'
    });
  } catch (err) {
    console.error("Custom heuristic recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Analyze product sets distribution for a given product
app.post("/recommend/analyze", async (req, res) => {
  const { productId } = req.body;
  
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    
    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }
    
    const analysis = analyzeProductSets(products, productId);
    
    if (!analysis) {
      return res.status(404).json({ error: "Product not found" });
    }
    
    res.json({
      analysis,
      setDescriptions: {
        set1: "Exact intent match - same category + similar attributes",
        set2: "Close substitutes - same category group, relaxed color/brand",
        set3: "Broader exploration - related items, style/brand focus",
        other: "Fallback items with only semantic similarity"
      },
      heuristicWeights: {
        set1: "α=0.4, β=0.3, γ=0.2, δ=0.1 (strong category + color)",
        set2: "α=0.5, β=0.25, γ=0.1, δ=0.15 (moderate category, relaxed color)",
        set3: "α=0.6, β=0.1, γ=0.05, δ=0.25 (high semantic, brand focus)"
      }
    });
  } catch (err) {
    console.error("Product analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Master recommendation endpoint supporting different algorithms
app.post("/recommend/master", async (req, res) => {
  const { 
    productId,
    algorithm = 'advanced', // 'advanced', 'heuristic', 'legacy'
    ...options
  } = req.body;
  
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    
    const results = recommendMaster(products, productId, { algorithm, ...options });
    
    res.json({
      results: Array.isArray(results) ? results : results.results,
      algorithm,
      metadata: results.metadata || { algorithm },
      availableAlgorithms: {
        advanced: "Multi-factor scoring with comprehensive attributes",
        heuristic: "Rule-based expansion with tiered sets", 
        legacy: "Simple cosine similarity only"
      }
    });
  } catch (err) {
    console.error("Master recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Enhanced Fashion Recommendation Server running at http://localhost:${PORT}`);
  console.log(`🔬 Heuristic Rule-Based Expansion available at /recommend/heuristic`);
  console.log(`⚙️  Custom weights tuning available at /recommend/heuristic/custom`);
  console.log(`📊 Product analysis available at /recommend/analyze`);
});

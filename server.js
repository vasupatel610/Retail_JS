// server.js
import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
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
  recommendWithinBudget
} from "./src/search/recommend.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Resolve absolute paths regardless of process cwd
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, "public");

app.use(cors());
app.use(express.json());
app.use(express.static(publicDir));

// Load and prepare product data
const csvFilePath = path.join(__dirname, "data", "fashion_products_100_clean.csv");
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
  console.log(`✅ Loaded ${products.length} products`);
}

bootstrap().catch(err => {
  console.error("Bootstrap error:", err);
});

// Routes
app.get("/", (req, res) => {
  const indexPath = path.join(publicDir, "index.html");
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send("🚀 SBERT Semantic Search API running...");
  }
});

app.post("/search", async (req, res) => {
  const { query, topK = 5, hybrid = false, lexicalWeight = 0.2, facets = true } = req.body;
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    let results = hybrid
      ? await hybridSearch(products, extractor, query, { topK, lexicalWeight, useFacets: facets, medianPrice, vocab: facetVocab })
      : await semanticSearchOnly(products, extractor, query, topK, { useFacets: facets, vocab: facetVocab });
    // Strip heavy fields from response
    results = results.map(({ embedding, search_doc, ...rest }) => rest);
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
    
    // Strip heavy fields from response
    const clean = (arr) => (arr || []).map(({ embedding, search_doc, ...rest }) => rest);
    res.json({ 
      results: clean(results),
      metadata: {
        purpose,
        total_candidates: products.length - 1,
        returned: (results || []).length,
        context
      }
    });
  } catch (err) {
    console.error("Recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Specific recommendation endpoints for different use cases
app.post("/recommend/outfit", async (req, res) => {
  const { productId, topK = 5, includeScoring = false } = req.body;
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    const results = recommendOutfit(products, productId, { topK, includeScoring });
    res.json({ results, type: 'outfit' });
  } catch (err) {
    console.error("Outfit recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/recommend/occasion", async (req, res) => {
  const { productId, occasion, topK = 5, includeScoring = false } = req.body;
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    if (!occasion) {
      return res.status(400).json({ error: "Occasion is required" });
    }
    const results = recommendForOccasion(products, productId, occasion, { topK, includeScoring });
    res.json({ results, type: 'occasion', occasion });
  } catch (err) {
    console.error("Occasion recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

app.post("/recommend/budget", async (req, res) => {
  const { productId, budget, topK = 5, includeScoring = false } = req.body;
  try {
    if (!extractor || products.length === 0) {
      return res.status(503).json({ error: "Model or data not ready yet" });
    }
    if (!budget || !budget.min || !budget.max) {
      return res.status(400).json({ error: "Budget range (min, max) is required" });
    }
    const results = recommendWithinBudget(products, productId, budget, { topK, includeScoring });
    res.json({ results, type: 'budget', budget });
  } catch (err) {
    console.error("Budget recommendation error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

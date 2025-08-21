// src/utils/embeddings.js
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { pipeline as hfPipeline, env } from '@xenova/transformers';


const DATA_DIR = path.resolve('data');
const EMB_PATH = path.join(DATA_DIR, 'embeddings.json');
const HASH_PATH = path.join(DATA_DIR, 'doc_hash.txt');
const BIN_PATH = path.join(DATA_DIR, 'embeddings.bin');
const DIM_PATH = path.join(DATA_DIR, 'embeddings_dim.txt');
const MODEL_ID = process.env.EMBEDDINGS_MODEL_ID || process.env.MODEL_ID || 'Xenova/all-MiniLM-L6-v2';


function sha256(s) {
return crypto.createHash('sha256').update(s).digest('hex');
}


function computeDocsHash(products) {
const concat = products.map(p => `${p.id}|${p.search_doc}`).join('\n');
return sha256(concat);
}


function tryLoadCache(docHash) {
try {
if (!fs.existsSync(EMB_PATH) || !fs.existsSync(HASH_PATH)) return null;
const saved = fs.readFileSync(HASH_PATH, 'utf8').trim();
if (saved !== docHash) return null;
const cache = JSON.parse(fs.readFileSync(EMB_PATH, 'utf8'));
return cache; // { products, dim }
} catch {
return null;
}
}


function saveCache(cacheObj, docHash) {
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
fs.writeFileSync(EMB_PATH, JSON.stringify(cacheObj));
fs.writeFileSync(HASH_PATH, docHash);
}

// Binary cache: faster load than JSON for large catalogs
function tryLoadBinaryInto(products, docHash) {
  try {
    if (!fs.existsSync(BIN_PATH) || !fs.existsSync(DIM_PATH) || !fs.existsSync(HASH_PATH)) return null;
    const saved = fs.readFileSync(HASH_PATH, 'utf8').trim();
    if (saved !== docHash) return null;
    const dim = Number(fs.readFileSync(DIM_PATH, 'utf8').trim());
    const buf = fs.readFileSync(BIN_PATH);
    const floatArray = new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
    const count = Math.floor(floatArray.length / dim);
    if (count !== products.length) return null;
    for (let i = 0; i < products.length; i++) {
      const start = i * dim;
      const slice = floatArray.subarray(start, start + dim);
      // Keep in memory as Float32Array for faster dot products
      products[i].embedding = new Float32Array(slice);
    }
    return { products, dim };
  } catch {
    return null;
  }
}

function saveBinary(products, dim, docHash) {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    const total = products.length * dim;
    const arr = new Float32Array(total);
    for (let i = 0; i < products.length; i++) {
      const emb = products[i].embedding;
      for (let j = 0; j < dim; j++) arr[i * dim + j] = emb[j];
    }
    fs.writeFileSync(BIN_PATH, Buffer.from(arr.buffer));
    fs.writeFileSync(DIM_PATH, String(dim));
    fs.writeFileSync(HASH_PATH, docHash);
  } catch (e) {
    // Fallback silently; binary cache is optional
    console.warn('Warning: failed to save binary embeddings cache:', e?.message || e);
  }
}


export async function loadModel() {
// Persistent cache for model weights
process.env.TRANSFORMERS_CACHE = process.env.TRANSFORMERS_CACHE || path.resolve('.hf_cache');

// WASM runtime tuning
env.backends.onnx.wasm.simd = true;
env.backends.onnx.wasm.numThreads = Math.max(1, (os.cpus()?.length || 4) - 1);

const extractor = await hfPipeline('feature-extraction', MODEL_ID);
// Warm-up call to reduce first-query latency
await extractor('ok', { pooling: 'mean', normalize: true });
return extractor;
}


export async function ensureEmbeddings(products, extractor) {
const docHash = computeDocsHash(products);

// Prefer fast binary cache
const binLoaded = tryLoadBinaryInto(products, docHash);
if (binLoaded) {
  return binLoaded;
}

// Fallback to JSON cache
const cached = tryLoadCache(docHash);
if (cached) {
  // Convert embeddings to Float32Array in-memory for faster dot products
  const dim = cached.dim;
  for (let i = 0; i < cached.products.length; i++) {
    const emb = cached.products[i].embedding;
    cached.products[i].embedding = new Float32Array(emb);
  }
  // Populate binary cache for faster future startups
  saveBinary(cached.products, dim, docHash);
  return { products: cached.products, dim };
}

// Compute embeddings (with batching where possible)
let dim = null;
const batchSize = 32;
for (let i = 0; i < products.length; i += batchSize) {
  const batch = products.slice(i, i + batchSize);
  const texts = batch.map(p => p.search_doc);
  let outs;
  let batchedSucceeded = true;
  try {
    outs = await extractor(texts, { pooling: 'mean', normalize: true });
  } catch {
    batchedSucceeded = false;
  }
  if (batchedSucceeded && Array.isArray(outs)) {
    for (let j = 0; j < batch.length; j++) {
      const data = outs[j].data ?? outs[j];
      const vec = Array.from(data);
      batch[j].embedding = new Float32Array(vec);
      if (!dim) dim = vec.length;
    }
  } else {
    // Fallback: per item
    for (let j = 0; j < batch.length; j++) {
      const emb = await extractor(batch[j].search_doc, { pooling: 'mean', normalize: true });
      const vec = Array.from(emb.data);
      batch[j].embedding = new Float32Array(vec);
      if (!dim) dim = vec.length;
    }
  }
  const done = Math.min(i + batch.length, products.length);
  if (done % 50 === 0 || done === products.length) console.log(`Embedded ${done}/${products.length}`);
}

// Save caches (JSON + binary)
// JSON expects plain arrays, so serialize accordingly
const serializable = products.map(p => ({ ...p, embedding: Array.from(p.embedding) }));
saveCache({ products: serializable, dim }, docHash);
saveBinary(serializable, dim, docHash);

return { products, dim };
}


export async function embedQuery(extractor, text) {
const out = await extractor(text, { pooling: 'mean', normalize: true });
return Array.from(out.data);
}
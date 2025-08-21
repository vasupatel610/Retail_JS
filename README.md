# Fashion Semantic Search (SBERT in JavaScript)


End-to-end semantic + hybrid search and recommendations using `@xenova/transformers` (browser/Node JS port of Hugging Face Transformers).


## Features
- Uses pre-trained Sentence-BERT variant: **Xenova/all-MiniLM-L6-v2**
- Loads `data/fashion_products_100_clean.csv`
- Uses only the fields available in `data/fashion_products_100_clean.csv`
- Normalizes text (colors/material synonyms)
- Builds a single **search document** per product
- Computes & **caches embeddings** (one-time) to `/data/embeddings.json`
- **Hybrid search** = semantic cosine + keyword score + business boosts (in-stock, price close to median)
- **Recommendations** = nearest neighbors + small same-category/type boost
- Simple **Express API** + optional static frontend in `/public`


## Quickstart
```bash
npm install
npm start
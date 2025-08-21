// src/utils/text_cleaner.js
import { colorMap, materialMap } from '../config/taxonomy.js';


export function normalizeText(str) {
if (!str) return '';
let t = String(str).toLowerCase();
// map colors
for (const [from, to] of Object.entries(colorMap)) {
t = t.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
}
// map materials
for (const [from, to] of Object.entries(materialMap)) {
t = t.replace(new RegExp(`\\b${from}\\b`, 'gi'), to);
}
return t.replace(/\s+/g, ' ').trim();
}
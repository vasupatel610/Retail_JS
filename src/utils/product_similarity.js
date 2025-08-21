// src/utils/product_similarity.js
import { 
  colorHarmony, 
  materialCompatibility, 
  occasionCompatibility, 
  sizeGroups 
} from '../config/taxonomy.js';

/**
 * Calculate color similarity and harmony score
 * @param {string} color1 - First product color
 * @param {string} color2 - Second product color
 * @returns {number} - Similarity score (0-1)
 */
export function colorSimilarity(color1, color2) {
  if (!color1 || !color2) return 0;
  
  const c1 = color1.toLowerCase().trim();
  const c2 = color2.toLowerCase().trim();
  
  // Exact match
  if (c1 === c2) return 1.0;
  
  // Neutral color compatibility
  if (colorHarmony.neutral.includes(c1) && colorHarmony.neutral.includes(c2)) {
    return 0.8;
  }
  
  // Check analogous colors
  if (colorHarmony.analogous[c1]?.includes(c2) || 
      colorHarmony.analogous[c2]?.includes(c1)) {
    return 0.7;
  }
  
  // Check complementary colors (good for outfits)
  if (colorHarmony.complementary[c1]?.includes(c2) || 
      colorHarmony.complementary[c2]?.includes(c1)) {
    return 0.6;
  }
  
  return 0.1; // Different colors
}

/**
 * Calculate material compatibility score
 * @param {string} material1 - First product material
 * @param {string} material2 - Second product material
 * @param {string} occasion - Occasion context (optional)
 * @returns {number} - Compatibility score (0-1)
 */
export function materialSimilarity(material1, material2, occasion = null) {
  if (!material1 || !material2) return 0;
  
  const m1 = material1.toLowerCase().trim();
  const m2 = material2.toLowerCase().trim();
  
  // Exact match
  if (m1 === m2) return 1.0;
  
  // Check occasion-based compatibility
  if (occasion && materialCompatibility[occasion]) {
    const compatibleMaterials = materialCompatibility[occasion];
    if (compatibleMaterials.includes(m1) && compatibleMaterials.includes(m2)) {
      return 0.8;
    }
  }
  
  // General material compatibility rules
  const premiumMaterials = ['silk', 'leather', 'wool', 'suede'];
  const casualMaterials = ['cotton', 'denim', 'canvas'];
  const syntheticMaterials = ['polyester', 'synthetic'];
  
  if (premiumMaterials.includes(m1) && premiumMaterials.includes(m2)) return 0.7;
  if (casualMaterials.includes(m1) && casualMaterials.includes(m2)) return 0.7;
  if (syntheticMaterials.includes(m1) && syntheticMaterials.includes(m2)) return 0.6;
  
  return 0.2; // Different material families
}

/**
 * Calculate occasion compatibility score
 * @param {string} occasion1 - First product occasion
 * @param {string} occasion2 - Second product occasion
 * @returns {number} - Compatibility score (0-1)
 */
export function occasionSimilarity(occasion1, occasion2) {
  if (!occasion1 || !occasion2) return 0.5; // Neutral if missing
  
  const o1 = occasion1.toLowerCase().trim();
  const o2 = occasion2.toLowerCase().trim();
  
  // Exact match
  if (o1 === o2) return 1.0;
  
  // Check compatibility
  if (occasionCompatibility[o1]?.includes(o2) || 
      occasionCompatibility[o2]?.includes(o1)) {
    return 0.7;
  }
  
  return 0.3; // Different occasions
}

/**
 * Calculate size compatibility score
 * @param {string} size1 - First product size
 * @param {string} size2 - Second product size
 * @param {string} category - Product category to determine size system
 * @returns {number} - Compatibility score (0-1)
 */
export function sizeSimilarity(size1, size2, category = 'clothing') {
  if (!size1 || !size2) return 0.5; // Neutral if missing
  
  const s1 = size1.toLowerCase().trim();
  const s2 = size2.toLowerCase().trim();
  
  // Exact match
  if (s1 === s2) return 1.0;
  
  // Check size group compatibility
  const categoryMap = sizeGroups[category] || sizeGroups.clothing;
  
  for (const [group, sizes] of Object.entries(categoryMap)) {
    if (sizes.includes(s1) && sizes.includes(s2)) {
      return 0.8; // Same size group
    }
  }
  
  // Adjacent sizes (approximate)
  const clothingSizes = ['xs', 's', 'm', 'l', 'xl', 'xxl'];
  const idx1 = clothingSizes.indexOf(s1);
  const idx2 = clothingSizes.indexOf(s2);
  
  if (idx1 >= 0 && idx2 >= 0) {
    const diff = Math.abs(idx1 - idx2);
    if (diff === 1) return 0.6; // Adjacent sizes
    if (diff === 2) return 0.4; // Two sizes apart
  }
  
  return 0.2; // Very different sizes
}

/**
 * Calculate age group compatibility score
 * @param {string} age1 - First product age group
 * @param {string} age2 - Second product age group
 * @returns {number} - Compatibility score (0-1)
 */
export function ageGroupSimilarity(age1, age2) {
  if (!age1 || !age2) return 0.5; // Neutral if missing
  
  const a1 = age1.toLowerCase().trim();
  const a2 = age2.toLowerCase().trim();
  
  // Exact match
  if (a1 === a2) return 1.0;
  
  // "All Ages" is compatible with everything
  if (a1 === 'all ages' || a2 === 'all ages') return 0.8;
  
  // Adults and teens have some compatibility
  if ((a1 === 'adults' && a2 === 'teens') || (a1 === 'teens' && a2 === 'adults')) {
    return 0.6;
  }
  
  return 0.2; // Very different age groups
}

/**
 * Calculate brand affinity score
 * @param {string} brand1 - First product brand
 * @param {string} brand2 - Second product brand
 * @returns {number} - Affinity score (0-1)
 */
export function brandSimilarity(brand1, brand2) {
  if (!brand1 || !brand2) return 0.3; // Neutral if missing
  
  const b1 = brand1.toLowerCase().trim();
  const b2 = brand2.toLowerCase().trim();
  
  // Exact match gets high score
  if (b1 === b2) return 0.9;
  
  // Brand tier compatibility (luxury, mid-range, etc.)
  const luxuryBrands = ['gucci', 'ray-ban', 'michael kors', 'tommy hilfiger'];
  const sportsBrands = ['nike', 'adidas', 'puma', 'reebok'];
  const casualBrands = ['zara', 'h&m', 'levis'];
  const affordable = ['bata', 'fossil'];
  
  if (luxuryBrands.includes(b1) && luxuryBrands.includes(b2)) return 0.7;
  if (sportsBrands.includes(b1) && sportsBrands.includes(b2)) return 0.7;
  if (casualBrands.includes(b1) && casualBrands.includes(b2)) return 0.6;
  if (affordable.includes(b1) && affordable.includes(b2)) return 0.6;
  
  return 0.1; // Different brand tiers
}

/**
 * Calculate category compatibility score
 * @param {string} category1 - First product category
 * @param {string} category2 - Second product category
 * @returns {number} - Compatibility score (0-1)
 */
export function categorySimilarity(category1, category2) {
  if (!category1 || !category2) return 0.3; // Neutral if missing
  
  const c1 = category1.toLowerCase().trim();
  const c2 = category2.toLowerCase().trim();
  
  // Exact match
  if (c1 === c2) return 1.0;
  
  // Cross-category compatibility for outfit recommendations
  const outfitCompatibility = {
    'clothing': ['accessories', 'footwear'],
    'footwear': ['clothing', 'accessories'],
    'accessories': ['clothing', 'footwear']
  };
  
  if (outfitCompatibility[c1]?.includes(c2)) {
    return 0.6; // Good for complete outfits
  }
  
  return 0.2; // Different categories
}

/**
 * Calculate price range compatibility
 * @param {number} price1 - First product price
 * @param {number} price2 - Second product price
 * @returns {number} - Compatibility score (0-1)
 */
export function priceSimilarity(price1, price2) {
  if (!price1 || !price2) return 0.5; // Neutral if missing
  
  const ratio = Math.min(price1, price2) / Math.max(price1, price2);
  
  // Very similar prices
  if (ratio > 0.8) return 1.0;
  if (ratio > 0.6) return 0.8;
  if (ratio > 0.4) return 0.6;
  if (ratio > 0.2) return 0.4;
  
  return 0.1; // Very different price ranges
}

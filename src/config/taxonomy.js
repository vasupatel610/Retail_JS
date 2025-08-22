export const colorMap = {
navy: 'blue', cobalt: 'blue', azure: 'blue', sky: 'blue', indigo: 'blue',
crimson: 'red', scarlet: 'red', maroon: 'red',
grey: 'gray', charcoal: 'gray', silver: 'gray',
fuchsia: 'pink', magenta: 'pink',
beige: 'brown', khaki: 'brown', tan: 'brown', camel: 'brown',
offwhite: 'white', ivory: 'white', cream: 'white',
burgundy: 'red', coral: 'pink', mint: 'green', olive: 'green',
turquoise: 'blue', teal: 'blue', lavender: 'purple'
};

// Color harmony rules for better color coordination recommendations
export const colorHarmony = {
  complementary: {
    red: ['green'],
    blue: ['yellow'],
    yellow: ['blue'],
    green: ['red'],
    purple: ['yellow'],
    pink: ['green']
  },
  analogous: {
    red: ['pink', 'brown'],
    blue: ['purple', 'green'],
    yellow: ['green', 'brown'],
    green: ['blue', 'yellow'],
    purple: ['blue', 'pink'],
    pink: ['red', 'purple'],
    brown: ['red', 'yellow'],
    gray: ['blue', 'purple'],
    black: ['gray', 'white'],
    white: ['gray', 'black']
  },
  neutral: ['black', 'white', 'gray', 'brown']
};


export const materialMap = {
// Canonicalize to materials present in CSV
// Avoid mapping 'denim' to 'cotton' since CSV includes 'denim'
chiffon: 'polyester', jersey: 'cotton',
leatherette: 'synthetic', pleather: 'synthetic', 'faux leather': 'synthetic', 'pu leather': 'synthetic',
viscose: 'polyester', rayon: 'polyester',
corduroy: 'cotton', flannel: 'cotton',
velvet: 'silk', satin: 'silk',
nylon: 'synthetic', spandex: 'synthetic', lycra: 'synthetic'
};

// Material compatibility for recommendations
export const materialCompatibility = {
  formal: ['silk', 'wool', 'leather', 'cotton'],
  casual: ['cotton', 'denim', 'polyester', 'canvas'],
  party: ['silk', 'synthetic', 'metal', 'leather'],
  sports: ['polyester', 'synthetic', 'cotton'],
  winter: ['wool', 'leather', 'synthetic'],
  summer: ['cotton', 'linen', 'silk', 'canvas'],
  premium: ['silk', 'leather', 'wool', 'suede'],
  durable: ['leather', 'canvas', 'denim', 'polyester']
};


// Canonical value sets based on CSV contents
export const colors = [
'black', 'white', 'gray', 'red', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown'
];

export const materials = [
'cotton', 'polyester', 'wool', 'leather', 'synthetic', 'suede', 'denim', 'canvas', 'metal', 'silk'
];

// Category keywords observed in product names mapped to CSV categories
export const categoryKeywords = {
clothing: ['t-shirt', 'tee', 'shirt', 'dress', 'skirt', 'sweater', 'hoodie', 'jacket', 'kurta', 'saree'],
footwear: ['shoe', 'shoes', 'sneaker', 'sneakers', 'boots', 'sandals', 'heels', 'slippers', 'loafers', 'running shoes'],
accessories: ['watch', 'hat', 'cap', 'wallet', 'handbag', 'sunglasses', 'backpack', 'belt', 'jewelry']
};

// Normalize sizes to canonical tokens
export function normalizeSize(size) {
if (!size) return '';
let s = String(size).trim().toLowerCase();
if (s === 'one size' || s === 'one-size' || s === 'onesize') return 'one_size';
// Normalize space and case
s = s.replace(/\s+/g, '');
// Normalize UK shoe sizes like 8UK
const uk = s.match(/^(\d{1,2})uk$/);
if (uk) return `${uk[1]}uk`;
// Clothing sizes
if (['xs','s','m','l','xl','xxl'].includes(s)) return s;
return s;
}

export const productTypeRules = [
// Keep rules for potential future enrichment, but we won't filter by these
{ re: /\bjeans?\b/i, val: 'jeans' },
{ re: /\bt[-\s]?shirt|tee\b/i, val: 't-shirt' },
{ re: /\bshirt\b/i, val: 'shirt' },
{ re: /\bhoodie|sweatshirt\b/i, val: 'hoodie' },
{ re: /\bdress\b/i, val: 'dress' },
{ re: /\btrouser|pant\b/i, val: 'trousers' },
{ re: /\bshorts?\b/i, val: 'shorts' },
{ re: /\bskirt\b/i, val: 'skirt' },
{ re: /\bsneaker|shoe\b/i, val: 'shoes' },
{ re: /\bjacket|coat\b/i, val: 'jacket' }
];


export const occasionRules = [
{ re: /\bformal|office|work\b/i, val: 'formal' },
{ re: /\bparty|evening|cocktail\b/i, val: 'party' },
{ re: /\bcasual|everyday|daily\b/i, val: 'casual' },
{ re: /\bsports?|workout|gym|athleisure\b/i, val: 'sports' },
{ re: /\bfestive|wedding|ceremony\b/i, val: 'festive' },
{ re: /\bbeach|summer|vacation\b/i, val: 'beach' },
{ re: /\bwinter|cold|warm\b/i, val: 'winter' },
{ re: /\btravel|trip\b/i, val: 'travel' },
{ re: /\bhome|house|indoor\b/i, val: 'home' }
];

// Occasion compatibility for cross-recommendations
export const occasionCompatibility = {
  formal: ['office', 'party', 'wedding'],
  casual: ['beach', 'travel', 'home'],
  party: ['festive', 'wedding'],
  sports: ['gym', 'travel', 'casual'],
  festive: ['wedding', 'party'],
  winter: ['formal', 'casual'],
  beach: ['summer', 'casual', 'travel'],
  travel: ['casual', 'beach'],
  home: ['casual']
};

export const ageGroupRules = [
{ re: /\bkids?|children|child|boy|girl\b/i, val: 'kids' },
{ re: /\bteen|youth\b/i, val: 'teen' },
{ re: /\bmen|man|male\b/i, val: 'men' },
{ re: /\bwomen|woman|female|ladies?\b/i, val: 'women' },
{ re: /\badults?|grown.?up\b/i, val: 'adults' },
{ re: /\ball.?ages?|everyone|universal\b/i, val: 'all ages' }
];

// Size group compatibility for recommendations
export const sizeGroups = {
  clothing: {
    small: ['xs', 's'],
    medium: ['m', 'l'],
    large: ['xl', 'xxl']
  },
  footwear: {
    small: ['5uk', '6uk', '7uk'],
    medium: ['8uk', '9uk', '10uk'],
    large: ['11uk', '12uk']
  },
  accessories: {
    onesize: ['one_size', 'one size']
  }
};

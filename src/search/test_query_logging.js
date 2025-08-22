// Test file for query-based heuristic recommendation logging
import { heuristicRecommendForQuery } from './heuristic_recommend.js';

// Example test data (you'll need to replace with your actual product data)
const sampleProducts = [
  {
    id: '1',
    name: 'Nike Air Max',
    category: 'sneakers',
    color: 'white',
    brand: 'Nike',
    embedding: [0.1, 0.2, 0.3, 0.4] // Your actual embeddings here
  },
  {
    id: '2', 
    name: 'Adidas Ultraboost',
    category: 'sneakers',
    color: 'black',
    brand: 'Adidas',
    embedding: [0.2, 0.3, 0.4, 0.5]
  },
  {
    id: '3',
    name: 'Converse Chuck Taylor',
    category: 'sneakers', 
    color: 'white',
    brand: 'Converse',
    embedding: [0.15, 0.25, 0.35, 0.45]
  }
];

// Test the query-based logging
console.log('🚀 Testing Query-Based Heuristic Recommendation Logging...\n');

try {
  const results = heuristicRecommendForQuery(sampleProducts, '1', {
    topK: 5,
    includeScoring: true
  });
  
  console.log('\n✅ Results:', results);
  
} catch (error) {
  console.error('❌ Error:', error.message);
  console.log('\n💡 Make sure to:');
  console.log('1. Replace sampleProducts with your actual product data');
  console.log('2. Ensure all required similarity functions are available');
  console.log('3. Check that embeddings are properly formatted');
}

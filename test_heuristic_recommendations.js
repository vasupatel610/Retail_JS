// test_heuristic_recommendations.js
// Test script for the enhanced heuristic recommendation system

import { readFileSync } from 'fs';
import Papa from 'papaparse';

// Test the heuristic recommendation API
async function testHeuristicRecommendations() {
  const baseUrl = 'https://retail-js.vercel.app';
  
  try {
    // Read the CSV to get some sample product IDs
    const csvFile = readFileSync('data/fashion_products_100_clean.csv', 'utf8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
    const sampleProducts = parsed.data.slice(0, 5);
    
    console.log('🧪 Testing Heuristic Rule-Based Expansion Recommendations\n');
    
    for (const product of sampleProducts) {
      console.log(`\n📦 Testing with: ${product.product_name} (${product.product_category})`);
      console.log(`   Brand: ${product.brand}, Color: ${product.color}, Material: ${product.material}`);
      
      // Test 1: Analyze product sets
      console.log('\n📊 Analyzing product sets distribution...');
      const analysisResponse = await fetch(`${baseUrl}/recommend/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.product_id })
      });
      
      if (analysisResponse.ok) {
        const analysis = await analysisResponse.json();
        console.log(`   Set 1 (Exact match): ${analysis.analysis.distribution.set1} items`);
        console.log(`   Set 2 (Close substitutes): ${analysis.analysis.distribution.set2} items`);
        console.log(`   Set 3 (Broader exploration): ${analysis.analysis.distribution.set3} items`);
      }
      
      // Test 2: Heuristic recommendations
      console.log('\n🔬 Getting heuristic recommendations...');
      const heuristicResponse = await fetch(`${baseUrl}/recommend/heuristic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: product.product_id,
          topK: 8,
          includeScoring: true
        })
      });
      
      if (heuristicResponse.ok) {
        const heuristic = await heuristicResponse.json();
        console.log(`   Found ${heuristic.results.results.length} recommendations:`);
        
        // Group by set
        const bySets = { 1: [], 2: [], 3: [], 0: [] };
        heuristic.results.results.forEach(item => {
          bySets[item.set || 0].push(item);
        });
        
        Object.entries(bySets).forEach(([set, items]) => {
          if (items.length > 0) {
            console.log(`     Set ${set}: ${items.length} items`);
            items.slice(0, 2).forEach(item => {
              console.log(`       - ${item.name} (Score: ${item.heuristic_score?.toFixed(3)})`);
            });
          }
        });
      }
      
      // Test 3: Custom weights
      console.log('\n⚙️  Testing custom weights (emphasize color matching)...');
      const customWeights = {
        set1: { alpha: 0.3, beta: 0.2, gamma: 0.4, delta: 0.1 }, // High color weight
        set2: { alpha: 0.4, beta: 0.2, gamma: 0.3, delta: 0.1 },
        set3: { alpha: 0.5, beta: 0.1, gamma: 0.2, delta: 0.2 }
      };
      
      const customResponse = await fetch(`${baseUrl}/recommend/heuristic/custom`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productId: product.product_id,
          customWeights,
          topK: 5
        })
      });
      
      if (customResponse.ok) {
        const custom = await customResponse.json();
        console.log(`   Custom recommendations (color-focused):`);
        custom.results.slice(0, 3).forEach((item, i) => {
          console.log(`     ${i+1}. ${item.name} - ${item.color || 'N/A'} (Score: ${item.heuristic_score?.toFixed(3)})`);
        });
      }
      
      console.log('\n' + '='.repeat(80));
    }
    
    console.log('\n✅ Heuristic recommendation testing completed!');
    console.log('\n📈 Summary:');
    console.log('   • Heuristic Rule-Based Expansion implemented with tiered sets');
    console.log('   • Formula: α*(SBERT) + β*(category) + γ*(color) + δ*(brand)');
    console.log('   • Set 1: Exact intent match (strong category + color)');
    console.log('   • Set 2: Close substitutes (relaxed color/brand)'); 
    console.log('   • Set 3: Broader exploration (style/brand focus)');
    console.log('   • Custom weight tuning available for different use cases');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test if server is available
async function checkServerAndTest() {
  try {
    const response = await fetch('https://retail-js.vercel.app/');
    if (response.ok) {
      await testHeuristicRecommendations();
    } else {
      console.log('❌ Server not responding. Please start the server first:');
      console.log('   npm start  or  node server_clean.js');
    }
  } catch (error) {
    console.log('❌ Server not available. Please start the server first:');
    console.log('   npm start  or  node server_clean.js');
    console.log('\nThen run this test: node test_heuristic_recommendations.js');
  }
}

checkServerAndTest();

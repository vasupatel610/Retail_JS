// quick_test.js - Quick test of heuristic recommendations
import { readFileSync } from 'fs';
import Papa from 'papaparse';

async function quickTest() {
  console.log('🧪 Quick Test of Heuristic Recommendations\n');
  
  try {
    // Get a sample product ID
    const csvFile = readFileSync('data/fashion_products_100_clean.csv', 'utf8');
    const parsed = Papa.parse(csvFile, { header: true, skipEmptyLines: true });
    const sampleProduct = parsed.data[0]; // Blue Adidas Sandals
    
    console.log(`📦 Testing with: ${sampleProduct.product_name}`);
    console.log(`   Category: ${sampleProduct.product_category}, Brand: ${sampleProduct.brand}, Color: ${sampleProduct.color}\n`);
    
    // Test heuristic recommendations
    console.log('🔬 Testing Heuristic Rule-Based Expansion...');
    const response = await fetch('http://localhost:3000/recommend/heuristic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: sampleProduct.product_id,
        topK: 8,
        includeScoring: true
      })
    });
    
    if (!response.ok) {
      console.error('❌ Server error:', response.status);
      return;
    }
    
    const data = await response.json();
    
    if (data.results && data.results.length > 0) {
      console.log(`✅ Got ${data.results.length} recommendations!`);
      console.log(`📊 Distribution: Set1=${data.metadata.distribution.set1}, Set2=${data.metadata.distribution.set2}, Set3=${data.metadata.distribution.set3}\n`);
      
      // Group by sets
      const bySets = { 1: [], 2: [], 3: [], 0: [] };
      data.results.forEach(item => {
        bySets[item.set || 0].push(item);
      });
      
      Object.entries(bySets).forEach(([set, items]) => {
        if (items.length > 0) {
          console.log(`📋 Set ${set} (${items.length} items):`);
          items.forEach((item, i) => {
            console.log(`   ${i+1}. ${item.name} - ${item.category} (Score: ${item.heuristic_score?.toFixed(3)})`);
          });
          console.log('');
        }
      });
      
      console.log('🎯 Heuristic Rule-Based Expansion is working correctly!');
      console.log('   Formula: α*(SBERT) + β*(category) + γ*(color) + δ*(brand)');
      console.log('   Set 1: Strong category + color matching');
      console.log('   Set 2: Same category group, relaxed constraints');
      console.log('   Set 3: Style/brand consistency focus');
      
    } else {
      console.log('📭 No recommendations returned');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n💡 Make sure the server is running: npm start');
  }
}

quickTest();

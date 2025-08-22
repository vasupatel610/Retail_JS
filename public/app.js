class FashionSearchApp {
    constructor() {
        this.API_BASE = 'https://retail-js.vercel.app/';
        this.currentQuery = '';
        this.searchResults = [];
        
        try {
            console.log('Initializing FashionSearchApp...');
            this.initializeElements();
            this.setupEventListeners();
            this.showWelcomeState();
            console.log('FashionSearchApp initialized successfully');
        } catch (error) {
            console.error('Error initializing FashionSearchApp:', error);
        }
    }
    
    initializeElements() {
        try {
            console.log('Initializing elements...');
            
            // Search elements
            this.searchInput = document.getElementById('searchInput');
            this.searchBtn = document.getElementById('searchBtn');
            this.searchMethod = document.getElementById('searchMethod');
            this.linearMethod = document.getElementById('linearMethod');
            this.topKSelect = document.getElementById('topK');
            this.compareBtn = document.getElementById('compareBtn');
            this.evaluateBtn = document.getElementById('evaluateBtn');
            this.comprehensiveBtn = document.getElementById('comprehensiveBtn');
            this.heuristicBtn = document.getElementById('heuristicBtn');
            this.heuristicCustomBtn = document.getElementById('heuristicCustomBtn');
            this.heuristicAnalysisBtn = document.getElementById('heuristicAnalysisBtn');
            
            // Debug button initialization
            console.log('Button initialization:');
            console.log('evaluateBtn:', this.evaluateBtn);
            console.log('comprehensiveBtn:', this.comprehensiveBtn);
            console.log('compareBtn:', this.compareBtn);
            
            // State elements
            this.loadingState = document.getElementById('loadingState');
            this.resultsSection = document.getElementById('resultsSection');
            this.resultsContainer = document.getElementById('resultsContainer');
            this.noResults = document.getElementById('noResults');
            this.errorState = document.getElementById('errorState');
            this.comparisonSection = document.getElementById('comparisonSection');
            this.evaluationSection = document.getElementById('evaluationSection');
            this.comprehensiveSection = document.getElementById('comprehensiveSection');
            this.heuristicSection = document.getElementById('heuristicSection');
            this.heuristicAnalysisSection = document.getElementById('heuristicAnalysisSection');
            
            // Results info
            this.resultsTitle = document.getElementById('resultsTitle');
            this.resultsCount = document.getElementById('resultsCount');
            this.searchTime = document.getElementById('searchTime');
            
            // Modal
            this.productModal = document.getElementById('productModal');
            this.modalBody = document.getElementById('modalBody');
            this.closeModal = document.getElementById('closeModal');
            
            // Error handling
            this.errorMessage = document.getElementById('errorMessage');
            this.retryBtn = document.getElementById('retryBtn');
            
            console.log('Elements initialized successfully');
        } catch (error) {
            console.error('Error initializing elements:', error);
            throw error;
        }
    }
    
    setupEventListeners() {
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Quick search tags
        document.querySelectorAll('.quick-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const query = e.target.dataset.query;
                this.searchInput.value = query;
                this.performSearch();
            });
        });
        
        // Modal functionality
        this.closeModal.addEventListener('click', () => this.closeProductModal());
        this.productModal.addEventListener('click', (e) => {
            if (e.target === this.productModal) this.closeProductModal();
        });
        
        // Retry functionality
        this.retryBtn.addEventListener('click', () => this.performSearch());
        
        // Compare methods functionality
        this.compareBtn.addEventListener('click', () => this.performComparison());
        
        // Evaluation functionality
        console.log('Setting up evaluation button listener');
        if (this.evaluateBtn) {
            this.evaluateBtn.addEventListener('click', () => {
                console.log('Evaluate button clicked!');
                this.performEvaluation();
            });
        } else {
            console.error('evaluateBtn is null!');
        }
        
        console.log('Setting up comprehensive button listener');
        if (this.comprehensiveBtn) {
            this.comprehensiveBtn.addEventListener('click', () => {
                console.log('Comprehensive button clicked!');
                this.performComprehensiveEvaluation();
            });
        } else {
            console.error('comprehensiveBtn is null!');
        }
        
        // Heuristic recommendation functionality
        console.log('Setting up heuristic button listeners');
        if (this.heuristicBtn) {
            this.heuristicBtn.addEventListener('click', () => {
                console.log('Heuristic button clicked!');
                this.performHeuristicRecommendation();
            });
        }
        
        if (this.heuristicCustomBtn) {
            this.heuristicCustomBtn.addEventListener('click', () => {
                console.log('Heuristic Custom button clicked!');
                this.performCustomHeuristic();
            });
        }
        
        if (this.heuristicAnalysisBtn) {
            this.heuristicAnalysisBtn.addEventListener('click', () => {
                console.log('Heuristic Analysis button clicked!');
                this.performHeuristicAnalysis();
            });
        }
        
        // Real-time search suggestions
        this.searchInput.addEventListener('input', this.debounce(() => {
            if (this.searchInput.value.trim().length > 2) {
                // Could add search suggestions here in the future
            }
        }, 300));
    }
    
    showWelcomeState() {
        this.hideAllStates();
        // Show welcome message or featured items here
    }
    
    hideAllStates() {
        [this.loadingState, this.resultsSection, this.noResults, this.errorState, this.comparisonSection, this.evaluationSection, this.comprehensiveSection, this.heuristicSection, this.heuristicAnalysisSection]
            .forEach(el => el.classList.add('hidden'));
    }
    
    showLoadingState() {
        this.hideAllStates();
        this.loadingState.classList.remove('hidden');
    }
    
    showErrorState(message = 'Something went wrong. Please try again.') {
        this.hideAllStates();
        this.errorMessage.textContent = message;
        this.errorState.classList.remove('hidden');
    }
    
    showNoResultsState() {
        this.hideAllStates();
        this.noResults.classList.remove('hidden');
    }
    
    showResultsState() {
        this.hideAllStates();
        this.resultsSection.classList.remove('hidden');
    }
    
    async performSearch() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.searchInput.focus();
            return;
        }
        
        this.currentQuery = query;
        this.showLoadingState();
        
        const startTime = performance.now();
        
        try {
            const searchParams = {
                query: query,
                topK: parseInt(this.topKSelect.value),
                method: this.searchMethod.value,
                linearMethod: this.linearMethod.value,
                lexicalWeight: 0.3,
                semanticWeight: 0.7,
                facets: true,
                earlyTermination: true,
                minScoreThreshold: 0.1
            };
            
            const response = await fetch(`${this.API_BASE}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(searchParams)
            });
            
            const endTime = performance.now();
            const searchTimeMs = Math.round(endTime - startTime);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.searchResults = data.results || [];
            
            if (this.searchResults.length === 0) {
                this.showNoResultsState();
            } else {
                this.displayResults(searchTimeMs);
            }
            
        } catch (error) {
            console.error('Search error:', error);
            this.showErrorState(error.message);
        }
    }
    
    async performComparison() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.searchInput.focus();
            return;
        }
        
        this.showLoadingState();
        
        try {
            const response = await fetch(`${this.API_BASE}/search/compare`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: query,
                    topK: parseInt(this.topKSelect.value),
                    facets: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`Comparison failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayComparisonResults(data);
            
        } catch (error) {
            console.error('Comparison error:', error);
            this.showErrorState(error.message);
        }
    }
    
    displayComparisonResults(data) {
        this.hideAllStates();
        this.comparisonSection.classList.remove('hidden');
        
        // Update performance cards
        this.updatePerformanceCard('linearPerf', data.performance.linear);
        this.updatePerformanceCard('semanticPerf', data.performance.semantic);
        this.updatePerformanceCard('hybridPerf', data.performance.hybrid);
        this.updatePerformanceCard('adaptivePerf', data.performance.adaptive);
        
        // Display comparison results
        this.displayComparisonResultsList(data);
        
        // Scroll to comparison section
        this.comparisonSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    updatePerformanceCard(cardId, perfData) {
        const card = document.getElementById(cardId);
        const timeSpan = card.querySelector('.time');
        const resultsSpan = card.querySelector('.results');
        const perfFill = card.querySelector('.perf-fill');
        
        timeSpan.textContent = `${perfData.time}ms`;
        resultsSpan.textContent = `${perfData.results} results`;
        
        // Simple performance bar (time-based, lower is better)
        const maxTime = Math.max(perfData.time, 1);
        const normalizedWidth = Math.max(10, (1000 / maxTime) * 100); // Scale to show differences
        perfFill.style.width = `${Math.min(100, normalizedWidth)}%`;
    }
    
    displayComparisonResultsList(data) {
        const container = document.getElementById('comparisonResults');
        container.innerHTML = '';
        
        // Create comparison table
        const table = document.createElement('table');
        table.className = 'comparison-table';
        
        // Add table headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Method', 'Time', 'Results', 'Top Result'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        Object.entries(data.results).forEach(([method, results]) => {
            const row = document.createElement('tr');
            
            // Method name
            const methodCell = document.createElement('td');
            methodCell.textContent = method.charAt(0).toUpperCase() + method.slice(1);
            row.appendChild(methodCell);
            
            // Time
            const timeCell = document.createElement('td');
            timeCell.textContent = `${data.performance[method].time}ms`;
            row.appendChild(timeCell);
            
            // Results count
            const resultsCell = document.createElement('td');
            resultsCell.textContent = results.length;
            row.appendChild(resultsCell);
            
            // Top result
            const topResultCell = document.createElement('td');
            if (results.length > 0) {
                topResultCell.textContent = results[0].name || 'N/A';
            } else {
                topResultCell.textContent = 'N/A';
            }
            row.appendChild(topResultCell);
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
    }
    
    async performEvaluation() {
        const query = this.searchInput.value.trim();
        
        if (!query) {
            this.searchInput.focus();
            return;
        }
        
        console.log('Starting evaluation for query:', query);
        console.log('Search method:', this.searchMethod.value);
        console.log('Linear method:', this.linearMethod.value);
        console.log('TopK:', this.topKSelect.value);
        
        this.showLoadingState();
        
        try {
            const requestBody = {
                query: query,
                topK: parseInt(this.topKSelect.value),
                method: this.searchMethod.value,
                linearMethod: this.linearMethod.value,
                includeGroundTruth: true
            };
            
            console.log('Sending evaluation request:', requestBody);
            
            const response = await fetch(`${this.API_BASE}/evaluate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (!response.ok) {
                throw new Error(`Evaluation failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            console.log('Evaluation response data:', data);
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayEvaluationResults(data);
            
        } catch (error) {
            console.error('Evaluation error:', error);
            this.showErrorState(error.message);
        }
    }
    
    displayEvaluationResults(data) {
        this.hideAllStates();
        this.evaluationSection.classList.remove('hidden');
        
        // Update metric values
        document.getElementById('precisionValue').textContent = data.evaluation.precision;
        document.getElementById('recallValue').textContent = data.evaluation.recall;
        document.getElementById('f1Value').textContent = data.evaluation.f1;
        document.getElementById('mapValue').textContent = data.evaluation.map;
        document.getElementById('ndcgValue').textContent = data.evaluation.ndcg;
        document.getElementById('latencyValue').textContent = `${data.latency}ms`;
        
        // Display evaluation details
        this.displayEvaluationDetails(data);
        
        // Scroll to evaluation section
        this.evaluationSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    displayEvaluationDetails(data) {
        const container = document.getElementById('evaluationDetails');
        container.innerHTML = '';
        
        // Create evaluation summary
        const summary = document.createElement('div');
        summary.className = 'evaluation-summary';
        
        const queryInfo = document.createElement('h3');
        queryInfo.textContent = `Query: "${data.query}"`;
        summary.appendChild(queryInfo);
        
        const methodInfo = document.createElement('p');
        methodInfo.innerHTML = `<strong>Method:</strong> ${data.method} | <strong>Top-K:</strong> ${data.topK}`;
        summary.appendChild(methodInfo);
        
        const groundTruthInfo = document.createElement('p');
        groundTruthInfo.innerHTML = `<strong>Ground Truth:</strong> ${data.groundTruth.totalRelevant} relevant products found`;
        summary.appendChild(groundTruthInfo);
        
        const resultsInfo = document.createElement('p');
        resultsInfo.innerHTML = `<strong>Results:</strong> ${data.evaluation.relevantFound} relevant out of ${data.evaluation.totalResults} returned`;
        summary.appendChild(resultsInfo);
        
        container.appendChild(summary);
        
        // Create results table
        if (data.results && data.results.length > 0) {
            const table = document.createElement('table');
            table.className = 'comparison-table';
            
            // Add table headers
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            ['Rank', 'Product', 'Score', 'Relevant'].forEach(header => {
                const th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Add table body
            const tbody = document.createElement('tbody');
            data.results.forEach((result, index) => {
                const row = document.createElement('tr');
                
                // Rank
                const rankCell = document.createElement('td');
                rankCell.textContent = index + 1;
                row.appendChild(rankCell);
                
                // Product name
                const nameCell = document.createElement('td');
                nameCell.textContent = result.name || 'N/A';
                row.appendChild(nameCell);
                
                // Score
                const scoreCell = document.createElement('td');
                const score = result.score || result.final_score || result.semantic_score || 'N/A';
                scoreCell.textContent = typeof score === 'number' ? score.toFixed(3) : score;
                row.appendChild(scoreCell);
                
                // Relevant indicator
                const relevantCell = document.createElement('td');
                const isRelevant = data.groundTruth.groundTruthIds && 
                    data.groundTruth.groundTruthIds.includes(result.id);
                relevantCell.innerHTML = isRelevant ? 
                    '<span style="color: #28a745;">✓</span>' : 
                    '<span style="color: #dc3545;">✗</span>';
                row.appendChild(relevantCell);
                
                tbody.appendChild(row);
            });
            table.appendChild(tbody);
            
            container.appendChild(table);
        }
    }
    
    async performComprehensiveEvaluation() {
        this.showLoadingState();
        
        try {
            const response = await fetch(`${this.API_BASE}/evaluate/comprehensive`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    methods: ['linear', 'semantic', 'hybrid', 'adaptive'],
                    queries: [
                        'nike shoes', 'dress', 'red', 'formal', 'cotton', 
                        'blue dress', 'casual summer', 'leather shoes', 'under 50'
                    ],
                    topK: parseInt(this.topKSelect.value),
                    linearMethod: this.linearMethod.value
                })
            });
            
            if (!response.ok) {
                throw new Error(`Comprehensive evaluation failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.displayComprehensiveResults(data);
            
        } catch (error) {
            console.error('Comprehensive evaluation error:', error);
            this.showErrorState(error.message);
        }
    }
    
    displayComprehensiveResults(data) {
        this.hideAllStates();
        this.comprehensiveSection.classList.remove('hidden');
        
        // Display summary
        this.displayComprehensiveSummary(data.summary);
        
        // Display detailed results
        this.displayComprehensiveDetails(data.results, data.testQueries);
        
        // Scroll to comprehensive section
        this.comprehensiveSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    displayComprehensiveSummary(summary) {
        const container = document.getElementById('comprehensiveSummary');
        container.innerHTML = '';
        
        const summaryTitle = document.createElement('h3');
        summaryTitle.textContent = 'Overall Performance Summary';
        container.appendChild(summaryTitle);
        
        const summaryStats = document.createElement('div');
        summaryStats.className = 'summary-stats';
        summaryStats.innerHTML = `
            <p><strong>Total Queries:</strong> ${summary.totalQueries}</p>
            <p><strong>Methods Tested:</strong> ${summary.methods.join(', ')}</p>
            <p><strong>Top-K:</strong> ${summary.topK}</p>
        `;
        container.appendChild(summaryStats);
        
        // Create method performance table
        const table = document.createElement('table');
        table.className = 'comparison-table';
        
        // Add table headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Method', 'Avg Latency', 'Precision', 'Recall', 'F1', 'MAP', 'nDCG'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        Object.entries(summary.methodPerformance).forEach(([method, perf]) => {
            const row = document.createElement('tr');
            
            // Method name
            const methodCell = document.createElement('td');
            methodCell.textContent = method.charAt(0).toUpperCase() + method.slice(1);
            row.appendChild(methodCell);
            
            // Average latency
            const latencyCell = document.createElement('td');
            latencyCell.textContent = `${perf.averageLatency}ms`;
            row.appendChild(latencyCell);
            
            // Metrics
            ['precision', 'recall', 'f1', 'map', 'ndcg'].forEach(metric => {
                const metricCell = document.createElement('td');
                metricCell.textContent = perf.averageMetrics[metric] || '0';
                row.appendChild(metricCell);
            });
            
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
    }
    
    displayComprehensiveDetails(results, testQueries) {
        const container = document.getElementById('comprehensiveResults');
        container.innerHTML = '';
        
        const detailsTitle = document.createElement('h3');
        detailsTitle.textContent = 'Detailed Results by Query';
        container.appendChild(detailsTitle);
        
        // Create tabs for each method
        const methods = Object.keys(results);
        const tabContainer = document.createElement('div');
        tabContainer.className = 'method-tabs';
        
        methods.forEach((method, index) => {
            const tab = document.createElement('button');
            tab.className = 'method-tab';
            tab.textContent = method.charAt(0).toUpperCase() + method.slice(1);
            tab.onclick = () => this.showMethodResults(method, results[method], testQueries);
            tabContainer.appendChild(tab);
            
            if (index === 0) {
                tab.classList.add('active');
                this.showMethodResults(method, results[method], testQueries);
            }
        });
        
        container.appendChild(tabContainer);
        
        // Create results container
        const resultsContainer = document.createElement('div');
        resultsContainer.id = 'methodResultsContainer';
        container.appendChild(resultsContainer);
    }
    
    showMethodResults(method, methodResults, testQueries) {
        // Update active tab
        document.querySelectorAll('.method-tab').forEach(tab => tab.classList.remove('active'));
        event.target.classList.add('active');
        
        const container = document.getElementById('methodResultsContainer');
        container.innerHTML = '';
        
        const methodTitle = document.createElement('h4');
        methodTitle.textContent = `${method.charAt(0).toUpperCase() + method.slice(1)} Results`;
        container.appendChild(methodTitle);
        
        // Create results table
        const table = document.createElement('table');
        table.className = 'comparison-table';
        
        // Add table headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        ['Query', 'Category', 'Latency', 'Precision', 'Recall', 'F1', 'MAP', 'nDCG'].forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Add table body
        const tbody = document.createElement('tbody');
        testQueries.forEach(queryInfo => {
            const query = queryInfo.query;
            const result = methodResults[query];
            
            if (result && !result.error) {
                const row = document.createElement('tr');
                
                // Query
                const queryCell = document.createElement('td');
                queryCell.textContent = query;
                row.appendChild(queryCell);
                
                // Category
                const categoryCell = document.createElement('td');
                categoryCell.textContent = queryInfo.info.category || 'unknown';
                row.appendChild(categoryCell);
                
                // Latency
                const latencyCell = document.createElement('td');
                latencyCell.textContent = `${result.latency}ms`;
                row.appendChild(latencyCell);
                
                // Metrics
                ['precision', 'recall', 'f1', 'map', 'ndcg'].forEach(metric => {
                    const metricCell = document.createElement('td');
                    metricCell.textContent = result.evaluation[metric] || '0';
                    row.appendChild(metricCell);
                });
                
                tbody.appendChild(row);
            }
        });
        table.appendChild(tbody);
        
        container.appendChild(table);
    }
    
    displayResults(searchTimeMs) {
        this.showResultsState();
        
        // Update results info
        this.resultsTitle.textContent = `Results for "${this.currentQuery}"`;
        this.resultsCount.textContent = `${this.searchResults.length} items found`;
        this.searchTime.textContent = `in ${searchTimeMs}ms`;
        
        // Clear previous results
        this.resultsContainer.innerHTML = '';
        
        // Render product cards
        this.searchResults.forEach((product, index) => {
            const productCard = this.createProductCard(product, index);
            this.resultsContainer.appendChild(productCard);
        });
        
        // Add smooth scroll to results
        this.resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    createProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Format price
        const price = product.price ? `$${product.price.toFixed(2)}` : 'Price not available';
        
        // Get similarity score if available
        const similarityScore = product.similarity ? 
            Math.round(product.similarity * 100) : null;
        
        // Get relevance score if available
        const relevanceScore = product.relevanceScore || product.score || product.final_score || product.semantic_score;
        const formattedRelevanceScore = relevanceScore ? 
            (typeof relevanceScore === 'number' ? relevanceScore.toFixed(3) : relevanceScore) : null;
        
        // Create stock status
        const stockClass = product.stock_status === 'in_stock' ? 'in-stock' : 'out-of-stock';
        const stockText = product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock';
        
        // Create product details tags
        const details = [];
        if (product.color && product.color !== 'unknown') details.push(product.color);
        if (product.material && product.material !== 'unknown') details.push(product.material);
        
        card.innerHTML = `
            <div class="stock-status ${stockClass}">${stockText}</div>
            
            ${product.image_url ? 
                `<img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.style.display='none'">` : 
                '<div class="product-image" style="background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; color: #999;"><i class="fas fa-image" style="font-size: 2rem;"></i></div>'
            }
            <div class="product-content">
                <div class="product-brand">${product.brand || 'Unknown Brand'}</div>
                <div class="product-name">${product.name || 'Unnamed Product'}</div>
                <div class="product-category">${product.category || 'Uncategorized'}</div>
                <div class="product-price">${price}</div>
                ${details.length > 0 ? 
                    `<div class="product-details">
                        ${details.map(detail => `<span class="detail-tag">${detail}</span>`).join('')}
                    </div>` : ''
                }
                ${product.description && product.description !== 'no description available' ? 
                    `<p class="product-description" style="font-size: 0.9rem; color: #666; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description}</p>` : ''
                }
                ${similarityScore ? 
                    `<div class="similarity-score">Match: ${similarityScore}%</div>` : ''
                }
                ${formattedRelevanceScore ? 
                    `<div class="relevance-score" style="cursor: pointer; color: #667eea; font-weight: 600;" 
                         onclick="fashionApp.showScoreCalculation('${product.id}', ${relevanceScore}, event)" 
                         title="Click to see detailed score calculation">
                        Relevance Score<i class="fas fa-calculator" style="margin-left: 5px; font-size: 0.8rem;"></i>
                     </div>` : ''
                }
            </div>
        `;
        
        // Add click event to show product details
        card.addEventListener('click', () => this.showProductModal(product));
        
        return card;
    }
    
    showProductModal(product) {
        const price = product.price ? `$${product.price.toFixed(2)}` : 'Price not available';
        const stockClass = product.stock_status === 'in_stock' ? 'in-stock' : 'out-of-stock';
        const stockText = product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock';
        
        this.modalBody.innerHTML = `
            <div style="text-align: center; margin-bottom: 20px;">
                ${product.image_url ? 
                    `<img src="${product.image_url}" alt="${product.name}" style="max-width: 100%; max-height: 300px; border-radius: 10px; object-fit: cover;" onerror="this.style.display='none'">` : 
                    '<div style="width: 100%; height: 200px; background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; color: #999; border-radius: 10px;"><i class="fas fa-image" style="font-size: 3rem;"></i></div>'
                }
            </div>
            
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="color: #667eea; font-size: 1rem; font-weight: 500; margin-bottom: 5px;">${product.brand || 'Unknown Brand'}</div>
                <h2 style="font-size: 1.5rem; color: #333; margin-bottom: 10px;">${product.name || 'Unnamed Product'}</h2>
                <div style="display: inline-block; background: #f0f0f0; color: #666; padding: 4px 12px; border-radius: 15px; font-size: 0.9rem; margin-bottom: 15px;">${product.category || 'Uncategorized'}</div>
            </div>
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 10px;">
                <div>
                    <div style="font-size: 1.8rem; font-weight: 700; color: #2d3748;">${price}</div>
                </div>
                <div>
                    <span class="stock-status ${stockClass}" style="position: static;">${stockText}</span>
                </div>
            </div>
            
            ${product.description && product.description !== 'no description available' ? 
                `<div style="margin-bottom: 20px;">
                    <h4 style="color: #333; margin-bottom: 10px;">Description</h4>
                    <p style="color: #666; line-height: 1.6;">${product.description}</p>
                </div>` : ''
            }
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                ${product.color && product.color !== 'unknown' ? 
                    `<div>
                        <h4 style="color: #333; margin-bottom: 5px;">Color</h4>
                        <span class="detail-tag">${product.color}</span>
                    </div>` : ''
                }
                ${product.material && product.material !== 'unknown' ? 
                    `<div>
                        <h4 style="color: #333; margin-bottom: 5px;">Material</h4>
                        <span class="detail-tag">${product.material}</span>
                    </div>` : ''
                }
            </div>
            
            <div style="margin-top: 25px; padding-top: 20px; border-top: 1px solid #e1e1e1;">
                <div style="display: flex; justify-content: center; gap: 10px;">
                    <button onclick="fashionApp.findSimilarProducts('${product.id}')" style="padding: 12px 20px; background: #667eea; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">Find Similar</button>
                    ${product.image_url ? 
                        `<a href="${product.image_url}" target="_blank" style="padding: 12px 20px; background: #28a745; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; text-decoration: none; display: inline-block;">View Full Image</a>` : ''
                    }
                </div>
            </div>
        `;
        
        this.productModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    closeProductModal() {
        this.productModal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
    
    async findSimilarProducts(productId) {
        this.closeProductModal();
        this.showLoadingState();
        
        try {
            // Use heuristic recommendations instead of legacy
            const response = await fetch(`${this.API_BASE}/recommend/heuristic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: productId,
                    topK: 8,
                    includeScoring: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`Heuristic recommendation failed: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.searchResults = data.results || [];
            this.currentQuery = 'Heuristic Similar Products';
            
            if (this.searchResults.length === 0) {
                this.showNoResultsState();
            } else {
                this.displayHeuristicResults(data, 0);
            }
            
        } catch (error) {
            console.error('Heuristic recommendation error:', error);
            this.showErrorState(error.message);
        }
    }
    
    async performHeuristicRecommendation() {
        // Need to get a sample product to demonstrate heuristic recommendations
        this.showLoadingState();
        
        try {
            // First get the first product from the dataset
            const response = await fetch(`${this.API_BASE}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'blue',
                    topK: 1,
                    method: 'linear'
                })
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get sample product: ${response.statusText}`);
            }
            
            const searchData = await response.json();
            
            if (!searchData.results || searchData.results.length === 0) {
                throw new Error('No sample product found');
            }
            
            const sampleProduct = searchData.results[0];
            
            // Now get heuristic recommendations for this product
            const heuristicResponse = await fetch(`${this.API_BASE}/recommend/heuristic`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: sampleProduct.id,
                    topK: parseInt(this.topKSelect.value),
                    includeScoring: true
                })
            });
            
            if (!heuristicResponse.ok) {
                throw new Error(`Heuristic recommendation failed: ${heuristicResponse.statusText}`);
            }
            
            const heuristicData = await heuristicResponse.json();
            
            if (heuristicData.error) {
                throw new Error(heuristicData.error);
            }
            
            this.displayHeuristicResults(heuristicData, 0, sampleProduct);
            
        } catch (error) {
            console.error('Heuristic recommendation error:', error);
            this.showErrorState(error.message);
        }
    }
    
    async performCustomHeuristic() {
        // Show prompt for custom weights
        const alpha = prompt('Enter alpha weight (semantic similarity, 0.0-1.0):', '0.4');
        const beta = prompt('Enter beta weight (category matching, 0.0-1.0):', '0.3');
        const gamma = prompt('Enter gamma weight (color harmony, 0.0-1.0):', '0.2');
        const delta = prompt('Enter delta weight (brand consistency, 0.0-1.0):', '0.1');
        
        if (!alpha || !beta || !gamma || !delta) {
            return; // User cancelled
        }
        
        const customWeights = {
            alpha: parseFloat(alpha),
            beta: parseFloat(beta),
            gamma: parseFloat(gamma),
            delta: parseFloat(delta)
        };
        
        this.showLoadingState();
        
        try {
            // Get sample product
            const response = await fetch(`${this.API_BASE}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'blue',
                    topK: 1,
                    method: 'linear'
                })
            });
            
            const searchData = await response.json();
            const sampleProduct = searchData.results[0];
            
            // Get custom heuristic recommendations
            const heuristicResponse = await fetch(`${this.API_BASE}/recommend/heuristic/custom`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: sampleProduct.id,
                    customWeights: customWeights,
                    topK: parseInt(this.topKSelect.value),
                    includeScoring: true
                })
            });
            
            if (!heuristicResponse.ok) {
                throw new Error(`Custom heuristic failed: ${heuristicResponse.statusText}`);
            }
            
            const heuristicData = await heuristicResponse.json();
            
            this.displayHeuristicResults(heuristicData, 0, sampleProduct, customWeights);
            
        } catch (error) {
            console.error('Custom heuristic error:', error);
            this.showErrorState(error.message);
        }
    }
    
    async performHeuristicAnalysis() {
        this.showLoadingState();
        
        try {
            // Get sample product
            const response = await fetch(`${this.API_BASE}/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: 'blue',
                    topK: 1,
                    method: 'linear'
                })
            });
            
            const searchData = await response.json();
            const sampleProduct = searchData.results[0];
            
            // Get heuristic analysis
            const analysisResponse = await fetch(`${this.API_BASE}/recommend/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productId: sampleProduct.id
                })
            });
            
            if (!analysisResponse.ok) {
                throw new Error(`Heuristic analysis failed: ${analysisResponse.statusText}`);
            }
            
            const analysisData = await analysisResponse.json();
            
            this.displayHeuristicAnalysis(analysisData, sampleProduct);
            
        } catch (error) {
            console.error('Heuristic analysis error:', error);
            this.showErrorState(error.message);
        }
    }
    
    displayHeuristicResults(data, searchTimeMs, sampleProduct = null, customWeights = null) {
        this.hideAllStates();
        this.heuristicSection.classList.remove('hidden');
        
        const metadata = document.getElementById('heuristicMetadata');
        const results = document.getElementById('heuristicResults');
        
        // Display metadata
        metadata.innerHTML = '';
        
        const metadataTitle = document.createElement('h3');
        metadataTitle.textContent = 'Heuristic Recommendation Metadata';
        metadata.appendChild(metadataTitle);
        
        if (sampleProduct) {
            const sampleInfo = document.createElement('div');
            sampleInfo.className = 'heuristic-sample-info';
            sampleInfo.innerHTML = `
                <p><strong>Base Product:</strong> ${sampleProduct.name} (${sampleProduct.brand})</p>
                <p><strong>Category:</strong> ${sampleProduct.category}</p>
                <p><strong>Color:</strong> ${sampleProduct.color || 'N/A'}</p>
            `;
            metadata.appendChild(sampleInfo);
        }
        
        if (customWeights) {
            const weightsInfo = document.createElement('div');
            weightsInfo.className = 'heuristic-weights-info';
            weightsInfo.innerHTML = `
                <h4>Custom Weights Used:</h4>
                <p><strong>Alpha (Semantic):</strong> ${customWeights.alpha}</p>
                <p><strong>Beta (Category):</strong> ${customWeights.beta}</p>
                <p><strong>Gamma (Color):</strong> ${customWeights.gamma}</p>
                <p><strong>Delta (Brand):</strong> ${customWeights.delta}</p>
            `;
            metadata.appendChild(weightsInfo);
        }
        
        if (data.metadata) {
            const statsInfo = document.createElement('div');
            statsInfo.className = 'heuristic-stats-info';
            statsInfo.innerHTML = `
                <p><strong>Total Candidates:</strong> ${data.metadata.totalCandidates || 'N/A'}</p>
                <p><strong>Scoring Method:</strong> ${data.metadata.method || 'Multi-factor heuristic'}</p>
                <p><strong>Processing Time:</strong> ${data.metadata.processingTime || searchTimeMs}ms</p>
            `;
            metadata.appendChild(statsInfo);
        }
        
        // Display results
        results.innerHTML = '';
        
        if (data.results && data.results.length > 0) {
            const resultsTitle = document.createElement('h3');
            resultsTitle.textContent = `Recommended Products (${data.results.length})`;
            results.appendChild(resultsTitle);
            
            const resultsGrid = document.createElement('div');
            resultsGrid.className = 'results-container';
            
            data.results.forEach((product, index) => {
                const productCard = this.createHeuristicProductCard(product, index);
                resultsGrid.appendChild(productCard);
            });
            
            results.appendChild(resultsGrid);
        } else {
            results.innerHTML = '<p>No heuristic recommendations found.</p>';
        }
        
        // Scroll to heuristic section
        this.heuristicSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    createHeuristicProductCard(product, index) {
        const card = document.createElement('div');
        card.className = 'product-card heuristic-card';
        card.style.animationDelay = `${index * 0.1}s`;
        
        // Format price
        const price = product.price ? `$${product.price.toFixed(2)}` : 'Price not available';
        
        // Get heuristic score if available
        const heuristicScore = product.heuristic_score || product.final_score || product.score;
        const formattedScore = heuristicScore ? heuristicScore.toFixed(3) : 'N/A';
        
        // Create stock status
        const stockClass = product.stock_status === 'in_stock' ? 'in-stock' : 'out-of-stock';
        const stockText = product.stock_status === 'in_stock' ? 'In Stock' : 'Out of Stock';
        
        // Create product details tags
        const details = [];
        if (product.color && product.color !== 'unknown') details.push(product.color);
        if (product.material && product.material !== 'unknown') details.push(product.material);
        
        // Create scoring breakdown if available
        let scoringBreakdown = '';
        if (product.scoring) {
            scoringBreakdown = `
                <div class="scoring-breakdown">
                    <h5>Scoring Breakdown:</h5>
                    <div class="score-details">
                        ${product.scoring.semantic_score ? `<span>Semantic: ${product.scoring.semantic_score.toFixed(3)}</span>` : ''}
                        ${product.scoring.category_score ? `<span>Category: ${product.scoring.category_score.toFixed(3)}</span>` : ''}
                        ${product.scoring.color_score ? `<span>Color: ${product.scoring.color_score.toFixed(3)}</span>` : ''}
                        ${product.scoring.brand_score ? `<span>Brand: ${product.scoring.brand_score.toFixed(3)}</span>` : ''}
                    </div>
                </div>
            `;
        }
        
        card.innerHTML = `
            <div class="stock-status ${stockClass}">${stockText}</div>
            <div class="heuristic-score-badge">Score: ${formattedScore}</div>
            ${product.image_url ? 
                `<img src="${product.image_url}" alt="${product.name}" class="product-image" onerror="this.style.display='none'">` : 
                '<div class="product-image" style="background: linear-gradient(45deg, #f0f0f0, #e0e0e0); display: flex; align-items: center; justify-content: center; color: #999;"><i class="fas fa-image" style="font-size: 2rem;"></i></div>'
            }
            <div class="product-content">
                <div class="product-brand">${product.brand || 'Unknown Brand'}</div>
                <div class="product-name">${product.name || 'Unnamed Product'}</div>
                <div class="product-category">${product.category || 'Uncategorized'}</div>
                <div class="product-price">${price}</div>
                ${details.length > 0 ? 
                    `<div class="product-details">
                        ${details.map(detail => `<span class="detail-tag">${detail}</span>`).join('')}
                    </div>` : ''
                }
                ${product.description && product.description !== 'no description available' ? 
                    `<p class="product-description" style="font-size: 0.9rem; color: #666; margin-top: 8px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${product.description}</p>` : ''
                }
                ${scoringBreakdown}
            </div>
        `;
        
        // Add click event to show product details
        card.addEventListener('click', () => this.showProductModal(product));
        
        return card;
    }
    
    displayHeuristicAnalysis(data, sampleProduct) {
        this.hideAllStates();
        this.heuristicAnalysisSection.classList.remove('hidden');
        
        const container = document.getElementById('heuristicAnalysisResults');
        container.innerHTML = '';
        
        // Display sample product info
        const sampleInfo = document.createElement('div');
        sampleInfo.className = 'analysis-sample-info';
        sampleInfo.innerHTML = `
            <h3>Analysis Base Product</h3>
            <div class="sample-product-card">
                <h4>${sampleProduct.name} (${sampleProduct.brand})</h4>
                <p><strong>Category:</strong> ${sampleProduct.category}</p>
                <p><strong>Color:</strong> ${sampleProduct.color || 'N/A'}</p>
                <p><strong>Price:</strong> $${sampleProduct.price ? sampleProduct.price.toFixed(2) : 'N/A'}</p>
            </div>
        `;
        container.appendChild(sampleInfo);
        
        // Display analysis results
        if (data.analysis) {
            const analysisSection = document.createElement('div');
            analysisSection.className = 'analysis-results';
            
            const analysisTitle = document.createElement('h3');
            analysisTitle.textContent = 'Heuristic Analysis Results';
            analysisSection.appendChild(analysisTitle);
            
            // Display set distributions
            if (data.analysis.setDistribution) {
                const distSection = document.createElement('div');
                distSection.className = 'distribution-section';
                
                const distTitle = document.createElement('h4');
                distTitle.textContent = 'Recommendation Set Distribution';
                distSection.appendChild(distTitle);
                
                const distTable = document.createElement('table');
                distTable.className = 'comparison-table';
                
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                ['Set Type', 'Count', 'Percentage'].forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                distTable.appendChild(thead);
                
                const tbody = document.createElement('tbody');
                Object.entries(data.analysis.setDistribution).forEach(([setType, info]) => {
                    const row = document.createElement('tr');
                    
                    const typeCell = document.createElement('td');
                    typeCell.textContent = setType.charAt(0).toUpperCase() + setType.slice(1);
                    row.appendChild(typeCell);
                    
                    const countCell = document.createElement('td');
                    countCell.textContent = info.count || info;
                    row.appendChild(countCell);
                    
                    const percentCell = document.createElement('td');
                    percentCell.textContent = info.percentage ? `${info.percentage.toFixed(1)}%` : 'N/A';
                    row.appendChild(percentCell);
                    
                    tbody.appendChild(row);
                });
                distTable.appendChild(tbody);
                
                distSection.appendChild(distTable);
                analysisSection.appendChild(distSection);
            }
            
            // Display scoring statistics
            if (data.analysis.scoringStats) {
                const statsSection = document.createElement('div');
                statsSection.className = 'scoring-stats-section';
                
                const statsTitle = document.createElement('h4');
                statsTitle.textContent = 'Scoring Distribution Statistics';
                statsSection.appendChild(statsTitle);
                
                const statsGrid = document.createElement('div');
                statsGrid.className = 'stats-grid';
                
                Object.entries(data.analysis.scoringStats).forEach(([statType, value]) => {
                    const statCard = document.createElement('div');
                    statCard.className = 'stat-card';
                    statCard.innerHTML = `
                        <h5>${statType.charAt(0).toUpperCase() + statType.slice(1)}</h5>
                        <div class="stat-value">${typeof value === 'number' ? value.toFixed(3) : value}</div>
                    `;
                    statsGrid.appendChild(statCard);
                });
                
                statsSection.appendChild(statsGrid);
                analysisSection.appendChild(statsSection);
            }
            
            // Display method comparison if available
            if (data.analysis.methodComparison) {
                const compSection = document.createElement('div');
                compSection.className = 'method-comparison-section';
                
                const compTitle = document.createElement('h4');
                compTitle.textContent = 'Heuristic Method Comparison';
                compSection.appendChild(compTitle);
                
                const compTable = document.createElement('table');
                compTable.className = 'comparison-table';
                
                const thead = document.createElement('thead');
                const headerRow = document.createElement('tr');
                ['Method', 'Average Score', 'Top Score', 'Coverage'].forEach(header => {
                    const th = document.createElement('th');
                    th.textContent = header;
                    headerRow.appendChild(th);
                });
                thead.appendChild(headerRow);
                compTable.appendChild(thead);
                
                const tbody = document.createElement('tbody');
                Object.entries(data.analysis.methodComparison).forEach(([method, stats]) => {
                    const row = document.createElement('tr');
                    
                    const methodCell = document.createElement('td');
                    methodCell.textContent = method.charAt(0).toUpperCase() + method.slice(1);
                    row.appendChild(methodCell);
                    
                    const avgCell = document.createElement('td');
                    avgCell.textContent = stats.averageScore ? stats.averageScore.toFixed(3) : 'N/A';
                    row.appendChild(avgCell);
                    
                    const topCell = document.createElement('td');
                    topCell.textContent = stats.topScore ? stats.topScore.toFixed(3) : 'N/A';
                    row.appendChild(topCell);
                    
                    const coverageCell = document.createElement('td');
                    coverageCell.textContent = stats.coverage ? `${stats.coverage.toFixed(1)}%` : 'N/A';
                    row.appendChild(coverageCell);
                    
                    tbody.appendChild(row);
                });
                compTable.appendChild(tbody);
                
                compSection.appendChild(compTable);
                analysisSection.appendChild(compSection);
            }
            
            container.appendChild(analysisSection);
        } else {
            const noDataMessage = document.createElement('p');
            noDataMessage.textContent = 'No analysis data available.';
            container.appendChild(noDataMessage);
        }
        
        // Add metadata if available
        if (data.metadata) {
            const metadataSection = document.createElement('div');
            metadataSection.className = 'analysis-metadata';
            metadataSection.innerHTML = `
                <h4>Analysis Metadata</h4>
                <p><strong>Analysis Time:</strong> ${data.metadata.analysisTime || 'N/A'}ms</p>
                <p><strong>Total Products Analyzed:</strong> ${data.metadata.totalProducts || 'N/A'}</p>
                <p><strong>Analysis Method:</strong> ${data.metadata.method || 'Comprehensive heuristic analysis'}</p>
            `;
            container.appendChild(metadataSection);
        }
        
        // Scroll to analysis section
        this.heuristicAnalysisSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    /**
     * Show detailed score calculation for a product
     */
    async showScoreCalculation(productId, score, event) {
        // Stop propagation to prevent card click
        event.stopPropagation();
        
        try {
            // Find the product in current results
            const product = this.searchResults.find(p => p.id === productId);
            if (!product) {
                this.showScoreTooltip(event.target, 'Product not found in current results');
                return;
            }
            
            // Remove any existing tooltips
            const existingTooltip = document.querySelector('.score-tooltip');
            if (existingTooltip) {
                existingTooltip.remove();
            }
            
            // DEBUG: Log product data to understand what's available
            console.log('🔍 Score calculation debug:', {
                productId,
                productName: product.name,
                hasScoringsDetails: !!product.scoring_details,
                scoringDetailsKeys: product.scoring_details ? Object.keys(product.scoring_details) : 'none',
                scoringDetailsMethod: product.scoring_details?.method,
                hasHeuristicScore: !!product.heuristic_score,
                hasSet: !!product.set,
                setValue: product.set,
                allProductKeys: Object.keys(product).filter(k => k.includes('score') || k.includes('scoring') || k === 'set')
            });
            
            // Check if we have comprehensive scoring details from backend
            if (product.scoring_details && product.scoring_details.method === 'heuristic') {
                console.log('✅ Using comprehensive scoring details from backend');
                // Use the comprehensive scoring details from backend - they now include method, setType, setName
                this.displayDetailedScoring(product, event.target);
                return;
            }
            
            // Fallback: Check for heuristic scoring data (legacy compatibility)
            if (product.heuristic_score && product.set) {
                console.log('📋 Using legacy heuristic data with mock scoring details');
                // This is a heuristic result, create mock detailed scoring for legacy data
                const mockScoringDetails = this.createMockHeuristicScoring(product);
                this.displayDetailedScoring({ ...product, scoring_details: mockScoringDetails }, event.target);
                return;
            }
            
            // Check for any scoring_details regardless of method
            if (product.scoring_details) {
                console.log('⚡ Using available scoring details (non-heuristic)');
                this.displayDetailedScoring(product, event.target);
                return;
            }
            
            console.log('❌ Falling back to basic score info');
            // For other search methods, show basic score info
            this.showBasicScoreInfo(product, score, event.target);
            
        } catch (error) {
            console.error('Error showing score calculation:', error);
            const product = this.searchResults.find(p => p.id === productId) || { id: productId };
            this.showBasicScoreInfo(product, score, event.target);
        }
    }
    
    /**
     * Create mock heuristic scoring details based on the heuristic result
     */
    createMockHeuristicScoring(product) {
        // Get the weights based on the set
        let weights;
        switch (product.set) {
            case 1:
                weights = { alpha: 0.4, beta: 0.3, gamma: 0.2, delta: 0.1 };
                break;
            case 2:
                weights = { alpha: 0.5, beta: 0.25, gamma: 0.1, delta: 0.15 };
                break;
            case 3:
                weights = { alpha: 0.6, beta: 0.1, gamma: 0.05, delta: 0.25 };
                break;
            default:
                weights = { alpha: 0.4, beta: 0.3, gamma: 0.2, delta: 0.1 };
        }
        
        // Create reasonable mock scores based on the final score
        const finalScore = product.heuristic_score || product.score || 0;
        
        // Reverse engineer approximate component scores
        const semanticScore = Math.min(0.9, finalScore / weights.alpha * 0.7); // Estimate semantic component
        const categoryScore = product.set === 1 ? 0.9 : product.set === 2 ? 0.7 : 0.5; // Higher for same category
        const colorScore = product.set === 1 ? 0.8 : 0.6; // Higher for Set 1 (exact match)
        const brandScore = 0.7; // Default brand similarity
        
        return {
            total: finalScore,
            breakdown: {
                semantic: semanticScore,
                category: categoryScore,
                color: colorScore,
                brand: brandScore
            },
            weights: weights,
            method: 'heuristic'
        };
    }
    
    /**
     * Display detailed scoring in a modal
     */
    displayDetailedScoring(product, triggerElement) {
        const scoreDetails = product.scoring_details || product.heuristic_scoring;
        const breakdown = scoreDetails.breakdown || {};
        const weights = scoreDetails.weights || {};
        const totalScore = scoreDetails.total || product.score || product.heuristic_score;
        
        // Create score calculation modal content
        const calculationHTML = `
            <div class="score-calculation-modal">
                <h3>🔍 Score Calculation Details</h3>
                <div class="score-product-info">
                    <h4>${product.name || 'Product'}</h4>
                    <p><strong>Brand:</strong> ${product.brand || 'N/A'} | <strong>Category:</strong> ${product.category || 'N/A'}</p>
                </div>
                
                <div class="score-calculation-content">
                    
                    
                    ${breakdown ? `
                        <div class="score-breakdown-section">
                            <h4>📊 Individual Component Scores:</h4>
                            <div class="score-components">
                                ${breakdown.semantic ? `
                                    <div class="score-component">
                                        <span class="component-icon">🔍</span>
                                        <span class="component-name">Cosine Similarity (Semantic):</span>
                                        <span class="component-score">${breakdown.semantic.toFixed(4)}</span>
                                    </div>
                                ` : ''}
                                
                                ${breakdown.category !== undefined ? `
                                    <div class="score-component">
                                        <span class="component-icon">📁</span>
                                        <span class="component-name">Category Similarity:</span>
                                        <span class="component-score">${breakdown.category.toFixed(4)}</span>
                                    </div>
                                ` : ''}
                                
                                ${breakdown.color !== undefined ? `
                                    <div class="score-component">
                                        <span class="component-icon">🎨</span>
                                        <span class="component-name">Color Similarity:</span>
                                        <span class="component-score">${breakdown.color.toFixed(4)}</span>
                                    </div>
                                ` : ''}
                                
                                ${breakdown.brand !== undefined ? `
                                    <div class="score-component">
                                        <span class="component-icon">🏷️</span>
                                        <span class="component-name">Brand Similarity:</span>
                                        <span class="component-score">${breakdown.brand.toFixed(4)}</span>
                                    </div>
                                ` : ''}
                            </div>
                        </div>
                        
                        ${weights && (weights.alpha || weights.beta || weights.gamma || weights.delta) ? `
                            <div class="weights-section">
                                <h4>⚖️ Weights Applied:</h4>
                                <div class="weights-grid">
                                    ${weights.alpha ? `<div class="weight-item">α (Semantic): <strong>${weights.alpha}</strong></div>` : ''}
                                    ${weights.beta ? `<div class="weight-item">β (Category): <strong>${weights.beta}</strong></div>` : ''}
                                    ${weights.gamma ? `<div class="weight-item">γ (Color): <strong>${weights.gamma}</strong></div>` : ''}
                                    ${weights.delta ? `<div class="weight-item">δ (Brand): <strong>${weights.delta}</strong></div>` : ''}
                                </div>
                            </div>
                            
                            <div class="calculation-section">
                                <h4>🧮 Calculation Process:</h4>
                                <div class="calculation-steps">
                                    <div class="calculation-formula">
                                        Final Score = α×semantic + β×category + γ×color + δ×brand
                                    </div>
                                    <div class="calculation-substitution">
                                        Final Score = ${weights.alpha || '?'}×${breakdown.semantic ? breakdown.semantic.toFixed(4) : '?'} + 
                                        ${weights.beta || '?'}×${breakdown.category ? breakdown.category.toFixed(4) : '?'} + 
                                        ${weights.gamma || '?'}×${breakdown.color ? breakdown.color.toFixed(4) : '?'} + 
                                        ${weights.delta || '?'}×${breakdown.brand ? breakdown.brand.toFixed(4) : '?'}
                                    </div>
                                    <div class="calculation-result">
                                        Final Score = ${weights.alpha && breakdown.semantic ? (weights.alpha * breakdown.semantic).toFixed(4) : '?'} + 
                                        ${weights.beta && breakdown.category !== undefined ? (weights.beta * breakdown.category).toFixed(4) : '?'} + 
                                        ${weights.gamma && breakdown.color !== undefined ? (weights.gamma * breakdown.color).toFixed(4) : '?'} + 
                                        ${weights.delta && breakdown.brand !== undefined ? (weights.delta * breakdown.brand).toFixed(4) : '?'}
                                    </div>
                                    <div class="calculation-final">
                                        Final Score = <strong>${totalScore ? totalScore.toFixed(4) : 'N/A'}</strong>
                                        ${totalScore && totalScore > 1.0 ? ` (capped at 1.0)` : ''}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                    ` : `
                        <div class="simple-score-info">
                            <p>This is a ${this.searchMethod.value} search score.</p>
                            <p>Detailed breakdown not available for this scoring method.</p>
                        </div>
                    `}
                    
                    ${product.set || scoreDetails.setType ? `
                        <div class="heuristic-set-info">
                            <h4>📋 Heuristic Set Assignment:</h4>
                            <div class="set-badge set-${scoreDetails.setType || product.set}">
                                ${scoreDetails.setName || 
                                  (product.set === 1 ? 'Set 1: Exact Intent Match' : 
                                   product.set === 2 ? 'Set 2: Close Substitutes' : 
                                   product.set === 3 ? 'Set 3: Broader Exploration' : 
                                   'Other Set')}
                            </div>
                            ${scoreDetails.setType ? `
                                <div class="set-details">
                                    <p><strong>Set Type:</strong> ${scoreDetails.setType}</p>
                                    <p><strong>Scoring Method:</strong> ${scoreDetails.method || 'heuristic'}</p>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                
                <div class="score-modal-footer">
                    <button onclick="fashionApp.closeScoreModal()" class="close-score-modal-btn">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        // Show in modal
        this.modalBody.innerHTML = calculationHTML;
        this.productModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Show basic score information when detailed breakdown is not available
     */
    showBasicScoreInfo(product, score, triggerElement) {
        // Calculate actual component scores for this product
        const calculatedScores = this.calculateActualComponentScores(product, score);
        
        const basicHTML = `
            <div class="score-calculation-modal">
                <h3>🔍 Score Calculation Details</h3>
                <div class="score-product-info">
                    <h4>${product.name || 'Product'}</h4>
                    <p><strong>Brand:</strong> ${product.brand || 'N/A'} | <strong>Category:</strong> ${product.category || 'N/A'}</p>
                </div>
                
                <div class="score-calculation-content">
                   
                    <div class="score-method-info">
                        <p><strong>Search Method:</strong> ${this.searchMethod.value}</p>
                        <p><strong>Query:</strong> "${this.currentQuery}"</p>
                    </div>
                    
                    <div class="score-breakdown-section">
                        <h4>📆 Individual Component Scores:</h4>
                        <div class="score-components">
                            <div class="score-component">
                                <span class="component-icon">🔍</span>
                                <span class="component-name">Cosine Similarity (Semantic):</span>
                                <span class="component-score">${calculatedScores.semantic.toFixed(4)}</span>
                            </div>
                            <div class="score-component">
                                <span class="component-icon">📁</span>
                                <span class="component-name">Category Similarity:</span>
                                <span class="component-score">${calculatedScores.category.toFixed(4)}</span>
                            </div>
                            <div class="score-component">
                                <span class="component-icon">🎨</span>
                                <span class="component-name">Color Similarity:</span>
                                <span class="component-score">${calculatedScores.color.toFixed(4)}</span>
                            </div>
                            <div class="score-component">
                                <span class="component-icon">🏷️</span>
                                <span class="component-name">Brand Similarity:</span>
                                <span class="component-score">${calculatedScores.brand.toFixed(4)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="weights-section">
                        <h4>⚖️ Weights Applied:</h4>
                        <div class="weights-grid">
                            <div class="weight-item">α (Semantic): <strong>${calculatedScores.weights.alpha}</strong></div>
                            <div class="weight-item">β (Category): <strong>${calculatedScores.weights.beta}</strong></div>
                            <div class="weight-item">γ (Color): <strong>${calculatedScores.weights.gamma}</strong></div>
                            <div class="weight-item">δ (Brand): <strong>${calculatedScores.weights.delta}</strong></div>
                        </div>
                    </div>
                    
                    <div class="calculation-section">
                        <h4>🧮 Calculation Process:</h4>
                        <div class="calculation-steps">
                            <div class="calculation-formula">
                                Final Score = α×semantic + β×category + γ×color + δ×brand
                            </div>
                            <div class="calculation-substitution">
                                Final Score = ${calculatedScores.weights.alpha}×${calculatedScores.semantic.toFixed(4)} + 
                                ${calculatedScores.weights.beta}×${calculatedScores.category.toFixed(4)} + 
                                ${calculatedScores.weights.gamma}×${calculatedScores.color.toFixed(4)} + 
                                ${calculatedScores.weights.delta}×${calculatedScores.brand.toFixed(4)}
                            </div>
                            <div class="calculation-result">
                                Final Score = ${(calculatedScores.weights.alpha * calculatedScores.semantic).toFixed(4)} + 
                                ${(calculatedScores.weights.beta * calculatedScores.category).toFixed(4)} + 
                                ${(calculatedScores.weights.gamma * calculatedScores.color).toFixed(4)} + 
                                ${(calculatedScores.weights.delta * calculatedScores.brand).toFixed(4)}
                            </div>
                            <div class="calculation-final">
                                Final Score = <strong>${calculatedScores.calculatedTotal.toFixed(4)}</strong>
                                ${calculatedScores.note ? `<br><small><em>${calculatedScores.note}</em></small>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="score-explanation">
                        <h4>Score Interpretation:</h4>
                        ${this.getScoreExplanation(this.searchMethod.value)}
                    </div>
                </div>
                
                <div class="score-modal-footer">
                    <button onclick="fashionApp.closeScoreModal()" class="close-score-modal-btn">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        this.modalBody.innerHTML = basicHTML;
        this.productModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
    
    /**
     * Get explanation for different scoring methods
     */
    getScoreExplanation(method) {
        const explanations = {
            'semantic': `
                <p>Semantic similarity scores range from 0 to 1, where:</p>
                <ul>
                    <li><strong>0.8-1.0:</strong> Very high semantic similarity</li>
                    <li><strong>0.6-0.8:</strong> High semantic similarity</li>
                    <li><strong>0.4-0.6:</strong> Moderate semantic similarity</li>
                    <li><strong>0.2-0.4:</strong> Low semantic similarity</li>
                    <li><strong>0.0-0.2:</strong> Very low semantic similarity</li>
                </ul>
            `,
            'linear': `
                <p>Linear search combines TF-IDF, BM25, and fuzzy matching scores.</p>
                <p>Scores are normalized and range from 0 to 1, representing text-based relevance.</p>
            `,
            'hybrid': `
                <p>Hybrid scores combine semantic and linear methods:</p>
                <p>Final Score = (Semantic Weight × Semantic Score) + (Linear Weight × Linear Score)</p>
                <p>This provides both semantic understanding and keyword matching.</p>
            `,
            'adaptive': `
                <p>Adaptive scoring intelligently switches between methods based on query analysis.</p>
                <p>The system selects the most appropriate scoring method for your query.</p>
            `
        };
        
        return explanations[method] || '<p>Score represents relevance to your search query.</p>';
    }
    
    /**
     * Show tooltip for score calculation
     */
    showScoreTooltip(element, message, isLoading = false) {
        // Remove existing tooltip
        const existingTooltip = document.querySelector('.score-tooltip');
        if (existingTooltip) {
            existingTooltip.remove();
        }
        
        // Create tooltip
        const tooltip = document.createElement('div');
        tooltip.className = 'score-tooltip';
        tooltip.innerHTML = `
            ${isLoading ? '<div class="tooltip-spinner"></div>' : ''}
            <span>${message}</span>
        `;
        
        // Position tooltip
        document.body.appendChild(tooltip);
        
        const rect = element.getBoundingClientRect();
        tooltip.style.position = 'fixed';
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom + 10}px`;
        tooltip.style.zIndex = '10001';
        
        // Auto-hide after 3 seconds if not loading
        if (!isLoading) {
            setTimeout(() => {
                tooltip.remove();
            }, 3000);
        }
    }
    
    /**
     * Close score calculation modal
     */
    closeScoreModal() {
        this.closeProductModal();
    }
    
    /**
     * Calculate actual component scores for any product
     * This estimates component scores based on available product data
     */
    calculateActualComponentScores(product, finalScore) {
        // Determine weights based on search method and product characteristics
        let weights;
        if (this.searchMethod.value === 'semantic') {
            weights = { alpha: 1.0, beta: 0.0, gamma: 0.0, delta: 0.0 };
        } else if (this.searchMethod.value === 'hybrid') {
            weights = { alpha: 0.7, beta: 0.15, gamma: 0.1, delta: 0.05 };
        } else if (this.searchMethod.value === 'linear') {
            weights = { alpha: 0.2, beta: 0.4, gamma: 0.3, delta: 0.1 };
        } else {
            // Default heuristic weights
            weights = { alpha: 0.4, beta: 0.3, gamma: 0.2, delta: 0.1 };
        }
        
        const numericScore = typeof finalScore === 'number' ? finalScore : 0.5;
        
        // Calculate semantic score - use the actual score if it's primarily semantic
        let semanticScore;
        if (this.searchMethod.value === 'semantic') {
            semanticScore = numericScore;
        } else if (product.semantic_score) {
            semanticScore = product.semantic_score;
        } else {
            // Estimate based on final score and typical semantic performance
            semanticScore = Math.min(0.95, numericScore * 0.8 + 0.1);
        }
        
        // Calculate category score based on query and product category matching
        let categoryScore = 0.5; // Default neutral score
        if (product.category && this.currentQuery) {
            const queryLower = this.currentQuery.toLowerCase();
            const categoryLower = product.category.toLowerCase();
            
            if (queryLower.includes(categoryLower) || categoryLower.includes(queryLower)) {
                categoryScore = 0.9; // High match
            } else {
                // Check for related categories
                const categoryRelations = {
                    'dress': ['dresses', 'clothing', 'women', 'apparel'],
                    'shoes': ['footwear', 'sneakers', 'boots', 'sandals'],
                    'shirt': ['shirts', 'tops', 'clothing', 'apparel'],
                    'pants': ['trousers', 'jeans', 'bottoms', 'clothing']
                };
                
                let hasRelation = false;
                Object.entries(categoryRelations).forEach(([key, relations]) => {
                    if (queryLower.includes(key) && relations.some(rel => categoryLower.includes(rel))) {
                        hasRelation = true;
                    }
                });
                
                categoryScore = hasRelation ? 0.7 : 0.3;
            }
        }
        
        // Calculate color score based on query and product color
        let colorScore = 0.5;
        if (product.color && this.currentQuery) {
            const queryLower = this.currentQuery.toLowerCase();
            const colorLower = product.color.toLowerCase();
            
            if (queryLower.includes(colorLower) || colorLower.includes(queryLower)) {
                colorScore = 0.85;
            } else {
                // Check for color family matches
                const colorFamilies = {
                    'red': ['crimson', 'scarlet', 'burgundy', 'maroon'],
                    'blue': ['navy', 'azure', 'royal', 'cobalt'],
                    'green': ['emerald', 'forest', 'olive', 'mint'],
                    'black': ['charcoal', 'ebony', 'onyx'],
                    'white': ['ivory', 'cream', 'pearl']
                };
                
                let hasColorFamily = false;
                Object.entries(colorFamilies).forEach(([base, variants]) => {
                    if (queryLower.includes(base) && variants.some(v => colorLower.includes(v))) {
                        hasColorFamily = true;
                    }
                });
                
                colorScore = hasColorFamily ? 0.6 : 0.4;
            }
        }
        
        // Calculate brand score based on query and product brand
        let brandScore = 0.5;
        if (product.brand && this.currentQuery) {
            const queryLower = this.currentQuery.toLowerCase();
            const brandLower = product.brand.toLowerCase();
            
            if (queryLower.includes(brandLower) || brandLower.includes(queryLower)) {
                brandScore = 0.9;
            } else {
                // Default brand similarity
                brandScore = 0.6;
            }
        }
        
        // Calculate what the total should be with these weights and scores
        const calculatedTotal = (weights.alpha * semanticScore) + 
                               (weights.beta * categoryScore) + 
                               (weights.gamma * colorScore) + 
                               (weights.delta * brandScore);
        
        // Create a note if there's a significant difference
        let note = '';
        if (Math.abs(calculatedTotal - numericScore) > 0.1) {
            note = 'Estimated component breakdown - actual scores may vary based on search method';
        }
        
        return {
            semantic: semanticScore,
            category: categoryScore,
            color: colorScore,
            brand: brandScore,
            weights: weights,
            calculatedTotal: calculatedTotal,
            note: note
        };
    }
    
    // Utility function to debounce function calls
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // Method to handle keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K to focus search
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.searchInput.focus();
            }
            
            // Escape to close modal
            if (e.key === 'Escape' && !this.productModal.classList.contains('hidden')) {
                this.closeProductModal();
            }
        });
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.fashionApp = new FashionSearchApp();
    window.fashionApp.setupKeyboardShortcuts();
    
    // Add some nice loading animation for cards
    const style = document.createElement('style');
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .product-card {
            animation: fadeInUp 0.6s ease forwards;
        }
        
        .product-card:hover .product-name {
            color: #667eea;
        }
        
        .search-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            transform: none !important;
        }
        
        .search-input-focused {
            border-color: #667eea !important;
            box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1) !important;
        }
    `;
    document.head.appendChild(style);
});

// Add some global utility functions
window.searchUtils = {
    formatPrice: (price) => {
        return price ? `$${price.toFixed(2)}` : 'Price not available';
    },
    
    truncateText: (text, maxLength = 100) => {
        if (!text || text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },
    
    capitalizeWords: (str) => {
        if (!str) return '';
        return str.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        ).join(' ');
    }
};

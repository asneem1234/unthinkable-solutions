// API Base URL
const API_BASE = '/api';

// State
let selectedFiles = [];
let queryHistory = [];

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const queryInput = document.getElementById('queryInput');
const queryBtn = document.getElementById('queryBtn');
const compareBtn = document.getElementById('compareBtn');
const answerSection = document.getElementById('answerSection');
const comparisonSection = document.getElementById('comparisonSection');
const answerText = document.getElementById('answerText');
const confidenceBadge = document.getElementById('confidenceBadge');
const metadata = document.getElementById('metadata');
const compressionMetrics = document.getElementById('compressionMetrics');
const sourcesSection = document.getElementById('sourcesSection');
const sourcesList = document.getElementById('sourcesList');
const historyList = document.getElementById('historyList');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');
const clearDbBtn = document.getElementById('clearDbBtn');
const docCount = document.getElementById('docCount');
const chunkCount = document.getElementById('chunkCount');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    loadHistory();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Upload area
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    fileInput.addEventListener('change', handleFileSelect);
    uploadBtn.addEventListener('click', handleUpload);
    
    // Query
    queryBtn.addEventListener('click', () => handleQuery(false));
    compareBtn.addEventListener('click', () => handleQuery(true));
    queryInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleQuery(false);
        }
    });
    
    // History
    clearHistoryBtn.addEventListener('click', clearHistory);
    clearDbBtn.addEventListener('click', clearDatabase);
}

// File Upload Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('drag-over');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

function addFiles(files) {
    const validFiles = files.filter(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        return ['pdf', 'txt', 'doc', 'docx'].includes(ext) && file.size <= 10 * 1024 * 1024;
    });
    
    selectedFiles = [...selectedFiles, ...validFiles];
    renderFileList();
    uploadBtn.disabled = selectedFiles.length === 0;
}

function renderFileList() {
    if (selectedFiles.length === 0) {
        fileList.innerHTML = '';
        return;
    }
    
    fileList.innerHTML = selectedFiles.map((file, index) => `
        <div class="file-item">
            <div>
                <div class="file-name">${file.name}</div>
                <div class="file-size">${formatFileSize(file.size)}</div>
            </div>
            <button class="file-remove" onclick="removeFile(${index})">×</button>
        </div>
    `).join('');
}

function removeFile(index) {
    selectedFiles.splice(index, 1);
    renderFileList();
    uploadBtn.disabled = selectedFiles.length === 0;
}

async function handleUpload() {
    if (selectedFiles.length === 0) return;
    
    setButtonLoading(uploadBtn, true);
    uploadStatus.innerHTML = '';
    
    try {
        const formData = new FormData();
        selectedFiles.forEach(file => formData.append('documents', file));
        
        const response = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
            showStatus(uploadStatus, 'success', `Successfully processed ${data.results.length} document(s)!`);
            selectedFiles = [];
            renderFileList();
            uploadBtn.disabled = true;
            fileInput.value = '';
            loadStats();
            
            // Show details
            const details = data.results.map(r => 
                `✓ ${r.filename}: ${r.chunks} chunks`
            ).join('<br>');
            showStatus(uploadStatus, 'success', details);
        } else {
            showStatus(uploadStatus, 'error', data.error);
        }
    } catch (error) {
        showStatus(uploadStatus, 'error', 'Upload failed: ' + error.message);
    } finally {
        setButtonLoading(uploadBtn, false);
    }
}

// Query Handlers
async function handleQuery(compareMode = false) {
    const query = queryInput.value.trim();
    if (!query) {
        showToast('Please enter a question');
        return;
    }
    
    const button = compareMode ? compareBtn : queryBtn;
    setButtonLoading(button, true);
    answerSection.hidden = true;
    comparisonSection.hidden = true;
    
    try {
        const response = await fetch(`${API_BASE}/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, compareMode })
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (compareMode) {
                displayComparison(data, query);
            } else {
                displayAnswer(data, query);
            }
            addToHistory(query, data, compareMode);
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Query failed: ' + error.message, 'error');
    } finally {
        setButtonLoading(button, false);
    }
}

function displayAnswer(data, query) {
    answerSection.hidden = false;
    comparisonSection.hidden = true;
    answerText.textContent = data.answer;
    
    // Confidence badge
    const confidence = data.metadata.confidence;
    let confidenceClass = 'confidence-low';
    if (confidence >= 70) confidenceClass = 'confidence-high';
    else if (confidence >= 50) confidenceClass = 'confidence-medium';
    
    confidenceBadge.className = `confidence-badge ${confidenceClass}`;
    confidenceBadge.textContent = `${confidence}% Confidence`;
    
    // Metadata
    metadata.innerHTML = `
        <span>⏱️ Total: ${data.metadata.totalTime}ms</span>
        <span>🔍 Retrieval: ${data.metadata.retrievalTime}ms</span>
        <span>📦 Compression: ${data.metadata.compressionTime || 0}ms</span>
        <span>🤖 Synthesis: ${data.metadata.synthesisTime}ms</span>
        <span>📄 Chunks: ${data.metadata.chunksRetrieved}</span>
    `;
    
    // Compression metrics
    if (data.metadata.compression) {
        const comp = data.metadata.compression;
        compressionMetrics.innerHTML = `
            <div class="metric-item">
                <span class="metric-label">Full Chunks</span>
                <span class="metric-value">${comp.fullChunks}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Compressed</span>
                <span class="metric-value">${comp.compressedChunks}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Tokens Used</span>
                <span class="metric-value">${comp.compressedTokens}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Tokens Saved</span>
                <span class="metric-value" style="color: var(--success-color)">${comp.tokensSaved}</span>
            </div>
            <div class="metric-item">
                <span class="metric-label">Compression</span>
                <span class="metric-value" style="color: var(--success-color)">${comp.compressionRate}%</span>
            </div>
        `;
    }
    
    // Sources
    if (data.sources && data.sources.length > 0) {
        sourcesSection.hidden = false;
        sourcesList.innerHTML = data.sources.map(source => `
            <div class="source-item">
                <div class="source-header">
                    <span class="source-filename">📄 ${source.filename}</span>
                    <span class="source-score">${Math.round(source.relevanceScore * 100)}% match</span>
                </div>
                ${source.excerpts.map(excerpt => `
                    <div class="source-excerpt">"${excerpt.text}"</div>
                `).join('')}
            </div>
        `).join('');
    } else {
        sourcesSection.hidden = true;
    }
    
    // Scroll to answer
    answerSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function displayComparison(data, query) {
    answerSection.hidden = true;
    comparisonSection.hidden = false;
    
    const { baseline, compressed, comparison } = data;
    
    // Improvement metrics
    document.getElementById('improvementMetrics').innerHTML = `
        <div class="improvement-card">
            <h5>⚡ Speed Improvement</h5>
            <div class="improvement-value">↓${comparison.timeImprovement.improvement}%</div>
            <div class="improvement-detail">
                ${comparison.timeImprovement.baseline}ms → ${comparison.timeImprovement.compressed}ms<br>
                Saved: ${comparison.timeImprovement.saved}ms
            </div>
        </div>
        <div class="improvement-card">
            <h5>💾 Token Reduction</h5>
            <div class="improvement-value">↓${comparison.tokenEfficiency.reduction}%</div>
            <div class="improvement-detail">
                ${comparison.tokenEfficiency.baseline} → ${comparison.tokenEfficiency.compressed} tokens<br>
                Saved: ${comparison.tokenEfficiency.saved} tokens
            </div>
        </div>
        <div class="improvement-card">
            <h5>💰 Cost Savings</h5>
            <div class="improvement-value">↓${comparison.costEfficiency.savings}%</div>
            <div class="improvement-detail">
                $${comparison.costEfficiency.baseline.toFixed(6)} → $${comparison.costEfficiency.compressed.toFixed(6)}<br>
                Per query savings
            </div>
        </div>
    `;
    
    // Baseline answer
    document.getElementById('baselineAnswer').textContent = baseline.answer;
    document.getElementById('baselineMetadata').innerHTML = `
        <span>⏱️ Time: ${baseline.metadata.totalTime}ms</span>
        <span>📄 Chunks: ${baseline.metadata.chunksUsed}</span>
        <span>🔤 Tokens: ${baseline.metadata.tokens}</span>
    `;
    
    // Compressed answer
    document.getElementById('compressedAnswer').textContent = compressed.answer;
    document.getElementById('compressedMetadata').innerHTML = `
        <span>⏱️ Time: ${compressed.metadata.totalTime}ms</span>
        <span>📄 Full: ${compressed.metadata.fullChunks} | Compressed: ${compressed.metadata.compressedChunks}</span>
        <span>🔤 Tokens: ${compressed.metadata.tokens}</span>
        <span>💾 Saved: ${compressed.metadata.tokensSaved} (${compressed.metadata.compressionRate}%)</span>
    `;
    
    // Scroll to comparison
    comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// History
function addToHistory(query, result, compareMode) {
    const historyItem = {
        query,
        answer: compareMode ? result.compressed.answer : result.answer,
        confidence: compareMode ? 0 : result.metadata.confidence,
        timestamp: new Date().toISOString(),
        sources: compareMode ? result.compressed.sources : result.sources,
        compareMode: compareMode || false
    };
    
    queryHistory.unshift(historyItem);
    if (queryHistory.length > 10) queryHistory.pop();
    
    saveHistory();
    renderHistory();
}

function renderHistory() {
    if (queryHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">No queries yet. Ask your first question!</p>';
        return;
    }
    
    historyList.innerHTML = queryHistory.map((item, index) => `
        <div class="history-item" onclick="loadHistoryItem(${index})">
            <div class="history-query">${item.query}</div>
            <div class="history-time">${formatTimestamp(item.timestamp)} • ${item.confidence}% confidence</div>
        </div>
    `).join('');
}

function loadHistoryItem(index) {
    const item = queryHistory[index];
    queryInput.value = item.query;
    displayAnswer({
        answer: item.answer,
        sources: item.sources,
        metadata: { confidence: item.confidence, totalTime: 0, retrievalTime: 0, synthesisTime: 0, chunksRetrieved: 0 }
    }, item.query);
}

function clearHistory() {
    if (confirm('Clear all query history?')) {
        queryHistory = [];
        saveHistory();
        renderHistory();
        showToast('History cleared');
    }
}

function saveHistory() {
    localStorage.setItem('queryHistory', JSON.stringify(queryHistory));
}

function loadHistory() {
    const saved = localStorage.getItem('queryHistory');
    if (saved) {
        queryHistory = JSON.parse(saved);
        renderHistory();
    }
}

// Stats
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/stats`);
        const data = await response.json();
        
        if (data.success) {
            chunkCount.textContent = data.stats.pointsCount || 0;
            // Estimate document count (rough estimate)
            docCount.textContent = Math.ceil((data.stats.pointsCount || 0) / 10);
        }
    } catch (error) {
        console.error('Failed to load stats:', error);
    }
}

// Clear Database
async function clearDatabase() {
    if (!confirm('⚠️ This will delete ALL documents from the knowledge base. Continue?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/documents`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('All documents deleted');
            loadStats();
            answerSection.hidden = true;
        } else {
            showToast(data.error, 'error');
        }
    } catch (error) {
        showToast('Failed to clear database: ' + error.message, 'error');
    }
}

// Utility Functions
function setButtonLoading(button, loading) {
    const text = button.querySelector('.btn-text');
    const spinner = button.querySelector('.spinner');
    
    if (loading) {
        text.hidden = true;
        spinner.hidden = false;
        button.disabled = true;
    } else {
        text.hidden = false;
        spinner.hidden = true;
        button.disabled = false;
    }
}

function showStatus(element, type, message) {
    element.className = `status-message status-${type}`;
    element.innerHTML = message;
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function formatTimestamp(iso) {
    const date = new Date(iso);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
}

// Export for onclick handlers
window.removeFile = removeFile;
window.loadHistoryItem = loadHistoryItem;

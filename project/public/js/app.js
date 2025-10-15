// API Base URL
const API_BASE = window.location.origin;

// State Management
let currentDocuments = [];
let systemMetrics = null;

// DOM Elements
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadStatus = document.getElementById('uploadStatus');
const documentsList = document.getElementById('documentsList');
const refreshDocsBtn = document.getElementById('refreshDocsBtn');
const clearAllBtn = document.getElementById('clearAllBtn');
const metricsGrid = document.getElementById('metricsGrid');
const queryInput = document.getElementById('queryInput');
const queryBtn = document.getElementById('queryBtn');
const resultsSection = document.getElementById('resultsSection');
const resultsContainer = document.getElementById('resultsContainer');
const clearResultsBtn = document.getElementById('clearResultsBtn');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    loadDocuments();
    loadMetrics();
    
    // Auto-refresh metrics every 30 seconds
    setInterval(loadMetrics, 30000);
});

// Event Listeners Setup
function setupEventListeners() {
    // Upload area interactions
    uploadArea.addEventListener('click', () => fileInput.click());
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // File input change
    fileInput.addEventListener('change', handleFileSelect);
    
    // Upload button
    uploadBtn.addEventListener('click', uploadFiles);
    
    // Documents management
    refreshDocsBtn.addEventListener('click', loadDocuments);
    clearAllBtn.addEventListener('click', clearAllDocuments);
    
    // Query
    queryBtn.addEventListener('click', handleQuery);
    queryInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            handleQuery();
        }
    });
    
    // Clear results
    clearResultsBtn.addEventListener('click', clearResults);
}

// Drag & Drop Handlers
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    const files = Array.from(e.dataTransfer.files);
    fileInput.files = e.dataTransfer.files;
    showUploadStatus(`${files.length} file(s) selected`, 'success');
}

function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
        showUploadStatus(`${files.length} file(s) selected`, 'success');
    }
}

// Upload Files
async function uploadFiles() {
    const files = fileInput.files;
    
    if (files.length === 0) {
        showToast('Please select files to upload', 'warning');
        return;
    }
    
    showLoading(true);
    uploadBtn.disabled = true;
    
    try {
        for (let file of files) {
            const formData = new FormData();
            formData.append('document', file);
            
            const response = await fetch(`${API_BASE}/api/upload`, {
                method: 'POST',
                body: formData
            });
            
            const result = await response.json();
            
            if (result.success) {
                showToast(`✓ ${file.name} uploaded successfully`, 'success');
            } else {
                throw new Error(result.error || 'Upload failed');
            }
        }
        
        // Reset form and reload documents
        fileInput.value = '';
        showUploadStatus(`${files.length} file(s) uploaded successfully`, 'success');
        setTimeout(() => {
            uploadStatus.style.display = 'none';
        }, 3000);
        
        loadDocuments();
        loadMetrics();
        
    } catch (error) {
        console.error('Upload error:', error);
        showToast(`Upload failed: ${error.message}`, 'error');
        showUploadStatus(`Upload failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
        uploadBtn.disabled = false;
    }
}

function showUploadStatus(message, type) {
    uploadStatus.textContent = message;
    uploadStatus.className = `upload-status ${type}`;
    uploadStatus.style.display = 'block';
}

// Load Documents
async function loadDocuments() {
    try {
        const response = await fetch(`${API_BASE}/api/documents`);
        const result = await response.json();
        
        if (result.success) {
            currentDocuments = result.documents;
            renderDocuments();
            updateMetricsDisplay({ totalDocuments: result.documents.length });
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        documentsList.innerHTML = '<div class="loading">Error loading documents</div>';
    }
}

function renderDocuments() {
    if (currentDocuments.length === 0) {
        documentsList.innerHTML = '<div class="loading">No documents uploaded yet</div>';
        return;
    }
    
    documentsList.innerHTML = currentDocuments.map(doc => `
        <div class="document-item">
            <div class="document-info">
                <div class="document-name">${doc.name || doc.filename || 'Unknown Document'}</div>
                <div class="document-meta">
                    ${doc.chunks} chunks | Uploaded ${formatDate(doc.timestamp || doc.uploadedAt)}
                </div>
            </div>
            <div class="document-actions">
                <button onclick="deleteDocument('${doc.id}', '${escapeHtml(doc.name || doc.filename || 'document')}')">🗑️</button>
            </div>
        </div>
    `).join('');
}

// Delete Document
async function deleteDocument(documentId, filename) {
    if (!confirm(`Delete "${filename}"?`)) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/api/documents/${documentId}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`✓ Deleted "${filename}"`, 'success');
            loadDocuments();
        } else {
            throw new Error(result.error || 'Delete failed');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showToast(`Delete failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Clear All Documents
async function clearAllDocuments() {
    if (!confirm('Delete ALL documents? This cannot be undone.')) {
        return;
    }
    
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/api/documents`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('✓ All documents cleared', 'success');
            loadDocuments();
            loadMetrics();
        } else {
            throw new Error(result.error || 'Clear failed');
        }
    } catch (error) {
        console.error('Clear error:', error);
        showToast(`Clear failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Handle Query
async function handleQuery() {
    const query = queryInput.value.trim();
    
    if (!query) {
        showToast('Please enter a question', 'warning');
        return;
    }
    
    if (currentDocuments.length === 0) {
        showToast('Please upload documents first', 'warning');
        return;
    }
    
    const mode = document.querySelector('input[name="queryMode"]:checked').value;
    
    showLoading(true);
    queryBtn.disabled = true;
    
    try {
        let result;
        
        if (mode === 'compare') {
            // Comparison mode
            const response = await fetch(`${API_BASE}/api/query/compare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            
            result = await response.json();
            
            if (result.success) {
                renderComparisonResults(query, result);
            } else {
                throw new Error(result.error || 'Query failed');
            }
        } else {
            // Single mode (compressed or baseline)
            const response = await fetch(`${API_BASE}/api/query`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, mode })
            });
            
            result = await response.json();
            
            if (result.success) {
                renderSingleResult(query, result, mode);
            } else {
                throw new Error(result.error || 'Query failed');
            }
        }
        
        resultsSection.style.display = 'block';
        loadMetrics();
        
    } catch (error) {
        console.error('Query error:', error);
        showToast(`Query failed: ${error.message}`, 'error');
    } finally {
        showLoading(false);
        queryBtn.disabled = false;
    }
}

// Render Single Result
function renderSingleResult(query, result, mode) {
    const modeLabel = mode === 'compressed' ? 'REFRAG Compressed' : 'Baseline RAG';
    const modeBadge = mode === 'compressed' ? '⚡' : '📄';
    
    // Access metrics from the correct path
    const metrics = result.metrics || {};
    const tokensUsed = metrics.tokensUsed || 0;
    const retrievalTime = metrics.retrievalTime || 0;
    const generationTime = metrics.generationTime || 0;
    const totalTime = metrics.totalTime || metrics.latencyMs || 0;
    
    const resultHTML = `
        <div class="result-card">
            <div class="result-header">
                <div class="result-title">${modeBadge} ${modeLabel}</div>
                <div class="result-stats">
                    <span>⏱️ ${totalTime}ms</span>
                    <span>🔤 ${tokensUsed} tokens</span>
                </div>
            </div>
            <div style="margin-bottom: 12px; color: #94a3b8;">
                <strong>Q:</strong> ${escapeHtml(query)}
            </div>
            <div class="result-answer">
                <strong>A:</strong> ${escapeHtml(result.answer)}
            </div>
            <div class="result-metrics">
                <div class="result-metric">
                    <div class="result-metric-value">${tokensUsed}</div>
                    <div class="result-metric-label">Tokens</div>
                </div>
                <div class="result-metric">
                    <div class="result-metric-value">${retrievalTime}ms</div>
                    <div class="result-metric-label">Retrieval</div>
                </div>
                <div class="result-metric">
                    <div class="result-metric-value">${generationTime}ms</div>
                    <div class="result-metric-label">Generation</div>
                </div>
                <div class="result-metric">
                    <div class="result-metric-value">${totalTime}ms</div>
                    <div class="result-metric-label">Total Time</div>
                </div>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = resultHTML;
}

// Render Comparison Results
function renderComparisonResults(query, result) {
    // Access metrics from the correct nested path
    const compressedMetrics = result.compressed.metrics || {};
    const baselineMetrics = result.baseline.metrics || {};
    
    const compressedTokens = compressedMetrics.tokensUsed || 0;
    const baselineTokens = baselineMetrics.tokensUsed || 0;
    const compressedTime = compressedMetrics.totalTime || compressedMetrics.latencyMs || 0;
    const baselineTime = baselineMetrics.totalTime || baselineMetrics.latencyMs || 0;
    
    const compressionRatio = baselineTokens > 0 ? ((1 - compressedTokens / baselineTokens) * 100).toFixed(1) : 0;
    const speedup = compressedTime > 0 ? (baselineTime / compressedTime).toFixed(2) : 0;
    
    const resultHTML = `
        <div style="margin-bottom: 20px; padding: 16px; background: var(--background); border-radius: 8px;">
            <strong style="font-size: 1.1rem;">Q:</strong> ${escapeHtml(query)}
        </div>
        
        <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px;">
            <div style="text-align: center; padding: 16px; background: rgba(16, 185, 129, 0.1); border-radius: 8px; border: 2px solid #10b981;">
                <div style="font-size: 2rem; font-weight: bold; color: #10b981;">${compressionRatio}%</div>
                <div style="color: #94a3b8;">Token Reduction</div>
            </div>
            <div style="text-align: center; padding: 16px; background: rgba(79, 70, 229, 0.1); border-radius: 8px; border: 2px solid #4f46e5;">
                <div style="font-size: 2rem; font-weight: bold; color: #4f46e5;">${speedup}x</div>
                <div style="color: #94a3b8;">Faster</div>
            </div>
        </div>
        
        <div class="comparison-grid">
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title">⚡ REFRAG Compressed</div>
                </div>
                <div class="result-answer">
                    ${escapeHtml(result.compressed.answer)}
                </div>
                <div class="result-metrics">
                    <div class="result-metric">
                        <div class="result-metric-value">${compressedTokens}</div>
                        <div class="result-metric-label">Tokens</div>
                    </div>
                    <div class="result-metric">
                        <div class="result-metric-value">${compressedMetrics.retrievalTime || 0}ms</div>
                        <div class="result-metric-label">Retrieval</div>
                    </div>
                    <div class="result-metric">
                        <div class="result-metric-value">${compressedMetrics.generationTime || 0}ms</div>
                        <div class="result-metric-label">Generation</div>
                    </div>
                    <div class="result-metric">
                        <div class="result-metric-value">${compressedTime}ms</div>
                        <div class="result-metric-label">Total</div>
                    </div>
                </div>
            </div>
            
            <div class="result-card">
                <div class="result-header">
                    <div class="result-title">📄 Baseline RAG</div>
                </div>
                <div class="result-answer">
                    ${escapeHtml(result.baseline.answer)}
                </div>
                <div class="result-metrics">
                    <div class="result-metric">
                        <div class="result-metric-value">${baselineTokens}</div>
                        <div class="result-metric-label">Tokens</div>
                    </div>
                    <div class="result-metric">
                        <div class="result-metric-value">${baselineMetrics.retrievalTime || 0}ms</div>
                        <div class="result-metric-label">Retrieval</div>
                    </div>
                    <div class="result-metric">
                        <div class="result-metric-value">${baselineMetrics.generationTime || 0}ms</div>
                        <div class="result-metric-label">Generation</div>
                    </div>
                    <div class="result-metric">
                        <div class="result-metric-value">${baselineTime}ms</div>
                        <div class="result-metric-label">Total</div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    resultsContainer.innerHTML = resultHTML;
}

function clearResults() {
    resultsContainer.innerHTML = '';
    resultsSection.style.display = 'none';
}

// Load Metrics
async function loadMetrics() {
    try {
        const response = await fetch(`${API_BASE}/api/metrics`);
        const result = await response.json();
        
        if (result.success) {
            systemMetrics = result.metrics;
            updateMetricsDisplay(systemMetrics);
        }
    } catch (error) {
        console.error('Error loading metrics:', error);
    }
}

function updateMetricsDisplay(metrics) {
    const metricItems = metricsGrid.querySelectorAll('.metric-item');
    
    // Update total queries
    if (metrics.totalQueries !== undefined && metricItems[0]) {
        metricItems[0].querySelector('.metric-value').textContent = metrics.totalQueries || 0;
    }
    
    // Update total documents
    if (metricItems[1]) {
        const docCount = metrics.totalDocuments !== undefined ? metrics.totalDocuments : currentDocuments.length;
        metricItems[1].querySelector('.metric-value').textContent = docCount || 0;
    }
    
    // Update average latency
    if (metricItems[2]) {
        const latency = metrics.avgLatency !== undefined && metrics.avgLatency > 0 ? Math.round(metrics.avgLatency) : 0;
        metricItems[2].querySelector('.metric-value').textContent = `${latency}ms`;
    }
    
    // Update total tokens
    if (metricItems[3]) {
        const tokens = metrics.totalTokens !== undefined ? metrics.totalTokens : 0;
        metricItems[3].querySelector('.metric-value').textContent = formatNumber(tokens);
    }
}

// Utility Functions
function showLoading(show) {
    loadingOverlay.style.display = show ? 'flex' : 'none';
}

function showToast(message, type = 'success') {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">${icons[type]}</div>
        <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

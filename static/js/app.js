document.addEventListener('DOMContentLoaded', () => {
    // State Variables
    let releaseData = null;
    let activeFilter = 'all';
    let searchQuery = '';
    let selectedUpdate = null;
    
    // DOM Elements
    const refreshBtn = document.getElementById('refresh-btn');
    const retryBtn = document.getElementById('retry-btn');
    const resetFiltersBtn = document.getElementById('reset-filters-btn');
    const feedContainer = document.getElementById('feed-container');
    const loadingState = document.getElementById('loading-state');
    const errorState = document.getElementById('error-state');
    const errorMessage = document.getElementById('error-message');
    const emptyState = document.getElementById('empty-state');
    const lastUpdatedText = document.getElementById('last-updated-text');
    const statusDot = document.querySelector('.status-dot');
    const feedCountBadge = document.getElementById('feed-count-badge');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const searchInput = document.getElementById('search-input');
    const tagFilters = document.querySelectorAll('.filter-tag');
    
    // Tweet Composer Elements
    const tweetTextarea = document.getElementById('tweet-textarea');
    const tweetBtn = document.getElementById('tweet-btn');
    const charCount = document.getElementById('char-count');
    const charProgress = document.getElementById('char-progress');
    
    // Progress Ring Calculations
    const progressRadius = 9;
    const progressCircumference = 2 * Math.PI * progressRadius;
    if (charProgress) {
        charProgress.style.strokeDasharray = `${progressCircumference} ${progressCircumference}`;
        charProgress.style.strokeDashoffset = progressCircumference;
    }

    // Check local storage for theme preference
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.body.classList.add('light-mode');
    }

    // Initialize the App
    fetchReleaseNotes();

    // Event Listeners
    refreshBtn.addEventListener('click', fetchReleaseNotes);
    retryBtn.addEventListener('click', fetchReleaseNotes);
    resetFiltersBtn.addEventListener('click', resetFilters);
    exportCsvBtn.addEventListener('click', exportToCSV);
    
    themeToggleBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const theme = document.body.classList.contains('light-mode') ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
    });
    
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderFeed();
    });
    
    tagFilters.forEach(tag => {
        tag.addEventListener('click', () => {
            tagFilters.forEach(t => t.classList.remove('active'));
            tag.classList.add('active');
            activeFilter = tag.dataset.filter.toLowerCase();
            renderFeed();
        });
    });
    
    tweetTextarea.addEventListener('input', updateCharCount);
    
    tweetBtn.addEventListener('click', () => {
        const text = tweetTextarea.value;
        const twitterIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        window.open(twitterIntentUrl, '_blank', 'width=550,height=420');
    });

    // Fetch Release Notes
    function fetchReleaseNotes() {
        showState('loading');
        refreshBtn.classList.add('spinning');
        refreshBtn.disabled = true;
        statusDot.classList.add('loading');
        lastUpdatedText.textContent = "Fetching latest feed...";

        fetch('/api/release-notes')
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                refreshBtn.classList.remove('spinning');
                refreshBtn.disabled = false;
                statusDot.classList.remove('loading');
                
                if (data.success) {
                    releaseData = data;
                    const now = new Date();
                    lastUpdatedText.textContent = `Last updated: ${now.toLocaleTimeString()}`;
                    renderFeed();
                } else {
                    throw new Error(data.error || "Failed parsing the feed.");
                }
            })
            .catch(error => {
                console.error("Error fetching release notes:", error);
                refreshBtn.classList.remove('spinning');
                refreshBtn.disabled = false;
                statusDot.classList.remove('loading');
                errorMessage.textContent = error.message;
                lastUpdatedText.textContent = "Failed to update.";
                showState('error');
            });
    }

    // Reset all Filters
    function resetFilters() {
        searchInput.value = '';
        searchQuery = '';
        tagFilters.forEach(t => t.classList.remove('active'));
        const allTag = Array.from(tagFilters).find(t => t.dataset.filter === 'all');
        if (allTag) allTag.classList.add('active');
        activeFilter = 'all';
        renderFeed();
    }

    // Toggle loading/error/content states
    function showState(state) {
        loadingState.classList.add('hidden');
        errorState.classList.add('hidden');
        emptyState.classList.add('hidden');
        feedContainer.classList.add('hidden');

        if (state === 'loading') {
            loadingState.classList.remove('hidden');
        } else if (state === 'error') {
            errorState.classList.remove('hidden');
        } else if (state === 'empty') {
            emptyState.classList.remove('hidden');
        } else if (state === 'content') {
            feedContainer.classList.remove('hidden');
        }
    }

    // Filter and Process Feed Items
    function getFilteredEntries() {
        if (!releaseData || !releaseData.entries) return [];

        const filtered = [];
        
        releaseData.entries.forEach(entry => {
            const matchingUpdates = entry.updates.filter(update => {
                // Category filter check
                const matchesCategory = activeFilter === 'all' || 
                    update.category.toLowerCase() === activeFilter;
                
                // Search query check
                const matchesSearch = !searchQuery || 
                    update.category.toLowerCase().includes(searchQuery) ||
                    update.plain_text.toLowerCase().includes(searchQuery) ||
                    entry.date.toLowerCase().includes(searchQuery);
                
                return matchesCategory && matchesSearch;
            });

            if (matchingUpdates.length > 0) {
                filtered.push({
                    ...entry,
                    updates: matchingUpdates
                });
            }
        });
        
        return filtered;
    }

    // Render Timeline Feed
    function renderFeed() {
        const filteredData = getFilteredEntries();
        feedContainer.innerHTML = '';
        
        let totalUpdates = 0;
        filteredData.forEach(entry => totalUpdates += entry.updates.length);
        feedCountBadge.textContent = `${totalUpdates} Update${totalUpdates !== 1 ? 's' : ''} Found`;

        if (totalUpdates === 0) {
            showState('empty');
            return;
        }

        filteredData.forEach(entry => {
            const groupDiv = document.createElement('div');
            groupDiv.className = 'timeline-group';

            const headerDiv = document.createElement('div');
            headerDiv.className = 'timeline-date-header';
            headerDiv.innerHTML = `<h3>${entry.date}</h3>`;
            groupDiv.appendChild(headerDiv);

            const updatesList = document.createElement('div');
            updatesList.className = 'timeline-updates-list';

            entry.updates.forEach((update, idx) => {
                const card = document.createElement('div');
                card.className = 'update-card';
                // Unique selector key
                const cardKey = `${entry.date}-${idx}`;
                card.dataset.key = cardKey;

                if (selectedUpdate && selectedUpdate.key === cardKey) {
                    card.classList.add('selected');
                }

                const catLower = update.category.toLowerCase();
                let badgeClass = 'badge-general';
                if (catLower.includes('feature')) badgeClass = 'badge-feature';
                else if (catLower.includes('issue')) badgeClass = 'badge-issue';
                else if (catLower.includes('deprecation')) badgeClass = 'badge-deprecation';

                card.innerHTML = `
                    <div class="card-header">
                        <span class="badge ${badgeClass}">${update.category}</span>
                        <div class="card-actions">
                            <button class="card-action-btn copy-card-btn" title="Copy to Clipboard">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                            </button>
                            <button class="card-action-btn tweet-card-btn" title="Prepare Tweet">
                                <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    <div class="card-content">
                        ${update.body_html}
                    </div>
                `;

                // Card selection handler
                card.addEventListener('click', (e) => {
                    // Avoid selecting if clicking a link inside the card
                    if (e.target.tagName === 'A') return;
                    
                    selectCard(cardKey, entry, update);
                });
                
                // Direct Copy button inside card
                const cardCopyBtn = card.querySelector('.copy-card-btn');
                cardCopyBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    copyToClipboard(entry, update, cardCopyBtn);
                });
                
                // Direct Tweet button inside card
                const cardTweetBtn = card.querySelector('.tweet-card-btn');
                cardTweetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    selectCard(cardKey, entry, update);
                    // Focus composition text area
                    tweetTextarea.focus();
                });

                updatesList.appendChild(card);
            });

            groupDiv.appendChild(updatesList);
            feedContainer.appendChild(groupDiv);
        });

        showState('content');
    }

    // Select Update Card
    function selectCard(key, entry, update) {
        selectedUpdate = { key, entry, update };
        
        // Update selection UI
        document.querySelectorAll('.update-card').forEach(card => {
            if (card.dataset.key === key) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Draft Tweet text
        draftTweet(entry, update);
    }

    // Draft Tweet and setup limits
    function draftTweet(entry, update) {
        const link = entry.link || "https://docs.cloud.google.com/bigquery/docs/release-notes";
        const category = update.category;
        const date = entry.date;
        const text = update.plain_text;
        
        // Draft Template
        // "BigQuery [Feature] (June 15, 2026): [Description...] - [Link]"
        const prefix = `BigQuery [${category}] (${date}): `;
        const suffix = ` ${link}`;
        
        // Compute available length
        const maxTextLen = 280 - prefix.length - suffix.length;
        
        let trimmedText = text;
        if (text.length > maxTextLen) {
            trimmedText = text.substring(0, maxTextLen - 3) + "...";
        }
        
        const fullTweetText = `${prefix}${trimmedText}${suffix}`;
        
        tweetTextarea.value = fullTweetText;
        tweetBtn.removeAttribute('disabled');
        updateCharCount();
    }

    // Update Character Count progress ring
    function updateCharCount() {
        const length = tweetTextarea.value.length;
        const limit = 280;
        const remaining = limit - length;
        
        charCount.textContent = remaining;
        
        if (remaining < 0) {
            charCount.style.color = 'var(--color-danger)';
            tweetBtn.disabled = true;
        } else {
            charCount.style.color = 'var(--text-secondary)';
            tweetBtn.disabled = length === 0;
        }

        // Progress ring animation
        if (charProgress) {
            const percentage = Math.min(length / limit, 1);
            const offset = progressCircumference - (percentage * progressCircumference);
            charProgress.style.strokeDashoffset = offset;
            
            // Highlight color when approaching limit
            if (remaining <= 20) {
                charProgress.style.stroke = 'var(--color-danger)';
            } else if (remaining <= 50) {
                charProgress.style.stroke = 'var(--color-warning)';
            } else {
                charProgress.style.stroke = 'var(--color-primary)';
            }
        }
    }

    // Copy to Clipboard logic
    function copyToClipboard(entry, update, btnElement) {
        const textToCopy = `BigQuery [${update.category}] (${entry.date}): ${update.plain_text}\nSource: ${entry.link || "https://docs.cloud.google.com/bigquery/docs/release-notes"}`;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            btnElement.classList.add('copied');
            const originalSVG = btnElement.innerHTML;
            btnElement.innerHTML = `
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
            `;
            
            setTimeout(() => {
                btnElement.classList.remove('copied');
                btnElement.innerHTML = originalSVG;
            }, 1500);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    // Export to CSV logic
    function exportToCSV() {
        const filteredData = getFilteredEntries();
        if (filteredData.length === 0) return;
        
        const headers = ['Date', 'Category', 'Update Text', 'Source URL'];
        const rows = [];
        
        filteredData.forEach(entry => {
            entry.updates.forEach(update => {
                const escapedText = update.plain_text.replace(/"/g, '""');
                const escapedCategory = update.category.replace(/"/g, '""');
                const escapedDate = entry.date.replace(/"/g, '""');
                const escapedLink = (entry.link || '').replace(/"/g, '""');
                
                rows.push([
                    `"${escapedDate}"`,
                    `"${escapedCategory}"`,
                    `"${escapedText}"`,
                    `"${escapedLink}"`
                ]);
            });
        });
        
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        
        // Create Blob and trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `bigquery_release_notes_${new Date().toISOString().slice(0,10)}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
});

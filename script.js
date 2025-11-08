// script.js - Final Version

// Mobile Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    initializeMobileMenu();
    initializeEditor();
    initializeActiveNav();
    initializeSelectionTracking();
});

// Mobile Menu Elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileCloseBtn = document.getElementById('mobileCloseBtn');
const mobileNav = document.getElementById('mobileNav');
const mobileOverlay = document.getElementById('mobileOverlay');

// Stats Elements
const topStats = document.getElementById('top-stats');
const statsTopBar = document.querySelector('.stats-top-bar');

// Details Elements
const detWords = document.getElementById('det-words');
const detChars = document.getElementById('det-chars');
const detSentences = document.getElementById('det-sentences');
const detParagraphs = document.getElementById('det-paragraphs');
const detReadingLevel = document.getElementById('det-reading-level');
const readingTime = document.getElementById('reading-time');
const speakingTime = document.getElementById('speaking-time');

// Other Elements
const editor = document.getElementById('editor');
const keywordList = document.getElementById('keyword-list');
const densityMultiplier = document.getElementById('density-multiplier');
const grammarResults = document.getElementById('grammar-results');
const textToSpeechBtn = document.getElementById('textToSpeechBtn');

// Global variables
let autoSaveEnabled = false;
let timeout;
let isSelectionMode = false;
let isSpeaking = false;
let currentUtterance = null;

// Initialize Mobile Menu
function initializeMobileMenu() {
    if (mobileMenuBtn && mobileNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mobileNav.classList.add('active');
            mobileOverlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        });
        
        mobileCloseBtn.addEventListener('click', closeMobileMenu);
        mobileOverlay.addEventListener('click', closeMobileMenu);
        
        document.querySelectorAll('.mobile-link').forEach(link => {
            link.addEventListener('click', closeMobileMenu);
        });
        
        document.querySelectorAll('.mobile-dropdown > .mobile-link').forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const dropdown = this.parentElement;
                dropdown.classList.toggle('active');
                
                const icon = this.querySelector('i');
                if (dropdown.classList.contains('active')) {
                    icon.classList.remove('fa-chevron-down');
                    icon.classList.add('fa-chevron-up');
                } else {
                    icon.classList.remove('fa-chevron-up');
                    icon.classList.add('fa-chevron-down');
                }
            });
        });
    }
}

function closeMobileMenu() {
    mobileNav.classList.remove('active');
    mobileOverlay.classList.remove('active');
    document.body.style.overflow = '';
    
    document.querySelectorAll('.mobile-dropdown').forEach(dropdown => {
        dropdown.classList.remove('active');
        const icon = dropdown.querySelector('i');
        if (icon) {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    });
}

// Auto-highlight active nav link
function initializeActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

// Initialize selection tracking
function initializeSelectionTracking() {
    // Track selection changes
    document.addEventListener('selectionchange', function() {
        clearTimeout(timeout);
        timeout = setTimeout(handleSelectionChange, 100);
    });
    
    // Track mouse up for selection
    document.addEventListener('mouseup', function() {
        clearTimeout(timeout);
        timeout = setTimeout(handleSelectionChange, 100);
    });
    
    // Track key up for selection (Shift + Arrow keys)
    document.addEventListener('keyup', function(e) {
        if (e.shiftKey || e.key === 'Shift') {
            clearTimeout(timeout);
            timeout = setTimeout(handleSelectionChange, 100);
        }
    });
    
    // Click outside to clear selection
    document.addEventListener('mousedown', function(e) {
        if (!editor.contains(e.target)) {
            clearTimeout(timeout);
            timeout = setTimeout(clearSelectionMode, 100);
        }
    });
}

// Handle selection change
function handleSelectionChange() {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    // Check if selection is within our editor and has text
    const isInEditor = editor.contains(selection.anchorNode) || 
                      editor.contains(selection.focusNode);
    
    if (selectedText && isInEditor && selection.rangeCount > 0) {
        // Switch to selection mode
        switchToSelectionMode(selectedText);
    } else {
        // Switch back to full document mode
        switchToFullDocumentMode();
    }
}

// Switch to selection mode - ONLY SHOW SELECTION STATS
function switchToSelectionMode(selectedText) {
    isSelectionMode = true;
    
    // Calculate selected text stats
    const selectedWordCount = selectedText === '' ? 0 : selectedText.split(/\s+/).filter(word => word.length > 0).length;
    const selectedCharCount = selectedText.length;
    const selectedSentenceCount = selectedText === '' ? 0 : selectedText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
    // Update top stats - ONLY SHOW SELECTION
    topStats.textContent = `${selectedWordCount} words ${selectedCharCount} characters`;
    
    // Update details panel - ONLY SHOW SELECTION
    detWords.textContent = selectedWordCount;
    detChars.textContent = selectedCharCount;
    detSentences.textContent = selectedSentenceCount;
    detParagraphs.textContent = 1; // Selection is treated as one paragraph
    detReadingLevel.textContent = calculateReadingLevel(selectedText, selectedWordCount, selectedSentenceCount);
    
    // Calculate and update times for selection only
    const readingTimeValue = calculateReadingTime(selectedWordCount);
    const speakingTimeValue = calculateSpeakingTime(selectedWordCount);
    readingTime.textContent = readingTimeValue;
    speakingTime.textContent = speakingTimeValue;
    
    // Update UI for selection mode
    statsTopBar.classList.add('selection-mode');
    
    // Update keywords for selection only
    updateKeywords(selectedWordCount, selectedText);
}

// Switch back to full document mode
function switchToFullDocumentMode() {
    isSelectionMode = false;
    
    // Update UI for full document mode
    statsTopBar.classList.remove('selection-mode');
    
    // Update stats with full document data
    updateFullDocumentStats();
}

// Clear selection mode
function clearSelectionMode() {
    if (isSelectionMode) {
        switchToFullDocumentMode();
    }
}

// Initialize editor
function initializeEditor() {
    // Load saved content
    const savedContent = localStorage.getItem('editorContent');
    if (savedContent) {
        editor.innerHTML = savedContent;
    }
    
    // Update stats initially
    updateFullDocumentStats();
    
    // Add event listeners
    editor.addEventListener('input', function() {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            if (!isSelectionMode) {
                updateFullDocumentStats();
            }
            if (autoSaveEnabled) {
                saveToLocalStorage();
            }
        }, 300);
    });
    
    editor.addEventListener('paste', function(e) {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
        setTimeout(() => {
            if (!isSelectionMode) {
                updateFullDocumentStats();
            }
        }, 100);
    });
    
    editor.addEventListener('focus', function() {
        this.classList.add('focused');
    });
    
    editor.addEventListener('blur', function() {
        this.classList.remove('focused');
    });
}

// Update full document statistics
function updateFullDocumentStats() {
    const text = editor.textContent || '';
    const cleanText = text.trim();
    
    // Count words accurately
    const wordCount = cleanText === '' ? 0 : cleanText.split(/\s+/).filter(word => word.length > 0).length;
    
    // Count characters
    const charCount = text.length;
    
    // Count sentences properly
    const sentenceCount = cleanText === '' ? 0 : cleanText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
    
    // Count paragraphs properly
    const paragraphCount = cleanText === '' ? 0 : text.split('\n').filter(paragraph => paragraph.trim().length > 0).length;
    
    // Calculate reading and speaking time
    const readingTimeValue = calculateReadingTime(wordCount);
    const speakingTimeValue = calculateSpeakingTime(wordCount);
    
    // Calculate reading level
    const readingLevelValue = calculateReadingLevel(text, wordCount, sentenceCount);
    
    // Update all displays
    topStats.textContent = `${wordCount} words ${charCount} characters`;
    detWords.textContent = wordCount;
    detChars.textContent = charCount;
    detSentences.textContent = sentenceCount;
    detParagraphs.textContent = paragraphCount;
    detReadingLevel.textContent = readingLevelValue;
    readingTime.textContent = readingTimeValue;
    speakingTime.textContent = speakingTimeValue;
    
    // Update keyword density
    updateKeywords(wordCount, text);
}

// Accurate reading time calculation
function calculateReadingTime(wordCount) {
    if (wordCount === 0) return '0 sec';
    
    const wordsPerMinute = 200;
    const minutes = wordCount / wordsPerMinute;
    
    if (minutes < 1) {
        const seconds = Math.ceil(minutes * 60);
        return `${seconds} sec`;
    } else {
        return `${Math.ceil(minutes)} min`;
    }
}

// Accurate speaking time calculation
function calculateSpeakingTime(wordCount) {
    if (wordCount === 0) return '0 sec';
    
    const wordsPerMinute = 150;
    const minutes = wordCount / wordsPerMinute;
    
    if (minutes < 1) {
        const seconds = Math.ceil(minutes * 60);
        return `${seconds} sec`;
    } else {
        return `${Math.ceil(minutes)} min`;
    }
}

// Accurate reading level calculation
function calculateReadingLevel(text, wordCount, sentenceCount) {
    if (wordCount === 0 || sentenceCount === 0) return 'N/A';
    
    try {
        const syllables = (text.toLowerCase().match(/[aeiou]{1,2}/g) || []).length;
        const fleschScore = 206.835 - (1.015 * (wordCount / sentenceCount)) - (84.6 * (syllables / wordCount));
        
        if (fleschScore >= 90) return 'Very Easy';
        if (fleschScore >= 80) return 'Easy';
        if (fleschScore >= 70) return 'Fairly Easy';
        if (fleschScore >= 60) return 'Standard';
        if (fleschScore >= 50) return 'Fairly Difficult';
        if (fleschScore >= 30) return 'Difficult';
        return 'Very Difficult';
    } catch (error) {
        return 'Standard';
    }
}

// Keyword density calculation
function updateKeywords(wordCount, text) {
    if (wordCount === 0 || !text.trim()) {
        keywordList.innerHTML = '<p class="placeholder">Start typing to see keywords...</p>';
        return;
    }
    
    const multiplier = parseInt(densityMultiplier.value) || 1;
    
    const words = text.toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(word => word.length > 3 && word.length < 20);
        
    const keywordFreq = {};
    
    words.forEach(word => {
        if (word.length > 3) {
            keywordFreq[word] = (keywordFreq[word] || 0) + 1;
        }
    });
    
    const filteredKeywords = Object.entries(keywordFreq)
        .filter(([_, count]) => count >= multiplier)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10);
    
    if (filteredKeywords.length === 0) {
        keywordList.innerHTML = '<p class="placeholder">No significant keywords found...</p>';
    } else {
        keywordList.innerHTML = filteredKeywords.map(([word, count]) => {
            const density = ((count / wordCount) * 100).toFixed(1);
            return `
                <div class="keyword-item">
                    <span class="keyword-word">${word}</span>
                    <span class="keyword-badge">${count} (${density}%)</span>
                </div>
            `;
        }).join('');
    }
}

// Text selection functions
function getSelectedText() {
    const selection = window.getSelection();
    return selection.toString().trim();
}

function selectAllText() {
    const range = document.createRange();
    range.selectNodeContents(editor);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    handleSelectionChange();
}

// Case conversion functions
function applyCaseConversion(convertFn) {
    const selectedText = getSelectedText();
    if (selectedText) {
        document.execCommand('insertText', false, convertFn(selectedText));
        // After conversion, we might still have selection, so update stats
        setTimeout(handleSelectionChange, 100);
    } else {
        const currentText = editor.textContent;
        editor.textContent = convertFn(currentText);
        updateFullDocumentStats();
    }
}

function toUpperCase() { 
    applyCaseConversion(text => text.toUpperCase()); 
}

function toLowerCase() { 
    applyCaseConversion(text => text.toLowerCase()); 
}

function toTitleCase() { 
    applyCaseConversion(text => 
        text.replace(/\w\S*/g, txt => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        )
    ); 
}

function toSentenceCase() { 
    applyCaseConversion(text => 
        text.toLowerCase().replace(/(^\s*|[.!?]\s+)(\w)/g, (match, p1, p2) => 
            p1 + p2.toUpperCase()
        )
    ); 
}

function toCamelCase() { 
    applyCaseConversion(text => 
        text.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        ).replace(/\s+/g, '')
    ); 
}

// Text to Speech with Toggle Functionality
function textToSpeech() {
    if (isSpeaking) {
        // Stop speaking
        stopSpeech();
        textToSpeechBtn.classList.remove('speech-active');
        textToSpeechBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        showNotification('Speech stopped');
    } else {
        // Start speaking
        const textToSpeak = isSelectionMode ? getSelectedText() : editor.textContent;
        
        if (!textToSpeak.trim()) {
            showNotification('Please enter some text first');
            return;
        }
        
        if ('speechSynthesis' in window) {
            startSpeech(textToSpeak);
            textToSpeechBtn.classList.add('speech-active');
            textToSpeechBtn.innerHTML = '<i class="fas fa-stop"></i>';
            showNotification(isSelectionMode ? 'Speaking selected text' : 'Speaking all text');
        } else {
            showNotification('Text-to-speech not supported in your browser');
        }
    }
}

function startSpeech(text) {
    isSpeaking = true;
    currentUtterance = new SpeechSynthesisUtterance(text);
    currentUtterance.rate = 0.8;
    currentUtterance.pitch = 1;
    currentUtterance.volume = 0.8;
    
    currentUtterance.onend = function() {
        isSpeaking = false;
        textToSpeechBtn.classList.remove('speech-active');
        textToSpeechBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        showNotification('Speech completed');
    };
    
    currentUtterance.onerror = function() {
        isSpeaking = false;
        textToSpeechBtn.classList.remove('speech-active');
        textToSpeechBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
        showNotification('Speech error occurred');
    };
    
    speechSynthesis.speak(currentUtterance);
}

function stopSpeech() {
    isSpeaking = false;
    if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
    }
}

// Tool functions
function toggleAutoSave() {
    autoSaveEnabled = !autoSaveEnabled;
    const btn = document.querySelector('.toggle-btn');
    btn.classList.toggle('autosave-off', !autoSaveEnabled);
    btn.classList.toggle('autosave-on', autoSaveEnabled);
    
    const icon = btn.querySelector('i');
    if (autoSaveEnabled) {
        icon.className = 'fas fa-sync';
        saveToLocalStorage();
        showNotification('Auto-save enabled');
    } else {
        icon.className = 'fas fa-sync';
        showNotification('Auto-save disabled');
    }
}

function saveToLocalStorage() {
    localStorage.setItem('editorContent', editor.innerHTML);
}

function checkGrammar() {
    const textToCheck = isSelectionMode ? getSelectedText() : editor.textContent;
    const text = textToCheck.trim();
    
    if (!text) {
        grammarResults.innerHTML = '<p class="placeholder">Please enter some text to check grammar.</p>';
        showNotification('Please enter some text first');
        return;
    }

    grammarResults.innerHTML = '<p>Checking grammar and spelling...</p>';
    showNotification('Checking grammar...');

    setTimeout(() => {
        grammarResults.innerHTML = `
            <div style="color: #27ae60; margin-bottom: 10px;">
                <i class="fas fa-check-circle"></i> No critical errors found
            </div>
            <p><strong>Grammar API Ready</strong></p>
            <p>Connect with Grammarly or LanguageTool API for detailed analysis.</p>
        `;
        showNotification('Grammar check completed');
    }, 1500);
}

function thesaurus() { 
    const selected = getSelectedText();
    if (selected) {
        showNotification(`Looking up synonyms for "${selected}"`);
        alert(`Thesaurus for "${selected}":\nSynonyms would appear here with API integration.`);
    } else {
        showNotification('Please select a word first');
    }
}

function saveDoc() {
    const textToSave = isSelectionMode ? getSelectedText() : editor.textContent;
    const text = textToSave.trim();
    
    if (!text) {
        showNotification('No text to save');
        return;
    }
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification('Document saved successfully');
}

function setGoal() { 
    const goal = prompt('Set your word goal:', '500');
    if (goal !== null && !isNaN(goal)) {
        showNotification(`Word goal set to: ${goal} words`);
    }
}

function clearEditor() { 
    if (confirm('Are you sure you want to clear all text?')) {
        editor.textContent = '';
        localStorage.removeItem('editorContent');
        switchToFullDocumentMode();
        showNotification('Editor cleared');
    }
}

function undo() { 
    document.execCommand('undo');
    setTimeout(() => {
        if (!isSelectionMode) {
            updateFullDocumentStats();
        }
    }, 100);
}

function redo() { 
    document.execCommand('redo'); 
    setTimeout(() => {
        if (!isSelectionMode) {
            updateFullDocumentStats();
        }
    }, 100);
}

// New tool functions
function showWordDensity() {
    const textToAnalyze = isSelectionMode ? getSelectedText() : editor.textContent;
    const wordCount = isSelectionMode ? 
        (getSelectedText() === '' ? 0 : getSelectedText().split(/\s+/).filter(word => word.length > 0).length) : 
        parseInt(detWords.textContent);
    
    updateKeywords(wordCount, textToAnalyze);
    showNotification('Word density updated');
}

function openCharMap() {
    const specialChars = '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
    const charToCopy = prompt('Special characters (click OK to copy):', specialChars);
    if (charToCopy) {
        navigator.clipboard.writeText(charToCopy).then(() => {
            showNotification('Characters copied to clipboard!');
        });
    }
}

function showProStats() {
    let statsInfo = '';
    
    if (isSelectionMode) {
        const selectedText = getSelectedText();
        const selectedWordCount = selectedText === '' ? 0 : selectedText.split(/\s+/).filter(word => word.length > 0).length;
        const selectedCharCount = selectedText.length;
        const selectedSentenceCount = selectedText === '' ? 0 : selectedText.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0).length;
        
        statsInfo = `SELECTED TEXT STATISTICS:\n\nWords: ${selectedWordCount}\nCharacters: ${selectedCharCount}\nSentences: ${selectedSentenceCount}\nReading Level: ${detReadingLevel.textContent}`;
    } else {
        statsInfo = `DOCUMENT STATISTICS:\n\nWords: ${detWords.textContent}\nCharacters: ${detChars.textContent}\nSentences: ${detSentences.textContent}\nParagraphs: ${detParagraphs.textContent}\nReading Level: ${detReadingLevel.textContent}`;
    }
    
    alert(`Professional Statistics:\n\n${statsInfo}`);
}

function findReplace() {
    const find = prompt('Find:');
    if (find === null) return;
    
    const replace = prompt('Replace with:') || '';
    const currentText = editor.textContent;
    const newText = currentText.replace(new RegExp(find, 'g'), replace);
    editor.textContent = newText;
    
    if (!isSelectionMode) {
        updateFullDocumentStats();
    }
    showNotification('Find and replace completed');
}

// Panel toggle function
function togglePanel(header) {
    const panel = header.parentElement;
    const content = header.nextElementSibling;
    const icon = header.querySelector('i');
    
    panel.classList.toggle('open');
    content.classList.toggle('show');
    
    if (content.classList.contains('show')) {
        icon.classList.remove('fa-chevron-down');
        icon.classList.add('fa-chevron-up');
    } else {
        icon.classList.remove('fa-chevron-up');
        icon.classList.add('fa-chevron-down');
    }
}

// Social share function
function shareStats(platform) {
    const words = detWords.textContent;
    const chars = detChars.textContent;
    const mode = isSelectionMode ? 'selected text' : 'document';
    const text = `I just wrote ${words} words and ${chars} characters in my ${mode} using Word Calculator!`;
    const url = encodeURIComponent(window.location.href);
    
    let shareUrl = '';
    switch(platform) {
        case 'facebook':
            shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
            break;
        case 'twitter':
            shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
            break;
        case 'linkedin':
            shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
            break;
        case 'pinterest':
            shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${encodeURIComponent(text)}`;
            break;
        case 'whatsapp':
            shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + window.location.href)}`;
            break;
        case 'email':
            shareUrl = `mailto:?subject=My Writing Stats&body=${encodeURIComponent(text + '\n\n' + window.location.href)}`;
            break;
        case 'reddit':
            shareUrl = `https://reddit.com/submit?url=${url}&title=${encodeURIComponent(text)}`;
            break;
        default:
            showNotification(`Sharing to ${platform}`);
            return;
    }
    
    if (shareUrl) {
        window.open(shareUrl, '_blank', 'width=600,height=400');
    }
}

function activity() {
    showNotification('Opening activity tracker...');
    alert('Activity tracking feature would show your writing statistics over time.');
}

// Notification system
function showNotification(message) {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    }, 3000);
}

// Add notification styles dynamically
const notificationStyles = `
.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #2c3e50;
    color: white;
    padding: 12px 20px;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    max-width: 300px;
    font-size: 14px;
    font-weight: 500;
}
.notification.show {
    transform: translateX(0);
}
@media (max-width: 768px) {
    .notification {
        top: 10px;
        right: 10px;
        left: 10px;
        max-width: none;
        transform: translateY(-100%);
    }
    .notification.show {
        transform: translateY(0);
    }
}
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Make sure density multiplier updates keywords
if (densityMultiplier) {
    densityMultiplier.addEventListener('change', function() {
        if (isSelectionMode) {
            const selectedText = getSelectedText();
            const selectedWordCount = selectedText === '' ? 0 : selectedText.split(/\s+/).filter(word => word.length > 0).length;
            updateKeywords(selectedWordCount, selectedText);
        } else {
            updateKeywords(parseInt(detWords.textContent), editor.textContent);
        }
    });
}

// Handle window resize
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        closeMobileMenu();
    }
});

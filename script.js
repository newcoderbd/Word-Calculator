// Auto-highlight active nav link
document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });
});

// Elements
const editor = document.getElementById('editor');
const topStats = document.getElementById('top-stats');
const detWords = document.getElementById('det-words');
const detChars = document.getElementById('det-chars');
const detSentences = document.getElementById('det-sentences');
const detParagraphs = document.getElementById('det-paragraphs');
const detReadingLevel = document.getElementById('det-reading-level');
const readingTime = document.getElementById('reading-time');
const speakingTime = document.getElementById('speaking-time');
const keywordList = document.getElementById('keyword-list');
const densityMultiplier = document.getElementById('density-multiplier');
const grammarResults = document.getElementById('grammar-results');

// Tooltip container
let tooltip = null;

// Create tooltip
function showTooltip(e, text) {
  if (tooltip) tooltip.remove();
  tooltip = document.createElement('div');
  tooltip.className = 'tooltip';
  tooltip.textContent = text;
  document.body.appendChild(tooltip);

  const rect = e.target.getBoundingClientRect();
  tooltip.style.left = `${rect.left + rect.width / 2}px`;
  tooltip.style.top = `${rect.top - 10}px`;
}

// Remove tooltip
function hideTooltip() {
  if (tooltip) {
    tooltip.remove();
    tooltip = null;
  }
}

// Add tooltips to buttons
document.querySelectorAll('.tool-btn, .toggle-btn').forEach(btn => {
  btn.addEventListener('mouseenter', e => showTooltip(e, btn.title));
  btn.addEventListener('mouseleave', hideTooltip);
});

// Get selected text
function getSelectedText() {
  const selection = window.getSelection();
  return selection.toString().trim();
}

// Select all text
function selectAll() {
  const range = document.createRange();
  range.selectNodeContents(editor);
  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

// Update Stats
function updateStats() {
  const rawText = editor.innerText || '';
  const text = rawText.trim();

  const wordCount = text === '' ? 0 : text.split(/\s+/).filter(word => word.length > 0).length;
  const charCount = text.length;
  const sentenceCount = text.split(/[.!?]+/).filter(s => s.trim()).length || 0;
  const paragraphCount = text.split(/\n\n/).filter(p => p.trim()).length || 0;
  const readingSeconds = Math.round((wordCount / 225) * 60);
  const speakingSeconds = Math.round((wordCount / 130) * 60);

  // READING LEVEL - FIXED
  let readingLevel = 'N/A';
  if (wordCount > 0 && sentenceCount > 0) {
    const syllables = text.match(/[aeiouy]+/gi)?.length || 0;
    const flesch = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (syllables / wordCount);
    readingLevel = `Grade ${Math.max(1, Math.round(flesch / 10))}`;
  }

  const statsText = `${wordCount} words ${charCount} characters`;
  topStats.textContent = statsText;

  detWords.textContent = wordCount;
  detChars.textContent = charCount;
  detSentences.textContent = sentenceCount;
  detParagraphs.textContent = paragraphCount;
  detReadingLevel.textContent = readingLevel;
  readingTime.textContent = readingSeconds + ' sec';
  speakingTime.textContent = speakingSeconds + ' sec';

  updateKeywords(wordCount);
}

// Keyword Density
function updateKeywords(wordCount) {
  const text = editor.innerText.toLowerCase();
  const words = text.match(/\b\w+\b/g) || [];
  const freq = {};
  words.forEach(word => freq[word] = (freq[word] || 0) + 1);

  const multiplier = parseInt(densityMultiplier.value);
  const minCount = multiplier;
  const filtered = Object.entries(freq)
    .filter(([_, count]) => count >= minCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (filtered.length === 0) {
    keywordList.innerHTML = '<p class="placeholder">Start typing to see keywords...</p>';
  } else {
    keywordList.innerHTML = filtered.map(([word, count]) => {
      const density = wordCount > 0 ? Math.round((count / wordCount) * 100) : 0;
      return `
        <div class="keyword-item">
          <span class="keyword-word">${word}</span>
          <span class="keyword-badge">${count} (${density}%)</span>
        </div>
      `;
    }).join('');
  }
}

// Social Share
function shareStats(platform) {
  const wordCount = detWords.textContent;
  const charCount = detChars.textContent;
  const url = encodeURIComponent(window.location.href);
  const title = encodeURIComponent('My Word Count Results');
  const text = encodeURIComponent(`I just wrote ${wordCount} words and ${charCount} characters on Word Calculator!`);

  let shareUrl = '';
  switch (platform) {
    case 'facebook': shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`; break;
    case 'twitter': shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`; break;
    case 'linkedin': shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`; break;
    case 'pinterest': shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`; break;
    case 'whatsapp': shareUrl = `https://api.whatsapp.com/send?text=${text} ${url}`; break;
    case 'email': shareUrl = `mailto:?subject=${title}&body=${text} ${url}`; break;
    case 'reddit': shareUrl = `https://reddit.com/submit?url=${url}&title=${title}`; break;
  }
  window.open(shareUrl, '_blank', 'width=600,height=400');
}

// CASE TOOLS
function applyCaseConversion(convertFn) {
  const selected = getSelectedText();
  if (selected) {
    document.execCommand('insertText', false, convertFn(selected));
  } else {
    selectAll();
    document.execCommand('insertText', false, convertFn(editor.innerText));
  }
  updateStats();
}

function toUpperCase() { applyCaseConversion(str => str.toUpperCase()); }
function toLowerCase() { applyCaseConversion(str => str.toLowerCase()); }
function toTitleCase() { 
  applyCaseConversion(str => str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()));
}
function toSentenceCase() { 
  applyCaseConversion(str => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase().replace(/([.!?])\s*([a-z])/g, (m, p1, p2) => p1 + ' ' + p2.toUpperCase()));
}
function toCamelCase() { 
  applyCaseConversion(str => str.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase()).replace(/\s+/g, ''));
}

// Tool Functions
function toggleAutoSave() {
  const btn = document.querySelector('.autosave-off, .autosave-on');
  btn.classList.toggle('autosave-off');
  btn.classList.toggle('autosave-on');
  const icon = btn.querySelector('i');
  icon.className = btn.classList.contains('autosave-on') ? 'fas fa-sync-alt' : 'fas fa-sync';
}

function thesaurus() { alert('Thesaurus: Select a word and press Ctrl+F to find synonyms (simulated).'); }
function saveDoc() {
  const blob = new Blob([editor.innerText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'document.txt'; a.click();
}
function setGoal() { const g = prompt('Set word goal:'); if (g) alert(`Goal set to ${g} words!`); }
function clearEditor() { if (confirm('Clear all text?')) { editor.innerText = ''; updateStats(); } }
function undo() { document.execCommand('undo'); updateStats(); }
function redo() { document.execCommand('redo'); updateStats(); }

// 5 NEW TOOLS
function showWordDensity() {
  const text = editor.innerText;
  const words = text.match(/\b\w+\b/g) || [];
  const freq = {};
  words.forEach(w => freq[w] = (freq[w] || 0) + 1);
  const total = words.length;
  const density = Object.entries(freq)
    .map(([w, c]) => `${w}: ${((c/total)*100).toFixed(1)}%`)
    .join('\n');
  alert(density || 'No words found.');
}

function openCharMap() {
  const chars = '¡¢£¤¥¦§¨©ª«¬®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
  const input = prompt('Special Characters (click to copy):', chars);
  if (input) navigator.clipboard.writeText(input);
}

function showProStats() {
  const text = editor.innerText;
  const syllables = (text.match(/[aeiouy]+/gi) || []).length;
  const avgWordLen = text.length / (text.split(/\s+/).length || 1);
  alert(`Pro Stats:\nSyllables: ${syllables}\nAvg Word Length: ${avgWordLen.toFixed(1)} chars`);
}

function textToSpeech() {
  const utterance = new SpeechSynthesisUtterance(editor.innerText);
  speechSynthesis.speak(utterance);
}

function findReplace() {
  const find = prompt('Find:');
  if (!find) return;
  const replace = prompt('Replace with:') || '';
  editor.innerText = editor.innerText.split(find).join(replace);
  updateStats();
}

// GRAMMAR CHECK - API READY
function checkGrammar() {
  const text = editor.innerText.trim();
  if (!text) {
    grammarResults.innerHTML = '<p class="placeholder">Please enter some text to check.</p>';
    return;
  }

  grammarResults.innerHTML = '<p>Checking grammar...</p>';

  setTimeout(() => {
    grammarResults.innerHTML = `
      <p><strong>Ready for API!</strong></p>
      <p>Add your Grammarly or LanguageTool API key to show real-time results here.</p>
    `;
  }, 1000);
}

// Panel Toggle
function togglePanel(header) {
  const panel = header.parentElement;
  const content = header.nextElementSibling;
  const icon = header.querySelector('i');

  panel.classList.toggle('open');
  content.classList.toggle('show');

  if (panel.classList.contains('open')) {
    icon.classList.remove('fa-chevron-down');
    icon.classList.add('fa-chevron-up');
  } else {
    icon.classList.remove('fa-chevron-up');
    icon.classList.add('fa-chevron-down');
  }
}

// Init
editor.addEventListener('input', updateStats);
editor.addEventListener('paste', () => setTimeout(updateStats, 100));
window.addEventListener('load', updateStats);

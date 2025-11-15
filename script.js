// ===== Boot =====
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initEditor();
  initSelectionTracking();
  initResizeHandle();
  initPanelToggles();
  initDropdownsAnchored();
  initAuthModal();
  initShareModal();
  updateFullStats();
  autoGrowEditor(true);
  const y = document.getElementById('pf-year'); if (y) y.textContent = new Date().getFullYear();
});

// ---------- Elements ----------
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileCloseBtn = document.getElementById('mobileCloseBtn');
const mobileNav = document.getElementById('mobileNav');
const mobileOverlay = document.getElementById('mobileOverlay');

const editor = document.getElementById('editor');
const topStats = document.getElementById('top-stats');
const bottomStats = document.getElementById('bottom-stats');
const keywordList = document.getElementById('keyword-list');
const grammarResults = document.getElementById('grammar-results');
const applyAllBtn = document.getElementById('applyAllBtn');
const grammarBtn = document.getElementById('grammarBtn');
const grammarBadge = document.getElementById('grammar-badge');

const detWords = document.getElementById('det-words');
const detChars = document.getElementById('det-chars');
const detSentences = document.getElementById('det-sentences');
const detParagraphs = document.getElementById('det-paragraphs');
const detReadingLevel = document.getElementById('det-reading-level');
const readingTime = document.getElementById('reading-time');
const speakingTime = document.getElementById('speaking-time');

let autoSaveEnabled = true;
let isSelectionMode = false;
let timeoutId;
let lastPlainText = '';
let lastMatches = [];
let userResized = false;
let grammarEnabled = true; // toolbar toggle state

// Readability dial / meter
let lastFleschScore = null;

// ---------- Mobile Menu ----------
function initMobileMenu(){
  if (!mobileMenuBtn || !mobileNav) return;
  const open = () => { mobileNav.classList.add('active'); mobileOverlay.classList.add('active'); document.body.style.overflow='hidden'; };
  const close = () => { mobileNav.classList.remove('active'); mobileOverlay.classList.remove('active'); document.body.style.overflow=''; };
  mobileMenuBtn.addEventListener('click', open);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', close);
  if (mobileOverlay) mobileOverlay.addEventListener('click', close);
  document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', close));
  const openAuthBtnMobile = document.getElementById('openAuthBtnMobile');
  if (openAuthBtnMobile) openAuthBtnMobile.addEventListener('click', () => { close(); openAuth(); });
}

// ---------- Editor + persistence ----------
function initEditor(){
  const savedHTML = localStorage.getItem('editorContentHTML');
  if (savedHTML) editor.innerHTML = savedHTML;

  editor.addEventListener('input', () => {
    unwrapLtSpansPreserveCaret();
    invalidateGrammarState();
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      if (!isSelectionMode) updateFullStats();
      autoGrowEditor();
      persistEditor();
    }, 120);
  });

  editor.addEventListener('paste', (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text');
    document.execCommand('insertText', false, text);
    unwrapLtSpansPreserveCaret();
    invalidateGrammarState();
    setTimeout(() => { if (!isSelectionMode) updateFullStats(); autoGrowEditor(); persistEditor(); }, 40);
  });
}
function persistEditor(){ localStorage.setItem('editorContentHTML', editor.innerHTML); }

// ---------- Selection tracking ----------
function initSelectionTracking(){
  document.addEventListener('selectionchange', () => { clearTimeout(timeoutId); timeoutId = setTimeout(handleSelectionChange, 100); });
  document.addEventListener('mouseup', () => { clearTimeout(timeoutId); timeoutId = setTimeout(handleSelectionChange, 100); });
  document.addEventListener('keyup', (e) => { if (e.shiftKey || e.key==='Shift'){ clearTimeout(timeoutId); timeoutId = setTimeout(handleSelectionChange, 100); }});
  document.addEventListener('mousedown', (e) => {
    if (!editor.contains(e.target)) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { if (isSelectionMode){ isSelectionMode=false; updateFullStats(); } }, 100);
    }
  });
}
function handleSelectionChange(){
  const sel = window.getSelection();
  const txt = sel ? sel.toString().trim() : '';
  const inEditor = sel && (editor.contains(sel.anchorNode) || editor.contains(sel.focusNode));
  if (txt && inEditor && sel.rangeCount > 0){
    isSelectionMode = true;
    const w = txt.split(/\s+/).filter(Boolean).length;
    const c = txt.length;
    const s = txt.split(/[.!?]+/).filter(t => t.trim().length>0).length;
    topStats.textContent = `${w} words ${c} characters`;
    bottomStats.textContent = topStats.textContent;
    detWords.textContent = w; detChars.textContent = c; detSentences.textContent = s; detParagraphs.textContent = 1;
    detReadingLevel.textContent = calcReadingLevel(txt, w, s);
    readingTime.textContent = calcReadingTime(w);
    speakingTime.textContent = calcSpeakingTime(w);

    // Update readability meter for selected text
    lastFleschScore = computeFleschFromWS(txt, w, s);
    updateReadabilityGauge(lastFleschScore, w, s);

    updateKeywords(w, txt);
  }else{
    if (isSelectionMode){ isSelectionMode=false; }
    updateFullStats();
  }
}

// ---------- Stats ----------
function updateFullStats(){
  const txt = editor.textContent || '';
  const clean = txt.trim();
  const w = clean===''?0:clean.split(/\s+/).filter(Boolean).length;
  const c = txt.length;
  const s = clean===''?0:clean.split(/[.!?]+/).filter(t=>t.trim().length>0).length;
  const p = clean===''?0:txt.split('\n').filter(t=>t.trim().length>0).length;

  topStats.textContent = `${w} words ${c} characters`;
  bottomStats.textContent = topStats.textContent;

  detWords.textContent = w; detChars.textContent = c; detSentences.textContent = s; detParagraphs.textContent = p;
  detReadingLevel.textContent = calcReadingLevel(txt, w, s);
  readingTime.textContent = calcReadingTime(w);
  speakingTime.textContent = calcSpeakingTime(w);

  // Update readability meter
  lastFleschScore = computeFleschFromWS(txt, w, s);
  updateReadabilityGauge(lastFleschScore, w, s);

  updateKeywords(w, txt);
}
function formatTime(totalSeconds){
  const mins = Math.floor(totalSeconds/60);
  const secs = Math.round(totalSeconds%60);
  if (mins > 0) return `${mins} mins ${secs} sec`;
  return `${secs} sec`;
}
function calcReadingTime(words){ if(!words) return '0 sec'; const secs = Math.ceil(words / (200/60)); return formatTime(secs); }
function calcSpeakingTime(words){ if(!words) return '0 sec'; const secs = Math.ceil(words / (150/60)); return formatTime(secs); }
function gradeFromFlesch(score){
  if(score >= 90) return '5th Grade';
  if(score >= 80) return '6th Grade';
  if(score >= 70) return '7th Grade';
  if(score >= 60) return '8–9th Grade';
  if(score >= 50) return '10–12th Grade';
  if(score >= 30) return 'College';
  return 'College Graduate';
}
function calcReadingLevel(text, w, s){
  if(!w || !s) return 'N/A';
  const syl=(text.toLowerCase().match(/[aeiou]{1,2}/g)||[]).length;
  const flesch=206.835 - (1.015*(w/s)) - (84.6*(syl/w));
  return gradeFromFlesch(flesch);
}

// Compute Flesch Reading Ease for meter
function computeFleschFromWS(text, w, s){
  if (!w || !s) return null;
  const clean = (text || '').trim();
  if (!clean) return null;

  const words = clean.split(/\s+/).filter(Boolean);
  if (!words.length) return null;

  const syllables = words.reduce((sum, word) => sum + countSyllablesEN(word), 0);
  const wordsPerSentence = w / s;
  const syllPerWord = syllables / words.length;

  const score = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllPerWord;
  return Math.max(0, Math.min(100, score));
}

// UPDATED: professional bar-style readability gauge
function updateReadabilityGauge(score, w, s){
  const meterFill = document.getElementById('readabilityMeterFill');
  const scoreLabel = document.getElementById('readabilityScoreLabel');
  const bandLabel = document.getElementById('readabilityBandLabel');
  const hintEl = document.getElementById('readabilityHint');

  if (!meterFill || !scoreLabel || !bandLabel || !hintEl) return;

  if (!w || !s || score === null || isNaN(score)){
    scoreLabel.textContent = 'N/A';
    bandLabel.textContent = 'Not enough text';
    hintEl.textContent = 'Type at least one full sentence to see where your text sits on the readability scale.';
    meterFill.style.width = '0%';
    meterFill.className = 'readability-meter-fill';
    return;
  }

  const clamped = Math.max(0, Math.min(100, score));
  scoreLabel.textContent = clamped.toFixed(1);

  // Map score to band label
  const band = gradeFromFlesch(score);
  bandLabel.textContent = band;

  // Hint text based on score
  let hint = '';
  if (score >= 90){
    hint = 'Very easy to read — great for casual content and wide audiences.';
  } else if (score >= 80){
    hint = 'Easy to read — suitable for blog posts and general readers.';
  } else if (score >= 70){
    hint = 'Fairly easy — a good balance for most online content.';
  } else if (score >= 60){
    hint = 'Standard readability — ideal for academic blogs and documentation.';
  } else if (score >= 50){
    hint = 'Fairly difficult — better for specialized or expert audiences.';
  } else if (score >= 30){
    hint = 'Difficult — consider shorter sentences and simpler vocabulary.';
  } else{
    hint = 'Very difficult — heavy, academic style; simplify for general readers.';
  }
  hintEl.textContent = hint;

  // Fill width and color class
  meterFill.style.width = `${clamped}%`;
  let bandClass = 'meter-hard';
  if (score >= 60) bandClass = 'meter-easy';
  else if (score >= 30) bandClass = 'meter-medium';
  meterFill.className = `readability-meter-fill ${bandClass}`;
}

// ---------- Auto-grow ----------
function autoGrowEditor(initial=false){
  const cs = getComputedStyle(editor);
  const minH = parseInt(cs.minHeight,10) || 220;
  const maxH = parseInt(cs.maxHeight,10) || 1000;
  const current = parseInt(editor.style.height || editor.offsetHeight, 10);
  editor.style.height = 'auto';
  const desired = Math.min(maxH, Math.max(minH, editor.scrollHeight));
  const shouldGrow = desired > current;
  const shouldShrink = desired < current;

  if (shouldGrow) editor.style.height = desired + 'px';
  else if (!userResized && shouldShrink) editor.style.height = desired + 'px';
  else if (initial && !editor.style.height) editor.style.height = Math.max(minH, current) + 'px';
}

// ---------- Keywords ----------
function updateKeywords(wordCount, text){
  if (!keywordList) return;
  if (wordCount===0 || !text.trim()){
    keywordList.innerHTML = '<p class="placeholder">Start typing to see keywords...</p>'; return;
  }
  const sel = document.getElementById('density-multiplier');
  const mult = parseInt((sel && sel.value) || '1',10);

  const words = text.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/).filter(w => w.length>3 && w.length<20);
  const freq = {}; words.forEach(w => freq[w]=(freq[w]||0)+1);
  const out = Object.entries(freq).filter(([,c])=>c>=mult).sort((a,b)=>b[1]-a[1]).slice(0,10);

  if (!out.length){ keywordList.innerHTML='<p class="placeholder">No significant keywords found...</p>'; return; }
  keywordList.innerHTML = out.map(([w,c])=>{
    const d=((c/wordCount)*100).toFixed(1);
    return `<div class="keyword-item"><span class="keyword-word">${w}</span><span class="keyword-badge">${c} (${d}%)</span></div>`;
  }).join('');
}

// ---------- CASE ----------
function getSelected(){ const s=window.getSelection(); return s?s.toString().trim():''; }
function applyCase(fn){ const sel=getSelected(); if(sel){ document.execCommand('insertText',false,fn(sel)); setTimeout(handleSelectionChange,80);} else { editor.textContent=fn(editor.textContent); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); } }
function toUpperCase(){applyCase(t=>t.toUpperCase())}
function toLowerCase(){applyCase(t=>t.toLowerCase())}
function toTitleCase(){applyCase(t=>t.replace(/\w\S*/g,s=>s[0].toUpperCase()+s.slice(1).toLowerCase()))}
function toSentenceCase(){applyCase(t=>t.toLowerCase().replace(/(^\s*|[.!?]\s+)(\w)/g,(_,p1,p2)=>p1+p2.toUpperCase()))}
function toCamelCase(){applyCase(t=>t.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g,(w,i)=>i===0?w.toLowerCase():w.toUpperCase()).replace(/\s+/g,''))}
function invertCase(){applyCase(t=>t.split('').map(ch=>ch===ch.toUpperCase()?ch.toLowerCase():ch.toUpperCase()).join(''))}

// ---------- CLEANUP ----------
function trimSpaces(){ editor.innerText=(editor.innerText||'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim(); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); }
function removeLineBreaks(){ editor.innerText=(editor.innerText||'').replace(/\n+/g,' '); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); }
function normalizeQuotes(){
  const map = {'“':'"', '”':'"', '‘':"'", '’':"'", '«':'"', '»':'"', '„':'"', '‹':"'", '›':"'"};
  editor.textContent = (editor.textContent||'').replace(/[“”‘’«»„‹›]/g, ch => map[ch] || ch);
  invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor();
}
function stripHTML(){
  const html = editor.innerHTML;
  const text = html.replace(/<[^>]+>/g,'');
  editor.textContent = text;
  invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify('HTML tags removed');
}
function stripDiacritics(){
  const text = editor.textContent || '';
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  editor.textContent = normalized;
  invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify('Diacritics removed');
}

// ---------- Find / Replace ----------
function findReplace(){ const f=prompt('Find:'); if(f===null) return; const r=prompt('Replace with:')||''; editor.textContent=(editor.textContent||'').replace(new RegExp(f,'g'),r); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify('Find and replace completed'); }

// ---------- Readability & analysis ----------
function countSyllablesEN(word){
  word = word.toLowerCase();
  if (!word) return 0;
  if(word.length<=3) return 1;
  const vowels = 'aeiouy';
  let count = 0, prevVowel=false;
  for (let i=0;i<word.length;i++){
    const isVowel = vowels.includes(word[i]);
    if (isVowel && !prevVowel) count++;
    prevVowel = isVowel;
  }
  if (word.endsWith('e')) count--;
  return Math.max(1, count);
}
function tokenSentences(t){ return (t.trim().match(/[^.!?]+[.!?]+/g) || (t.trim()? [t.trim()] : [])).map(s=>s.trim()); }
function calcAllReadability(){
  const text = editor.textContent || '';
  const sentences = tokenSentences(text);
  const words = text.trim().split(/\s+/).filter(Boolean);
  if (!words.length || !sentences.length){ alert('Not enough text to calculate.'); return; }

  const syllables = words.reduce((a,w)=>a+countSyllablesEN(w),0);
  const wordsPerSentence = words.length / sentences.length;
  const syllPerWord = syllables / words.length;

  const fleschReadingEase = 206.835 - 1.015*wordsPerSentence - 84.6*syllPerWord;
  const fleschKincaidGrade = 0.39*wordsPerSentence + 11.8*syllPerWord - 15.59;

  const complexWords = words.filter(w => countSyllablesEN(w) >= 3).length;
  const gunningFog = 0.4 * (wordsPerSentence + (100 * complexWords / words.length));

  const polysyllables = words.filter(w => countSyllablesEN(w) >= 3).length;
  const smog = sentences.length >= 3 ? (1.0430 * Math.sqrt(polysyllables * (30 / sentences.length)) + 3.1291) : NaN;

  alert(
    `Readability Metrics:\n\n`+
    `Flesch Reading Ease: ${fleschReadingEase.toFixed(1)}\n`+
    `Flesch–Kincaid Grade: ${fleschKincaidGrade.toFixed(1)}\n`+
    `Gunning Fog: ${gunningFog.toFixed(1)}\n`+
    `SMOG (approx): ${isNaN(smog)?'N/A':smog.toFixed(1)}`
  );
}
function showLexicalDiversity(){
  const text = editor.textContent || '';
  const words = text.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
  if (!words.length){ alert('No words.'); return; }
  const unique = new Set(words);
  const ttr = (unique.size / words.length) * 100;
  alert(`Lexical diversity (TTR): ${ttr.toFixed(1)}% (${unique.size} unique of ${words.length})`);
}
function showNgrams(n=2){
  const text = editor.textContent || '';
  const words = text.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
  if (words.length < n){ alert('Not enough words.'); return; }
  const freq={};
  for(let i=0;i<=words.length-n;i++){
    const gram = words.slice(i,i+n).join(' ');
    freq[gram]=(freq[gram]||0)+1;
  }
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,20).map(([g,c])=>`${g} — ${c}`).join('\n');
  alert(`${n}-gram frequency (top 20):\n\n${top}`);
}

// ---------- Thesaurus (Datamuse) ----------
function openThesaurus(){
  document.getElementById('thOverlay').style.display='block';
  document.getElementById('thModal').style.display='block';
  const sel = getSelected();
  const input = document.getElementById('thInput');
  input.value = sel || '';
  if (sel) lookupThesaurus();
}
function closeThesaurus(){
  document.getElementById('thOverlay').style.display='none';
  document.getElementById('thModal').style.display='none';
}
async function lookupThesaurus(){
  const word = (document.getElementById('thInput').value || '').trim();
  const out = document.getElementById('thResults');
  if (!word){ out.innerHTML='<p>Type a word to search.</p>'; return; }
  out.innerHTML='<p>Searching…</p>';
  try{
    const res = await fetch(`https://api.datamuse.com/words?rel_syn=${encodeURIComponent(word)}&max=20`);
    const data = await res.json();
    if (!data.length){ out.innerHTML='<p>No synonyms found.</p>'; return; }
    out.innerHTML = data.map(d=>`<button class="btn" style="margin:4px" onclick="insertSynonym('${d.word.replace(/'/g,"\\'")}')">${d.word}</button>`).join('');
  }catch(e){
    out.innerHTML='<p>Unable to reach thesaurus service.</p>';
  }
}
function insertSynonym(w){
  document.execCommand('insertText', false, w);
  closeThesaurus();
  updateFullStats(); autoGrowEditor(); persistEditor();
}

// ---------- Export & Print ----------
function saveDoc(){
  const text=(isSelectionMode?getSelected():editor.textContent).trim();
  if(!text) return notify('No text to save');
  const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='document.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  notify('Document saved');
}
function exportToMD(){
  const text=(isSelectionMode?getSelected():editor.textContent).trim();
  const md=text.replace(/\n{3,}/g,'\n\n');
  const blob=new Blob([md],{type:'text/markdown'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='document.md'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  notify('Markdown exported');
}
function printDocument(){
  // Print preview; dropdown menus hidden by CSS @media print
  window.print();
}
async function generateStatsPDF(){
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit:'pt', format:'a4' });

  const siteName = 'WordCalculator.net';
  const siteUrl = 'https://wordcalculator.net';

  doc.setFont('helvetica','bold'); doc.setFontSize(16); doc.text(siteName, 40, 40);
  doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.text(siteUrl, 40, 56);

  doc.setFont('helvetica','bold'); doc.setFontSize(14); doc.text('Word Statistics', 40, 90);
  doc.setFont('helvetica','normal'); doc.setFontSize(12);

  const stats = [
    `Words: ${detWords.textContent}`,
    `Characters: ${detChars.textContent}`,
    `Sentences: ${detSentences.textContent}`,
    `Paragraphs: ${detParagraphs.textContent}`,
    `Reading Level: ${detReadingLevel.textContent}`,
    `Reading Time: ${readingTime.textContent}`,
    `Speaking Time: ${speakingTime.textContent}`,
  ];
  let y = 112; stats.forEach(s => { doc.text(s, 40, y); y += 18; });

  doc.setFont('helvetica','bold'); doc.text('Content (excerpt):', 40, y + 12);
  doc.setFont('helvetica','normal');

  const fullText = (isSelectionMode ? getSelected() : editor.textContent) || '';
  const excerpt = fullText.length > 3000 ? fullText.slice(0, 3000) + ' …' : fullText;
  const lines = doc.splitTextToSize(excerpt, 515);
  doc.text(lines, 40, y + 36);

  const blob = doc.output('blob');
  return new File([blob], 'wordcalculator_stats.pdf', { type: 'application/pdf' });
}
async function generateStatsPDF_UI(){
  const file = await generateStatsPDF();
  const url = URL.createObjectURL(file);
  const a = document.createElement('a'); a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  notify('PDF downloaded');
}

// ---------- Share stats (panel icons + share modal) ----------
function shareStats(platform){
  const words = detWords.textContent || '0';
  const chars = detChars.textContent || '0';
  const baseText = `I just analyzed ${words} words (${chars} characters) with WordCalculator.net`;
  const urlRaw = 'https://wordcalculator.net';
  const url = encodeURIComponent(urlRaw);
  const text = encodeURIComponent(baseText);

  let shareUrl = '';
  switch(platform){
    case 'facebook':
      shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
      break;
    case 'x':
      shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      break;
    case 'linkedin':
      shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      break;
    case 'whatsapp':
      shareUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
      break;
    case 'telegram':
      shareUrl = `https://t.me/share/url?url=${url}&text=${text}`;
      break;
    case 'reddit':
      shareUrl = `https://www.reddit.com/submit?url=${url}&title=${text}`;
      break;
    case 'pinterest':
      shareUrl = `https://pinterest.com/pin/create/button/?url=${url}&description=${text}`;
      break;
    case 'instagram':
      shareUrl = `https://www.instagram.com/`;
      notify('Instagram does not support direct link sharing via URL. Paste the link manually.');
      break;
    case 'tumblr':
      shareUrl = `https://www.tumblr.com/widgets/share/tool?canonicalUrl=${url}&caption=${text}`;
      break;
    case 'weibo':
      shareUrl = `https://service.weibo.com/share/share.php?url=${url}&title=${text}`;
      break;
    case 'vk':
      shareUrl = `https://vk.com/share.php?url=${url}&title=${text}`;
      break;
    case 'discord':
      shareUrl = `https://discord.com/app`;
      notify('Paste the link into a Discord channel manually.');
      break;
    case 'github':
      shareUrl = `https://github.com/`;
      notify('Paste the link into your GitHub issue or README manually.');
      break;
    case 'medium':
      shareUrl = `https://medium.com/`;
      notify('Paste the link into your Medium story manually.');
      break;
    case 'youtube':
      shareUrl = `https://www.youtube.com/`;
      notify('Paste the link into your description or comment manually.');
      break;
    case 'tiktok':
      shareUrl = `https://www.tiktok.com/`;
      notify('Paste the link into your TikTok bio or caption manually.');
      break;
    case 'line':
      shareUrl = `https://social-plugins.line.me/lineit/share?url=${url}&text=${text}`;
      break;
    case 'snapchat':
      shareUrl = `https://www.snapchat.com/`;
      notify('Paste the link directly into Snapchat.');
      break;
    case 'pocket':
      shareUrl = `https://getpocket.com/save?url=${url}&title=${text}`;
      break;
    case 'email':
      shareUrl = `mailto:?subject=${encodeURIComponent('Word count from WordCalculator.net')}&body=${text}%0A%0A${urlRaw}`;
      break;
    default:
      notify('Sharing is not configured for this platform yet.');
      return;
  }
  if (platform === 'email'){
    window.location.href = shareUrl;
  } else {
    window.open(shareUrl, '_blank', 'width=800,height=600');
  }
}

// ---------- Share Modal open/close ----------
function initShareModal(){
  const overlay = document.getElementById('shareOverlay');
  const modal = document.getElementById('shareModal');
  if (!overlay || !modal) return;

  overlay.addEventListener('click', closeShareModal);
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') closeShareModal();
  });
}
function openShareModal(){
  const overlay = document.getElementById('shareOverlay');
  const modal = document.getElementById('shareModal');
  if (!overlay || !modal) return;
  overlay.style.display='block';
  modal.style.display='block';
  document.body.style.overflow='hidden';
}
function closeShareModal(){
  const overlay = document.getElementById('shareOverlay');
  const modal = document.getElementById('shareModal');
  if (!overlay || !modal) return;
  overlay.style.display='none';
  modal.style.display='none';
  document.body.style.overflow='';
}

// ---------- Time tool (More) ----------
function insertDateTime(){
  const now = new Date();
  const str = now.toLocaleString();
  document.execCommand('insertText', false, ` ${str} `);
  persistEditor();
}

// ---------- More tools ----------
function removeDuplicates(){
  const mode = prompt('Remove duplicates by: lines (L) or words (W)?', 'L');
  if (!mode) return;
  const text = editor.textContent || '';
  if (mode.toLowerCase()==='w'){
    const words = text.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/).filter(Boolean);
    const seen = new Set(); const unique = [];
    for(const w of words){ if(!seen.has(w)){ seen.add(w); unique.push(w); } }
    editor.textContent = unique.join(' ');
  }else{
    const lines = text.split('\n');
    const seen = new Set(); const unique = [];
    for(const ln of lines){ if(!seen.has(ln)){ seen.add(ln); unique.push(ln); } }
    editor.textContent = unique.join('\n');
  }
  invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify('Duplicates removed');
}
function sortLines(asc=true){
  const lines = (editor.textContent || '').split('\n');
  lines.sort((a,b)=> asc ? a.localeCompare(b) : b.localeCompare(a));
  editor.textContent = lines.join('\n');
  invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify('Lines sorted');
}
function shuffleLines(){
  const lines = (editor.textContent || '').split('\n');
  for(let i=lines.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [lines[i],lines[j]]=[lines[j],lines[i]]; }
  editor.textContent = lines.join('\n');
  invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify('Lines shuffled');
}
function hardWrapPrompt(){
  const n = parseInt(prompt('Wrap at how many characters per line?','80')||'80',10);
  if (!n || n<10) return;
  const text = (editor.textContent || '').split('\n').map(line=>{
    const out=[]; let i=0;
    while(i<line.length){ out.push(line.slice(i,i+n)); i+=n; }
    return out.join('\n');
  }).join('\n');
  editor.textContent = text;
  invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify(`Wrapped at ${n} chars`);
}
function copyWordList(){
  const txt = (isSelectionMode?getSelected():editor.textContent)||'';
  const words = txt.toLowerCase().replace(/[^\w\s]/g,' ').split(/\s+/).filter(w=>w.length>2);
  const freq = {}; words.forEach(w=>freq[w]=(freq[w]||0)+1);
  const list = Object.entries(freq).sort((a,b)=>b[1]-a[1]).map(([w,c])=>`${w},${c}`).join('\n');
  navigator.clipboard.writeText(list).then(()=>notify('Word list copied (CSV)'));
}

// ---------- Grammar (LanguageTool) ----------
function invalidateGrammarState(){
  lastMatches = [];
  lastPlainText = '';
  if (applyAllBtn) applyAllBtn.style.display = 'none';
}
function escapeHtml(s){ return s.replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m])); }
function unwrapLtSpansPreserveCaret(){
  if (!editor.querySelector('.lt-error')) return;
  const sel = window.getSelection();
  let marker = null;

  if (sel && sel.rangeCount){
    const rng = sel.getRangeAt(0);
    const inEditor = editor.contains(rng.startContainer);
    if (inEditor){
      marker = document.createElement('span');
      marker.id = '__caret_marker__';
      marker.style.cssText = 'display:inline-block;width:0;height:0;overflow:hidden;';
      const collapsed = rng.cloneRange();
      collapsed.collapse(true);
      collapsed.insertNode(marker);
    }
  }

  editor.querySelectorAll('span.lt-error').forEach(span=>{
    const textNode = document.createTextNode(span.textContent);
    span.replaceWith(textNode);
  });

  if (marker){
    const range = document.createRange();
    range.setStartAfter(marker);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    marker.remove();
  }
}
function paintHighlights(plain, matches){
  let html = '';
  let idx = 0;
  matches.sort((a,b)=>a.offset-b.offset);
  for(const m of matches){
    const {offset, length, message, replacements=[]} = m;
    const before = plain.slice(idx, offset);
    const err = plain.slice(offset, offset+length);
    const tip = escapeHtml(`${message}${replacements[0]?` • Suggestion: ${replacements[0].value}`:''}`);
    html += escapeHtml(before) + `<span class="lt-error" data-tip="${tip}">${escapeHtml(err)}</span>`;
    idx = offset + length;
  }
  html += escapeHtml(plain.slice(idx));
  editor.innerHTML = html;
  autoGrowEditor();
  persistEditor();
}

// Grammar toolbar UI helpers
function updateGrammarToolbarUI(){
  if (!grammarBtn || !grammarBadge) return;
  if (grammarEnabled){
    grammarBadge.textContent = 'ON';
    grammarBadge.classList.remove('tb-badge-off');
    grammarBadge.classList.add('tb-badge-on');
    grammarBtn.classList.remove('tb-btn-off');
  } else {
    grammarBadge.textContent = 'OFF';
    grammarBadge.classList.remove('tb-badge-on');
    grammarBadge.classList.add('tb-badge-off');
    grammarBtn.classList.add('tb-btn-off');
  }
}

function clearGrammarHighlights(){
  unwrapLtSpansPreserveCaret();
  invalidateGrammarState();
  if (grammarResults){
    grammarResults.innerHTML = '<p class="placeholder">Grammar check is currently turned off from the toolbar.</p>';
  }
}

// Toolbar Grammar button click (toggle ON/OFF)
function grammarToolbarClick(){
  grammarEnabled = !grammarEnabled;
  updateGrammarToolbarUI();

  if (grammarEnabled){
    notify('Grammar check enabled');
    // Optionally run a check immediately when turning ON
    checkGrammar();
  } else {
    clearGrammarHighlights();
    notify('Grammar check disabled');
  }
}

async function checkGrammar(){
  const text=(isSelectionMode?getSelected():editor.textContent).trim();

  if (!grammarEnabled){
    if (grammarResults){
      grammarResults.innerHTML = '<p class="placeholder">Grammar check is turned off from the toolbar. Turn it ON to analyze your text.</p>';
    }
    return notify('Grammar check is turned off');
  }

  if(!text){
    if (grammarResults){
      grammarResults.innerHTML='<p class="placeholder">Please enter some text to check grammar.</p>';
    }
    return notify('Please enter some text first');
  }

  grammarResults.innerHTML='<p>Analyzing... Please wait.</p>';
  try{
    const res=await fetch('https://api.languagetool.org/v2/check',{
      method:'POST',
      headers:{'Content-Type':'application/x-www-form-urlencoded;charset=UTF-8'},
      body:new URLSearchParams({text,language:'en-US'})
    });
    const data=await res.json();
    const matches=Array.isArray(data.matches)?data.matches:[];
    lastPlainText = text;
    lastMatches = matches.filter(m=>m.replacements && m.replacements.length>0);

    const fixableCount = lastMatches.length;
    if (applyAllBtn) applyAllBtn.style.display = fixableCount > 0 ? 'inline-flex' : 'none';

    if(matches.length===0){
      grammarResults.innerHTML=`<div class="issue-card"><div class="issue-head"><div class="issue-type">Grammar</div><div class="issue-badges"><span class="badge badge-err">0 issues</span></div></div><div class="issue-body" style="color:var(--ok)"><i class="fa-solid fa-circle-check"></i> No critical issues found.</div></div>`;
      editor.textContent = text;
      invalidateGrammarState();
      persistEditor();
      return;
    }

    paintHighlights(text, matches);

    const cards = matches.slice(0,120).map((m,i)=>{
      const type = (m.rule && (m.rule.id||m.rule.issueType)) || 'Issue';
      const levelBadge = (m.rule && m.rule.issueType==='misspelling') ? 'badge-err'
                       : (m.rule && m.rule.issueType==='typographical') ? 'badge-warn'
                       : 'badge-err';
      const best = (m.replacements && m.replacements[0]) ? m.replacements[0].value : null;
      const excerpt = lastPlainText.slice(Math.max(0,m.offset-25), Math.min(lastPlainText.length,m.offset+m.length+25)).replace(/\n/g,' ');
      return `
        <div class="issue-card" data-idx="${i}">
          <div class="issue-head">
            <div class="issue-type">${escapeHtml(type)}</div>
            <div class="issue-badges">
              <span class="badge ${levelBadge}">${m.rule && m.rule.issueType ? escapeHtml(m.rule.issueType) : 'issue'}</span>
            </div>
          </div>
          <div class="issue-body">
            <strong>${escapeHtml(m.message)}</strong>
            ${best ? `<div style="margin-top:4px">Suggestion: <code>${escapeHtml(best)}</code></div>` : ''}
            <div style="margin-top:4px;color:#6b7280;font-size:12px">“… ${escapeHtml(excerpt)} …”</div>
          </div>
          <div class="issue-actions">
            ${best ? `<button class="btn btn-apply" onclick="applyOneFix(${m.offset}, ${m.length}, ${JSON.stringify(best).replace(/"/g,'&quot;')})">Apply</button>` : ''}
            <button class="btn btn-ignore" onclick="ignoreOne(${m.offset}, ${m.length})">Ignore</button>
          </div>
        </div>`;
    }).join('');

    grammarResults.innerHTML = cards || '<p class="placeholder">Issues found, but none with automatic fixes.</p>';
    notify(`${matches.length} issues highlighted`);

  }catch(e){
    console.error(e);
    grammarResults.innerHTML='<p class="placeholder">Grammar service unavailable (CORS/network). You can add a tiny backend proxy later for reliability.</p>';
    if (applyAllBtn) applyAllBtn.style.display = 'none';
    notify('Grammar service failed');
  }
}
function applyOneFix(offset, length, replacement){
  if(!lastPlainText) return;
  let t = lastPlainText;
  lastPlainText = t.slice(0, offset) + replacement + t.slice(offset+length);
  editor.textContent = lastPlainText;
  invalidateGrammarState();
  updateFullStats();
  autoGrowEditor();
  persistEditor();
  notify('Applied suggestion');
  checkGrammar();
}
function ignoreOne(offset, length){
  if(!lastPlainText || !lastMatches.length){ return; }
  lastMatches = lastMatches.filter(m => !(m.offset===offset && m.length===length));
  editor.textContent = lastPlainText;
  paintHighlights(lastPlainText, lastMatches);
  if (applyAllBtn) applyAllBtn.style.display = lastMatches.length > 0 ? 'inline-flex' : 'none';
  notify('Ignored one issue');
}
function applyAllFixes(){
  if(!lastPlainText || !lastMatches.length){ return notify('No fixes available'); }
  let txt = lastPlainText;
  const fixables = lastMatches
    .filter(m => m.replacements && m.replacements[0])
    .map(m => ({offset:m.offset, length:m.length, repl:m.replacements[0].value}))
    .sort((a,b)=>b.offset-a.offset);
  for(const f of fixables){ txt = txt.slice(0, f.offset) + f.repl + txt.slice(f.offset + f.length); }
  editor.textContent = txt;
  invalidateGrammarState();
  updateFullStats();
  autoGrowEditor();
  persistEditor();
  notify(`Applied ${fixables.length} fixes`);
}

// ---------- Undo / Redo / Clear ----------
function undoAction(){
  document.execCommand('undo');
  setTimeout(()=>{ invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); }, 60);
}
function redoAction(){
  document.execCommand('redo');
  setTimeout(()=>{ invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); }, 60);
}
function clearEditor(){
  if (!confirm('Are you sure you want to clear all text?')) return;
  editor.textContent = '';
  localStorage.removeItem('editorContentHTML');
  invalidateGrammarState();
  updateFullStats();
  autoGrowEditor();
  notify('Editor cleared');
}

// ---------- Resize handle ----------
function initResizeHandle(){
  const handle=document.getElementById('editorResizeHandle'); if(!handle) return;
  let startY=0,startH=0;
  const minH=parseInt(getComputedStyle(editor).minHeight,10)||220;
  const maxH=parseInt(getComputedStyle(editor).maxHeight,10)||1000;

  const move=(y)=>{ const dy=y-startY; let h=Math.min(maxH, Math.max(minH, startH+dy)); editor.style.height=h+'px'; userResized=true; };
  const stop=()=>{ document.removeEventListener('mousemove', onMouseMove); document.removeEventListener('mouseup', stop); document.body.style.cursor=''; };
  const onMouseMove=(e)=>move(e.clientY);

  handle.addEventListener('mousedown', (e)=>{ e.preventDefault(); startY=e.clientY; startH=editor.getBoundingClientRect().height; document.addEventListener('mousemove', onMouseMove); document.addEventListener('mouseup', stop); document.body.style.cursor='ns-resize'; });
  handle.addEventListener('touchstart', (e)=>{ const t=e.touches[0]; startY=t.clientY; startH=editor.getBoundingClientRect().height;
    const tmv=(ev)=>{ move(ev.touches[0].clientY); };
    const tend=()=>{ document.removeEventListener('touchmove', tmv); document.removeEventListener('touchend', tend); };
    document.addEventListener('touchmove', tmv,{passive:false}); document.addEventListener('touchend', tend);
  });
}

// ---------- Panels ----------
function initPanelToggles(){
  document.querySelectorAll('.panel').forEach((panel,idx)=>{
    const toggleBtn=panel.querySelector('.panel-toggle');
    const content=panel.querySelector('.panel-content');
    const icon=toggleBtn && toggleBtn.querySelector('i');
    const key='panel:'+ (panel.getAttribute('data-panel') || idx);
    const saved=localStorage.getItem(key);
    if(saved==='closed'){ content.style.display='none'; if(icon){ icon.classList.remove('fa-chevron-up'); icon.classList.add('fa-chevron-down'); } }
    if(toggleBtn) toggleBtn.addEventListener('click', ()=>{
      const open= content.style.display !== 'none';
      content.style.display = open ? 'none' : 'block';
      if(icon){ icon.classList.toggle('fa-chevron-up', !open); icon.classList.toggle('fa-chevron-down', open); }
      localStorage.setItem(key, open ? 'closed' : 'open');
    });
  });
}

// ---------- Dropdowns: single-open, anchored ----------
function initDropdownsAnchored(){
  const openMenus = [];

  function closeAll(exceptMenu=null){
    for (const entry of openMenus) {
      if (exceptMenu && entry.menu === exceptMenu) continue;
      entry.menu.style.display='none';
      entry.btn.setAttribute('aria-expanded','false');
      if (entry.detach) entry.detach();
    }
    if (exceptMenu){
      const keep = openMenus.filter(e => e.menu === exceptMenu);
      openMenus.length = 0;
      keep.forEach(k => openMenus.push(k));
    } else {
      openMenus.length = 0;
    }
  }

  document.addEventListener('click', (e)=>{
    const clickedInside = openMenus.some(({btn,menu}) => btn.contains(e.target) || menu.contains(e.target));
    if (!clickedInside) closeAll();
  });
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') closeAll(); });

  document.querySelectorAll('.tb-dropdown').forEach((dd)=>{
    const btn = dd.querySelector('.tb-dd-btn');
    const menu = dd.querySelector('.tb-menu');
    if(!btn || !menu) return;

    let isOpen = false;
    let onScroll=null, onResize=null;

    const place = () => {
      const b = btn.getBoundingClientRect();
      const mw = menu.offsetWidth || 260;
      const mh = menu.offsetHeight || 260;
      let left = b.left + window.scrollX + (b.width/2) - (mw/2);
      left = Math.max(window.scrollX + 8, Math.min(left, window.scrollX + window.innerWidth - mw - 8));
      const spaceAbove = b.top;
      const top = (spaceAbove > mh + 12)
        ? (b.top + window.scrollY - mh - 10)
        : (b.bottom + window.scrollY + 10);
      menu.style.left = `${Math.round(left)}px`;
      menu.style.top  = `${Math.round(top)}px`;
      menu.style.position='absolute';
    };

    const detach = () => {
      if (onScroll) window.removeEventListener('scroll', onScroll);
      if (onResize) window.removeEventListener('resize', onResize);
      onScroll = onResize = null;
    };

    const open = () => {
      if (isOpen) return;
      closeAll(menu);
      isOpen = true;
      document.body.appendChild(menu);
      menu.style.display='block';
      btn.setAttribute('aria-expanded','true');
      place();

      onScroll = () => { if (isOpen) place(); };
      onResize = () => { if (isOpen) place(); };
      window.addEventListener('scroll', onScroll, {passive:true});
      window.addEventListener('resize', onResize);

      openMenus.push({btn, menu, detach});
    };

    const close = () => {
      if (!isOpen) return;
      isOpen = false;
      menu.style.display='none';
      btn.setAttribute('aria-expanded','false');
      detach();
      const idx = openMenus.findIndex(e => e.menu === menu);
      if (idx >= 0) openMenus.splice(idx,1);
    };

    btn.addEventListener('click', (e)=>{ e.stopPropagation(); isOpen?close():open(); });
    btn.addEventListener('keydown', (e)=>{ if (['Enter',' '].includes(e.key)) { e.preventDefault(); isOpen?close():open(); }});
  });
}

// ---------- TTS ----------
let isSpeaking=false,currentUtterance=null;
const speakIcon = document.getElementById('speakIcon');
function textToSpeech(){
  const content = isSelectionMode? getSelected() : editor.textContent;
  if(!content.trim()) return notify('Please enter some text first');
  if(isSpeaking){ stopSpeech(); return; }
  if(!('speechSynthesis' in window)) return notify('Text-to-speech not supported in your browser');
  isSpeaking=true; if (speakIcon) speakIcon.className = 'fas fa-stop';
  currentUtterance=new SpeechSynthesisUtterance(content); currentUtterance.rate=0.9; currentUtterance.pitch=1; currentUtterance.volume=0.9;
  currentUtterance.onend=()=>{ isSpeaking=false; if (speakIcon) speakIcon.className='fas fa-volume-up'; notify('Speech completed'); };
  currentUtterance.onerror=()=>{ isSpeaking=false; if (speakIcon) speakIcon.className='fas fa-volume-up'; notify('Speech error'); };
  speechSynthesis.speak(currentUtterance); notify(isSelectionMode?'Speaking selected text':'Speaking all text');
}
function stopSpeech(){ isSpeaking=false; if (speakIcon) speakIcon.className='fas fa-volume-up'; if(speechSynthesis.speaking) speechSynthesis.cancel(); }

// ---------- Auth Modal ----------
function initAuthModal(){
  const openBtn = document.getElementById('openAuthBtn');
  const overlay = document.getElementById('authOverlay');
  const modal = document.getElementById('authModal');
  const closeBtn = document.getElementById('authCloseBtn');

  const open = ()=>{ overlay.style.display='block'; modal.style.display='block'; document.body.style.overflow='hidden'; };
  const close = ()=>{ overlay.style.display='none'; modal.style.display='none'; document.body.style.overflow=''; };

  if (openBtn) openBtn.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (overlay) overlay.addEventListener('click', close);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') close(); });

  document.querySelectorAll('.auth-tab').forEach(tab=>{
    tab.addEventListener('click', ()=>{
      document.querySelectorAll('.auth-tab').forEach(t=>t.classList.remove('active'));
      document.querySelectorAll('.auth-pane').forEach(p=>p.classList.remove('active'));
      tab.classList.add('active');
      const pane = document.querySelector(tab.getAttribute('data-target'));
      if (pane) pane.classList.add('active');
    });
  });
}
function openAuth(){ document.getElementById('authOverlay').style.display='block'; document.getElementById('authModal').style.display='block'; document.body.style.overflow='hidden'; }
function fakeLogin(e){ e.preventDefault(); notify('Logged in (demo only)'); document.getElementById('authOverlay').click(); return false; }
function fakeRegister(e){ e.preventDefault(); notify('Account created (demo only)'); document.getElementById('authOverlay').click(); return false; }

// ---------- Helpers ----------
function notify(msg){
  const old=document.querySelector('.notification'); if(old) old.remove();
  const n=document.createElement('div'); n.className='notification'; n.textContent=msg; document.body.appendChild(n);
  setTimeout(()=>n.classList.add('show'),30); setTimeout(()=>{ n.classList.remove('show'); setTimeout(()=>n.remove(),300); },3000);
}

// Initialize grammar UI state on load
updateGrammarToolbarUI();

// ---------- Boot ----------
document.addEventListener('DOMContentLoaded', () => {
  initMobileMenu();
  initEditor();
  initSelectionTracking();
  initResizeHandle();
  initPanelToggles();
  initToolbarDropdowns();   // click-to-toggle & click-outside-close
  updateFullStats();
  updateMoreCount();
  autoGrowEditor(true);
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
const applyAllBtn = document.getElementById('applyAllBtn'); // hidden by default

const detWords = document.getElementById('det-words');
const detChars = document.getElementById('det-chars');
const detSentences = document.getElementById('det-sentences');
const detParagraphs = document.getElementById('det-paragraphs');
const detReadingLevel = document.getElementById('det-reading-level');
const readingTime = document.getElementById('reading-time');
const speakingTime = document.getElementById('speaking-time');

let autoSaveEnabled = false;
let isSelectionMode = false;
let timeoutId;

// grammar state
let lastPlainText = '';
let lastMatches = [];

// auto-grow state
let userResized = false;

// Safety: ensure hidden at load
if (applyAllBtn) applyAllBtn.style.display = 'none';

// ---------- Mobile Menu ----------
function initMobileMenu(){
  if (!mobileMenuBtn || !mobileNav) return;
  const open = () => { mobileNav.classList.add('active'); mobileOverlay.classList.add('active'); document.body.style.overflow='hidden'; };
  const close = () => { mobileNav.classList.remove('active'); mobileOverlay.classList.remove('active'); document.body.style.overflow=''; };
  mobileMenuBtn.addEventListener('click', open);
  if (mobileCloseBtn) mobileCloseBtn.addEventListener('click', close);
  if (mobileOverlay) mobileOverlay.addEventListener('click', close);
  document.querySelectorAll('.mobile-link').forEach(l => l.addEventListener('click', close));

  document.querySelectorAll('.mobile-dropdown > .mobile-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const d = link.parentElement;
      d.classList.toggle('active');
      const icon = link.querySelector('i');
      if (icon){
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
      }
    });
  });
}

// ---------- Editor ----------
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
      if (autoSaveEnabled) notify('Saved');
    }, 150);
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

function persistEditor(){
  localStorage.setItem('editorContentHTML', editor.innerHTML);
}

// ---------- Selection Tracking ----------
function initSelectionTracking(){
  document.addEventListener('selectionchange', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(handleSelectionChange, 120);
  });
  document.addEventListener('mouseup', () => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(handleSelectionChange, 120);
  });
  document.addEventListener('keyup', (e) => {
    if (e.shiftKey || e.key === 'Shift') {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionChange, 120);
    }
  });
  document.addEventListener('mousedown', (e) => {
    if (!editor.contains(e.target)) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => { if (isSelectionMode) { isSelectionMode=false; updateFullStats(); } }, 120);
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

    detWords.textContent = w; detChars.textContent = c; detSentences.textContent = s;
    detParagraphs.textContent = 1;
    detReadingLevel.textContent = calcReadingLevel(txt, w, s);
    readingTime.textContent = calcReadingTime(w);
    speakingTime.textContent = calcSpeakingTime(w);
    updateKeywords(w, txt);
  }else{
    if (isSelectionMode){ isSelectionMode=false; }
    updateFullStats();
  }
}

// ---------- Stats calc ----------
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

  updateKeywords(w, txt);
}

function formatTime(totalSeconds){
  const mins = Math.floor(totalSeconds/60);
  const secs = Math.round(totalSeconds%60);
  if (mins > 0) return `${mins} min${mins>1?'s':''} ${secs} sec`;
  return `${secs} sec`;
}
function calcReadingTime(words){
  if(!words) return '0 sec';
  const secs = Math.ceil(words / (200/60));
  return formatTime(secs);
}
function calcSpeakingTime(words){
  if(!words) return '0 sec';
  const secs = Math.ceil(words / (150/60));
  return formatTime(secs);
}
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

  if (shouldGrow) {
    editor.style.height = desired + 'px';
  } else if (!userResized && shouldShrink) {
    editor.style.height = desired + 'px';
  } else if (initial && !editor.style.height) {
    editor.style.height = Math.max(minH, current) + 'px';
  }
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

// ---------- Tools ----------
function getSelected(){ const s=window.getSelection(); return s?s.toString().trim():''; }
function applyCase(fn){ const sel=getSelected(); if(sel){ document.execCommand('insertText',false,fn(sel)); setTimeout(handleSelectionChange,80);} else { editor.textContent=fn(editor.textContent); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); } }
function toUpperCase(){applyCase(t=>t.toUpperCase())}
function toLowerCase(){applyCase(t=>t.toLowerCase())}
function toTitleCase(){applyCase(t=>t.replace(/\w\S*/g,s=>s[0].toUpperCase()+s.slice(1).toLowerCase()))}
function toSentenceCase(){applyCase(t=>t.toLowerCase().replace(/(^\s*|[.!?]\s+)(\w)/g,(_,p1,p2)=>p1+p2.toUpperCase()))}
function toCamelCase(){applyCase(t=>t.toLowerCase().replace(/(?:^\w|[A-Z]|\b\w)/g,(w,i)=>i===0?w.toLowerCase():w.toUpperCase()).replace(/\s+/g,''))}
function invertCase(){applyCase(t=>t.split('').map(ch=>ch===ch.toUpperCase()?ch.toLowerCase():ch.toUpperCase()).join(''))}

function saveDoc(){
  const text=(isSelectionMode?getSelected():editor.textContent).trim();
  if(!text) return notify('No text to save');
  const blob=new Blob([text],{type:'text/plain'}); const url=URL.createObjectURL(blob);
  const a=document.createElement('a'); a.href=url; a.download='document.txt'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  notify('Document saved');
}
function setGoal(){ const g=prompt('Set your word goal:','500'); if(g!==null && !isNaN(g)) notify(`Word goal set to: ${g} words`); }
function clearEditor(){ if(!confirm('Clear all text?')) return; editor.innerHTML=''; localStorage.removeItem('editorContentHTML'); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); notify('Editor cleared'); }
function undo(){ document.execCommand('undo'); setTimeout(()=>{ if(!isSelectionMode) updateFullStats(); autoGrowEditor(); persistEditor(); },60); }
function redo(){ document.execCommand('redo'); setTimeout(()=>{ if(!isSelectionMode) updateFullStats(); autoGrowEditor(); persistEditor(); },60); }
function findReplace(){ const f=prompt('Find:'); if(f===null) return; const r=prompt('Replace with:')||''; editor.textContent=(editor.textContent||'').replace(new RegExp(f,'g'),r); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); notify('Find and replace completed'); }
function printDocument(){
  const win=window.open('','_blank'); const safe=(editor.textContent||'').replace(/[&<>]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
  win.document.write(`<html><head><title>Print</title></head><body style="font:14px/1.7 Roboto,Arial;padding:24px;"><div style="font-weight:900;font-size:18px;margin-bottom:12px;">WordCalculator.net</div><pre>${safe}</pre></body></html>`); win.document.close(); win.focus(); win.print();
}
function exportToMD(){ const t=(isSelectionMode?getSelected():editor.textContent).trim(); if(!t) return notify('No text to export'); const blob=new Blob([t],{type:'text/markdown'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='document.md'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url); notify('Exported as Markdown'); }
function clearFormatting(){ editor.innerText=editor.innerText; invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); }
function trimSpaces(){ editor.innerText=(editor.innerText||'').replace(/[ \t]+/g,' ').replace(/\n{3,}/g,'\n\n').trim(); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); }
function removeLineBreaks(){ editor.innerText=(editor.innerText||'').replace(/\n+/g,' '); invalidateGrammarState(); updateFullStats(); autoGrowEditor(); persistEditor(); }
function activity(){ alert('Activity tracking would show your writing statistics over time.'); }
function thesaurus(){ const s=getSelected(); if(!s) return notify('Please select a word first'); alert(`Thesaurus for "${s}" (plug external API later).`); }

// Auto-save (UI badge only; persistence always on)
function toggleAutoSave(){
  autoSaveEnabled=!autoSaveEnabled;
  const badge=document.getElementById('autosave-badge');
  if(badge){ badge.textContent=autoSaveEnabled?'ON':'OFF'; badge.classList.toggle('tb-badge-on',autoSaveEnabled); badge.classList.toggle('tb-badge-off',!autoSaveEnabled); }
  if(autoSaveEnabled) persistEditor();
  notify(autoSaveEnabled?'Auto-save enabled':'Auto-save disabled');
}

// ---------- Grammar (LanguageTool public endpoint) ----------
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

async function checkGrammar(){
  const text=(isSelectionMode?getSelected():editor.textContent).trim();
  if(!text){ grammarResults.innerHTML='<p class="placeholder">Please enter some text to check grammar.</p>'; return notify('Please enter some text first'); }

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

  for(const f of fixables){
    txt = txt.slice(0, f.offset) + f.repl + txt.slice(f.offset + f.length);
  }
  editor.textContent = txt;
  invalidateGrammarState();
  updateFullStats();
  autoGrowEditor();
  persistEditor();
  notify(`Applied ${fixables.length} fixes`);
}

// ---------- More menu count ----------
function updateMoreCount(){
  const menu=document.getElementById('moreMenu'); const count=document.getElementById('moreCount');
  if(menu && count){ const n=menu.querySelectorAll('a').length; count.textContent=`(${n})`; }
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

// ---------- Panel toggles ----------
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

// ---------- Toolbar dropdowns ----------
function initToolbarDropdowns(){
  const dropdowns = document.querySelectorAll('.tb-dropdown');
  dropdowns.forEach(dd=>{
    const btn = dd.querySelector('.tb-dd-btn');
    const menu = dd.querySelector('.tb-menu');
    if(!btn || !menu) return;

    btn.addEventListener('click', (e)=>{
      e.stopPropagation();
      const isOpen = menu.style.display === 'block';
      closeAllToolbarMenus();
      menu.style.display = isOpen ? 'none' : 'block';
      btn.setAttribute('aria-expanded', (!isOpen).toString());
    });

    menu.addEventListener('click', (e)=> e.stopPropagation());
  });

  document.addEventListener('click', closeAllToolbarMenus);
  document.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeAllToolbarMenus(); });
}
function closeAllToolbarMenus(){
  document.querySelectorAll('.tb-dropdown .tb-menu').forEach(m=> m.style.display='none');
  document.querySelectorAll('.tb-dropdown .tb-dd-btn').forEach(b=> b.setAttribute('aria-expanded','false'));
}

// ---------- Share & PDF ----------
function shareFromPanel(platform){
  generateStatsPDF().then(file=>{
    if (navigator.canShare && navigator.canShare({ files:[file] })) {
      navigator.share({
        title: 'Word stats — WordCalculator.net',
        text: 'Sharing my word statistics as a PDF from WordCalculator.net',
        files: [file]
      }).catch(()=>downloadPDF(file));
    } else {
      downloadPDF(file);
      openShareUrl(platform);
    }
  });
}

function openShareUrl(platform){
  const words=detWords.textContent, chars=detChars.textContent;
  const mode=isSelectionMode?'selected text':'document';
  const text=`I just wrote ${words} words and ${chars} characters in my ${mode} using WordCalculator.net!`;
  const url=encodeURIComponent(location.href);
  let share='';
  if(platform==='facebook') share=`https://www.facebook.com/sharer/sharer.php?u=${url}`;
  else if(platform==='twitter') share=`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
  else if(platform==='linkedin') share=`https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  else if(platform==='whatsapp') share=`https://api.whatsapp.com/send?text=${encodeURIComponent(text+' '+location.href)}`;
  else if(platform==='telegram') share=`https://t.me/share/url?url=${url}&text=${encodeURIComponent(text)}`;
  else if(platform==='reddit') share=`https://www.reddit.com/submit?url=${url}&title=${encodeURIComponent(text)}`;
  else if(platform==='pinterest') share=`https://pinterest.com/pin/create/button/?url=${url}&description=${encodeURIComponent(text)}`;
  else if(['instagram','tiktok','youtube','snapchat','wechat','line'].includes(platform)){
    notify('PDF downloaded. Please upload it in the selected app.');
    return;
  }
  if(share) window.open(share,'_blank','width=700,height=600');
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

function downloadPDF(file){
  const url = URL.createObjectURL(file);
  const a = document.createElement('a'); a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  URL.revokeObjectURL(url);
  notify('PDF downloaded');
}

async function copyShareLink(){
  try{ await navigator.clipboard.writeText(location.href); notify('Link copied'); }catch{ notify('Copy failed'); }
}

// Modal controls
function openSocialModal(){
  document.getElementById('socialModalOverlay').style.display='block';
  document.getElementById('socialModal').style.display='block';
}
function closeSocialModal(){
  document.getElementById('socialModalOverlay').style.display='none';
  document.getElementById('socialModal').style.display='none';
}
function shareFromModal(platform){
  closeSocialModal();
  generateStatsPDF().then(file=>{
    if (navigator.canShare && navigator.canShare({ files:[file] })) {
      navigator.share({
        title: 'Word stats — WordCalculator.net',
        text: 'Sharing my word statistics as a PDF from WordCalculator.net',
        files: [file]
      }).catch(()=>downloadPDF(file));
    } else {
      downloadPDF(file);
      openShareUrl(platform);
    }
  });
}

// ---------- Share (legacy quick) ----------
function shareStats(platform){
  const words=detWords.textContent, chars=detChars.textContent;
  const mode=isSelectionMode?'selected text':'document';
  const text=`I just wrote ${words} words and ${chars} characters in my ${mode} using WordCalculator.net!`;
  const url=encodeURIComponent(location.href);
  let share='';
  if(platform==='facebook') share=`https://www.facebook.com/sharer/sharer.php?u=${url}`;
  else if(platform==='twitter') share=`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${url}`;
  else if(platform==='linkedin') share=`https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  if(share) window.open(share,'_blank','width=600,height=400');
}

// ---------- TTS ----------
let isSpeaking=false,currentUtterance=null;
function textToSpeech(){
  const content = isSelectionMode? getSelected() : editor.textContent;
  if(!content.trim()) return notify('Please enter some text first');
  if(isSpeaking){ stopSpeech(); return; }
  if(!('speechSynthesis' in window)) return notify('Text-to-speech not supported in your browser');
  isSpeaking=true;
  currentUtterance=new SpeechSynthesisUtterance(content); currentUtterance.rate=0.9; currentUtterance.pitch=1; currentUtterance.volume=0.9;
  currentUtterance.onend=()=>{ isSpeaking=false; notify('Speech completed'); };
  currentUtterance.onerror=()=>{ isSpeaking=false; notify('Speech error'); };
  speechSynthesis.speak(currentUtterance); notify(isSelectionMode?'Speaking selected text':'Speaking all text');
}
function stopSpeech(){ isSpeaking=false; if(speechSynthesis.speaking) speechSynthesis.cancel(); }

// ---------- Notify ----------
function notify(msg){
  const old=document.querySelector('.notification'); if(old) old.remove();
  const n=document.createElement('div'); n.className='notification'; n.textContent=msg; document.body.appendChild(n);
  setTimeout(()=>n.classList.add('show'),30); setTimeout(()=>{ n.classList.remove('show'); setTimeout(()=>n.remove(),300); },3000);
}

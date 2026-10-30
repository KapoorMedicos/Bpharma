'use strict';
const main = document.querySelector('main');
const roman = ['','I','II','III','IV','V','VI','VII','VIII'];
let library;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const icons = {
 arrow:'M5 12h14m-5-5 5 5-5 5',chevron:'m9 5 7 7-7 7',book:'M4 4h6a3 3 0 0 1 2 2 3 3 0 0 1 2-2h6v15h-6a3 3 0 0 0-2 2 3 3 0 0 0-2-2H4zM12 6v15',
 search:'m21 21-5-5M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0',file:'M14 2H5v20h14V7zM14 2v6h5M8 13h8M8 17h6',
 play:'m9 7 8 5-8 5zM22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',download:'M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5',
 external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7',info:'M12 11v6M12 7h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',
 flask:'M9 3h6m-5 0v7L4 20a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1l-6-10V3M7 15h10',leaf:'M20 3C5 1 0 17 8 20c8 3 14-8 12-17ZM5 21 16 8',heart:'M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-4 4 0 9 8 16 8-7 12-12 8-16Z',scales:'M12 3v18M6 21h12M3 7h18M6 7 2 14h8zM18 7l-4 7h8z'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${icons[name] || icons.book}"/></svg>`;
const external = 'target="_blank" rel="noopener noreferrer"';
const provider = id => library.providers[id].name;
const resourcesFor = subject => library.resources.filter(r => r.subject === subject.id);
const subjectsFor = sem => library.subjects.filter(s => s.semester === Number(sem));
const size = bytes => bytes >= 1048576 ? `${(bytes/1048576).toFixed(1)} MB` : `${Math.ceil(bytes/1024)} KB`;
const details = r => [r.pages ? `${r.pages} pages` : '', 'PDF', size(r.bytes)].filter(Boolean).join(' · ');
const badge = id => `<span class="source-badge ${id === 'carewell' ? 'carewell' : ''}">${esc(provider(id))}</span>`;
const videoLink = (subject, label = 'Lecture playlist') => subject.playlist ? `<a class="video-link" href="${esc(subject.playlist)}" ${external}>${icon('play')}${label} ${icon('external')}</a>` : '';
const crumb = (items = []) => `<div class="breadcrumbs"><a href="#">All semesters</a>${items.map(([label,href]) => `${icon('chevron')}${href ? `<a href="${href}">${esc(label)}</a>` : `<span aria-current="page">${esc(label)}</span>`}`).join('')}</div>`;
const searchBox = placeholder => `<label class="search-box">${icon('search')}<input id="search" type="search" aria-label="${placeholder}" placeholder="${placeholder}" autocomplete="off"></label>`;
const empty = (heading, text) => `<div class="empty-state">${icon('book')}<h2>${heading}</h2><p>${text}</p></div>`;
function home() {
 const populated = new Set(library.resources.filter(r=>r.subject).map(r=>r.subject));
 const count = library.resources.filter(r=>r.kind!=='syllabus').length;
 const paperCount=(library.pyqs||[]).length;
 main.innerHTML = `<div class="container"><section class="hero"><div><div class="eyebrow">A little more organized. A lot easier to study.</div><h1>Your pharmacy notes,<span>all in one place.</span></h1><p class="hero-copy">Find your semester, choose a subject, and get straight to the unit you need. Notes, past papers, and lecture playlists, together.</p><div class="hero-meta"><span>${icon('book')}8 semesters</span><span>${icon('file')}${count} study PDFs</span><span>${icon('play')}Lecture playlists</span></div></div><a class="current-card" href="#semester/5"><div class="card-kicker"><i></i>Ready to study</div><h2>Semester V</h2><p>${populated.size} subjects · ${count} notes & revision PDFs</p><div class="current-link">Explore the collection ${icon('arrow')}</div></a></section>${paperCount?`<a class="pyq-callout" href="#pyq"><span class="subject-icon">${icon('file')}</span><span><strong>Previous year question papers</strong><small>PTU · Semesters II & V · ${paperCount} papers · ${Math.min(...library.pyqs.map(r=>r.year))}–${Math.max(...library.pyqs.map(r=>r.year))}</small></span><span class="pyq-callout-action">Browse PYQs ${icon('arrow')}</span></a>`:''}<section class="semester-section"><div class="section-heading"><h2>Choose your semester</h2><p>Bachelor of Pharmacy · 4 years</p></div><div class="semester-grid">${Array.from({length:8},(_,i)=>{
 const n=i+1; const notes=library.resources.filter(r=>r.semester===n && r.kind!=='syllabus'); const papers=(library.pyqs||[]).filter(r=>r.semester===n);
 return `<a class="semester-card ${notes.length||papers.length?'featured':''}" href="#semester/${n}"><div class="semester-top"><span class="semester-number">${roman[n]}</span><span class="status ${notes.length||papers.length?'available':''}">${notes.length?'<span class="live-dot"></span>Notes ready':papers.length?'<span class="live-dot"></span>PYQs ready':'Not added yet'}</span></div><h3>Semester ${roman[n]}</h3><p class="semester-details">Year ${Math.ceil(n/2)} · ${subjectsFor(n).length} subjects</p><div class="semester-bottom"><span>${notes.length?`${notes.length} study PDFs`:papers.length?`${papers.length} past papers`:'Browse subjects'}</span>${icon('arrow')}</div></a>`;
 }).join('')}</div><div class="collection-note">${icon('info')}<p>This library is growing. Semester V notes and past papers for Semesters II and V are available now. More collections can be added as the library grows.</p></div></section></div>`;
 document.title = 'BPharma Library · Kapoor Medicos';
}
function semester(n) {
 const subjects=subjectsFor(n); if(!subjects.length) return notFound();
 const available = library.resources.filter(r=>r.semester===n && r.kind!=='syllabus').length;
 const papers=(library.pyqs||[]).filter(r=>r.semester===n);
 const syllabus=library.resources.find(r=>r.kind==='syllabus');
 main.innerHTML=`<div class="container">${crumb([[`Semester ${roman[n]}`]])}<section class="page-intro"><div><div class="eyebrow">Year ${Math.ceil(n/2)} · BPharma</div><h1>Semester ${roman[n]}</h1><p class="page-description">${available ? `${subjects.length} subjects. ${available} study PDFs. Pick a subject to explore its units.` : 'The subjects are here. Notes will appear as they are added to the library.'}</p></div>${papers.length?`<a class="button" href="#pyq/${n}">${icon('file')}${papers.length} previous year papers</a>`:''}${syllabus?`<a class="button secondary" href="#read/${syllabus.id}">${icon('file')}BPharma syllabus</a>`:''}</section><div class="toolbar">${searchBox('Search subjects or topics…')}<span class="result-count" aria-live="polite"></span></div><div class="subject-grid" id="results"></div></div>`;
 const results=document.querySelector('#results');
 function show() {
  const term=document.querySelector('#search').value.trim().toLowerCase();
  const filtered=subjects.filter(s=>[s.name,...s.units.flatMap(u=>[u.title,u.topics])].join(' ').toLowerCase().includes(term));
  results.innerHTML=filtered.map((s,i)=>{
   const rs=resourcesFor(s); const sources=[...new Set(rs.map(r=>r.provider))];
   return `<a class="subject-card ${rs.length?'':'is-empty'}" href="#semester/${n}/${s.id}"><div class="subject-card-top"><span class="subject-icon ${s.color||''}">${icon(s.icon)}</span><span class="subject-code">${esc(s.code || `SEM ${roman[n]}`)}</span></div><h2>${esc(s.name)}</h2><p class="subject-description">${esc(s.description || 'Unit notes and study resources will be added here.')}</p><div class="source-badges">${sources.map(badge).join('') || '<span class="source-badge">Notes not added yet</span>'}</div><div class="subject-card-bottom"><span>${rs.length?`${s.units.length} units <span class="subject-count">· ${rs.length} PDFs</span>`:'View subject'}</span>${icon('arrow')}</div></a>`;
  }).join('') || empty('No matching subjects', 'Try another subject name or topic.');
  document.querySelector('.result-count').textContent=`${filtered.length} of ${subjects.length} subjects`;
 }
 document.querySelector('#search').addEventListener('input',show);show();
 document.title=`Semester ${roman[n]} · BPharma Library`;
}
function subjectView(s) {
 const subjectPapers=(library.pyqs||[]).filter(r=>r.syllabusSubject===s.id);
 const rs=resourcesFor(s); const sources=[...new Set(rs.map(r=>r.provider))]; let selected='all';
 main.innerHTML=`<div class="container">${crumb([[`Semester ${roman[s.semester]}`,`#semester/${s.semester}`],[s.name]])}<section class="page-intro"><div><div class="eyebrow">${esc(s.code || 'BPharma subject')}</div><div class="subject-title-row"><h1>${esc(s.name)}</h1></div><p class="page-description">${esc(s.description || 'Your study collection for this subject.')}</p><div class="subject-intro-meta"><span>${s.units.length} units</span><span class="meta-separator">·</span><span>${rs.length} PDFs</span>${sources.map(id=>`<span class="meta-separator">·</span>${badge(id)}`).join('')}</div></div>${subjectPapers.length?`<a class="button secondary" href="#pyq/${s.semester}/${s.id}">${icon('file')}Past papers (${subjectPapers.length})</a>`:''}</section>${rs.length?`<div class="toolbar">${searchBox('Search units or topics…')}<div class="source-filters" aria-label="Filter notes by source">${['all',...sources].map(id=>`<button class="filter-button" type="button" data-source="${id}" aria-pressed="${id==='all'}">${id==='all'?'All notes':esc(provider(id))}</button>`).join('')}</div></div>`:''}<div id="unit-results"></div>${s.source?`<div class="source-note">${icon('info')}<p>Imperfect Pharmacy videos open the subject’s lecture playlist. Carewell notes are from the app and have no video links. <a href="${esc(s.source)}" ${external}>Visit the original subject page ↗</a></p></div>`:''}</div>`;
 function row(r) {return `<div class="resource-row"><div><div class="resource-title">${esc(provider(r.provider))}</div><div class="resource-details">${details(r)}</div></div><div class="resource-actions">${r.provider==='imperfect'?videoLink(s):''}<a class="button small" href="#read/${r.id}" aria-label="Read Unit ${r.unit} from ${esc(provider(r.provider))}">${icon('file')}Read PDF</a></div></div>`;}
 function show() {
  const term=(document.querySelector('#search')?.value || '').trim().toLowerCase();
  const filtered=rs.filter(r=>selected==='all'||r.provider===selected);
  const units=s.units.filter(u=>[u.title,u.topics,`unit ${u.number}`].join(' ').toLowerCase().includes(term) && filtered.some(r=>r.unit===u.number && r.kind==='unit'));
  const revision=filtered.filter(r=>r.kind==='revision' && `${r.title} revision ${provider(r.provider)}`.toLowerCase().includes(term));
  document.querySelector('#unit-results').innerHTML=rs.length ? `<div class="units-stack">${units.map(u=>`<article class="unit-card"><div class="unit-heading"><span class="unit-index">${String(u.number).padStart(2,'0')}</span><div><div class="unit-eyebrow">Unit ${u.number}</div><h2>${esc(u.title)}</h2><p class="unit-topics">${esc(u.topics)}</p></div></div><div class="unit-resources">${filtered.filter(r=>r.unit===u.number && r.kind==='unit').map(row).join('')}</div></article>`).join('')}</div>${revision.length?`<section class="revision-section"><div class="section-label">${icon('file')}<h2>Revision corner</h2></div><div class="revision-grid">${revision.map(r=>`<article class="revision-card"><div>${badge(r.provider)}<h3>${esc(r.title)}</h3><p>${details(r)}</p></div><a class="button small" href="#read/${r.id}">Read PDF ${icon('arrow')}</a></article>`).join('')}</div></section>`:''}${!units.length&&!revision.length?empty('No matching notes','Try another topic or source.'):''}` : empty('Notes are on their way', 'This subject is ready for future notes. Explore Semester V for the current collection.');
 }
 document.querySelector('#search')?.addEventListener('input',show);
 document.querySelectorAll('[data-source]').forEach(b=>b.addEventListener('click',()=>{
  selected=b.dataset.source;document.querySelectorAll('[data-source]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));show();
 }));show(); document.title=`${s.name} · BPharma Library`;
}
function pyqView(initialSemester='all',initialSubject='',initialSession='all',initialQuery='') {
 const papers=library.pyqs||[], rules=PyqFilters;
 let filters=rules.normalize(papers,{semester:initialSemester,subject:initialSubject,session:initialSession,query:initialQuery});
 const semesters=[...new Set(papers.map(r=>r.semester))].sort((a,b)=>a-b);
 main.innerHTML=`<div class="container">${crumb([['Previous year papers']])}<section class="page-intro"><div><div class="eyebrow">Exam preparation · PTU</div><h1>Previous year question papers</h1><p class="page-description" id="pyq-description"></p></div><span class="pill">PTU · BPharma</span></section><section class="pyq-filter-panel" aria-label="Question paper filters"><div class="pyq-filter-controls"><label class="semester-filter">Semester<select id="pyq-semester" aria-label="Filter papers by semester"><option value="all">All semesters</option>${semesters.map(n=>`<option value="${n}">Semester ${roman[n]}</option>`).join('')}</select></label><label class="semester-filter">Exam session<select id="pyq-session" aria-label="Filter papers by exam session"></select></label>${searchBox('Search paper codes or keywords…')}</div><div><p class="filter-label">Subject</p><div class="pyq-subjects" id="pyq-subjects" role="group" aria-label="Filter papers by subject"></div></div></section><p class="result-count" id="paper-count" aria-live="polite"></p><div class="pyq-grid" id="paper-results"></div><div class="source-note" id="pyq-source-note"></div></div>`;
 const semesterSelect=document.querySelector('#pyq-semester'),sessionSelect=document.querySelector('#pyq-session'),search=document.querySelector('#search');
 semesterSelect.value=filters.semester;search.value=filters.query;
 function remember(){
  let path='#pyq';
  if(filters.semester!=='all'||filters.subject!=='all')path+=`/${filters.semester}`;
  if(filters.subject!=='all')path+=`/${encodeURIComponent(filters.subject)}`;
  const query=new URLSearchParams();if(filters.session!=='all')query.set('session',filters.session);if(filters.query)query.set('q',filters.query);
  history.replaceState(null,'',path+(query.size?'?'+query.toString():''));
 }
 function renderSessions(){
  sessionSelect.innerHTML='<option value="all">All sessions</option>'+rules.sessions(papers,filters.semester).map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('');sessionSelect.value=filters.session;
 }
 function renderSubjects(){
  const available=rules.subjects(papers,filters.semester,filters.session);
  document.querySelector('#pyq-subjects').innerHTML=[{key:'all',name:'All subjects'},...available].map(x=>`<button type="button" class="filter-button subject-filter-button" data-subject="${esc(x.key)}" aria-pressed="${x.key===filters.subject}">${esc(x.name)}${x.count?`<span class="filter-count" aria-hidden="true">${x.count}</span>`:''}</button>`).join('');
  document.querySelectorAll('[data-subject]').forEach(b=>b.addEventListener('click',()=>{
   filters.subject=b.dataset.subject;
   document.querySelectorAll('[data-subject]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));remember();show();
  }));
 }
 function show(){
  const results=rules.filter(papers,filters).sort((a,b)=>b.year-a.year||rules.sessions(papers).indexOf(a.session)-rules.sessions(papers).indexOf(b.session)||a.paperSubject.localeCompare(b.paperSubject));
  const collection=papers.filter(r=>filters.semester==='all'||String(r.semester)===filters.semester);
  const years=[...new Set(collection.map(r=>r.year))].sort((a,b)=>a-b);
  const scope=filters.semester==='all'?`Semesters ${semesters.map(n=>roman[n]).join(' and ')}`:`Semester ${roman[Number(filters.semester)]}`;
  document.querySelector('#pyq-description').textContent=`${collection.length} papers from ${scope} · ${years[0]===years.at(-1)?years[0]:years[0]+'–'+years.at(-1)}. Choose an exam session and subject to find your paper.`;
  const sourceRecords=collection.filter(r=>filters.session==='all'||r.session===filters.session);
  const sources=new Map();sourceRecords.forEach(r=>{sources.set(r.collectionSource,r.provider);});
  const sourceNote=filters.semester==='5'?'Semester V includes only your five current syllabus subjects. Subject buttons update for the selected exam session.':filters.semester==='2'?'Semester II retains the subjects listed in its original source collection.':'Choose a semester and session to see the subjects available for that collection.';
  document.querySelector('#pyq-source-note').innerHTML=`${icon('info')}<p>${sourceNote} ${[...sources].map(([url,id])=>`<a href="${esc(url)}" ${external}>${esc(provider(id))} collection ↗</a>`).join(' · ')}</p>`;
  document.querySelector('#paper-count').textContent=`${results.length} ${results.length===1?'paper':'papers'} shown · ${collection.length} in this ${filters.semester==='all'?'library':'semester'}`;
  document.querySelector('#paper-results').innerHTML=results.map(r=>`<article class="pyq-card"><div class="subject-card-top"><span class="source-badge">${esc(r.university)} · Semester ${roman[r.semester]}</span><span class="subject-code">${esc(r.code)}</span></div><h2>${esc(r.paperSubject)}</h2><p class="pyq-session">${esc(r.session)}</p><p class="resource-details">${r.path?details(r):'PDF not downloaded · source link available'} · via ${esc(provider(r.provider))}</p><div class="pyq-actions">${r.path?`<a class="button small" href="#read/${r.id}">${icon('file')}Read paper</a><a class="button secondary small" href="${encodeURI(r.path)}" download="${esc(r.code)} - ${esc(r.paperSubject)} - ${esc(r.session)}.pdf">${icon('download')}Download</a><a class="pyq-source" href="${esc(r.source)}" ${external}>Source ↗</a>`:`<a class="button secondary small" href="${esc(r.source)}" ${external}>View source ${icon('external')}</a><span class="pyq-unavailable">Source temporarily unavailable</span>`}</div></article>`).join('')||empty('No matching papers','Try another subject, exam session, or search term.');
 }
 semesterSelect.addEventListener('change',()=>{filters=rules.normalize(papers,{...filters,semester:semesterSelect.value});renderSessions();renderSubjects();remember();show();});
 sessionSelect.addEventListener('change',()=>{filters=rules.normalize(papers,{...filters,session:sessionSelect.value});renderSubjects();remember();show();});
 search.addEventListener('input',()=>{filters.query=search.value;remember();show();});
 renderSessions();renderSubjects();show();document.title='Previous year papers · BPharma Library';
}
function read(id) {
 const r=[...library.resources,...(library.pyqs||[])].find(r=>r.id===id);if(!r||!r.path)return notFound();
 const s=library.subjects.find(s=>s.id===r.subject);
 const title=r.kind==='unit'?`Unit ${r.unit} · ${s.name}`:r.title;
 const siblings=s?resourcesFor(s).filter(x=>x.kind===r.kind && (r.kind!=='unit'||x.unit===r.unit)):[r];
 const url=encodeURI(r.path);
 const filename=r.kind==='unit'?`Unit ${r.unit} - ${s.name}.pdf`:r.kind==='pyq'?`${r.code} - ${r.paperSubject} - ${r.session}.pdf`:`${r.title}.pdf`;
 main.innerHTML=`<div class="container reader-shell">${crumb(r.kind==='pyq'?[['Previous year papers',`#pyq/${r.semester}`],[r.title]]:s?[[`Semester ${roman[s.semester]}`,`#semester/${s.semester}`],[s.name,`#semester/${s.semester}/${s.id}`],[r.kind==='unit'?`Unit ${r.unit}`:r.title]]:[[r.title]])}<div class="reader-top"><div><h1>${esc(title)}</h1><p>${r.kind==='pyq'?`PTU · Semester ${roman[r.semester]} · Paper ${esc(r.code)} · `:''}${r.provider?`${esc(provider(r.provider))} · `:''}${details(r)}</p></div><div class="reader-actions"><a class="button secondary" href="${url}" ${external}>${icon('external')}Open in new tab</a><a class="button" href="${url}" download="${esc(filename)}">${icon('download')}Download PDF</a></div></div>${r.dateNote?`<p class="reader-date-note">${esc(r.dateNote)}</p>`:''}<div class="reader-bar"><div class="reader-tabs" aria-label="Available note sources">${siblings.map(x=>`<a class="reader-tab" href="#read/${x.id}" ${x===r?'aria-current="page"':''}>${x.provider?esc(provider(x.provider)):'Syllabus'}</a>`).join('')}</div>${s&&r.provider==='imperfect'?videoLink(s):r.kind==='pyq'?`<a class="video-link" href="${esc(r.source)}" ${external}>${icon('external')}Original paper</a>`:''}</div><a class="button reader-fullscreen" href="${url}" ${external} aria-label="Open in fullscreen (opens PDF in a new tab)">${icon('external')}Open in fullscreen</a><div class="reader-frame"><iframe src="viewer.html?file=${encodeURIComponent(r.path)}" title="${esc(title)}${r.provider?' — '+esc(provider(r.provider)):''}"></iframe></div><div class="reader-help"><span>Having trouble with the preview? <a href="${url}" ${external}>Open the PDF directly ↗</a></span><span>${r.provider==='carewell'?'Carewell app notes · captured pages':r.provider==='imperfect'?'Original Imperfect Pharmacy PDF':r.kind==='pyq'?`PTU question paper · via ${esc(provider(r.provider))}`:'BPharma course syllabus'}</span></div></div>`;
 document.title=`${title} · BPharma Library`;
}
function notFound(){main.innerHTML=`<div class="container">${empty('This page isn’t in the library','<a class="button" href="#">Browse semesters</a>')}</div>`;document.title='Page not found · BPharma Library';}
function route() {
 const [path,query='']=location.hash.slice(1).split('?');
 const parts=path.split('/').map(x=>{try{return decodeURIComponent(x);}catch{return '';}}),params=new URLSearchParams(query);
 if(parts[0]==='main'){main.focus();return;}
 if(!parts[0])home();
 else if(parts[0]==='semester' && /^[1-8]$/.test(parts[1])){
  if(parts[2]) {const s=library.subjects.find(x=>x.id===parts[2]&&x.semester===Number(parts[1]));s?subjectView(s):notFound();}
  else semester(Number(parts[1]));
 }else if(parts[0]==='pyq')pyqView(parts[1],parts[2],params.get('session')||'all',params.get('q')||'');
 else if(parts[0]==='read')read(parts[1]);else notFound();
 window.scrollTo(0,0);main.focus({preventScroll:true});
}
fetch('data/library.json',{cache:'no-cache'}).then(response=>{if(!response.ok)throw new Error('Catalog unavailable');return response.json();}).then(data=>{library=data;route();window.addEventListener('hashchange',route);}).catch(()=>{
 main.innerHTML=`<div class="container">${empty('The library couldn’t load','Please refresh the page. For a local preview, serve the docs folder with a web server instead of opening index.html directly.')}</div>`;
});

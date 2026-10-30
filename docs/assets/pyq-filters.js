/* Shared catalog filtering rules for the static question-paper library. */
(function (root) {
 'use strict';
 const months={January:1,February:2,March:3,April:4,May:5,June:6,July:7,August:8,September:9,October:10,November:11,December:12};
 const inSemester=(r,semester)=>semester==='all'||String(r.semester)===String(semester);
 const subjectKey=r=>r.syllabusSubject||`s${r.semester}-${r.paperSubject.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`;
 function sessions(papers,semester='all'){
  const dates=new Map();
  papers.filter(r=>inSemester(r,semester)).forEach(r=>dates.set(r.session,r.year*100+(months[r.month]||0)));
  return [...dates.keys()].sort((a,b)=>dates.get(b)-dates.get(a)||a.localeCompare(b));
 }
 function subjects(papers,semester='all',session='all'){
  const values=new Map();
  papers.filter(r=>inSemester(r,semester)&&(session==='all'||r.session===session)).forEach(r=>{
   const key=subjectKey(r);if(!values.has(key))values.set(key,{key,name:r.paperSubject,count:0});values.get(key).count++;
  });
  return [...values.values()].sort((a,b)=>a.name.localeCompare(b.name));
 }
 function normalize(papers,filters={}){
  let semester=String(filters.semester||'all'),session=filters.session||'all',subject=filters.subject||'all';
  if(semester!=='all'&&!papers.some(r=>String(r.semester)===semester))semester='all';
  if(session!=='all'&&!sessions(papers,semester).includes(session))session='all';
  if(subject!=='all'&&!subjects(papers,semester,session).some(s=>s.key===subject))subject='all';
  return {semester,session,subject,query:filters.query||''};
 }
 function filter(papers,filters){
  const term=(filters.query||'').trim().toLowerCase();
  return papers.filter(r=>inSemester(r,filters.semester)&&(filters.session==='all'||r.session===filters.session)&&(filters.subject==='all'||subjectKey(r)===filters.subject)&&[r.paperSubject,r.code,r.session,r.university].join(' ').toLowerCase().includes(term));
 }
 const api={subjectKey,sessions,subjects,normalize,filter};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.PyqFilters=api;
})(globalThis);

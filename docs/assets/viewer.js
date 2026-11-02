import * as pdfjs from './pdfjs/pdf.mjs';
import {PageWindow, pageWindow, bitmapSize} from './pdf-page-window.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdfjs/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
const area=$('page-area'), stack=$('page-stack'), input=$('page-number'), status=$('status'), single=$('single-page');
const preference='bpharma-single-page';
try { single.checked=localStorage.getItem(preference)==='true'; } catch { /* Storage can be disabled. */ }
let pdf=null, worker=null, loadingTask=null, pages=null, disposed=false, releasePromise=null;
let pageNumber=1, zoom=1, baseSize=null, slots=[], scrollFrame=0, resizeTimer=0, lastWidth=0;
const sizes=new Map();
const gap=22;
function controls(force=false) {
 if (!pdf || disposed) return;
 if (force || document.activeElement!==input) input.value=pageNumber;
 input.max=pdf.numPages; $('total').textContent=`of ${pdf.numPages}`;
 $('previous').disabled=pageNumber<=1; $('next').disabled=pageNumber>=pdf.numPages;
 $('zoom-out').disabled=zoom<=.5; $('zoom-in').disabled=zoom>=3;
}
function dimensions(number) {
 const base=sizes.get(number)||baseSize;
 const scale=Math.max(100,area.clientWidth-(innerWidth<420?16:28))/base.width*zoom;
 return {width:base.width*scale,height:base.height*scale,scale};
}
function top(number) { return stack.offsetTop + slots[number-1].element.offsetTop; }
function anchor() {
 const height=slots[pageNumber-1]?.element.offsetHeight||1;
 return {page:pageNumber,fraction:(area.scrollTop-top(pageNumber))/height};
}
function restore(mark) {
 area.scrollTop=top(mark.page)+mark.fraction*slots[mark.page-1].element.offsetHeight;
}
function sizeSlot(number) {
 const {width,height}=dimensions(number), slot=slots[number-1];
 slot.sheet.style.width=`${width}px`; slot.sheet.style.height=`${height}px`;
}
function rememberSize(number, page) {
 const viewport=page.getViewport({scale:1}), previous=sizes.get(number)||baseSize;
 if (previous.width===viewport.width && previous.height===viewport.height) return;
 const mark=anchor(); sizes.set(number,{width:viewport.width,height:viewport.height});
 sizeSlot(number); restore(mark);
}
function createView(number, page) {
 rememberSize(number,page);
 const slot=slots[number-1], view=page.getViewport({scale:dimensions(number).scale});
 const bitmap=bitmapSize(view.width,view.height,devicePixelRatio||1);
 const canvas=document.createElement('canvas');
 canvas.width=bitmap.width; canvas.height=bitmap.height;
 canvas.style.width=`${view.width}px`; canvas.style.height=`${view.height}px`;
 canvas.setAttribute('role','img'); canvas.setAttribute('aria-label',`PDF page ${number} of ${pdf.numPages}. Use the direct PDF link for selectable text.`);
 slot.sheet.append(canvas);
 return {
  renderOptions:{canvasContext:canvas.getContext('2d',{alpha:false}),viewport:view,transform:[bitmap.scale,0,0,bitmap.scale,0,0]},
  release() {
   // Reset the backing store as well as detaching the element to release bitmap memory promptly.
   canvas.width=0; canvas.height=0; canvas.remove();
  }
 };
}
function requestWindow(refresh=false) {
 if (!pdf || disposed || !pages) return;
 pages.setPages(pageWindow(pageNumber,pdf.numPages,single.checked),pageNumber,refresh);
 controls();
 const state=slots[pageNumber-1].sheet.dataset.state;
 status.textContent=state==='ready'?'':state==='error'?'This page could not render. Use Open in new tab or Download PDF above.':`Loading page ${pageNumber}…`;
}
function currentAtScroll() {
 const probe=area.scrollTop+Math.min(area.clientHeight*.3,200);
 let lo=1, hi=slots.length;
 while (lo<hi) {
  const mid=Math.floor((lo+hi)/2), end=top(mid)+slots[mid-1].element.offsetHeight+gap/2;
  if (end<probe) lo=mid+1; else hi=mid;
 }
 return lo;
}
function onScroll() {
 if (scrollFrame || !pdf || disposed || single.checked) return;
 scrollFrame=requestAnimationFrame(() => {
  scrollFrame=0;
  const next=currentAtScroll();
  if (next!==pageNumber) { pageNumber=next; requestWindow(); }
 });
}
function go(number) {
 if (!pdf || disposed) return;
 const next=Math.max(1,Math.min(pdf.numPages,Math.trunc(Number(number))||1));
 if (single.checked && next!==pageNumber) {
  slots[pageNumber-1].element.hidden=true; slots[next-1].element.hidden=false;
 }
 pageNumber=next; controls(true); area.scrollTop=single.checked?0:top(next);
 requestWindow();
}
function layout() {
 if (!pdf || disposed) return;
 const mark=anchor();
 slots.forEach((_,i)=>sizeSlot(i+1)); restore(mark);
 lastWidth=area.clientWidth; requestWindow(true);
}
function changeZoom(value) {
 if (!pdf || disposed) return;
 // Capture the old page-relative position before changing dimensions.
 const mark=anchor(); zoom=value;
 slots.forEach((_,i)=>sizeSlot(i+1)); restore(mark); requestWindow(true);
}
$('previous').addEventListener('click',()=>go(pageNumber-1));
$('next').addEventListener('click',()=>go(pageNumber+1));
input.addEventListener('change',()=>go(input.value));
input.addEventListener('keydown',event=>{ if(event.key==='Enter'){go(input.value);input.blur();} });
$('zoom-in').addEventListener('click',()=>changeZoom(Math.min(3,zoom+.25)));
$('zoom-out').addEventListener('click',()=>changeZoom(Math.max(.5,zoom-.25)));
$('zoom-reset').addEventListener('click',()=>changeZoom(1));
single.addEventListener('change',()=>{
 if (!pdf || disposed) return;
 const offset=area.scrollTop-top(pageNumber);
 try { localStorage.setItem(preference,String(single.checked)); } catch { /* Optional preference. */ }
 slots.forEach((slot,i)=>{slot.element.hidden=single.checked && i+1!==pageNumber;});
 area.dataset.mode=single.checked?'single':'continuous';
 area.scrollTop=top(pageNumber)+Math.max(0,offset); requestWindow();
});
area.addEventListener('scroll',onScroll,{passive:true});
const observer=new ResizeObserver(()=>{
 clearTimeout(resizeTimer);
 resizeTimer=setTimeout(()=>{if(pdf && !disposed && area.clientWidth!==lastWidth)layout();},180);
});
observer.observe(area);
window.addEventListener('keydown',event=>{
 if(!pdf || disposed || ['INPUT','BUTTON'].includes(event.target.tagName))return;
 if(event.key==='ArrowRight'){event.preventDefault();go(pageNumber+1);}
 if(event.key==='ArrowLeft'){event.preventDefault();go(pageNumber-1);}
});
function releasePdf() {
 if (releasePromise) return releasePromise;
 disposed=true; clearTimeout(resizeTimer); cancelAnimationFrame(scrollFrame); observer.disconnect();
 area.removeEventListener('scroll',onScroll);
 const stopped=pages?.dispose();
 const destroyed=loadingTask?.destroy();
 const ownedWorker=worker;
 pdf=null; worker=null; loadingTask=null; pages=null; sizes.clear(); slots=[]; stack.replaceChildren();
 area.dataset.state='disposed';
 // Allow graceful PDF.js teardown, with a short bound if a network/render promise stalls.
 let timeout;
 releasePromise=Promise.race([Promise.allSettled([stopped,destroyed]),new Promise(resolve=>{timeout=setTimeout(resolve,200);})])
  .finally(()=>{clearTimeout(timeout);ownedWorker?.destroy();});
 return releasePromise;
}
window.releasePdf=releasePdf;
window.addEventListener('pagehide',releasePdf,{once:true});
window.addEventListener('pageshow',event=>{if(event.persisted && disposed)location.reload();});

async function openPdf() {
 try {
  const file=new URLSearchParams(location.search).get('file');
  const url=new URL(file||'',location.href), root=new URL('./pdfs/',location.href);
  if(!file || url.origin!==root.origin || !url.pathname.startsWith(root.pathname) || !url.pathname.endsWith('.pdf'))throw new Error('Invalid document');
  worker=new pdfjs.PDFWorker();
  loadingTask=pdfjs.getDocument({url:url.href,worker,disableAutoFetch:true,disableStream:true,rangeChunkSize:262144,
   cMapUrl:new URL('./pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,
   standardFontDataUrl:new URL('./pdfjs/standard_fonts/',import.meta.url).href,
   wasmUrl:new URL('./pdfjs/wasm/',import.meta.url).href,iccUrl:new URL('./pdfjs/iccs/',import.meta.url).href,isEvalSupported:false});
  pdf=await loadingTask.promise;
  if(disposed)return;
  const first=await pdf.getPage(1);
  if(disposed){first.cleanup();return;}
  const viewport=first.getViewport({scale:1});baseSize={width:viewport.width,height:viewport.height};first.cleanup();
  const fragment=document.createDocumentFragment();
  for(let number=1;number<=pdf.numPages;number++) {
   const element=document.createElement('section');element.className='pdf-page';element.setAttribute('aria-label',`Page ${number}`);
   const label=document.createElement('span');label.className='page-label';label.textContent=`Page ${number}`;
   const sheet=document.createElement('div');sheet.className='page-sheet';sheet.dataset.state='idle';
   const placeholder=document.createElement('span');placeholder.className='page-placeholder';placeholder.textContent=`Page ${number}`;placeholder.setAttribute('aria-hidden','true');
   sheet.append(placeholder);element.append(label,sheet);element.hidden=single.checked && number!==pageNumber;
   fragment.append(element);slots.push({element,sheet,placeholder});
  }
  stack.append(fragment);slots.forEach((_,i)=>sizeSlot(i+1));lastWidth=area.clientWidth;
  pages=new PageWindow({getPage:number=>pdf.getPage(number),createView,cleanupDocument:()=>pdf?.cleanup(true),
   onState(number,state) {
    if(disposed)return;
    const slot=slots[number-1];slot.sheet.dataset.state=state;
    slot.placeholder.textContent=state==='error'?'This page could not load. Open the PDF directly above.':state==='loading'?`Loading page ${number}…`:`Page ${number}`;
    if(number===pageNumber)status.textContent=state==='loading'?`Loading page ${number}…`:state==='error'?'This page could not render. Use Open in new tab or Download PDF above.':'';
   }});
  area.dataset.state='ready';area.dataset.mode=single.checked?'single':'continuous';
  input.disabled=false;single.disabled=false;$('zoom-reset').disabled=false;status.textContent='';
  controls(true);requestWindow();
 } catch(error) {
  if(disposed)return;
  status.textContent='The PDF could not load. Use Open in new tab or Download PDF above.';
  await releasePdf();
 }
}
openPdf();

import * as pdfjs from './pdfjs/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = new URL('./pdfjs/pdf.worker.mjs', import.meta.url).href;
const $ = id => document.getElementById(id);
const canvas=$('pdf-canvas'), area=$('page-area'), input=$('page-number'), status=$('status');
let pdf, pageNumber=1, zoom=1, task, generation=0;
function controls(){
 input.value=pageNumber;input.max=pdf.numPages;
 $('total').textContent=`of ${pdf.numPages}`;
 $('previous').disabled=pageNumber<=1;$('next').disabled=pageNumber>=pdf.numPages;
 $('zoom-out').disabled=zoom<=.5;$('zoom-in').disabled=zoom>=3;
}
async function render(){
 const current=++generation;
 if(task){task.cancel();task=null;}
 controls();status.textContent=`Loading page ${pageNumber}…`;
 try{
  const page=await pdf.getPage(pageNumber);if(current!==generation)return;
  const base=page.getViewport({scale:1});
  const width=Math.max(150,area.clientWidth-(innerWidth<420?16:28));
  const viewport=page.getViewport({scale:Math.min(1.8,width/base.width)*zoom});
  const ratio=Math.min(devicePixelRatio||1,2);
  canvas.width=Math.floor(viewport.width*ratio);canvas.height=Math.floor(viewport.height*ratio);
  canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;canvas.style.display='block';
  task=page.render({canvasContext:canvas.getContext('2d'),viewport,transform:ratio===1?null:[ratio,0,0,ratio,0,0]});
  await task.promise;if(current!==generation)return;
  canvas.setAttribute('aria-label',`PDF page ${pageNumber} of ${pdf.numPages}. Use the direct PDF link for selectable text.`);
  status.textContent='';task=null;
 }catch(error){if(error.name!=='RenderingCancelledException')status.textContent='This page could not render. Use Open in new tab or Download PDF above.';}
}
function go(number){pageNumber=Math.max(1,Math.min(pdf.numPages,Number(number)||1));render();window.scrollTo(0,0);area.scrollTop=0;}
$('previous').addEventListener('click',()=>go(pageNumber-1));
$('next').addEventListener('click',()=>go(pageNumber+1));
input.addEventListener('change',()=>go(input.value));
input.addEventListener('keydown',e=>{if(e.key==='Enter'){go(input.value);input.blur();}});
$('zoom-in').addEventListener('click',()=>{zoom=Math.min(3,zoom+.25);render();});
$('zoom-out').addEventListener('click',()=>{zoom=Math.max(.5,zoom-.25);render();});
$('zoom-reset').addEventListener('click',()=>{zoom=1;render();});
let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(pdf)render();},180);});
window.addEventListener('keydown',e=>{if(!pdf||e.target.tagName==='INPUT')return;if(e.key==='ArrowRight'){e.preventDefault();go(pageNumber+1);}if(e.key==='ArrowLeft'){e.preventDefault();go(pageNumber-1);}});
try{
 const file=new URLSearchParams(location.search).get('file');
 const url=new URL(file||'',location.href);
 const root=new URL('./pdfs/',location.href);
 if(!file||url.origin!==root.origin||!url.pathname.startsWith(root.pathname)||!url.pathname.endsWith('.pdf'))throw new Error('Invalid document');
 pdf=await pdfjs.getDocument({url:url.href,cMapUrl:new URL('./pdfjs/cmaps/',import.meta.url).href,cMapPacked:true,standardFontDataUrl:new URL('./pdfjs/standard_fonts/',import.meta.url).href,wasmUrl:new URL('./pdfjs/wasm/',import.meta.url).href,iccUrl:new URL('./pdfjs/iccs/',import.meta.url).href,isEvalSupported:false}).promise;
 input.disabled=false;$('zoom-reset').disabled=false;await render();
}catch(error){status.textContent='The PDF could not load. Use Open in new tab or Download PDF above.';}

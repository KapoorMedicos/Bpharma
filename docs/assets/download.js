import {PdfDownload} from './pdf-download.mjs';
const dialog=document.createElement('dialog');
dialog.className='download-dialog';dialog.setAttribute('aria-labelledby','download-title');
dialog.innerHTML=`<div class="download-heading"><h2 id="download-title">Save your PDF</h2><button type="button" class="download-close" aria-label="Close download">×</button></div><p class="download-filename"></p><p class="download-status" role="status" aria-live="polite"></p><progress aria-label="Preparing PDF"></progress><div class="download-actions"><button type="button" class="button" id="save-pdf" disabled>Save PDF</button><button type="button" class="button secondary" id="share-pdf" hidden>Save / share PDF</button><button type="button" class="button secondary" id="retry-pdf" hidden>Try again</button></div><p class="download-help">Your browser may ask where to save the file. If saving is blocked inside an app, open this website in your usual browser.</p>`;
document.body.append(dialog);
const $=selector=>dialog.querySelector(selector), save=$('#save-pdf'), share=$('#share-pdf'), retry=$('#retry-pdf'), status=$('.download-status'), progress=$('progress');
let source=null, expiry=null;
const download=new PdfDownload({onState(state,message){
 progress.hidden=state!=='loading';save.disabled=state!=='ready';retry.hidden=state!=='error';share.hidden=true;
 if(state==='loading')status.textContent='Preparing your PDF…';
 else if(state==='ready'){
  status.textContent='Your PDF is ready. Choose Save PDF to download it.';
  try { share.hidden=!(navigator.share && navigator.canShare?.({files:[download.file]})); } catch { /* File sharing is optional. */ }
  $('.download-help').textContent=share.hidden?'Your browser may ask where to save the file. If saving is blocked inside an app, open this website in your usual browser.':'Your browser may ask where to save the file. On iPhone or iPad, choose Save / share PDF, then Save to Files.';
  clearTimeout(expiry);expiry=setTimeout(()=>{
   download.clear();save.disabled=true;share.hidden=true;retry.hidden=false;
   status.textContent='This download has expired. Choose Try again to prepare it again.';
  },120000);
 }else status.textContent=message||'The download could not be prepared. Please try again.';
}});
function close(){clearTimeout(expiry);download.clear();source=null;if(dialog.open)dialog.close();}
function prepare(){download.prepare(source.url,source.name);}
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-download]');if(!button)return;
 event.preventDefault();close();
 const url=new URL(button.dataset.url,document.baseURI), root=new URL('pdfs/',document.baseURI);
 if(url.origin!==root.origin || !url.pathname.startsWith(root.pathname) || !url.pathname.endsWith('.pdf'))return;
 source={url:url.href,name:button.dataset.filename};$('.download-filename').textContent=source.name;
 dialog.showModal();prepare();
});
save.addEventListener('click',()=>{
 if(!download.url)return;
 // Run synchronously inside this fresh user gesture, including after a slow mobile fetch.
 const link=document.createElement('a');link.href=download.url;link.download=download.file.name;link.hidden=true;
 document.body.append(link);link.click();link.remove();
 status.textContent='Download requested. Check your browser’s Downloads. If it did not save, try Save / share PDF below.';
 if(share.hidden)status.textContent='Download requested. Check your browser’s Downloads. If this app blocks saving, open this website in Safari, Chrome, or Firefox and try again.';
});
share.addEventListener('click',async()=>{
 if(!download.file)return;
 try {
  await navigator.share({files:[download.file],title:download.file.name});
  status.textContent='The PDF was handed to your selected app or save location.';
 }catch(error){
  status.textContent=error.name==='AbortError'?'Save cancelled. Your PDF is still ready.':'Sharing is unavailable here. Choose Save PDF or open the website in your browser.';
 }
});
retry.addEventListener('click',()=>{if(source)prepare();});
$('.download-close').addEventListener('click',close);
dialog.addEventListener('cancel',event=>{event.preventDefault();close();});
dialog.addEventListener('click',event=>{if(event.target===dialog)close();});
window.addEventListener('hashchange',close);
window.addEventListener('pagehide',close);

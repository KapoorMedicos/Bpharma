/* Run before stylesheets so the remembered theme is applied before first paint. */
(() => {
 const key='bpharma-theme', root=document.documentElement;
 const system=window.matchMedia('(prefers-color-scheme: dark)');
 const valid=value=>value==='dark'||value==='light';
 let preference=null;
 try {const saved=localStorage.getItem(key);if(valid(saved))preference=saved;} catch { /* Theme still works without storage. */ }
 function updateButton(){
  const button=document.getElementById('theme-toggle');if(!button)return;
  const dark=root.dataset.theme==='dark';
  button.setAttribute('aria-pressed',String(dark));
  button.setAttribute('aria-label',dark?'Switch to light mode':'Switch to dark mode');
  button.title=dark?'Switch to light mode':'Switch to dark mode';
 }
 function send(frame){
  frame.contentWindow?.postMessage({type:'bpharma-theme',theme:root.dataset.theme,preference},location.origin);
 }
 function apply(){
  const theme=preference||(system.matches?'dark':'light');
  root.dataset.theme=theme;root.style.colorScheme=theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content',theme==='dark'?'#101916':'#174f45');
  updateButton();document.querySelectorAll('iframe').forEach(send);
 }
 apply();
 document.addEventListener('DOMContentLoaded',()=>{
  updateButton();
  document.getElementById('theme-toggle')?.addEventListener('click',()=>{
   preference=root.dataset.theme==='dark'?'light':'dark';
   try {localStorage.setItem(key,preference);} catch { /* Optional persistence. */ }
   apply();
  });
 });
 system.addEventListener('change',()=>{if(!preference)apply();});
 window.addEventListener('storage',event=>{
  if(event.key!==key && event.key!==null)return;
  preference=valid(event.newValue)?event.newValue:null;apply();
 });
 // Keep the embedded reader in sync even if browser storage is unavailable.
 document.addEventListener('load',event=>{if(event.target.tagName==='IFRAME')send(event.target);},true);
 window.addEventListener('message',event=>{
  if(window.parent===window || event.source!==window.parent || event.origin!==location.origin || event.data?.type!=='bpharma-theme' || !valid(event.data.theme))return;
  preference=valid(event.data.preference)?event.data.preference:null;
  root.dataset.theme=event.data.theme;root.style.colorScheme=event.data.theme;updateButton();
 });
})();

// A PDF navigation is not a download: prepare an owned file URL for a fresh Save click.
export function pdfFilename(value) {
 const name=String(value||'Notes').replace(/[\\/:*?"<>|\x00-\x1f\x7f]/g,'-').trim().replace(/[. ]+$/g,'');
 return `${name.replace(/\.pdf$/i,'').slice(0,170)||'Notes'}.pdf`;
}
export class PdfDownload {
 constructor({fetchFile=fetch,createUrl=URL.createObjectURL,revokeUrl=URL.revokeObjectURL,onState=()=>{}}={}) {
  Object.assign(this,{fetchFile,createUrl,revokeUrl,onState});this.version=0;this.url=null;this.file=null;this.controller=null;
 }
 clear() {
  this.version++;this.controller?.abort();this.controller=null;
  if(this.url)this.revokeUrl(this.url);
  this.url=null;this.file=null;
 }
 async prepare(url,name) {
  this.clear();const version=this.version;
  const controller=this.controller=new AbortController();this.onState('loading');
  try {
   const response=await this.fetchFile(url,{signal:controller.signal,credentials:'omit',redirect:'error'});
   if(!response.ok)throw new Error('The PDF could not be fetched. Please try again.');
   const blob=await response.blob();
   if(version!==this.version)return;
   if(!blob.size || blob.size>100*1024*1024 || await blob.slice(0,5).text()!=='%PDF-')throw new Error('The server did not return a valid PDF. Please try again.');
   if(version!==this.version)return;
   this.file=new File([blob],pdfFilename(name),{type:'application/pdf'});
   // Keep .pdf as the filename while avoiding the browser's inline PDF navigation handler.
   this.url=this.createUrl(blob.slice(0,blob.size,'application/octet-stream'));
   this.onState('ready');
  } catch(error) {
   if(version!==this.version || controller.signal.aborted)return;
   this.onState('error',error.message);
  }
 }
}

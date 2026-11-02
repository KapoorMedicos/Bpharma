import assert from 'node:assert/strict';
import {PdfDownload,pdfFilename} from '../docs/assets/pdf-download.mjs';
const pdf='%PDF-1.7\nA small PDF download fixture\n%%EOF';
const good=()=>new Response(pdf,{headers:{'Content-Type':'application/pdf'}});
const states=[],created=[],revoked=[];
const download=new PdfDownload({fetchFile:async()=>good(),createUrl:blob=>{created.push(blob);return `blob:test-${created.length}`;},revokeUrl:url=>revoked.push(url),onState:(...args)=>states.push(args)});
await download.prepare('/pdfs/one.pdf','Unit 1 - Pharmacology.pdf');
assert.equal(download.file.name,'Unit 1 - Pharmacology.pdf');
assert.equal(download.file.type,'application/pdf');
assert.equal(await download.file.text(),pdf);
assert.equal(created[0].type,'application/octet-stream');
assert.equal(await created[0].text(),pdf);
assert.deepEqual(states.map(s=>s[0]),['loading','ready']);
await download.prepare('/pdfs/two.pdf','Paper 2025');
assert.deepEqual(revoked,['blob:test-1']);assert.equal(download.file.name,'Paper 2025.pdf');
download.clear();download.clear();assert.deepEqual(revoked,['blob:test-1','blob:test-2']);assert.equal(download.file,null);assert.equal(download.url,null);
assert.equal(pdfFilename('Unit: 1/Pharmacology?.pdf'),'Unit- 1-Pharmacology-.pdf');
assert.equal(pdfFilename('...'),'Notes.pdf');
assert.equal(pdfFilename('notes.PDF'),'notes.pdf');
for(const response of [new Response('missing',{status:404}),new Response('<html>Not a PDF</html>'),new Response('')]){
 const errors=[];const d=new PdfDownload({fetchFile:async()=>response,createUrl:()=>assert.fail('An invalid file became downloadable'),onState:(s)=>errors.push(s)});
 await d.prepare('/bad','bad');assert.deepEqual(errors,['loading','error']);assert.equal(d.url,null);assert.equal(d.file,null);
}
{
 let resolve,signal;const states=[];
 const d=new PdfDownload({fetchFile:(_,options)=>{signal=options.signal;return new Promise(r=>resolve=r);},createUrl:()=>assert.fail('A cancelled fetch created a file URL'),onState:s=>states.push(s)});
 const pending=d.prepare('/slow','slow.pdf');d.clear();assert.equal(signal.aborted,true);resolve(good());await pending;
 assert.deepEqual(states,['loading']);assert.equal(d.file,null);
}
{
 let resolve,firstSignal;const states=[];
 const d=new PdfDownload({fetchFile:(url,options)=>url==='/old'?new Promise(r=>{resolve=r;firstSignal=options.signal;}):Promise.resolve(good()),createUrl:()=> 'blob:latest',revokeUrl:()=>{},onState:s=>states.push(s)});
 const old=d.prepare('/old','old.pdf');await d.prepare('/new','new.pdf');resolve(good());await old;
 assert.equal(firstSignal.aborted,true);assert.equal(d.file.name,'new.pdf');assert.equal(d.url,'blob:latest');assert.deepEqual(states,['loading','loading','ready']);d.clear();
}
{
 let finishBlob;const d=new PdfDownload({fetchFile:async()=>({ok:true,blob:()=>new Promise(r=>finishBlob=r)}),createUrl:()=>assert.fail('A late body created a URL')});
 const pending=d.prepare('/slow-body','slow.pdf');await new Promise(r=>setImmediate(r));d.clear();finishBlob(new Blob([pdf]));await pending;assert.equal(d.file,null);
}
console.log('PDF bytes, attachment MIME, filenames, invalid responses, cancellation, superseded requests, and file URL cleanup passed.');

// Keep the expensive page resources bounded; document bytes are managed by PDF.js.
export const MAX_PAGES = 5;
export const MAX_CANVAS_PIXELS = 4_000_000;
export function pageWindow(current, total, single = false) {
 const page = Math.max(1, Math.min(total, Math.trunc(Number(current)) || 1));
 if (single) return [page];
 const start = Math.min(Math.max(1, page - 2), Math.max(1, total - MAX_PAGES + 1));
 return Array.from({length: Math.min(total, MAX_PAGES)}, (_, i) => start + i);
}
export function bitmapSize(width, height, dpr = 1) {
 const scale = Math.min(Math.max(1, dpr), 2, Math.sqrt(MAX_CANVAS_PIXELS / (width * height)), 4096 / Math.max(width, height));
 return {width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)), scale};
}

export class PageWindow {
 constructor({getPage, createView, cleanupDocument, onError = () => {}, onState = () => {}}) {
  Object.assign(this, {getPage, createView, cleanupDocument, onError, onState});
  this.entries = new Map(); this.desired = []; this.closed = false; this.running = null; this.needsCleanup = false;
 }
 setPages(numbers, focus, refresh = false) {
  if (this.closed) return;
  this.desired = [...new Set(numbers)].slice(0, MAX_PAGES).sort((a,b) => Math.abs(a-focus)-Math.abs(b-focus) || a-b);
  for (const [number, entry] of this.entries) {
   if (refresh || !this.desired.includes(number)) { this.entries.delete(number); this.release(entry); }
  }
  this.schedule();
 }
 release(entry) {
  entry.active = false;
  entry.task?.cancel();
  entry.view?.release(); entry.view = null;
  // A cancelled render must settle before PDF.js can clean its page resources.
  if (!entry.task) { entry.page?.cleanup(); entry.page = null; }
  this.needsCleanup = true; this.onState(entry.number, 'evicted');
 }
 schedule() {
  if (this.closed || this.running) return;
  this.running = this.drain().finally(() => {
   this.running = null;
   if (!this.closed && this.desired.some(n => !this.entries.has(n))) this.schedule();
  });
 }
 async drain() {
  while (!this.closed) {
   const number = this.desired.find(n => !this.entries.has(n));
   if (number === undefined) {
    if (this.needsCleanup) {
     this.needsCleanup = false;
     // All rendering is serial and idle here, so shared decoded-image caches can be released too.
     try { await this.cleanupDocument?.(); } catch { /* The document may be closing. */ }
     continue;
    }
    break;
   }
   const entry = {number, active:true, page:null, view:null, task:null};
   this.entries.set(number, entry); this.onState(number, 'loading');
   try {
    entry.page = await this.getPage(number);
    if (!entry.active || this.closed) continue;
    entry.view = this.createView(number, entry.page);
    entry.task = entry.page.render(entry.view.renderOptions);
    await entry.task.promise;
    if (entry.active && !this.closed) this.onState(number, 'ready');
   } catch (error) {
    if (entry.active && !this.closed && error.name !== 'RenderingCancelledException') {
     entry.view?.release(); entry.view = null; entry.failed = true;
     this.onState(number, 'error'); this.onError(number, error);
    }
   } finally {
    entry.task = null;
    if (!entry.active || this.closed || entry.failed) {
     entry.view?.release(); entry.view = null;
     entry.page?.cleanup(); entry.page = null;
    }
   }
  }
 }
 async whenIdle() { while (this.running) await this.running; }
 dispose() {
  if (!this.closed) {
   this.closed = true; this.desired = [];
   for (const entry of this.entries.values()) this.release(entry);
   this.entries.clear();
  }
  return this.whenIdle();
 }
}

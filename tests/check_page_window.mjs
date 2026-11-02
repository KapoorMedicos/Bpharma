import assert from 'node:assert/strict';
import {PageWindow,pageWindow,bitmapSize,MAX_CANVAS_PIXELS} from '../docs/assets/pdf-page-window.mjs';
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const deferred=()=>{let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b;});return {promise,resolve,reject};};
assert.deepEqual(pageWindow(1,100),[1,2,3,4,5]);
assert.deepEqual(pageWindow(50,100),[48,49,50,51,52]);
assert.deepEqual(pageWindow(100,100),[96,97,98,99,100]);
assert.deepEqual(pageWindow(2,2),[1,2]);
assert.deepEqual(pageWindow(50,100,true),[50]);
for(const [w,h,dpr] of [[10000,15000,3],[280,400,2],[5000,500,1],[700,900,2]]){
 const bitmap=bitmapSize(w,h,dpr);
 assert.ok(bitmap.width*bitmap.height<=MAX_CANVAS_PIXELS);
 assert.ok(Math.max(bitmap.width,bitmap.height)<=4096);
}
function harness({manual=false,fail=0}={}){
 const state={live:new Set(),peak:0,cleaned:[],cancelled:[],started:[],states:[],idleCleanups:0,active:0};
 const pending=new Map();
 const getPage=async number=>({
  cleanup(){assert.equal(state.active,0,'Page cleaned before render cancellation settled');state.cleaned.push(number);},
  render(){
   const task=deferred();state.active++;state.started.push(number);pending.set(number,task);
   if(!manual)queueMicrotask(()=>number===fail?task.reject(new Error('broken page')):task.resolve());
   return {promise:task.promise.finally(()=>{state.active--;}),cancel(){state.cancelled.push(number);task.reject(Object.assign(new Error('cancelled'),{name:'RenderingCancelledException'}));}};
  }
 });
 const controller=new PageWindow({getPage,createView(number){
  state.live.add(number);state.peak=Math.max(state.peak,state.live.size);
  return {renderOptions:{},release(){state.live.delete(number);}};
 },cleanupDocument:async()=>{assert.equal(state.active,0);state.idleCleanups++;},onState:(n,s)=>state.states.push([n,s])});
 return {controller,state,pending};
}
{
 const {controller:c,state:s}=harness();
 c.setPages(pageWindow(1,100),1);await c.whenIdle();assert.deepEqual([...s.live].sort((a,b)=>a-b),[1,2,3,4,5]);
 for(let current=2;current<=25;current++){c.setPages(pageWindow(current,100),current);await c.whenIdle();assert.ok(s.live.size<=5);}
 assert.equal(s.peak,5);assert.ok(s.cleaned.includes(1));assert.ok(s.idleCleanups>0);
 c.setPages(pageWindow(25,100,true),25);await c.whenIdle();assert.deepEqual([...s.live],[25]);
 c.setPages(pageWindow(25,100),25,true);await c.whenIdle();assert.equal(s.live.size,5);
 await c.dispose();assert.equal(s.live.size,0);assert.equal(c.entries.size,0);
}
{
 const {controller:c,state:s,pending}=harness({manual:true});
 c.setPages(pageWindow(1,100),1);await tick();
 c.setPages(pageWindow(70,100),70);await tick();
 assert.ok(s.cancelled.includes(1));assert.ok(!s.live.has(1));assert.equal(s.started.at(-1),70);
 for(const n of [70,69,71,68,72]){pending.get(n).resolve();await tick();}
 await c.whenIdle();assert.equal(s.peak,5);assert.deepEqual([...s.live].sort((a,b)=>a-b),[68,69,70,71,72]);
 await c.dispose();
}
{
 const gate=deferred(), cleaned=[];let created=0;
 const c=new PageWindow({getPage:()=>gate.promise,createView(){created++;},onError(){assert.fail('Disposed fetch reported an error');}});
 c.setPages([1],1);const stopped=c.dispose();
 gate.resolve({cleanup(){cleaned.push(1);}});await stopped;
 assert.equal(created,0);assert.deepEqual(cleaned,[1]);
 c.setPages([2],2);assert.equal(c.entries.size,0);
}
{
 const {controller:c,state:s}=harness({fail:2});
 c.setPages([1,2,3],1);await c.whenIdle();assert.ok(!s.live.has(2));assert.ok(s.cleaned.includes(2));
 assert.ok(s.states.some(([n,state])=>n===2&&state==='error'));await c.dispose();
}
{
 const {controller:c,state:s}=harness({manual:true});
 c.setPages([1,2,3,4,5],1);await tick();await c.dispose();
 assert.deepEqual(s.cancelled,[1]);assert.equal(s.live.size,0);assert.equal(c.entries.size,0);
}
console.log('Five-page residency, pixel budget, scroll/zoom races, late loads, failure cleanup, and disposal passed.');

const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const {parseHTML}=require(process.env.LINKEDOM_PATH||'linkedom');
const root=path.resolve(__dirname,'../minitool');
const saved=new Map();
function boot(){
 const {window}=parseHTML(fs.readFileSync(path.join(root,'index.html'),'utf8'));
 const timers=new Map();let id=0;
 Object.assign(window,{console,innerHeight:844,innerWidth:390,localStorage:{getItem:k=>saved.get(k)||null,setItem:(k,v)=>saved.set(k,v)},sessionStorage:{getItem:()=>null,setItem:()=>{}},matchMedia:()=>({matches:false}),confirm:()=>true,HTMLFormElement:function(){},setTimeout:(fn,ms)=>{timers.set(++id,{fn,ms});return id;},clearTimeout:i=>timers.delete(i),setInterval:()=>++id,clearInterval:()=>{},requestAnimationFrame:()=>++id});
 window.HTMLElement.prototype.focus=function(){};
 window.document.importNode=n=>n.cloneNode(true);
 const context=vm.createContext(window);
 for(const f of ['compat.js','app.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),context,{filename:f});
 const click=q=>{const el=window.document.querySelector(q);assert(el,'Missing '+q);assert(!el.disabled,'Disabled '+q);el.dispatchEvent(new window.Event('click',{bubbles:true,cancelable:true}));};
 const flush=()=>{let count=0;while(timers.size){assert(count++<200,'runaway timers');const [key,{fn}]=timers.entries().next().value;timers.delete(key);fn();}};
 return {window,click,flush,doc:window.document};
}
let a=boot();assert(a.doc.body.classList.contains('at-start'));assert.equal(saved.size,0,'start screen must not overwrite saves');a.flush();assert.equal(saved.size,0,'no story before start');
a.click('#new-game');a.flush();assert(!a.doc.body.classList.contains('at-start'));assert(a.doc.querySelector('#opening-thread').textContent.includes('救命'));
for(let step=0;step<3;step++){a.click('[data-action="lin-reply"][data-step="'+step+'"]');a.flush();}
assert.equal(JSON.parse(saved.get('night-travel-mobile-v1')).opening,3);
a.click('[data-action="start"]');a.flush();
a.click('[data-action="nav"][data-view="map"]');
assert(a.doc.querySelector('#network-map svg'),'bundled map mounts without fetch');
a.click('[data-action="inspect"][data-station="28"]');a.click('[data-action="inspect"][data-station="43"]');
a.click('[data-action="version"][data-version="archive"]');assert(!a.doc.querySelector('#network-map #station-43'));
a.click('[data-action="open-chat"]');assert(a.doc.querySelector('#modal').open);assert(a.doc.querySelector('#modal-lin-thread'));
a.click('[data-action="close"]');a.click('[data-action="mobile-menu"]');a.click('[data-action="full-rules"]');assert(a.doc.querySelector('#modal-body').textContent.includes('天黑后'));a.click('[data-action="close"]');
a.click('[data-action="mobile-menu"]');a.click('[data-action="mobile-home"]');assert(a.doc.body.classList.contains('at-start'));const homeSave=saved.get('night-travel-mobile-v1');a.flush();assert.equal(saved.get('night-travel-mobile-v1'),homeSave,'home pauses messages');
a=boot();assert(!a.doc.querySelector('#continue-game').hidden);a.click('#continue-game');a.flush();assert.equal(JSON.parse(saved.get('night-travel-mobile-v1')).opening,3);assert(a.doc.querySelector('#network-map svg'));
a.click('[data-sound-toggle]');assert.equal(saved.get('last-train-sound'),'on','missing AudioContext must not block play');
a.click('[data-action="nav"][data-view="support"]');assert(a.doc.querySelector('#workspace').textContent.includes('客服'));
a.click('[data-action="mobile-menu"]');a.click('[data-action="mobile-home"]');a.click('#new-game');a.flush();assert.equal(JSON.parse(saved.get('night-travel-mobile-v1')).opening,0);
console.log('PASS: no auto-start, opening replies, refund entry, offline map/current/archive, in-page chat, full rules, menu, pause, persisted continue, audio fallback, support and confirmed restart.');
console.log('DOM-only verification; no viewport rendering, audio playback, platform simulator or physical-device verification.');

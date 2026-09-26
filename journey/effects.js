let effectTimer=null,phaseTimer=null,lastEffectAt=0,distortionTimer=null,settleTimer=null,restoreTimer=null,growthTimer=null;
const altered=new Map();
let reducedMode=false;
let minorTimer=null,minorRestore=null;
const minorNodes=new Map();
function clearMinor(){clearInterval(minorTimer);clearTimeout(minorRestore);for(const [node,text] of minorNodes){if(node.isConnected){node.textContent=text;node.classList.remove('minor-text-fault');}}minorNodes.clear();}
function minorSignal(kind){
 clearMinor();
 const phrase=kind==='minor-location'?'那它显示的就不是我现在的位置啊。':'我们的数据是完全正确的。';
 let reduced;try{reduced=JSON.parse(sessionStorage.getItem('night-travel-demo-v2-expanded'))?.v2?.reduced;}catch{}
 if(typeof reduced!=='boolean')reduced=!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 let frame=0;
 const frames=kind==='minor-location'?['那它显示的就不是我现在的位置啊。','那它显示的就不是我现现在的位置啊。','那它显示的就不是我／我现在的位置啊。','那它显示的就不是我现在的位置啊。']:['我们的数据是完全正确的。','我们的数据是完完全正确的。','我们的数据是完全确正的。','我们的数据是完全正确的。'];
 const tick=()=>{for(const node of document.querySelectorAll('.lin-line p,.chat-line:not(.me) p')){if(!minorNodes.has(node)&&node.textContent.includes(phrase)){minorNodes.set(node,node.textContent);if(!reduced)node.classList.add('minor-text-fault');}}for(const [node,text] of minorNodes)if(node.isConnected)node.textContent=text.replace(phrase,frames[reduced?1:frame%frames.length]);frame++;};
 requestAnimationFrame(()=>{tick();minorTimer=setInterval(tick,220);minorRestore=setTimeout(clearMinor,reduced?700:1500);});
}
export function clearCorruption(){
 clearMinor();
 clearInterval(distortionTimer);clearInterval(growthTimer);clearTimeout(settleTimer);clearTimeout(restoreTimer);
 for(const [node,entry] of altered){if(node.isConnected&&node.nodeValue===entry.changed)node.nodeValue=entry.original;}
 altered.clear();document.body.classList.remove('page-corrupted','corruption-settling','corruption-reduced');
 document.getElementById('corruption-recovery')?.remove();
 document.getElementById('corruption-field')?.remove();
}
function distortText(text,index){
 const replacements=[['夜间账户服务','乘客连续性维护'],['夜间出行账户','关联对象登记'],['行程与退款','去程与回程与去程'],['共享位置','共有位置'],['博物馆花园','花园博物馆'],['雷恩街','雷恩街 / 雷恩街'],['M. LIN','M. L/IN'],['已完成','尚未发生'],['请保持联系','请保持保持联系']];
 let value=text;for(const [a,b] of replacements)value=value.split(a).join(b);
 const chars=Array.from(value);if(chars.length>8){for(let i=2+index%5;i<chars.length;i+=reducedMode?25:11){if(!/\s/.test(chars[i]))chars[i]=['',chars[i]+chars[i],chars[i+1]||'','/'][i%4];}}
 if(!reducedMode&&index%5===0&&chars.length>12){const chunk=chars.splice(3,4);chars.splice(8,0,...chunk.reverse());}
 return chars.join('');
}
function sweep(){
 let index=0;
 const roots=document.querySelectorAll('#workspace,.topbar,.sidebar,.correspondence,#modal-body,#location-pin,#chat-thread,.chat-header');
 for(const root of roots){const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node;
 while((node=walker.nextNode())){
 const parent=node.parentElement;
 if(!parent||parent.closest('button,a,input,textarea,select,script,style,svg,[role="status"],.sr-only,[data-no-corrupt]')||!node.nodeValue.trim()||node.nodeValue.trim().length<3)continue;
 if(reducedMode&&!parent.closest('h1,h2,h3,strong,.eyebrow,.paper'))continue;
 const old=altered.get(node);if(old&&old.changed===node.nodeValue)continue;
 const original=node.nodeValue,changed=distortText(original,index++);if(original!==changed){altered.set(node,{original,changed});node.nodeValue=changed;}
 }}
 for(const node of altered.keys())if(!node.isConnected)altered.delete(node);
}
function corruptPage(reduced,kind){
 clearCorruption();reducedMode=reduced;
 document.body.classList.add('page-corrupted');if(reduced)document.body.classList.add('corruption-reduced');
 const control=document.createElement('button');control.id='corruption-recovery';control.type='button';control.textContent='重新同步界面';control.setAttribute('aria-label','结束文字异常并恢复显示');control.addEventListener('click',clearCorruption);(document.querySelector('dialog[open]')||document.body).appendChild(control);
 if(!reduced){
 const field=document.createElement('div');field.id='corruption-field';field.setAttribute('popover','manual');field.setAttribute('aria-hidden','true');
 const label=kind==='arrival'?'抵达确认已替换 / ARRIVAL REASSIGNED':'同行对象不唯一 / ASSOCIATED PASSENGER NOT UNIQUE';
 field.innerHTML=`<div class="fracture-band band-one">${label} / LIM / LIM / L/IM / LIM</div><div class="fracture-band band-two">你正在核对的对象也在核对你 / THE OBJECT IS VERIFYING YOU</div><div class="dup-grid" aria-hidden="true"></div><div class="fracture-record">PASSENGER 01　LIM<br>PASSENGER 01　LIM<br>PASSENGER 01　LIM<br>PASSENGER 01　L/IM<br>存在状态：等待你的确认<br>STATUS: AWAITING YOUR CONFIRMATION</div><div class="fracture-bottom">请保持联系　/　PLEASE REMAIN CONNECTED　/　请保持联系</div>`;
 document.body.appendChild(field);try{field.showPopover();}catch{}
 const grid=field.querySelector('.dup-grid');let row=0;
 const addRow=()=>{if(!grid||row>=18)return;const line=document.createElement('div');line.className='dup-row';const id=String(row+1).padStart(2,'0');line.textContent=`PASSENGER ${id}  /  LIM  /  LIM  /  L/IM  /  RECORD ACCEPTED`;line.style.setProperty('--row',row);grid.appendChild(line);row++;};
 for(let i=0;i<3;i++)addRow();growthTimer=setInterval(addRow,480);
 }
 sweep();distortionTimer=setInterval(sweep,1100);
 settleTimer=setTimeout(()=>document.body.classList.add('corruption-settling'),reduced?3000:11000);
 restoreTimer=setTimeout(clearCorruption,reduced?6500:21000);
}
export function playSignal(kind){
 if(kind==='minor-location'||kind==='minor-time'){minorSignal(kind);return;}
 const layer=document.getElementById('screen-signal');if(!layer)return;
 const important=['identity','arrival','pressure'].includes(kind);
 if(!important&&Date.now()-lastEffectAt<1400)return;
 lastEffectAt=Date.now();clearTimeout(effectTimer);clearTimeout(phaseTimer);clearCorruption();
 // The in-game accessibility choice is authoritative. Otherwise the browser's
 // reduced-motion preference is respected as a safe fallback.
 let savedChoice;try{savedChoice=JSON.parse(sessionStorage.getItem('night-travel-demo-v2-expanded'))?.v2?.reduced;}catch{}
 const reduced=typeof savedChoice==='boolean'?savedChoice:!!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 const message=kind==='arrival'?'抵达关系：无法求值 / ARRIVAL RELATIONSHIP: UNDEFINED\n对象：LIM / SUBJECT: LIM':kind==='identity'?'身份核对循环 / IDENTITY VERIFICATION LOOP\n请勿重复核对 / DO NOT VERIFY AGAIN':kind==='pressure'?'关联对象未释放 / ASSOCIATED OBJECT NOT RELEASED\n请完成 / PLEASE COMPLETE':'位置节点未解析 / LOCATION NODE NOT RESOLVED\n路线：-- / -- / ROUTE: -- / --';
 layer.hidden=false;layer.className='screen-signal '+(reduced?'reduced-signal signal-notice':important?'signal-blackout signal-deep':'signal-blackout');layer.textContent=reduced?message:important?'':kind==='static'?message:'';
 if(typeof layer.showPopover==='function'){try{layer.showPopover();}catch{}}
 if(important&&!reduced)phaseTimer=setTimeout(()=>{
   layer.className='screen-signal signal-blackout system-check';
   layer.innerHTML='<span>夜间出行连续性服务 / NIGHT TRAVEL CONTINUITY SERVICE</span><span>正在检查关联乘客 / CHECKING ASSOCIATED PASSENGER</span><span>对象：LIM　　SUBJECT: LIM</span><span>当前记录：2　　EXPECTED RECORDS: 1</span><span class="system-cursor">▮</span>';
 },480);
 effectTimer=setTimeout(()=>{if(typeof layer.hidePopover==='function'){try{layer.hidePopover();}catch{}}layer.hidden=true;layer.textContent='';if(important)corruptPage(reduced,kind);},important&&!reduced?1250:reduced?900:550);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape'){clearTimeout(phaseTimer);clearTimeout(effectTimer);const layer=document.getElementById('screen-signal');try{layer?.hidePopover?.();}catch{}if(layer)layer.hidden=true;clearCorruption();}});

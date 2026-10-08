import {audioStart,audioToggle,audioIncoming,audioPause,audioEnabled} from './sound.js';
import {networkSVG} from './network-data.js';
import {safetyHTML} from './safety-data.js';
import {stationNoteHTML} from './station-notes.js';
import {investigation,investigationHTML,expansionEntry,expansionEnding,migrateState} from './expansion.js';
import {createState,transition,canResolve,duplicateKnown} from './engine.js';
import {stations} from './stations.js';
import {esc,linMessages,incomingCount,conversationHTML,repliesHTML,typingHTML,composerHTML,linBusy,deliveryDelay,photoHTML} from './messages.js';
import {timeGuidance} from './rules.js';
import {playSignal,clearCorruption,stopSignals} from './effects.js';
const $=id=>document.getElementById(id);
const workspace=$('workspace'),dialog=$('modal');
const SAVE='night-travel-mobile-v1';
let gameStarted=false;
let hasSave=false;
let state=createState();
try{const saved=JSON.parse((localStorage.getItem(SAVE)||sessionStorage.getItem('night-travel-demo-v2-expanded')));if(saved?.schema===9&&Array.isArray(saved.chat)&&Array.isArray(saved.seen)&&Array.isArray(saved.asked)){state={...state,...saved};hasSave=true;}}catch{}
state=migrateState(state);
let lastRenderedView='';
let svgSource='',mapRequest=0,restoreFocus=null,modalKind='',chatWindow=null;
let notified=incomingCount(state),notifiedRound=state.round;
const mapView={left:0,top:0,zoom:false};
const drafts={side:'',opening:'',modal:''};
let linTimer=null,scheduledMessage='',lastSignal=state.signal?.id||'';
const receivedInputs=new Set();
const button=(text,action,more='',style='')=>`<button type="button" class="button ${style}" data-action="${action}" ${more}>${text}</button>`;
const stationName=id=>{const s=stations.find(x=>x[0]===id);return s?`${s[1]} / ${s[2]}`:id;};
const heading=(title,description,code='1408 / JOURNEYS')=>`<div class="page-heading"><div><span class="eyebrow">账户服务 / ${state.view==='map'?'线路查询':state.view==='support'?'协助中心':'行程管理'}</span><h1>${title}</h1><p>${description}</p></div><span class="ref">${code}</span></div>`;
function tell(text){$('announcement').textContent=text;}
function act(type,value){state=transition(state,type,value);}
function persist(){if(!gameStarted)return;try{localStorage.setItem(SAVE,JSON.stringify(state));sessionStorage.setItem('night-travel-demo-v2-expanded',JSON.stringify(state));}catch{}}
function chatSnapshot(){return {...state,chat:[],linQueue:state.linQueue.map(m=>({id:m.id}))};}
function scheduleLin(){
 if(!gameStarted||document.hidden)return;
 const head=state.linQueue[0],key=head?state.round+':'+head.id:'';
 if(key===scheduledMessage)return;
 clearTimeout(linTimer);scheduledMessage=key;
 if(!head)return;
 const round=state.round;
 linTimer=setTimeout(()=>{linTimer=null;scheduledMessage='';if(!gameStarted||document.hidden||state.round!==round)return;act('deliver',head.id);refreshLive();},deliveryDelay(head));
}
setInterval(()=>{if(!gameStarted||document.hidden)return;const next=transition(state,'lin-read-receipts');if(next!==state){state=next;updateChatViews();persist();publish();}},200);
function runSignal(){if(state.signal&&state.signal.id!==lastSignal){lastSignal=state.signal.id;playSignal(state.signal.kind);}}
function refreshLive(){renderV2Live();renderSide();updateChatViews();updateSupportOptions();persist();scheduleLin();runSignal();}
function publish(){if(chatWindow&&!chatWindow.closed)chatWindow.postMessage({channel:'nt-lin-v9',type:'snapshot',state:chatSnapshot()},location.origin);}
function updateBadges(){
 const unread=Math.max(0,incomingCount(state)-state.linRead);
 document.querySelectorAll('[data-unread]').forEach(n=>{n.textContent=unread;n.hidden=!unread;});
 document.title=(unread?`(${unread}) 林发来消息 · `:'')+'行程与退款 · 夜间出行账户';
 if(!unread)$('lin-toast').hidden=true;
}
function markRead(){
 const count=incomingCount(state);if(state.linRead>=count)return;
 act('read',count);persist();updateBadges();publish();
}
function chatBody(){return `${v2ChatTools()}<div class="lin-thread" id="modal-lin-thread" role="log" aria-label="与林的消息">${conversationHTML(state)}</div><div class="lin-typing" id="modal-lin-typing" role="status">${typingHTML(state)}</div><div class="lin-replies" id="modal-lin-replies">${repliesHTML(state)}</div>${composerHTML(state,'modal',drafts.modal)}${state.claim?button('查看林分享的行程附件','plan','','secondary'):''}<div class="chat-window-actions">${button('独立窗口打开 ↗','popout','','quiet')}<span>可与账户页并排查看</span></div>`;}
function updateChatViews(){
 const surfaces=[['friend-messages','side-lin-replies','side-lin-typing'],['opening-thread','opening-lin-replies','opening-lin-typing'],['modal-lin-thread','modal-lin-replies','modal-lin-typing']];
 for(const [threadId,repliesId,typingId] of surfaces){
  const thread=$(threadId);if(!thread)continue;
  const nearBottom=thread.scrollHeight-thread.clientHeight-thread.scrollTop<70;
  const content=conversationHTML(state);if(thread.innerHTML!==content)thread.innerHTML=content;
  if(nearBottom)thread.scrollTop=thread.scrollHeight;
  if($(repliesId))$(repliesId).innerHTML=repliesHTML(state);
  if($(typingId))$(typingId).innerHTML=typingHTML(state);
 }
 document.querySelectorAll('[data-lin-compose]').forEach(form=>{form.querySelector('button[type="submit"]').disabled=linBusy(state)||Boolean(state.ending&&!['erasure','replacement'].includes(state.ending));form.querySelector('textarea').disabled=Boolean(state.ending&&!['erasure','replacement'].includes(state.ending));});
 $('lin-attachment').hidden=!state.claim;
 $('friend-status').textContent=state.ending==='erasure'&&!linBusy(state)?'等待回复':linBusy(state)?'正在输入…':state.ending?'23:55 · 刚刚联系':state.proof?'23:54 · 刚刚联系':'在线';
 if(state.opening<3||(dialog.open&&modalKind==='lin'))markRead();
 const count=incomingCount(state);
 if(notifiedRound!==state.round){notifiedRound=state.round;notified=count;$('lin-toast').hidden=true;}
 if(count>notified){
  if(gameStarted)audioIncoming();
  notified=count;
  if(state.opening===3&&!(dialog.open&&modalKind==='lin')){
   const latest=linMessages(state).filter(m=>m.who==='lin').at(-1);
   $('toast-preview').textContent=latest.text;$('toast-time').textContent=latest.time;$('lin-toast').hidden=false;
   tell('林发来消息：'+latest.text);
  }
 }
 updateBadges();publish();
}
function renderSide(){
 $('balance').textContent=state.ending==='refund'?'£10.70':'£4.60';
 const evidence=[];
 if(state.plan)evidence.push(['原始路线与换乘回执','23:28 · 博物馆花园']);
 if(state.compared)evidence.push(['两个雷恩街','站点编号与相邻车站不同']);
 if(state.proof)evidence.push([state.asked.includes('time')?'已提出时间记录疑问':'出站匹配凭证','23:12 / 23:16']);
 if(state.togetherAsked)evidence.push(['林说你们曾一起出站','同行关系尚未核实']);
 if(state.ruleCompared)evidence.push(['更正通知晚于停更时间','23:59 / 23:30']);
 $('evidence-count').textContent=evidence.length;
 $('evidence-list').innerHTML=evidence.length?evidence.map(([name,sub])=>`<p class="evidence-item">${name}<small>${sub}</small></p>`).join(''):'<p class="empty-text">查看记录后，可在这里保留核对结果。</p>';
 $('support-count').hidden=!(state.compared&&!state.asked.includes('duplicate'));
 document.querySelectorAll('.nav-button').forEach(b=>{
  b.disabled=state.opening<3;
  const active=b.dataset.view===state.view||b.dataset.view==='history'&&['claim','resolution','ending'].includes(state.view);
  b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
 });
 document.body.classList.toggle('opening-mode',state.opening<3);
}
function renderOpening(){return `<div class="opening-heading"><span class="eyebrow">23:48 / MESSAGES</span><h1>林发来了一条消息</h1><p>今天本来是很普通的一天。</p></div><section class="panel opening-conversation"><div class="panel-title"><div class="support-identity"><div class="avatar">林</div><div><h2>林</h2><span class="small-note">在线</span></div></div>${button('独立窗口 ↗','popout','','quiet')}</div><div class="lin-thread" id="opening-thread" role="log" aria-label="与林的消息">${conversationHTML(state)}</div><div class="lin-typing" id="opening-lin-typing" role="status">${typingHTML(state)}</div><div class="lin-replies" id="opening-lin-replies">${repliesHTML(state)}</div>${composerHTML(state,'opening',drafts.opening)}</section><p class="small-note">可以输入回复，也可以点选一句话。</p>`;}
function renderHistory(){return heading('行程与退款','查看持卡人的近期行程及扣款记录。')+`<div class="shared-note"><strong>林与你分享了一笔行程。</strong><br>“你能不能帮我看一下。退回来请你喝东西。”</div><section class="panel"><div class="panel-title"><h2>最近行程</h2><span class="ref">SEPTEMBER 2026</span></div><div class="journey-row current"><div class="journey-date">14 SEP<br>23:16</div><div class="journey-route">惠特科姆广场 → —<small>Whitcombe Square · 未找到出站记录</small></div><div class="journey-fare">£8.90<small>Incomplete</small></div></div><div class="panel-content"><span class="badge pending">待补全行程</span><p class="small-note">如果扣款与实际行程不符，可以补充下车站后申请退款。</p><div class="actions">${button(state.claim?'继续处理退款':'查看行程并申请退款','start')}${state.claim?button('查看朋友的附件','plan','','secondary'):''}</div></div><div class="journey-row"><div class="journey-date">14 SEP<br>09:08</div><div class="journey-route">奥德维克 → 惠特科姆广场<small>Alderwick → Whitcombe Square<br>09:08 — 09:32 · 已完成</small></div><div class="journey-fare">£2.80</div></div><div class="journey-row"><div class="journey-date">13 SEP<br>18:41</div><div class="journey-route">博物馆花园 → 奥德维克<small>Museum Gardens → Alderwick<br>18:41 — 19:03 · 已完成</small></div><div class="journey-fare">£2.80</div></div></section><p class="small-note">只显示本次共享范围内的记录。所有时间均为伦敦当地时间。</p>`;}
function renderClaim(){return heading('补充下车站','核对实际行程后，我们将重新计算本次费用。','NT—008 / OPEN')+`<section class="panel"><div class="panel-title"><h2>9 月 14 日 · 夜间行程</h2><span class="badge pending">待补全</span></div><div class="panel-content"><div class="detail-grid"><div><span>已扣金额</span><strong class="amount">£8.90</strong></div><div><span>预计可退金额</span><strong class="amount">£6.10</strong></div></div><div class="timeline"><div class="timeline-item"><strong>惠特科姆广场 / Whitcombe Square</strong><span>23:16 · 进站记录有效</span></div><div class="timeline-item"><strong>博物馆花园 / Museum Gardens</strong><span>23:28 · 换乘记录有效</span></div><div class="timeline-item missing"><strong>尚未确认下车站</strong><span>等待持卡人补充</span></div></div><form id="claim-form"><label for="exit-station">您最后一次离开的车站</label><select id="exit-station" required><option value="">请选择车站</option><option value="alderwick">奥德维克 / Alderwick</option><option value="28">雷恩街 / Wren Street · 记录 A</option><option value="43">雷恩街 / Wren Street · 记录 B</option><option value="unknown">我无法确认下车站</option></select><p class="small-note">候选记录由本次行程自动匹配，尚待核对。</p>${state.formMessage?`<p class="form-feedback" role="status">${state.formMessage}</p>`:''}<div class="actions"><button class="button" type="submit">核对出站记录</button>${button('查看线路图','nav','data-view="map"','secondary')}</div></form></div></section><div class="actions">${button('查看原始附件','plan','','quiet')}${button('联系在线客服','nav','data-view="support"','quiet')}</div>`;}
function stationDetailBase(){
 const id=state.selected,name=stationName(id);
 if(!state.seen.includes(id))return '<h3>车站详情</h3><p>点击地图上的站点，或选择车站查看。</p>';
 if(id==='28')return `<h3>${name}</h3><p>站点编号：CR–28</p><p>相邻车站：惠特科姆广场 ↔ 博物馆花园</p><p>Whitcombe Square ↔ Museum Gardens</p><p>所属区域：Zone 2</p><p>行程当日记录：雷恩街 / Wren Street</p>`;
 if(id==='43')return `<h3>${name}</h3><p>站点编号：NT–00</p><p>相邻车站：博物馆花园 ↔ 边界路</p><p>Museum Gardens ↔ Boundary Road</p><p>所属区域：Zone 1</p><p>行程当日记录：此区间没有车站 <button class="clue-question" data-action="missing-question" aria-label="询问此区间为什么没有车站">?</button></p>${state.mapVersion==='archive'?'<p>此记录来自当前候选列表，未显示于存档线路图。</p>':''}`;
 if(id==='44')return '<h3>???</h3><p>站点编号：……—0</p><p>所属线路：未标注</p><p>位置数据暂不可用。请勿重复请求定位。</p>';
 if(id==='06')return '<h3>斯蒂尔韦尔 / Stillwell</h3><p>站点编号：AL–06</p><p>相邻车站：博物馆花园 ↔ 牛津庭院</p><p>本站未包含在原定返程路线中。</p><p class="faint-record">最近查询状态：等待 · STAY STILL</p>'+button('问问林是否见过这个站','lin-topic','data-topic="stillwell"','quiet');
 const extra=id==='05'?'皇冠线 / 阿尔德线换乘站 · 本次行程有有效换乘记录':id==='01'?'朋友提供的原定下车站':id==='23'?'本次行程的进站站点':id==='03'?'阿尔德线 / 沼泽线换乘站 · 图上未标注站名':'图示车站';
 return `<h3>${esc(name)}</h3><p>站点编号：ST–${id}</p><p>${extra}</p>`;
}
function stationDetail(){return stationDetailBase()+(state.seen.includes(state.selected)?stationNoteHTML(state.selected):'');}
function renderMap(){
 const both=state.seen.includes('28')&&state.seen.includes('43');
 const hasCandidate=duplicateKnown(state);
 const available=stations.filter(([id])=>state.mapVersion==='current'||!['43','44'].includes(id));
 return heading('线路查询','点击车站查看详情，也可以核对行程当日的线路图。','NETWORK / 1—3')+`<div class="map-controls"><div class="segmented" role="group" aria-label="线路图版本"><button data-action="version" data-version="current" aria-pressed="${state.mapVersion==='current'}" class="${state.mapVersion==='current'?'active':''}">当前线路图</button><button data-action="version" data-version="archive" aria-pressed="${state.mapVersion==='archive'}" class="${state.mapVersion==='archive'?'active':''}">行程当日</button></div>${button(mapView.zoom?'适应屏幕':'放大地图','zoom',`aria-pressed="${mapView.zoom}"`,'quiet')}<a class="text-button" href="network.svg" target="_blank" rel="noopener">完整地图 ↗</a></div><div id="network-map" class="map-wrapper ${mapView.zoom?'zoom':''}"><p style="color:#172b52;padding:20px">正在载入线路图…</p></div><div class="map-caption"><span>${state.mapVersion==='archive'?'存档 · 14 SEP / 23:10':'当前服务版本'}</span><span>默认显示全图 · 放大后可拖动</span></div><div class="station-tools"><section class="panel"><div class="panel-content"><form id="station-form"><label for="station-select">查找车站</label><select id="station-select">${available.map(([id])=>`<option value="${id}" ${state.selected===id?'selected':''}>${esc(stationName(id))}${id==='28'?' · A':id==='43'?' · B':''}</option>`).join('')}</select><div class="actions"><button class="button secondary" type="submit">查看站点</button></div></form>${state.claim?`<p class="small-note">退款记录中的两个候选站：</p><div class="actions">${button('雷恩街 · A','inspect','data-station="28"','quiet')}${button('雷恩街 · B','inspect','data-station="43"','quiet')}</div>`:''}</div></section><section class="panel"><div class="panel-content station-detail">${stationDetail()}</div></section></div>${state.claim?`<section class="panel"><div class="panel-title"><h2>候选站点核对</h2><span class="badge">${state.compared?'已保留记录':Number(state.seen.includes('28'))+Number(state.seen.includes('43'))+' / 2'}</span></div><div class="panel-content"><p class="small-note">两条候选记录使用了同一个站名。可直接询问林或客服，再核对它们的位置。</p>${both?'<div class="comparison"><div><strong>雷恩街 A · CR–28</strong><p>惠特科姆广场<br>↔ 博物馆花园</p><p>存档中已有此站</p></div><div><strong>雷恩街 B · NT–00</strong><p>博物馆花园<br>↔ 边界路</p><p>存档中没有此站</p></div></div>':''}<div class="actions">${button('问客服：为什么有两个雷恩街？','submit-duplicate',hasCandidate?'':'disabled')}${button('问林：你也看到两个同名站了吗？','lin-topic',`data-topic="duplicate" ${hasCandidate?'':'disabled'}`,'secondary')}${button('查看朋友的路线','plan','','secondary')}</div></div></section>`:''}`;
}
async function mountMap(){
 const serial=++mapRequest;
 try{
  if(!svgSource)svgSource=networkSVG;
  if(state.view!=='map'||state.ending||serial!==mapRequest)return;
  const doc=new DOMParser().parseFromString(svgSource,'image/svg+xml'),root=doc.documentElement;
  root.setAttribute('aria-label',state.mapVersion==='archive'?'行程当日线路图':'当前线路图');
  if(state.mapVersion==='archive')for(const id of ['43','44']){root.querySelector('#station-'+id)?.remove();root.querySelector('#label-'+id)?.remove();}
  for(const [id]of stations){
   const g=root.querySelector('#station-'+id);if(!g)continue;
   const marker=g.firstElementChild;let x,y;
   if(marker.tagName==='circle'){x=Number(marker.getAttribute('cx'));y=Number(marker.getAttribute('cy'));}
   else{const match=marker.getAttribute('d').match(/M\s*([\d.]+)[ ,]+([\d.]+)/);if(!match)continue;x=+match[1];y=+match[2];}
   const target=doc.createElementNS('http://www.w3.org/2000/svg','circle');
   target.setAttribute('cx',x);target.setAttribute('cy',y);target.setAttribute('r','21');target.setAttribute('fill','transparent');target.setAttribute('class','station-hit');g.appendChild(target);
   g.setAttribute('role','button');g.setAttribute('tabindex','0');g.setAttribute('aria-label',stationName(id)+'，查看车站');g.setAttribute('data-action','inspect');g.setAttribute('data-station',id);
   if(id===state.selected&&state.seen.includes(id))g.classList.add('selected');
  }
  $('network-map').replaceChildren(document.importNode(root,true));$('network-map').scrollLeft=mapView.left;$('network-map').scrollTop=mapView.top;
 }catch{if($('network-map'))$('network-map').innerHTML='<p style="color:#172b52;padding:20px">线路图暂时无法载入。仍可通过下方车站查询核对记录。</p>';}
}
function addChat(question,answer,attachment=false){state.chat.push({who:'me',text:question},{who:'agent',text:answer,attachment});}
function pendingCheck(){
 if(!state.plan)return button('核对林发来的原始附件','plan');
 if(!state.togetherAsked)return button('附件显示未出站，问问林','lin-topic','data-topic="together"');
 if(!duplicateKnown(state))return button('查看候选站点','nav','data-view="map"');
 if(!state.asked.includes('duplicate'))return button('为什么有两个一模一样的站名？','ask','data-question="duplicate"');
 if(!state.proof)return button('查看出站匹配凭证','proof');
 if(!state.asked.includes('time'))return button('核对凭证时间','proof');
 if(!state.ruleCompared)return button('查看乘客安全须知','rules');
 if(!state.linChecked)return button('问问林现在的情况','open-chat');
 if(!state.v2.shared||!state.v2.routeChecked)return button('对照共享位置与客服路线','v2-location');
 if(state.v2.hotline<2)return button('尝试夜间帮助热线','v2-call');
 return linBusy(state)?'<p class="small-note">林正在回复你的消息…</p>':'';
}
function supportOptions(){
 if(investigation(state).rescued)return expansionEntry(state);
 if(!state.claim)return button('查看 14 日的未完成行程','start');
 let options=v2SupportOptions()+expansionEntry(state);
 if(state.proof&&state.v2.refusals<3)options+=button('仍无法确认到达，保留行程','v2-refuse','','secondary');
 if(!state.asked.includes('where'))options+=button('我找不到正确的下车站','ask','data-question="where"');
 options+=pendingCheck();
 if(duplicateKnown(state)&&!state.asked.includes('duplicate'))options+=button('地图上为什么有两个雷恩街？','ask','data-question="duplicate"','secondary');
 if(state.asked.includes('duplicate')&&state.proof)options+=button('重新查看出站凭证','proof','','secondary');
 if(state.asked.includes('time'))options+=button('查阅安全须知的更正说明','rules','','secondary');
 if(canResolve(state))options+=`<p class="decision-label">请选择本次行程的处理方式</p>${button('保留原始行程，申请返回','request-preserve','','secondary')}`;
 return options+'<p class="chat-note">选择一条消息继续会话。</p>';
}
function updateSupportOptions(){const options=$('support-options');if(options)options.innerHTML=supportOptions();}
function supportText(item){
 if(item.text.includes('请不要反复核对同一位同行人员'))return esc(item.text).replace('请不要反复核对同一位同行人员', '<button type="button" class="rule-probe-link" data-action="v2-rule-probe">请不要反复核对同一位同行人员</button>');
 if(!item.leakUntil||Date.now()>=item.leakUntil)return item.text;
 return item.text.replace('行程',`<span class="terminology"><span class="term-leak">副本</span><span class="term-normal">行程</span></span>`);
}
function renderSupport(){
 const log=state.chat.length?state.chat:[{who:'agent',text:'您好，夜间账户服务为您提供协助。请问您需要处理哪笔行程？'}];
 return heading('在线客服','与夜间账户服务核对本次行程。','CASE / NT—008')+`<section class="panel"><div class="panel-title"><div class="support-identity"><div class="operator-avatar">N08</div><div><h2>夜间账户服务</h2><span class="small-note">正在处理你的请求</span></div></div><span class="badge">会话已连接</span></div><div class="chat-log" id="chat-log" role="log" aria-label="客服聊天记录">${log.map(item=>`<div class="chat-line ${item.who==='me'?'me':''}"><span class="who">${item.who==='me'?'你':'夜间账户服务'}</span><p>${supportText(item)}</p>${item.attachment?'<button class="receipt-link" data-action="proof">↳ 出站匹配凭证 · NT-008-R<br><small>查看文件</small></button>':''}</div>`).join('')}</div><div class="chat-options" id="support-options">${supportOptions()}</div></section>`;
}
function renderResolution(){if(investigation(state).rescued)return investigationHTML({...state,v3:{...investigation(state),panel:'aftermath'}});if(state.v2.checkpoint)return v2Checkpoint(); return v2ReturnTools()+heading('保留原始行程','请指定最后一次能够确认的车站。','NT—008 / RETAINED')+`<div class="shared-note">夜间账户服务：可以保留本次行程。返回请求需要匹配一条有效刷卡记录。费用将在行程结束后重新核算。</div><section class="panel"><div class="panel-title"><h2>提交返回请求</h2><span class="badge pending">原行程尚未关闭</span></div><div class="panel-content"><p>请使用持卡人提供的原始记录。原定目的地可能尚未到达。</p><form id="return-form"><label for="return-station">最近一次已确认的车站</label><select id="return-station" required><option value="">选择车站</option><option value="alderwick">奥德维克 / Alderwick</option><option value="museum">博物馆花园 / Museum Gardens</option><option value="wren">雷恩街 / Wren Street</option><option value="whitcombe">惠特科姆广场 / Whitcombe Square</option></select>${state.formMessage?`<p class="form-feedback" role="status">${state.formMessage}</p>`:''}<div class="actions"><button class="button" type="submit">保留行程并请求返回</button>${button('核对原始附件','plan','','secondary')}</div></form><p class="tip">关闭原行程后，将无法使用本次进站记录申请返回。</p></div></section>`;}
function renderEnding(){return expansionEnding(state)||v2Ending();}
function render(){
 document.body.dataset.view=state.view;
 if(lastRenderedView!==state.view){workspace.scrollTop=0;lastRenderedView=state.view;}
 const previousMap=$('network-map');if(previousMap){mapView.left=previousMap.scrollLeft;mapView.top=previousMap.scrollTop;}
 renderSide();workspace.innerHTML=state.ending?renderEnding():({opening:renderOpening,history:renderHistory,claim:renderClaim,map:renderMap,support:renderSupport,resolution:renderResolution}[state.view]||renderHistory)();
 if(state.view==='map'&&!state.ending)mountMap();
 renderV2Live();
 if(state.opening<3){const thread=$('opening-thread');if(thread)thread.scrollTop=thread.scrollHeight;}
 const chat=$('chat-log');if(chat)chat.scrollTop=chat.scrollHeight;
 persist();updateChatViews();scheduleLin();runSignal();
}
function modal(title,body,category='行程档案',kind='document'){
 restoreFocus=document.activeElement;modalKind=kind;
 dialog.dataset.kind=kind;document.body.classList.add('has-modal');
 $('modal-category').textContent=kind==='lin'?'林 · 消息':category;$('modal-body').innerHTML=`<h2>${title}</h2>${body}`;
 $('modal-body').scrollTop=0;
 if(!dialog.open)dialog.showModal();
}
function closeModal(userInitiated=false){dialog.close();modalKind='';document.body.classList.remove('has-modal');if(restoreFocus?.isConnected)restoreFocus.focus({preventScroll:true});}
function openChat(){act('v2-chat-open');refreshLive();modal('林',chatBody(),'MESSAGES / 23:48 — 23:55','lin');markRead();const thread=$('modal-lin-thread');thread.scrollTop=thread.scrollHeight;}
function openChatWindow(){
 if(window.LAST_TRAIN_MINITOOL||window.matchMedia('(max-width:760px)').matches){openChat();return;}
 act('v2-chat-open');refreshLive();
 if(chatWindow&&!chatWindow.closed){chatWindow.focus();publish();return;}
 chatWindow=window.open('chat.html','night-travel-lin-'+state.round,'popup=yes,width=440,height=760,resizable=yes,scrollbars=yes');
 if(!chatWindow){openChat();tell('浏览器没有打开独立窗口，已在当前页面显示聊天。');return;}
 if(dialog.open&&modalKind==='lin')closeModal();
 publish();tell('林的聊天已在独立窗口打开，可与账户页并排查看。');
}
function showPlan(){if(state.ending==='reference'){modal('附件已同步','<p>原始换乘回执已被一致版本覆盖。当前版本没有可用于返回的通道编号。</p>'+button('关闭','close'),'统一记录');return;}
 if(state.opening<3)return;
 act('plan');render();
 modal('林分享的行程附件',`<span class="eyebrow">01 / 出发前保存的路线 · 14 SEP 23:10</span><div class="paper"><strong>惠特科姆广场 → 奥德维克</strong><p>Whitcombe Square → Alderwick<br>约 24 分钟 · 1 次换乘</p><div class="timeline"><div class="timeline-item"><strong>惠特科姆广场 / Whitcombe Square</strong><span>皇冠线 / Crown line</span></div><div class="timeline-item"><strong>雷恩街 / Wren Street</strong><span>CR–28 · 途经站</span></div><div class="timeline-item"><strong>博物馆花园 / Museum Gardens</strong><span>换乘阿尔德线，向奥德维克方向</span></div><div class="timeline-item"><strong>奥德维克 / Alderwick</strong><span>原定下车站</span><button class="unexited-clue" data-action="lin-topic" data-topic="together">未出站 · 询问林 ↗</button></div></div><small>保存在林的手机中 · 23:10</small></div><span class="eyebrow">02 / 原始换乘回执</span><div class="paper"><strong>TRANSFER ACCEPTED / 换乘有效</strong><div class="paper-line">CARD: •••• 1408<br>14 SEP 2026 / 23:28<br>博物馆花园 / MUSEUM GARDENS<br>READER: MG-04<br>STATUS: VALID</div><p>请保留本回执至行程结束。</p></div><p class="small-note">此附件为朋友发送的副本，不会随线路查询页面更新。</p>${button('返回核对','close')}`,'共享附件 / M. LIN');tell('原始路线和换乘回执已加入核对记录。');
}
function showProof(){
 if(!state.asked.includes('duplicate'))return;
 if(!state.proof){act('proof');refreshLive();}
 modal('出站匹配凭证',`<p>夜间账户服务提供 · 14 SEP 2026</p><div class="paper"><strong>JOURNEY MATCH / NT-008-R</strong><table class="receipt-table"><tr><th>持卡人</th><td>M. LIN</td></tr><tr><th>卡号末位</th><td>1408</td></tr><tr><th>本次进站</th><td>14 SEP · 23:16<br>惠特科姆广场 / Whitcombe Square</td></tr><tr><th>匹配出站</th><td>14 SEP · 23:12 <button type="button" class="clue-question" data-action="time-question" aria-label="核对这个时间">?</button><br>雷恩街 / Wren Street · NT–00</td></tr><tr><th>核验依据</th><td>姓名与卡号一致</td></tr><tr><th>处理方式</th><td>确认后代入原行程</td></tr></table><p>确认后将关闭原行程。原始进站记录不再用于返回申请。</p><small>所有时间均为伦敦当地时间。</small></div><div class="actions">${button('返回会话','close','','secondary')}</div>`,'夜间账户服务 / 匹配记录');
}
function missingQuestion(){modal('此区间没有车站？',`<p>行程当日，博物馆花园与边界路之间没有可供乘客停靠的站台。当前版本却在同一区间标注了雷恩街。</p><div class="actions">${button('问林：你在那里看到了什么？','lin-topic','data-topic="missing"')}${button('问客服：这个站哪里来的？','ask','data-question="missing"','secondary')}</div><p class="small-note">乘客安全须知：站台具有完整的照明与候车人员，不代表它对外开放。</p>`,'站点核对');}
function showRules(){
 if(!state.proof)return;act('rules');persist();
 modal('乘客安全须知',`<section class="rule-excerpt"><span class="eyebrow">原安全提示 / 夜间出行信息处</span><p>${timeGuidance.platform}</p><p>请在进站前记录出发站、原定换乘站及预计乘车时间。请勿修改原有记录。</p></section><section class="rule-excerpt amended-rule"><span class="eyebrow">补充更正 / 乘客接返办公室 / 23:59</span><h3>${timeGuidance.title}</h3><p>${timeGuidance.normal}</p><p>${timeGuidance.detail}</p><p>${timeGuidance.last}</p></section><section class="rule-excerpt"><span class="eyebrow">页面维护记录 / 23:30</span><p>${timeGuidance.maintenance}</p></section><div class="actions">${button('这条更正在停止更新之后发布','rule-compare')}${button('查看其他相关规则','v2-rules','','secondary')}${button('返回会话','close','','secondary')}</div><p class="small-note"><a href="../#time-guidance" target="_blank" rel="noopener">阅读完整安全须知 ↗</a></p>`,'NT—008 / 行程时间');
}
function ask(q){
 if(state.asked.includes(q)){if(dialog.open)closeModal();state.view='support';render();return;}
 if(q==='where'&&state.claim)addChat('我找不到正确的下车站。','候选站点依据您的账户记录生成。请核对两个雷恩街 / Wren Street。姓名与卡号匹配的乘客，应当具有可以确认的终点。');
 else if(q==='duplicate'&&duplicateKnown(state)){
  addChat('为什么地图上有两个雷恩街？它们是同一个站吗？','我们正在核对林的行程。两处名称一致，便于同一批次乘客继续识别原有目的地。站点的具体位置不影响账户结算。请查看出站凭证。',true);
  state.chat.at(-1).leakUntil=Date.now()+850;
 }
 else if(q==='missing'&&state.claim)addChat('行程当日这两站之间没有车站，新的雷恩街是哪里来的？','该站尚未完成对外准备。已到达的乘客不受此状态影响。请勿要求乘客描述站台之外的环境。');
 else if(q==='time'&&state.proof)addChat('出站时间是 23:12，进站是 23:16。为什么出站在进站之前？','我们的数据是完全正确的。到达已完成，出发将按顺序补齐。请查看《乘客安全须知》中关于行程时间的更正。您无需为记忆与记录之间的差异承担额外费用。');
 else if(q==='rules'&&state.ruleCompared)addChat('页面 23:30 就停止更新了，为什么有一条 23:59 的更正？','通知的发布时间不会晚于您被确认到达的时间。如您无法确认，请以已完成的记录为准。请不要反复核对同一位同行人员。');
 else return;
 act('ask',q);if(dialog.open)closeModal();state.view='support';render();
}
function reset(){clearCorruption();if(dialog.open)closeModal();clearTimeout(linTimer);scheduledMessage='';state=createState();Object.assign(drafts,{side:'',opening:'',modal:''});Object.assign(mapView,{left:0,top:0,zoom:false});render();workspace.focus();}
function reply(step,text){act('opening',text?{step,text}:step);render();if(state.opening===3&&dialog.open&&modalKind==='lin')closeModal();}
function checkLin(){act('check-lin');refreshLive();}
function linTopic(topic){
 const questions={together:'附件里奥德维克标着未出站，你到底出去了吗？',memory:'我不记得我们一起坐过。',duplicate:'地图上有两个一模一样的雷恩街，你那边也是吗？',missing:'地图上这两站之间没有车站，你那边看到了什么？',stillwell:'你今天去过斯蒂尔韦尔吗？'};
 act('lin-topic',{topic,question:questions[topic]||topic});refreshLive();openChat();
}
function sendLinText(text){
 text=String(text).trim().slice(0,320);if(!text||(state.ending&&!['erasure','replacement'].includes(state.ending))||linBusy(state))return false;
 if(state.opening<3)reply(state.opening,text);else{act('lin-text',text);refreshLive();}return true;
}
function onAction(b){
 const a=b.dataset.action;
 if(a==='full-rules'){modal('乘客安全须知',safetyHTML,'NIGHT TRAVEL / 规则档案');return;}
 if(a==='mobile-evidence'){modal('本次核对',$('evidence-list').innerHTML,'1408 / 已保留记录');return;}
 if(a==='mobile-menu'){openMenu();return;}
 if(a.startsWith('v3-')){handleV3(a,b.dataset.value);return;}
 if(a.startsWith('v2-')){handleV2(a,b.dataset.value);return;}
 if(a==='nav'){act('nav',b.dataset.view);render();workspace.focus();}
 else if(a==='start'){act('start');state.formMessage='';render();workspace.focus();}
 else if(a==='plan')showPlan();
 else if(a==='close')closeModal(true);
 else if(a==='open-chat')openChat();
 else if(a==='popout')openChatWindow();
 else if(a==='lin-reply')reply(Number(b.dataset.step));
 else if(a==='check-lin')checkLin();
 else if(a==='lin-topic')linTopic(b.dataset.topic);
 else if(a==='missing-question')missingQuestion();
 else if(a==='rules')showRules();
 else if(a==='rule-compare'){act('rule-compare');ask('rules');}
 else if(a==='dismiss-toast')$('lin-toast').hidden=true;
 else if(a==='inspect'){act('inspect',b.dataset.station);render();tell('已查看 '+stationName(b.dataset.station)+'。');}
 else if(a==='version'){act('mapVersion',b.dataset.version);render();}
 else if(a==='zoom'){mapView.zoom=!mapView.zoom;$('network-map').classList.toggle('zoom',mapView.zoom);b.textContent=mapView.zoom?'适应屏幕':'放大地图';b.setAttribute('aria-pressed',String(mapView.zoom));}
 else if(a==='compare'){act('compare');render();tell('不同站点的核对结果已保存。');}
 else if(a==='submit-duplicate')ask('duplicate');
 else if(a==='ask')ask(b.dataset.question);
 else if(a==='proof')showProof();
 else if(a==='time-question')modal('时间记录',`<div class="paper"><p>进站记录　14 SEP · 23:16</p><p>匹配出站　14 SEP · 23:12</p><small>同一持卡人 · 伦敦当地时间</small></div><div class="actions">${button('请客服解释这两个时间','ask','data-question="time"')}${button('再看一下凭证','proof','','secondary')}</div>`,'凭证核对');
 else if(a==='request-preserve'){act('preserve');state.formMessage='';render();workspace.focus();}

 else if(a==='hint')hint();
 else if(a==='restart'){
  if(state.ending)reset();
  else modal('重新开始这笔行程？',`<p>将清空这次行程的核对记录，并回到林发来第一条消息的时候。独立聊天窗口也会同步重置。</p><div class="actions">${button('重新开始','reset-confirm')}${button('继续当前进度','close','','secondary')}</div>`,'行程控制');
 }
 else if(a==='reset-confirm')reset();

}
function receiveChat(event){
 const d=event.data;
 if(event.origin!==location.origin||d?.channel!=='nt-lin-v9'||!event.source)return;
 if(d.type==='hello'){
  // Only the chat document opened by this account can establish a connection.
  try{if(event.source.opener!==window||!event.source.location.pathname.endsWith('/journey/chat.html'))return;}catch{return;}
  chatWindow=event.source;publish();return;
 }
 if(event.source!==chatWindow||d.round!==state.round)return;
 if(d.type==='text'){
  const key=state.round+':'+d.id;if(receivedInputs.has(key))return;receivedInputs.add(key);
  const accepted=typeof d.text==='string'&&sendLinText(d.text);chatWindow.postMessage({channel:'nt-lin-v9',type:'input-result',id:d.id,round:state.round,accepted},location.origin);
 }else if(d.type==='read')markRead();
 else if(d.type==='reply'&&Number.isInteger(d.step))reply(d.step);
 else if(d.type==='end-chat')handleV2('v2-end-chat');
 else if(d.type==='resume-chat'){act('v2-chat-open');refreshLive();}
 else if(d.type==='check-lin')checkLin();
 else if(d.type==='topic')linTopic(d.topic);
 else if(d.type==='plan'){showPlan();window.focus();}
}
window.addEventListener('message',receiveChat);
setInterval(()=>{if(chatWindow?.closed){chatWindow=null;tell('独立聊天窗口已关闭，仍可在此页查看林的消息。');}else publish();},3000);
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled){e.preventDefault();onAction(b);}});
document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){const b=e.target.closest('[role="button"][data-action]');if(b){e.preventDefault();onAction(b);}}});

document.addEventListener('input',e=>{if(e.target.dataset.linInput)drafts[e.target.dataset.linInput]=e.target.value;});
document.addEventListener('keydown',e=>{if(e.target.matches?.('[data-lin-input]')&&e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();if(!linBusy(state))e.target.form.requestSubmit();}});
document.addEventListener('submit',e=>{
 e.preventDefault();
 if(e.target.dataset.linCompose){const name=e.target.dataset.linCompose,input=e.target.querySelector('textarea');const text=input.value;if(sendLinText(text)){drafts[name]='';const current=$('lin-input-'+name);if(current){current.value='';current.focus();}}return;}
 if(e.target.id==='claim-form'){
  const station=$('exit-station').value;
  if(station==='alderwick'){state.formMessage='没有找到奥德维克的有效出站记录。系统匹配到两个雷恩街；请核对线路图，或联系在线客服。';render();}
  else if(station==='unknown'){state.view='map';render();}
  else if(['28','43'].includes(station)){act('inspect',station);state.view='map';render();tell('请核对这条候选记录的站点位置。');}
 }
 else if(e.target.id==='station-form'){act('inspect',$('station-select').value);render();}
 else if(e.target.id==='return-form'){
  const station=$('return-station').value;
  if(station!=='museum'){state.formMessage='该站不是本次行程最近一次有效换乘记录。请核对原始附件中的站名和时间。';render();}
  else{act('return',station);render();workspace.focus();}
 }

});
dialog.addEventListener('cancel',e=>{e.preventDefault();closeModal(true);});
dialog.addEventListener('close',()=>{modalKind='';document.body.classList.remove('has-modal');});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal(true);}});
setupV2();
initStartScreen();
let erasureQuietAt=0;
setInterval(()=>{if(!gameStarted||state.ending!=='erasure'||linBusy(state)){erasureQuietAt=0;return;}if((state.v2.erasureStep||0)>=12||document.hidden)return;if(!erasureQuietAt){erasureQuietAt=Date.now();return;}if(Date.now()-erasureQuietAt<2400)return;act('v2-erasure-tick');if(state.v2.erasureStep>=12)render();else refreshLive();publish();},90);

function v2ChatTools(){if(state.ending==='erasure')return '';if(state.ending==='replacement')return '<p class="small-note">接返关联仍在线。</p>';return `<details class="chat-extra"><summary>位置、附件与更多话题</summary><div class="v2-chat-tools">${!state.ending?button('暂时结束聊天','v2-end-chat','','end-conversation'):''}${button('共享位置','v2-location','','quiet')}${button('问换乘经过','v2-topic','data-value="你换乘时下车了吗？"','quiet')}${button('先别退款了','v2-topic','data-value="先别退款了，你先出来。"','quiet')}${button('发张照片看看','v2-topic','data-value="发张照片看看"','quiet')}${state.v2.photo?button('查看换乘照片','v2-photo','','quiet'):''}${button('你真的是林吗？','v2-topic','data-value="你真的是林吗？"','quiet')}</div></details>`;}
function renderV2Live(){
 renderLocationPin();
 if(modalKind==='investigation'){const field=$('v3-channel'),code=field?.value,focused=document.activeElement===field,expanded=$('modal-body').querySelector('details')?.open;$('modal-body').innerHTML=investigationHTML(state);if(code&&$('v3-channel'))$('v3-channel').value=code;if(focused&&$('v3-channel'))$('v3-channel').focus();if(expanded&&$('modal-body').querySelector('details'))$('modal-body').querySelector('details').open=true;}
 const side=$('v2-side-tools');if(side)side.innerHTML=state.claim?`${button('查看共享位置','v2-location','','secondary')}${!state.ending?button(state.v2.chatPaused?'重新联系林':'暂时结束聊天',state.v2.chatPaused?'open-chat':'v2-end-chat','','end-conversation'):''}<p class="small-note">${state.v2.shared?'林正在与你共享位置':'可请求林共享位置'}</p>`:'';
 if(modalKind==='location'){$('modal-body').innerHTML=locationHTML();updateLocationTelemetry();}
 if(modalKind==='hotline')$('modal-body').innerHTML=hotlineHTML();
 const status=$('v2-live-note');if(status)status.textContent=state.v2.stability<2?'消息偶有缺失 · 连接保持中':'联系保持中';
}
function locationHTML(){const v=state.v2;const n=v.observation;return `<h2>林的位置</h2><p class="small-note">接收林的位置不会共享你的位置。</p><p class="small-note">${v.shared?'位置共享中 · 地下定位精度较低':'等待开启位置共享'}</p><div class="location-map" aria-label="故事中的站内位置示意，不读取真实定位"><svg viewBox="0 0 640 340" role="img" aria-label="博物馆花园附近，林的位置与接返预计路线"><rect width="640" height="340" fill="#101d2a"/><g stroke="#25384a" stroke-width="25" fill="none"><path d="M0 70H270L390 190H640M100 0V340M450 0V340M0 290H640"/></g><path d="M40 210H240L310 140H540" fill="none" stroke="#55769c" stroke-width="3" stroke-dasharray="6 8"/><g fill="#bdcddd" font-size="17" font-family="sans-serif"><text x="30" y="46">博物馆花园</text><text x="430" y="118">雷恩街</text><text x="440" y="322">旧换乘通道 · MG-04</text></g><circle data-live-accuracy cx="280" cy="190" r="${n?42:82}" fill="#568fed" opacity=".12"/><circle data-live-lin cx="280" cy="190" r="14" fill="#9dc1ff" stroke="#fff" stroke-width="3"/><text data-live-label x="280" y="166" text-anchor="middle" fill="#fff" font-size="18">林</text>${n>=2?`<circle data-live-expected cx="${360+(n-2)*110}" cy="140" r="11" fill="#e0bb76"/><text data-live-expected-label x="${360+(n-2)*110}" y="174" text-anchor="middle" fill="#e0bb76" font-size="15">接返预计位置</text>`:''}${v.ownLocation?'<circle cx="306" cy="201" r="10" fill="#97d6b4"/><text x="315" y="224" fill="#97d6b4" font-size="17">你</text>':''}</svg></div><div class="location-meta"><span>林的设备<br><strong>${n>=2?'已停止移动':'定位接收中'}</strong></span><span>最近更新<br><strong data-live-time>${['尚未查询','23:51:08','23:51:42','23:52:16'][n]}</strong></span><span>预计步行<br><strong>${v.violations.includes('shortcut')?'3 分钟':'18 分钟'}</strong></span></div>${n>=2?'<p class="notice">黄色标记来自账户接返服务；蓝色标记来自林的设备。两者使用不同数据来源。</p>':''}<div class="actions">${v.shared?button(v.pinned?'取消固定小窗':'固定位置小窗','v2-pin','','secondary'):''}${v.shared?button(n>=3?'查看最后一次位置':'请求更新位置','v2-observe',n>=3?'disabled':''):button('请林共享位置','v2-share')}${button(v.ownLocation?'我的位置已交给接返服务':v.ownDeclined?'重新查看位置授权':'共享我的位置…','v2-own-review',v.ownLocation?'disabled':'','secondary')}${button('换乘照片附件','v2-photo','','secondary')}${button('回到聊天','open-chat','','quiet')}</div>${v.routeChecked?`<p class="small-note">路线服务找到更短的路径。请先核对安全提示第七条。</p>${button('查看近路与相关规则','v2-risk','data-value="shortcut"','secondary')}`:''}${safetyLink()}`;}
function safetyLink(){return `<div class="actions">${button('阅读相关安全提示','v2-rules','','quiet')}</div>`;}
function hotlineHTML(){const n=state.v2.hotline;return `<h2>夜间帮助热线</h2><div class="hotline-card"><span class="eyebrow">NIGHT ASSISTANCE</span><strong>${n>=3?'服务已结束':n===2?'102':'103'}</strong><p>${n>=3?'您的排队位置将被保留。':'您当前的排队位置'}</p><p>预计等待时间：8 小时</p><p>${n>=3?'我们很快就会为您服务。':'本热线将于几分钟后结束服务。请前往出口。'}</p></div><p class="small-note">You are number ${n===2?'102':'103'} in the queue. The approximate waiting time is 8 hours. Please make your way to the exit.</p><div class="actions">${n===1?button('查询排队进度','v2-hotline-next'):n===2?button('继续等待接通','v2-hotline-end'):''}${button('保留排队，继续查记录','close','','secondary')}</div><p class="small-note">可以离开此窗口，排队记录会保留。</p>`;}
function v2SupportOptions(){if(!state.claim)return '';return `<details class="support-more"><summary>其他帮助与复核</summary><div class="actions">${button('查询位置','v2-support','data-value="location"','secondary')}${button('报告危险','v2-support','data-value="danger"','secondary')}${button('只确认保持联系','v2-support','data-value="identity"','secondary')}${button('定位为什么在移动','v2-support','data-value="records"','secondary')}${button('夜间帮助热线','v2-call','','secondary')}${button('提交／查看投诉','v2-complaints','','secondary')}${state.proof?button('核验同行人员','v2-risk','data-value="verify"','secondary')+button('申请住所接返','v2-risk','data-value="address"','secondary'):''}</div><form id="v2-support-form"><label for="support-input">补充您的问题</label><input id="support-input" maxlength="200" placeholder="位置、危险、人工、暂停退款…" required><button class="button secondary">发送</button></form></details>`;}
function v2ReturnTools(){const v=state.v2;return `<section class="panel"><div class="panel-content"><h2>返回前核对</h2><p>请先保留争议记录，再与林确认原始通道。</p><div class="actions">${button(v.dispute?'复核已受理':'申请争议复核','v2-complaints','','secondary')}${button('查看换乘照片记录','v2-photo','','secondary')}${button(v.recovered?'已确认 MG-04':'请林寻找照片中的 MG-04','v2-recover',v.dispute&&v.photo&&!v.recovered?'':'disabled')}</div>${v.recovered?'<p>林已找到旧通道。请使用有效换乘回执申请返回。</p>':''}</div></section>`;}
function v2Checkpoint(){if(state.v2.checkpoint===2)return heading('原通道已确认','请核对随身物品和当前状态，再让林继续前进。')+`<section class="panel"><div class="panel-content"><h2>楼梯就在前面</h2><p>旧通道还在。先听听林看到了什么。</p>${button(investigation(state).rescue?'继续协助林出站':'沿原通道继续，保持联系',investigation(state).rescue?'v3-open':'v2-finish','data-value="rescue"')}</div></section>`;return heading('返回请求已受理','请保持联系，确认乘客通过原始通道。')+`<section class="panel"><div class="panel-content"><h2>${state.v2.checkpoint===1?'林走到了一个岔路':'旧通道已确认'}</h2><p>${state.v2.checkpoint===1?'新出口标识向下，刚刚辨认出的 MG-04 换乘通道在身后。':'林已退回 MG-04，可以沿刚才走过的换乘通道返回。'}</p>${safetyLink()}<div class="actions">${state.v2.checkpoint===1?button('跟随新的出口牌','v2-unsafe','','secondary')+button('原路退回，不再参考新标识','v2-safe'):button('沿原通道返回地面，保持联系','v2-finish')}</div></div></section>`;}
function v2Ending(){if(state.ending==='erasure')return heading('通信记录同步中','请保持当前窗口开启。','NT—008 / RECORD SYNC')+`<section class="panel end-paper"><span class="stamp">识别请求已受理</span><h2>${state.v2.erasureStep>=12?'已读':'正在同步关联对象'}</h2><p>${state.v2.erasureStep>=12?'服务已结束。未收到乘客回复。':'客服：记录正在修正，无需重复提交。'}</p>${button('查看林的消息','open-chat')}<p class="small-note">${state.v2.erasureStep>=12?'你发出的消息仍然保留。':'原始聊天记录正在同步。'}</p>${state.v2.erasureStep>=12?button('重新体验','restart','','secondary'):''}</section>`;return ''; }
function handleV2(a,value){
 if(a==='v2-settings'){modal('画面设置',`${button(state.v2.reduced?'恢复标准画面效果':'减弱惊吓与动态效果','v2-reduced','','secondary')}<p class="small-note">${state.v2.reduced?'已减弱画面效果。':'画面包含短暂遮黑与文字异常。'}</p>${button('关闭','close')}`);return;}
 if(a==='v2-reduced'){act(a);persist();handleV2('v2-settings');return;}
 if(state.opening<3){tell('先回复林的开场消息。');return;}
 if(a==='v2-end-chat'){act('v2-chat-close');if(dialog.open&&modalKind==='lin')closeModal();refreshLive();tell('聊天暂时结束。仍可重新打开与林联系。');return;}
 if(a==='v2-topic'){if(sendLinText(value))openChat();return;}
 if(a==='v2-own-review'){act(a);persist();modal('将你的位置交给谁？',`<p>接收方：夜间乘客接返服务。林已共享自己的位置；你可以只查看，不必回传。</p><p>接返条款：所提供的位置将作为同行批次的空间参照，并用于安排接返地点。</p><blockquote>第二十条：您只需提供站名，不必提供住址。</blockquote><div class="actions">${button('不共享，只查看林的位置','v2-own-decline')}${button('仍提供位置给接返服务','v2-own','','secondary')}</div>`,'位置授权');return;}
 if(a==='v2-own-decline'||a==='v2-own'){act(a);refreshLive();if(a==='v2-own'){closeModal();openChat();}else handleV2('v2-location');return;}
 if(a==='v2-location'){modal('共享位置',locationHTML(),'MESSAGES / LOCATION','location');updateLocationTelemetry();return;}
 if(a==='v2-pin'||a==='v2-pin-collapse'){act(a);refreshLive();return;}
 if(a==='v2-rule-probe'){act(a);refreshLive();modal('核对请求已记录','<p class="corrupt-record">关联人员：林 / …</p><p>同一对象的重复核验将合并处理。</p><p>林正在发来消息。</p>'+button('查看林的消息','open-chat'),'同行记录');return;}
 if(a==='v2-rules'){modal('相关安全提示',`<p class="small-note">夜间出行信息处 · 请结合现场情况判断。以下为原提示节选。</p><ol class="rule-list"><li value="2">如遇行为异常的人，请不要表现出您已经注意到他们。不要注视，不要回应，并逐渐远离。</li><li value="7">若地图显示的乘车时间明显缩短，请立即关闭地图，远离其指定的乘车地点。</li><li value="10">若出口标识将您引向更深的地下，请原路返回。原路返回时，请勿再次参考出口标识。</li><li value="12">请勿通过倒影确认车厢内的人数。如您已经发现人数不符，请勿再用其他方式核对。</li><li value="19">请勿回应任何叫出您姓名的乘客。</li><li value="20">您只需提供站名，不必提供住址。</li></ol><p>以上规定的适用情境并不相同。规则文本与客服解释也可能冲突，请保留原始记录。</p><a href="../" target="_blank" rel="noopener">阅读完整原文 ↗</a><div class="actions">${button('回到调查','close')}</div>`,'安全须知 / 原文节选');return;}
 if(a==='v2-risk'&&value==='verify'){if(linBusy(state)){tell('请先等林说完。');return;}act('v2-reidentify-warn');refreshLive();modal('重新核验同行人员',`<p>此操作将以新的识别结果覆盖原始通信关联。旧消息及附件可能无法保留。</p><p>请先阅读林发来的消息。只确认保持联系，无需重新识别。</p>${button('先看林的消息','open-chat')}${button('仍要查看核验授权','v2-reidentify-review','','secondary')}${button('撤回，保留原始联系','close','','secondary')}`);return;}
 if(a==='v2-reidentify-review'){if(linBusy(state)){tell('林还在发消息，请先读完。');return;}modal('授权覆盖原始关联？',`<p>林已经请求停止核验。继续后，旧通信关联可能失效，本轮无法撤销。</p>${button('撤回，保持联系','close')}${button('授权重新识别并覆盖记录','v2-reidentify-confirm','','secondary')}`);return;}
 if(a==='v2-reidentify-confirm'){act(a);if(state.ending==='erasure'){clearCorruption();closeModal();render();openChat();}return;}
 if(a==='v2-risk'){const info={verify:['核验同行人员','已发现同行人数与记忆不符。第十二条要求停止用其他方式核对。','继续调取同行识别记录'],shortcut:['采用更短路线','导航将原本 18 分钟的路程缩短至 3 分钟，但林仍在原通道。请核对第七条。','仍将近路发给林'],address:['授权住所接返','将向接返服务确认角色账户中保存的住所。第二十条提醒只提供站名，不必提供住址。','确认账户中的住所']}[value];modal(info[0],`<p>${info[1]}</p>${safetyLink()}<div class="actions">${button(info[2],'v2-'+value,'','secondary')}${button('暂不操作','close')}</div>`,'操作核对');return;}
 if(a==='v2-call'){if(!state.v2.hotline)act('v2-hotline');modal('热线',hotlineHTML(),'夜间帮助热线','hotline');refreshLive();return;}
 if(a==='v2-photo'&&state.ending==='reference'){modal('附件已同步','<p>原照片已被一致版本替换。旧通道参照不可用。</p>'+button('关闭','close'));return;}
 if(a==='v2-photo'){act(a);refreshLive();modal('林分享的换乘照片',`<div class="photo-attachment">${photoHTML()}</div><details class="photo-transcript"><summary>查看照片文字</summary><p>MUSEUM GARDENS · 博物馆花园<br>Crown line · 皇冠线<br>Alder line · 阿尔德线 · Platforms 1–2<br>← Alderwick · 奥德维克<br>City Centre · 市中心 →<br>通道编号：MG-04</p></details><p class="small-note">可以放大查看指示牌，并与原始换乘记录对照。</p><div class="actions">${button('查看原始回执','plan','','secondary')}${button('返回','close')}</div>`,'共享附件');return;}
 if(a==='v2-complaints'){if(!state.v2.complaint&&state.proof)act('v2-complaint');const v=state.v2;modal('投诉与时间记录争议',`<p>工单 NT-008 · 当前摘要</p><div class="paper">${v.hotline>=2?'乘客拒绝使用指定出口。':'乘客无法找到出口。'}</div>${v.snapshot?'<p>你保留的原始受理回执：</p><div class="paper">乘客无法找到出口。<br>原始提交记录 · 不随结案摘要更新</div>':'<p>原始受理回执（可下载副本）：乘客无法找到出口。</p>'}<p>服务条款：有争议的行程，在复核完成前保留原始换乘记录；关闭的行程不再支持返回申请。</p><div class="actions">${button(v.snapshot?'原始回执已保存':'保存原始受理回执','v2-snapshot',v.complaint&&!v.snapshot?'':'disabled','secondary')}${button(v.dispute?'复核已受理':'提交时间与摘要争议','v2-dispute',state.proof&&v.snapshot&&state.ruleCompared&&!v.dispute?'':'disabled')}${button('返回客服','v2-to-support','','quiet')}</div><p class="small-note">提交争议需：保存受理回执，指出出站时间异常，并对照安全须知的更正时间。</p>`,'复核服务');refreshLive();return;}
 if(a==='v2-to-support'){closeModal();state.view='support';render();return;}
 if(a==='v2-snapshot'||a==='v2-dispute'){act(a);refreshLive();handleV2('v2-complaints');return;}
 if(a==='v2-support'){act(a,value);if(dialog.open)closeModal();state.view='support';render();return;}
 if(a==='v2-refuse'){act(a);if(dialog.open)closeModal();state.view='support';render();return;}
 if(a==='v2-recover'){act(a);render();return;}
 if(['v2-verify','v2-shortcut','v2-address'].includes(a)){act(a);if(dialog.open)closeModal();refreshLive();openChat();return;}
 act(a,value);
 if(a==='v2-finish'&&investigation(state).rescue){render();modal('原通道接返',investigationHTML(state),'原始通道 / MG-04','investigation');return;}
 if(['v2-safe','v2-unsafe','v2-finish'].includes(a))render();else refreshLive();
}
function hint(){state.v2.hint++;persist();const direct=state.v2.hint%3===0;let text;
 if(state.opening<3)text='先回复林。可以打字，也可以使用建议回复。';
 else if(!state.claim)text='打开最新一笔未完成行程。';
 else if(!state.plan)text='林提供的原始附件不会随系统更新。先查看它。';
 else if(!state.togetherAsked)text='附件中的奥德维克标记为未出站。点它问林。';
 else if(!state.asked.includes('duplicate'))text='查看任意一个雷恩街，向客服询问同名站。';
 else if(!state.proof)text='客服提供了一份凭证。打开看看它依据的是哪些记录。';
 else if(!state.asked.includes('time'))text=direct?'比较凭证里的 23:16 和 23:12，点时间旁的问号继续核对。':'凭证里的日期、时间和字段名称，是否能对应上原来的行程？';
 else if(!state.ruleCompared)text='更正发布时间是 23:59，页面却在 23:30 停止更新。读完须知，指出这处冲突。';
 else if(!state.linChecked)text='林说出口不见了。问他出口在哪里，或让他先留在原地。';
 else if(!state.v2.routeChecked)text=direct?'打开共享位置，开启共享并请求三次位置更新。比较两个来源。':'安全提示建议不要只依赖单一来源。林停下时，客服的预计位置是否也停止了？';
 else if(state.v2.hotline<2)text='向客服请求人工协助，查看一次排队进度。可以随时离开排队窗口。';
 else if(investigation(state).rescued)text='林已安全。查看尚未完成的关联，检查自己的位置，或继续追查原始交接记录。';
 else if(state.v2.checkpoint===1)text='第十条涉及向地下延伸的出口。照片中的 MG-04 能确认旧通道的位置；回去的方向需要结合林的记忆。';
 else if(state.v2.checkpoint===2)text='在原通道继续与林联系，核对内袋里的原钥匙；对照第二十条，不提供住所。到达和保持联系是不同操作。';
 else if(state.preserve&&!state.v2.recovered)text=direct?'保存投诉原回执，提交争议；查看换乘照片，再请林寻找 MG-04。':'保留行程需要依据。客服的新摘要是否改变了你最初提交的问题？';
 else text='保留原始行程可以请求返回；也可以保存投诉原件，追查记录复核中的关联对象和时间字段。';
 modal('一点提示',`<p>${text}</p><p class="small-note">规则有适用情境，也可能被客服误用。请对照现场描述与原始记录。查看提示不会影响行程。</p><div class="actions">${button('再给一点提示','hint','','secondary')}${button('继续调查','close')}</div>`,'帮助');}
function setupV2(){
 let hoverTimer=null,lastActivity=Date.now(),lastTick=Date.now();
 setInterval(()=>{if(gameStarted&&!document.hidden)updateLocationTelemetry();},1000);
 const begin=e=>{const b=e.target.closest?.('[data-action="offer-refund"],#refund-submit');if(!b||b.disabled||state.ending)return;clearTimeout(hoverTimer);hoverTimer=setTimeout(()=>{if(gameStarted&&!document.hidden&&!linBusy(state)){act('v2-hover');refreshLive();}},950);};
 document.addEventListener('mouseover',begin);document.addEventListener('focusin',begin);
 document.addEventListener('mouseout',e=>{if(e.target.closest?.('[data-action="offer-refund"],#refund-submit'))clearTimeout(hoverTimer);});document.addEventListener('focusout',()=>clearTimeout(hoverTimer));
 document.addEventListener('pointerdown',()=>{lastActivity=Date.now();});document.addEventListener('keydown',()=>{lastActivity=Date.now();});
 document.addEventListener('click',e=>{const b=e.target.closest?.('[data-action]');if(!b)return;if(b.dataset.action==='request-preserve'){act('v2-refuse');render();}});
 document.addEventListener('submit',e=>{if(e.target.id!=='v2-support-form')return;e.preventDefault();const t=$('support-input').value;const k=/人工|真人|电话/.test(t)?'human':/不要|别退|暂停/.test(t)?'stop':/危险|救|安全/.test(t)?'danger':/定位|移动/.test(t)?'records':/在哪|位置|出口/.test(t)?'location':/联系|身份/.test(t)?'identity':/规则|须知|矛盾/.test(t)?'rules':'fallback';handleV2('v2-support',k);});
 document.addEventListener('visibilitychange',()=>{lastTick=Date.now();if(!document.hidden){state.v2.idleAt=Date.now();state.v2.idle=0;lastActivity=Date.now();}});
 setInterval(()=>{const now=Date.now();const gap=now-lastTick;lastTick=now;if(!gameStarted||document.hidden||state.ending||!state.claim)return;if(gap>5000){state.v2.idleAt=now;return;}const elapsed=now-state.v2.idleAt;const thresholds=[90000,180000,300000];if(state.v2.idle<3&&elapsed>thresholds[state.v2.idle]&&!linBusy(state)&&now-lastActivity>45000){act('v2-idle');refreshLive();}},2500);
}

function renderLocationPin(){
 let panel=$('location-pin');
 if(!panel){panel=document.createElement('aside');panel.id='location-pin';panel.setAttribute('aria-label','林的共享位置小窗');document.body.appendChild(panel);}
 const v=state.v2;panel.hidden=!v.shared||!v.pinned;
 if(panel.hidden)return;
 const signature=[state.round,v.pinCollapsed,v.observation>=2,v.ownLocation,state.ending].join(':');
 if(panel.dataset.signature!==signature){panel.dataset.signature=signature;panel.innerHTML=`<div class="pin-heading"><button class="pin-title" data-action="v2-location"><span class="pin-live-dot"></span>林 · 共享位置</button><div>${button(v.pinCollapsed?'展开':'收起','v2-pin-collapse','','quiet')}${button('×','v2-pin','aria-label="取消固定位置小窗"','quiet')}</div></div><div class="pin-content" ${v.pinCollapsed?'hidden':''}><div class="pin-map"><svg viewBox="0 0 640 340" role="img" aria-label="林的实时共享位置示意"><rect width="640" height="340" fill="#101d2a"/><g fill="none" stroke="#263c50" stroke-width="24"><path d="M0 70H270L390 190H640M100 0V340M450 0V340M0 290H640"/></g><path d="M40 210H240L310 140H540" fill="none" stroke="#6182a8" stroke-width="3" stroke-dasharray="7 8"/><text x="32" y="45" fill="#bbccdf" font-size="24">博物馆花园</text><text x="430" y="315" fill="#bbccdf" font-size="23">MG-04</text><circle data-live-accuracy cx="260" cy="190" r="65" fill="#70a6ff" opacity=".14"/><circle data-live-lin cx="260" cy="190" r="14" fill="#9dc1ff" stroke="#fff" stroke-width="3"/><text data-live-label x="260" y="163" text-anchor="middle" fill="#fff" font-size="26">林</text>${v.observation>=2?'<circle data-live-expected cx="360" cy="140" r="11" fill="#e0bb76"/><text data-live-expected-label x="360" y="174" text-anchor="middle" fill="#e0bb76" font-size="22">预计</text>':''}${v.ownLocation?'<circle cx="300" cy="206" r="10" fill="#a0d9b9"/><text x="318" y="226" fill="#a0d9b9" font-size="23">你</text>':''}</svg></div><div class="pin-telemetry"><span data-live-status>正在接收</span><span data-live-fresh>刚刚更新</span></div><div class="pin-telemetry secondary"><span>定位精度 <b data-live-precision>±45 米</b></span><time data-live-time>23:51:08</time></div><p class="pin-note">${v.observation>=2?'蓝色：设备位置　黄色：接返预计位置':'站内信号较弱，位置可能存在误差'}</p></div>`;}
 updateLocationTelemetry();
}
function updateLocationTelemetry(){
 if(!state.v2.shared)return;
 let r=updateLocationTelemetry.runtime;
 const now=performance.now();
 if(!r||r.round!==state.round){r={round:state.round,last:now,elapsed:0,lastPacket:0,x:260,y:190,expected:350,seq:0};updateLocationTelemetry.runtime=r;}
 const delta=Math.min((now-r.last)/1000,1.5);r.last=now;
 if(!document.hidden&&!state.ending){r.elapsed+=delta;
  if(state.v2.recovered){r.x=Math.max(110,r.x-delta*1.6);r.y=Math.min(210,r.y+delta*.22);}
  else if(state.v2.observation<2&&!state.linChecked)r.x=Math.min(280,r.x+delta*.4);
  if(state.v2.observation>=2)r.expected=Math.min(485,r.expected+delta*1.8);
 }
 const unstable=state.v2.stability<2;
 const silence=unstable&&Math.floor(r.elapsed/16)%2===1;
 if(!silence&&!state.ending&&r.elapsed-r.lastPacket>=4){r.lastPacket=r.elapsed;r.seq++;}
 const age=Math.floor(r.elapsed-r.lastPacket);
 const seconds=23*3600+(state.proof?54:49)*60+Math.floor(r.lastPacket);
 const clock=[Math.floor(seconds/3600)%24,Math.floor(seconds/60)%60,seconds%60].map(x=>String(x).padStart(2,'0')).join(':');
 const accuracy=unstable?88:state.v2.observation>=2?30+(r.seq%3)*3:45+(r.seq%4)*4;
 document.querySelectorAll('[data-live-lin]').forEach(n=>{n.setAttribute('cx',r.x);n.setAttribute('cy',r.y);});
 document.querySelectorAll('[data-live-accuracy]').forEach(n=>{n.setAttribute('cx',r.x);n.setAttribute('cy',r.y);n.setAttribute('r',accuracy);});
 document.querySelectorAll('[data-live-label]').forEach(n=>{n.setAttribute('x',r.x);n.setAttribute('y',r.y-27);});
 document.querySelectorAll('[data-live-expected]').forEach(n=>n.setAttribute('cx',r.expected));
 document.querySelectorAll('[data-live-expected-label]').forEach(n=>n.setAttribute('x',r.expected));
 document.querySelectorAll('[data-live-time]').forEach(n=>n.textContent=clock);
 document.querySelectorAll('[data-live-fresh]').forEach(n=>n.textContent=state.ending==='erasure'?'位置已失联':state.ending==='refund'?'林已停止共享':state.ending==='return'?'本次共享已完成':age<2?'刚刚更新':age+' 秒前更新');
 document.querySelectorAll('[data-live-status]').forEach(n=>n.textContent=state.ending?'最后一次位置':silence?'信号暂时中断':state.v2.recovered?'沿旧通道移动':state.v2.observation>=2||state.linChecked?'林已停下':'正在缓慢步行');
 document.querySelectorAll('[data-live-precision]').forEach(n=>n.textContent='±'+accuracy+' 米');
 const pin=$('location-pin');if(pin)pin.classList.toggle('signal-lost',silence);
}

function handleV3(a,value){
 if(state.linQueue.length&&a!=='v3-open'){tell('林正在回复，请先等他把话说完。');return;}
 if(a==='v3-index-submit'){value=$('v3-channel')?.value||'';a='v3-index';}
 act(a,value);render();
 if(investigation(state).panel==='closed'){closeModal();return;}
 modal('记录复核',investigationHTML(state),'NT-008 / 原始记录','investigation');
}

function openMenu(){
 modal('行程菜单',`<div class="menu-actions">${button('返回开始界面','mobile-home')}${button('乘客安全须知','full-rules','','secondary')}${button('查看核对记录','mobile-evidence','','secondary')}${button('画面设置','v2-settings','','secondary')}${button('需要一点提示？','hint','','secondary')}${button('重新开始','restart','','secondary')}</div><p class="small-note">进度保存在当前设备。清理应用数据可能清除记录。</p>`,'LAST TRAIN');
}
function showHome(){
 if(dialog.open)closeModal();persist();gameStarted=false;clearTimeout(linTimer);scheduledMessage='';audioPause();stopSignals();
 document.body.classList.add('at-start');$('start-screen').hidden=false;
 $('continue-game').hidden=!hasSave;$('new-game').textContent=hasSave?'重新开始':'开始行程';$('start-title').focus();
}
function launch(fresh){
 if(fresh&&hasSave&&!window.confirm('重新开始会清除本机当前行程，确定吗？'))return;
 if(fresh){state=createState();Object.assign(drafts,{side:'',opening:'',modal:''});Object.assign(mapView,{left:0,top:0,zoom:false});notified=0;notifiedRound=state.round;lastSignal='';}
 gameStarted=true;hasSave=true;document.body.classList.remove('at-start');$('start-screen').hidden=true;
 audioStart();render();workspace.focus();
}
function initStartScreen(){
 $('new-game').addEventListener('click',()=>launch(true));$('continue-game').addEventListener('click',()=>launch(false));
 document.querySelectorAll('[data-sound-toggle]').forEach(b=>b.addEventListener('click',()=>{audioToggle();syncSoundButtons();}));
 document.addEventListener('click',e=>{const b=e.target.closest('[data-action="mobile-home"]');if(b)showHome();});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){persist();clearTimeout(linTimer);scheduledMessage='';audioPause();}else if(gameStarted){audioStart();scheduleLin();}});
 window.addEventListener('pagehide',()=>{persist();audioPause();});
 function viewport(){const v=window.visualViewport;document.documentElement.style.setProperty('--app-height',Math.round(v?v.height:window.innerHeight)+'px');}
 viewport();window.addEventListener('resize',viewport);if(window.visualViewport)window.visualViewport.addEventListener('resize',viewport);
 syncSoundButtons();showHome();
}
function syncSoundButtons(){document.querySelectorAll('[data-sound-toggle]').forEach(b=>{b.textContent=audioEnabled()?'声音：开':'声音：关';b.setAttribute('aria-pressed',String(audioEnabled()));});}

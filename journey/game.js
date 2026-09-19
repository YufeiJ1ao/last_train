import {createState,transition,canResolve,canRefund,duplicateKnown} from './engine.js';
import {stations} from './stations.js';
import {esc,linMessages,incomingCount,conversationHTML,repliesHTML,typingHTML,composerHTML,linBusy,deliveryDelay} from './messages.js';
import {timeGuidance} from './rules.js';
import {playSignal} from './effects.js';
const $=id=>document.getElementById(id);
const workspace=$('workspace'),dialog=$('modal');
const SAVE='night-travel-demo-v8';
let state=createState();
try{const saved=JSON.parse(sessionStorage.getItem(SAVE));if(saved?.schema===8&&Array.isArray(saved.chat)&&Array.isArray(saved.seen)&&Array.isArray(saved.asked))state={...state,...saved};}catch{}
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
function persist(){try{sessionStorage.setItem(SAVE,JSON.stringify(state));}catch{}}
function chatSnapshot(){return {...state,chat:[],linQueue:state.linQueue.map(m=>({id:m.id}))};}
function scheduleLin(){
 const head=state.linQueue[0],key=head?state.round+':'+head.id:'';
 if(key===scheduledMessage)return;
 clearTimeout(linTimer);scheduledMessage=key;
 if(!head)return;
 const round=state.round;
 linTimer=setTimeout(()=>{linTimer=null;scheduledMessage='';if(state.round!==round)return;act('deliver',head.id);refreshLive();},deliveryDelay(head));
}
function runSignal(){if(state.signal&&state.signal.id!==lastSignal){lastSignal=state.signal.id;playSignal(state.signal.kind);}}
function refreshLive(){renderSide();updateChatViews();updateSupportOptions();updateRefundConsent();persist();scheduleLin();runSignal();}
function publish(){if(chatWindow&&!chatWindow.closed)chatWindow.postMessage({channel:'nt-lin-v8',type:'snapshot',state:chatSnapshot()},location.origin);}
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
function chatBody(){return `<div class="lin-thread" id="modal-lin-thread" role="log" aria-label="与林的消息">${conversationHTML(state)}</div><div class="lin-typing" id="modal-lin-typing" role="status">${typingHTML(state)}</div><div class="lin-replies" id="modal-lin-replies">${repliesHTML(state)}</div>${composerHTML(state,'modal',drafts.modal)}${state.claim?button('查看林分享的行程附件','plan','','secondary'):''}<div class="chat-window-actions">${button('独立窗口打开 ↗','popout','','quiet')}<span>可与账户页并排查看</span></div>`;}
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
 document.querySelectorAll('[data-lin-compose]').forEach(form=>{form.querySelector('button[type="submit"]').disabled=linBusy(state)||Boolean(state.ending);form.querySelector('textarea').disabled=Boolean(state.ending);});
 $('lin-attachment').hidden=!state.claim;
 $('friend-status').textContent=linBusy(state)?'正在输入…':state.ending?'23:55 · 刚刚联系':state.proof?'23:54 · 刚刚联系':'在线';
 if(state.opening<3||(dialog.open&&modalKind==='lin'))markRead();
 const count=incomingCount(state);
 if(notifiedRound!==state.round){notifiedRound=state.round;notified=count;$('lin-toast').hidden=true;}
 if(count>notified){
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
 if(state.proof)evidence.push(['出站时间早于进站时间','23:12 / 23:16']);
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
function stationDetail(){
 const id=state.selected,name=stationName(id);
 if(!state.seen.includes(id))return '<h3>车站详情</h3><p>点击地图上的站点，或选择车站查看。</p>';
 if(id==='28')return `<h3>${name}</h3><p>站点编号：CR–28</p><p>相邻车站：惠特科姆广场 ↔ 博物馆花园</p><p>Whitcombe Square ↔ Museum Gardens</p><p>所属区域：Zone 2</p><p>行程当日记录：雷恩街 / Wren Street</p>`;
 if(id==='43')return `<h3>${name}</h3><p>站点编号：NT–00</p><p>相邻车站：博物馆花园 ↔ 边界路</p><p>Museum Gardens ↔ Boundary Road</p><p>所属区域：Zone 1</p><p>行程当日记录：此区间没有车站 <button class="clue-question" data-action="missing-question" aria-label="询问此区间为什么没有车站">?</button></p>${state.mapVersion==='archive'?'<p>此记录来自当前候选列表，未显示于存档线路图。</p>':''}`;
 if(id==='44')return '<h3>???</h3><p>站点编号：□□—0</p><p>所属线路：未标注</p><p>位置数据暂不可用。请勿重复请求定位。</p>';
 if(id==='06')return '<h3>斯蒂尔韦尔 / Stillwell</h3><p>站点编号：AL–06</p><p>相邻车站：博物馆花园 ↔ 牛津庭院</p><p>本站未包含在原定返程路线中。</p><p class="faint-record">最近查询状态：等待 · STAY STILL</p>'+button('问问林是否见过这个站','lin-topic','data-topic="stillwell"','quiet');
 const extra=id==='05'?'皇冠线 / 阿尔德线换乘站 · 本次行程有有效换乘记录':id==='01'?'朋友提供的原定下车站':id==='23'?'本次行程的进站站点':id==='03'?'阿尔德线 / 沼泽线换乘站 · 图上未标注站名':'图示车站';
 return `<h3>${esc(name)}</h3><p>站点编号：ST–${id}</p><p>${extra}</p>`;
}
function renderMap(){
 const both=state.seen.includes('28')&&state.seen.includes('43');
 const hasCandidate=duplicateKnown(state);
 const available=stations.filter(([id])=>state.mapVersion==='current'||!['43','44'].includes(id));
 return heading('线路查询','点击车站查看详情，也可以核对行程当日的线路图。','NETWORK / 1—3')+`<div class="map-controls"><div class="segmented" role="group" aria-label="线路图版本"><button data-action="version" data-version="current" aria-pressed="${state.mapVersion==='current'}" class="${state.mapVersion==='current'?'active':''}">当前线路图</button><button data-action="version" data-version="archive" aria-pressed="${state.mapVersion==='archive'}" class="${state.mapVersion==='archive'?'active':''}">行程当日</button></div>${button(mapView.zoom?'缩小':'放大','zoom',`aria-pressed="${mapView.zoom}"`,'quiet')}<a class="text-button" href="network.svg" target="_blank" rel="noopener">完整地图 ↗</a></div><div id="network-map" class="map-wrapper ${mapView.zoom?'zoom':''}"><p style="color:#172b52;padding:20px">正在载入线路图…</p></div><div class="map-caption"><span>${state.mapVersion==='archive'?'存档 · 14 SEP / 23:10':'当前服务版本'}</span><span>中英双语 · 可横向滚动</span></div><div class="station-tools"><section class="panel"><div class="panel-content"><form id="station-form"><label for="station-select">查找车站</label><select id="station-select">${available.map(([id])=>`<option value="${id}" ${state.selected===id?'selected':''}>${esc(stationName(id))}${id==='28'?' · A':id==='43'?' · B':''}</option>`).join('')}</select><div class="actions"><button class="button secondary" type="submit">查看站点</button></div></form>${state.claim?`<p class="small-note">退款记录中的两个候选站：</p><div class="actions">${button('雷恩街 · A','inspect','data-station="28"','quiet')}${button('雷恩街 · B','inspect','data-station="43"','quiet')}</div>`:''}</div></section><section class="panel"><div class="panel-content station-detail">${stationDetail()}</div></section></div>${state.claim?`<section class="panel"><div class="panel-title"><h2>候选站点核对</h2><span class="badge">${state.compared?'已保留记录':Number(state.seen.includes('28'))+Number(state.seen.includes('43'))+' / 2'}</span></div><div class="panel-content"><p class="small-note">两条候选记录使用了同一个站名。可直接询问林或客服，再核对它们的位置。</p>${both?'<div class="comparison"><div><strong>雷恩街 A · CR–28</strong><p>惠特科姆广场<br>↔ 博物馆花园</p><p>存档中已有此站</p></div><div><strong>雷恩街 B · NT–00</strong><p>博物馆花园<br>↔ 边界路</p><p>存档中没有此站</p></div></div>':''}<div class="actions">${button('问客服：为什么有两个雷恩街？','submit-duplicate',hasCandidate?'':'disabled')}${button('问林：你也看到两个同名站了吗？','lin-topic',`data-topic="duplicate" ${hasCandidate?'':'disabled'}`,'secondary')}${button('查看朋友的路线','plan','','secondary')}</div></div></section>`:''}`;
}
async function mountMap(){
 const serial=++mapRequest;
 try{
  if(!svgSource){const response=await fetch('./network.svg');if(!response.ok)throw Error('map');svgSource=await response.text();}
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
 if(!state.asked.includes('time'))return button('出站时间为什么在进站之前？','ask','data-question="time"');
 if(!state.ruleCompared)return button('查看乘客安全须知','rules');
 if(!state.linChecked)return button('问问林现在的情况','open-chat');
 return linBusy(state)?'<p class="small-note">林正在回复你的消息…</p>':'';
}
function supportOptions(){
 if(!state.claim)return button('查看 14 日的未完成行程','start');
 let options='';
 if(!state.asked.includes('where'))options+=button('我找不到正确的下车站','ask','data-question="where"');
 options+=pendingCheck();
 if(duplicateKnown(state)&&!state.asked.includes('duplicate'))options+=button('地图上为什么有两个雷恩街？','ask','data-question="duplicate"','secondary');
 if(state.asked.includes('duplicate')&&state.proof)options+=button('重新查看出站凭证','proof','','secondary');
 if(state.asked.includes('time'))options+=button('查阅安全须知的更正说明','rules','','secondary');
 if(canResolve(state))options+=`<p class="decision-label">请选择本次行程的处理方式</p>${button('接受匹配并退款','offer-refund')}${button('保留原始行程，申请返回','request-preserve','','secondary')}`;
 return options+'<p class="chat-note">选择一条消息继续会话。</p>';
}
function updateSupportOptions(){const options=$('support-options');if(options)options.innerHTML=supportOptions();}
function supportText(item){
 if(!item.leakUntil||Date.now()>=item.leakUntil)return item.text;
 return item.text.replace('行程',`<span class="terminology"><span class="term-leak">副本</span><span class="term-normal">行程</span></span>`);
}
function renderSupport(){
 const log=state.chat.length?state.chat:[{who:'agent',text:'您好，夜间账户服务为您提供协助。请问您需要处理哪笔行程？'}];
 return heading('在线客服','与夜间账户服务核对本次行程。','CASE / NT—008')+`<section class="panel"><div class="panel-title"><div class="support-identity"><div class="operator-avatar">N08</div><div><h2>夜间账户服务</h2><span class="small-note">正在处理你的请求</span></div></div><span class="badge">会话已连接</span></div><div class="chat-log" id="chat-log" role="log" aria-label="客服聊天记录">${log.map(item=>`<div class="chat-line ${item.who==='me'?'me':''}"><span class="who">${item.who==='me'?'你':'夜间账户服务'}</span><p>${supportText(item)}</p>${item.attachment?'<button class="receipt-link" data-action="proof">↳ 出站匹配凭证 · NT-008-R<br><small>查看文件</small></button>':''}</div>`).join('')}</div><div class="chat-options" id="support-options">${supportOptions()}</div></section>`;
}
function renderResolution(){return heading('保留原始行程','请指定最后一次能够确认的车站。','NT—008 / RETAINED')+`<div class="shared-note">夜间账户服务：可以保留本次行程。返回请求需要匹配一条有效刷卡记录。费用将在行程结束后重新核算。</div><section class="panel"><div class="panel-title"><h2>提交返回请求</h2><span class="badge pending">原行程尚未关闭</span></div><div class="panel-content"><p>请使用持卡人提供的原始记录。原定目的地可能尚未到达。</p><form id="return-form"><label for="return-station">最近一次已确认的车站</label><select id="return-station" required><option value="">选择车站</option><option value="alderwick">奥德维克 / Alderwick</option><option value="museum">博物馆花园 / Museum Gardens</option><option value="wren">雷恩街 / Wren Street</option><option value="whitcombe">惠特科姆广场 / Whitcombe Square</option></select>${state.formMessage?`<p class="form-feedback" role="status">${state.formMessage}</p>`:''}<div class="actions"><button class="button" type="submit">保留行程并请求返回</button>${button('核对原始附件','plan','','secondary')}</div></form><p class="tip">关闭原行程后，将无法使用本次进站记录申请返回。</p></div></section>`;}
function renderEnding(){
 const good=state.ending==='return';
 return heading(good?'返回请求已受理':'退款已完成',good?'本次行程仍然开放。':'本次行程已补全，无需进一步操作。',good?'NT—008 / OPEN':'NT—008 / CLOSED')+`<section class="panel end-paper"><span class="stamp">${good?'ORIGINAL RECORD RETAINED':'REFUND PROCESSED'}</span><h2>${good?'保留了他来时的那条路。':'已为您找到合适的终点。'}</h2><p>${good?'23:28 的换乘记录已恢复为返回参照。<br>目的地：博物馆花园 / Museum Gardens。':'出站记录已匹配，差额将退回原账户。<br>原始行程记录已归档，无法再次申请返回。'}</p><p class="result-number">${good?'博物馆花园':'£6.10'}</p><div class="end-status">${good?'退款状态':'账户状态'}<span>${good?'暂停处理':'所有行程均已完成'}</span></div><p>${good?'林发来了一条消息。<br>“出站了！我自己走回去。”':'林发来了一条消息。<br>“你选的是哪里？”'}</p>${button('查看林的消息','open-chat','','secondary')}<p class="end-note">序章结束 · ${good?'原路返回':'账目平衡'}<br>${good?'家仍然在原来的地方。':'系统没有未完成的行程。'}</p><div class="actions">${button('重新体验','restart')}${button('查看这一版的设计','debrief','','secondary')}</div></section>`;
}
function render(){
 const previousMap=$('network-map');if(previousMap){mapView.left=previousMap.scrollLeft;mapView.top=previousMap.scrollTop;}
 renderSide();workspace.innerHTML=state.ending?renderEnding():({opening:renderOpening,history:renderHistory,claim:renderClaim,map:renderMap,support:renderSupport,resolution:renderResolution}[state.view]||renderHistory)();
 if(state.view==='map'&&!state.ending)mountMap();
 if(state.opening<3){const thread=$('opening-thread');if(thread)thread.scrollTop=thread.scrollHeight;}
 const chat=$('chat-log');if(chat)chat.scrollTop=chat.scrollHeight;
 persist();updateChatViews();scheduleLin();runSignal();
}
function modal(title,body,category='行程档案',kind='document'){
 restoreFocus=document.activeElement;modalKind=kind;
 $('modal-category').textContent=category;$('modal-body').innerHTML=`<h2>${title}</h2>${body}`;
 if(!dialog.open)dialog.showModal();
}
function closeModal(){dialog.close();modalKind='';if(restoreFocus?.isConnected)restoreFocus.focus();}
function openChat(){modal('林',chatBody(),'MESSAGES / 23:48 — 23:55','lin');markRead();const thread=$('modal-lin-thread');thread.scrollTop=thread.scrollHeight;}
function openChatWindow(){
 if(chatWindow&&!chatWindow.closed){chatWindow.focus();publish();return;}
 chatWindow=window.open('chat.html','night-travel-lin-'+state.round,'popup=yes,width=440,height=760,resizable=yes,scrollbars=yes');
 if(!chatWindow){openChat();tell('浏览器没有打开独立窗口，已在当前页面显示聊天。');return;}
 if(dialog.open&&modalKind==='lin')closeModal();
 publish();tell('林的聊天已在独立窗口打开，可与账户页并排查看。');
}
function showPlan(){
 if(state.opening<3)return;
 act('plan');render();
 modal('林分享的行程附件',`<span class="eyebrow">01 / 出发前保存的路线 · 14 SEP 23:10</span><div class="paper"><strong>惠特科姆广场 → 奥德维克</strong><p>Whitcombe Square → Alderwick<br>约 24 分钟 · 1 次换乘</p><div class="timeline"><div class="timeline-item"><strong>惠特科姆广场 / Whitcombe Square</strong><span>皇冠线 / Crown line</span></div><div class="timeline-item"><strong>雷恩街 / Wren Street</strong><span>CR–28 · 途经站</span></div><div class="timeline-item"><strong>博物馆花园 / Museum Gardens</strong><span>换乘阿尔德线，向奥德维克方向</span></div><div class="timeline-item"><strong>奥德维克 / Alderwick</strong><span>原定下车站</span><button class="unexited-clue" data-action="lin-topic" data-topic="together">未出站 · 询问林 ↗</button></div></div><small>保存在林的手机中 · 23:10</small></div><span class="eyebrow">02 / 原始换乘回执</span><div class="paper"><strong>TRANSFER ACCEPTED / 换乘有效</strong><div class="paper-line">CARD: •••• 1408<br>14 SEP 2026 / 23:28<br>博物馆花园 / MUSEUM GARDENS<br>READER: MG-04<br>STATUS: VALID</div><p>请保留本回执至行程结束。</p></div><p class="small-note">此附件为朋友发送的副本，不会随线路查询页面更新。</p>${button('返回核对','close')}`,'共享附件 / M. LIN');tell('原始路线和换乘回执已加入核对记录。');
}
function showProof(){
 if(!state.asked.includes('duplicate'))return;
 modal('出站匹配凭证',`<p>夜间账户服务提供 · 14 SEP 2026</p><div class="paper"><strong>JOURNEY MATCH / NT-008-R</strong><table class="receipt-table"><tr><th>持卡人</th><td>M. LIN</td></tr><tr><th>卡号末位</th><td>1408</td></tr><tr><th>本次进站</th><td>14 SEP · 23:16<br>惠特科姆广场 / Whitcombe Square</td></tr><tr><th>匹配出站</th><td>14 SEP · 23:12<br>雷恩街 / Wren Street · NT–00</td></tr><tr><th>核验依据</th><td>姓名与卡号一致</td></tr><tr><th>处理方式</th><td>确认后代入原行程</td></tr></table><p>确认后将关闭原行程。原始进站记录不再用于返回申请。</p><small>所有时间均为伦敦当地时间。</small></div><div class="actions">${button('出站时间早于进站时间','flag-proof')}${button('返回会话','close','','secondary')}</div>`,'夜间账户服务 / 匹配记录');
}
function updateRefundConsent(){
 const checkbox=$('refund-consent'),submit=$('refund-submit');if(!checkbox||!submit)return;
 checkbox.disabled=!canRefund(state);submit.disabled=!canRefund(state)||!checkbox.checked;
 const waiting=$('refund-wait');if(waiting)waiting.hidden=canRefund(state);
}
function refundOffer(){
 if(!canResolve(state)){state.view='support';render();tell('请先完成行程核对。');return;}
 act('refund-offer');
 modal('确认出站并申请退款',`<p>我们将使用匹配的出站记录补全此行程，并退回 <strong>£6.10</strong>。</p><div class="paper"><strong>雷恩街 / Wren Street · NT–00</strong><p>匹配出站：14 SEP · 23:12<br>匹配依据：姓名与卡号一致</p></div><p>确认后将关闭原行程。原始记录不再用于返回申请。</p><p class="small-note" id="refund-wait">林正在发来消息，请稍候。</p>${button('查看林的消息','open-chat','','secondary')}<form id="refund-form"><label class="confirmation-check"><input id="refund-consent" type="checkbox" required disabled><span>我确认林已抵达该站，并同意关闭原始行程。</span></label><div class="actions"><button class="button" type="submit" id="refund-submit" disabled>确认，退回 £6.10</button>${button('暂不确认','close','','secondary')}</div></form>`,'处理确认');
 refreshLive();
}
function missingQuestion(){modal('此区间没有车站？',`<p>行程当日，博物馆花园与边界路之间没有可供乘客停靠的站台。当前版本却在同一区间标注了雷恩街。</p><div class="actions">${button('问林：你在那里看到了什么？','lin-topic','data-topic="missing"')}${button('问客服：这个站哪里来的？','ask','data-question="missing"','secondary')}</div><p class="small-note">乘客安全须知：站台具有完整的照明与候车人员，不代表它对外开放。</p>`,'站点核对');}
function showRules(){
 if(!state.proof)return;act('rules');persist();
 modal('乘客安全须知',`<section class="rule-excerpt"><span class="eyebrow">原安全提示 / 夜间出行信息处</span><p>${timeGuidance.platform}</p><p>请在进站前记录出发站、原定换乘站及预计乘车时间。请勿修改原有记录。</p></section><section class="rule-excerpt amended-rule"><span class="eyebrow">补充更正 / 乘客接返办公室 / 23:59</span><h3>${timeGuidance.title}</h3><p>${timeGuidance.normal}</p><p>${timeGuidance.detail}</p><p>${timeGuidance.last}</p></section><section class="rule-excerpt"><span class="eyebrow">页面维护记录 / 23:30</span><p>${timeGuidance.maintenance}</p></section><div class="actions">${button('这条更正在停止更新之后发布','rule-compare')}${button('返回会话','close','','secondary')}</div><p class="small-note"><a href="../#time-guidance" target="_blank" rel="noopener">阅读完整安全须知 ↗</a></p>`,'NT—008 / 行程时间');
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
function hint(){
 const t=state.opening<3?'回复林的消息，也可以在输入框里写你想说的话。':!state.claim?'打开最新一笔未完成的行程。':!state.plan?'林的附件里有原定路线和换乘回执。':!state.togetherAsked?'附件的目的地旁边写着红色的“未出站”。可以点它问问林。':!duplicateKnown(state)?'查看任意一个雷恩街候选站，就可以问为什么有两个同名站。':!state.asked.includes('duplicate')?'把两个同名站的问题提交给客服。':!state.proof?'打开客服凭证，比较同一天的进站和出站时间。':!state.asked.includes('time')?'问客服为什么出站时间早于进站。':!state.ruleCompared?'读客服提供的安全须知，把更正的发布时间与维护说明对照。':!state.linChecked?'林找不到出口了。打开聊天，问他在哪，或让他先留在原地。':linBusy(state)?'林正在回复，等他把话说完。':!state.preserve?'材料已核对，可以决定是否接受匹配，或保留原始行程。':'查看换乘回执，选择最后一次有效记录对应的车站。';
 modal('一点提示',`<p>${t}</p>${button('继续','close')}`,'试玩帮助');
}
function reset(){if(dialog.open)closeModal();clearTimeout(linTimer);scheduledMessage='';state=createState();Object.assign(drafts,{side:'',opening:'',modal:''});Object.assign(mapView,{left:0,top:0,zoom:false});render();workspace.focus();}
function reply(step,text){act('opening',text?{step,text}:step);render();if(state.opening===3&&dialog.open&&modalKind==='lin')closeModal();}
function checkLin(){act('check-lin');refreshLive();}
function linTopic(topic){
 const questions={together:'附件里奥德维克标着未出站，你到底出去了吗？',memory:'我不记得我们一起坐过。',duplicate:'地图上有两个一模一样的雷恩街，你那边也是吗？',missing:'地图上这两站之间没有车站，你那边看到了什么？',stillwell:'你今天去过斯蒂尔韦尔吗？'};
 act('lin-topic',{topic,question:questions[topic]||topic});refreshLive();openChat();
}
function sendLinText(text){
 text=String(text).trim().slice(0,320);if(!text||state.ending||linBusy(state))return false;
 if(state.opening<3)reply(state.opening,text);else{act('lin-text',text);refreshLive();}return true;
}
function onAction(b){
 const a=b.dataset.action;
 if(a==='nav'){act('nav',b.dataset.view);render();workspace.focus();}
 else if(a==='start'){act('start');state.formMessage='';render();workspace.focus();}
 else if(a==='plan')showPlan();
 else if(a==='close')closeModal();
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
 else if(a==='zoom'){mapView.zoom=!mapView.zoom;$('network-map').classList.toggle('zoom',mapView.zoom);b.textContent=mapView.zoom?'缩小':'放大';b.setAttribute('aria-pressed',String(mapView.zoom));}
 else if(a==='compare'){act('compare');render();tell('不同站点的核对结果已保存。');}
 else if(a==='submit-duplicate')ask('duplicate');
 else if(a==='ask')ask(b.dataset.question);
 else if(a==='proof')showProof();
 else if(a==='flag-proof'){act('proof');closeModal();state.view='support';render();tell('时间不符的凭证已加入核对记录。');}
 else if(a==='request-preserve'){act('preserve');state.formMessage='';render();workspace.focus();}
 else if(a==='offer-refund')refundOffer();
 else if(a==='hint')hint();
 else if(a==='restart'){
  if(state.ending)reset();
  else modal('重新开始这笔行程？',`<p>将清空这次试玩的核对记录，并回到林发来第一条消息的时候。独立聊天窗口也会同步重置。</p><div class="actions">${button('重新开始','reset-confirm')}${button('继续当前进度','close','','secondary')}</div>`,'试玩控制');
 }
 else if(a==='reset-confirm')reset();
 else if(a==='debrief')modal('序章：未完成行程',`<p>进站前的路线、两个同名站，以及时间倒置的出站凭证，共同构成本次调查。地图根据新的六线版本绘制，站名均提供中英对照。</p><p>退款需要查证材料、追问客服并回应林的消息。确认会关闭原行程；保留原始记录并使用 23:28 的换乘回执，可以请求返回博物馆花园。</p><p>地图、客服和林的消息均为预先编写的故事内容；自由输入按当前剧情和话题响应。进度保留于此账户标签页，关闭标签页后重新开始。</p>${button('关闭','close')}`,'创作说明');
}
function receiveChat(event){
 const d=event.data;
 if(event.origin!==location.origin||d?.channel!=='nt-lin-v8'||!event.source)return;
 if(d.type==='hello'){
  // Only the chat document opened by this account can establish a connection.
  try{if(event.source.opener!==window||!event.source.location.pathname.endsWith('/journey/chat.html'))return;}catch{return;}
  chatWindow=event.source;publish();return;
 }
 if(event.source!==chatWindow||d.round!==state.round)return;
 if(d.type==='text'){
  const key=state.round+':'+d.id;if(receivedInputs.has(key))return;receivedInputs.add(key);
  const accepted=typeof d.text==='string'&&sendLinText(d.text);chatWindow.postMessage({channel:'nt-lin-v8',type:'input-result',id:d.id,round:state.round,accepted},location.origin);
 }else if(d.type==='read')markRead();
 else if(d.type==='reply'&&Number.isInteger(d.step))reply(d.step);
 else if(d.type==='check-lin')checkLin();
 else if(d.type==='topic')linTopic(d.topic);
 else if(d.type==='plan'){showPlan();window.focus();}
}
window.addEventListener('message',receiveChat);
setInterval(()=>{if(chatWindow?.closed){chatWindow=null;tell('独立聊天窗口已关闭，仍可在此页查看林的消息。');}else publish();},3000);
document.addEventListener('click',e=>{const b=e.target.closest('[data-action]');if(b&&!b.disabled){e.preventDefault();onAction(b);}});
document.addEventListener('keydown',e=>{if(['Enter',' '].includes(e.key)){const b=e.target.closest('[role="button"][data-action]');if(b){e.preventDefault();onAction(b);}}});
document.addEventListener('change',e=>{if(e.target.id==='refund-consent')updateRefundConsent();});
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
 else if(e.target.id==='refund-form'&&$('refund-consent').checked&&canRefund(state)){act('refund',true);closeModal();render();workspace.focus();}
});
dialog.addEventListener('close',()=>{modalKind='';});
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
render();

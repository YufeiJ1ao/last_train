import {esc,photoHTML} from './messages.js';
export const endingNames={erasure:'已读',replacement:'接返完成',void:'尚未离站',terminal:'请由乘客本人处理'};
const defaults=()=>({panel:'archive',source:false,time:false,index:false,rescue:0,key:false,addressDenied:false,contact:false,held:false,rescued:false,own:false,window:false,mergeWarn:false,epilogue:0,note:''});
export const investigation=s=>({...defaults(),...s.v3});
function copy(s){return {...s,v3:investigation(s),v2:{...s.v2},linLog:[...s.linLog],linQueue:[...s.linQueue],chat:[...s.chat],events:[...s.events]};}
function say(s,lines){for(const text of lines){s.sequence++;s.linQueue.push({id:'v3-'+s.sequence,who:'lin',text,time:'23:57'});}}
function me(s,text){s.sequence++;s.linLog.push({id:'v3-me-'+s.sequence,who:'me',text,time:'23:57'});s.v2.idleAt=Date.now();s.v2.chatPaused=false;}
function exchange(s,q,a){s.chat.push({who:'me',text:q},{who:'agent',text:a});}
function finish(s,name){s.ending=name;s.view='ending';s.v3.panel='closed';}
const reviewable=s=>s.proof&&s.v2?.snapshot&&s.v2?.dispute;
export function expansionAction(state,action,value){
 if(action!=='v2-finish'&&!action.startsWith('v3-'))return null;
 const s=copy(state),v=s.v3;
 if(action==='v3-open'){if((reviewable(s)||v.rescued||v.held)&&!s.ending)v.panel=['archive','rescue','self','terminal','aftermath'].includes(value)?value:'archive';return s;}
 if(s.linQueue.length)return s;
 if(s.ending)return s;
 v.note='';
 if(action==='v2-finish'){
  if(s.v2.checkpoint!==2||!s.v2.recovered||s.ending)return s;
  if(v.rescued){v.panel='aftermath';return s;}
  v.rescue=Math.max(1,v.rescue);v.panel='rescue';
  if(!s.events.includes('v3-gate')){s.events.push('v3-gate');say(s,['到楼梯底下了。终于有风了。','等一下，有个人说出口在维修，要用钥匙开旁边的门。','他给的钥匙跟我家那把一模一样，连蓝线都在。']);}
  return s;
 }
 if(!reviewable(s)&&!s.ending&&!(s.v2.checkpoint===2&&s.v2.recovered))return s;
 switch(action){
 case 'v3-source':
  if(v.source)return s;v.source=true;v.panel='archive';exchange(s,'保留两个版本，不覆盖原始投诉。','原始事件：乘客无法找到出口。结案摘要：乘客拒绝使用出口。两项记录均有效。请指定需要修正的乘客。');break;
 case 'v3-time':
  v.panel='archive';if(!v.source||v.time)return s;
  if(value!=='allocation'){v.note='23:12 的来源字段没有闸机编号。重新比较“分配记录”和“刷卡事件”。';break;}
  v.time=true;exchange(s,'23:12 是终点分配时间，不是实际过闸时间。','字段说明已展开。终点分配可以早于进站。将该字段显示为“出站”，有助于您理解已完成的服务。');say(s,['所以不是我记错时间了。','那它说我到了，是它先决定的？']);break;
 case 'v3-index':
  v.panel='archive';if(!v.time||!s.v2.photo||v.index)return s;
  if(String(value).trim().toUpperCase().replace(/\s/g,'')!=='MG-04'){v.note='没有找到对应通道。请使用林的照片上已有的编号。';break;}
  v.index=true;exchange(s,'查阅 MG-04 原始通道维护索引。','MG-04 / 0：空间交接未完成。VOID 为状态字段，不是车站名称。乘客描述层继续提供服务，直至关系交接完成。');break;
 case 'v3-freeze':
  if(!v.source||!v.time)return s;
  v.held=true;v.panel='archive';exchange(s,'冻结自动修正，保留无法同时成立的记录。','已暂停乘客修正。本次服务未完成。出口已验证；到达已验证；乘客待修正。');say(s,['那边的人不催我走了。','灯还亮着。就是每个人都站在原地。','我先陪你等。你别偷偷去睡觉啊。']);break;
 case 'v3-merge-review':if(v.source&&!v.rescued){v.mergeWarn=true;v.panel='replace';if(!s.events.includes('replacement-warning')){s.events.push('replacement-warning');say(s,['刚才有条消息说我已经到家了。','可我还坐在长椅这里。','先别把这个窗口换掉，好吗。']);}}break;
 case 'v3-merge-confirm':
  if(!v.mergeWarn||!v.source)return s;
  if(v.rescued)return s;
  finish(s,'replacement');v.replacedAt=s.sequence;
  exchange(s,'接受已到达的关联对象，并关闭旧关联。','已接收。到达对象：LIM。旧通信关联不再用于行程服务。');
  say(s,['我回来了。','茉莉奶白经典原味，记着呢。','你的偏好、我们说过的话，都同步好了。']);
  for(const m of s.linQueue)m.source='matched';
  s.sequence++;s.linQueue.push({id:'old-lim-'+s.sequence,who:'lin',text:'我还在长椅这里。刚刚发消息的不是我。',time:'23:57',source:'original'});
  s.sequence++;s.linQueue.push({id:'new-lim-'+s.sequence,who:'lin',text:s.v2.ownLocation||s.v2.address?'我到你门口了。你不用下来，我有钥匙。':'我出来了。还是老地方见，你不用再看那个窗口了。',time:'23:57',source:'matched'});
  say(s,['旧窗口里的那位不会出来了。','以后我就是陪你回去的那个。']);for(const m of s.linQueue.slice(-2))m.source='matched';break;
 case 'v3-key':
  if(v.rescue!==1)return s;
  me(s,'先别接。摸摸内袋，你出门时带的钥匙还在吗？');v.key=true;v.rescue=2;v.panel='rescue';say(s,['我摸到我自己的了，还在内袋里。','旧的蓝线有个死结。给我的那把也有。','你是不是也有一把？上次备用的给你了。','他开始报我的门牌号了，说不用我们再确认。']);break;
 case 'v3-address':
  if(v.rescue!==2)return s;
  v.panel='rescue';if(value!=='deny'){v.note='你停在确认前。第二十条要求：只提供站名；对方报出准确门牌号也应告知地址有误。';say(s,['先别把地址给他。','我自己的钥匙还在，我想自己回去。']);break;}
  me(s,'别确认地址。说地址有误，留着自己的钥匙，沿原通道走。');v.addressDenied=true;v.rescue=3;exchange(s,'只确认乘客仍在 MG-04，与账户住址无关。','住所接返取消。原通道仅对关联未关闭的行程保持。请提交当前状态。');say(s,['我说地址不对。','他把那把钥匙收回去了。终于不挡着楼梯了。','你那边如果有“到达”，先别帮我点。我还没走完。']);break;
 case 'v3-contact':
  if(v.rescue!==3||!v.addressDenied)return s;
  v.panel='rescue';if(value!=='contact'){v.note='到达确认会关闭仍在使用的通道。请对照客服此前说过的“联系不等于抵达”。';break;}
  me(s,'我没点到达。我只确认还跟你联系着。你慢慢走，我在。');v.contact=true;v.rescue=4;exchange(s,'我仍与乘客保持联系。尚未确认抵达。','联系已保留。原通道开放。关联批次尚余一位对象维持交接。');say(s,['上来了！','好冷。第一次觉得汽车鸣笛这么好听。','我自己走回去。你点的'+(s.v2.drink||'饮料')+'我记着呢。','诶？它怎么还说有一位没出来。','不是我。我的鞋都踩到水坑了。']);break;
 case 'v3-rescue-end':
  if(v.rescue!==4||!v.contact)return s;
  v.rescued=true;v.panel='aftermath';s.view='support';break;
 case 'v3-own':
  if(!v.rescued)return s;if(v.own){v.panel='self';return s;}
  v.own=true;v.panel='self';exchange(s,'显示“我的位置”的原始来源，不要显示账户默认值。',s.v2.ownLocation?'位置来源：您授权的接返参照。设备坐标：未验证。环境就绪：是。实际出站事件：未找到。':'位置来源：账户常用住所。您未授权共享位置。设备定位：未接收。环境就绪：是。实际出站事件：未找到。');say(s,['你先别关。','我离你家那条路不远，我去路口看一眼。']);break;
 case 'v3-window':
  if(!v.rescued||!v.own||v.window)return s;
  me(s,'我这边灯是开着的。你从路口能看见窗户吗？');v.window=true;v.panel='self';say(s,['到路口了。你家窗户是暗的。','你不是说开着灯吗？','我先不敲门。你听我说。','我站这儿。跟刚才你陪我一样。']);break;
 case 'v3-void':
  if(!v.rescued||!v.window)return s;
  v.priorOutcome='rescued';finish(s,'void');exchange(s,'保留我尚未离站的状态，不再使用住所预设定位。','临时环境已标记。原住所未移动。您尚未完成与该住所的空间交接。');say(s,['这次换我陪你找路。','不着急，我手机还有电。']);break;
 case 'v3-terminal':
  if(v.epilogue===1){v.panel='terminal';return s;}
  if(v.epilogue||!v.source||!v.time||!v.index||!(v.rescued||v.held)||!s.v2.routeChecked)return s;
  v.epilogue=1;v.panel='terminal';exchange(s,'请提供 VOID 原始交接记录，而不是乘客描述层。','远程账户无权修改原始连接。请由乘客本人前往 MG-04 / 0 现场终端处理。');break;
 case 'v3-broadcast':
  if(v.epilogue!==1||v.broadcast)return s;v.broadcast=true;v.panel='terminal';me(s,'我不在车站。');say(s,['你那边怎么也有这个声音？','刚才通话里的通风声。我这里一直都有。']);break;
 case 'v3-enter':
  if(v.epilogue!==1||!v.broadcast)return s;
  v.epilogue=2;finish(s,'terminal');say(s,v.rescued?['你那边怎么也有通风声？','我在街口。你先看看门上的编号，我陪你。']:['你那边怎么也有通风声？','我还在 MG-04 的长椅旁边。我们是不是离得很近？']);break;
 }
 return s;
}
const b=(label,action,value='',disabled=false)=>`<button type="button" class="button secondary" data-action="${action}" data-value="${esc(value)}" ${disabled?'disabled':''}>${label}</button>`;
const badge=t=>`<span class="eyebrow">${t}</span>`;
export function expansionEntry(s){return (reviewable(s)||investigation(s).rescued)&&!s.ending?`<div class="v3-entry">${badge('原始文件 / SOURCE RECORDS')}<p>受理回执与客服摘要不一致。复核允许你查看字段来源。</p>${b('打开记录复核','v3-open','archive')}${investigation(s).rescued?b('查看尚未完成的关联','v3-open','aftermath'):''}</div>`:'';}
export function investigationHTML(s){
 const v=investigation(s),busy=!!s.linQueue.length;
 const btn=(label,a,val='')=>b(label,a,val,busy);
 let body='';
 if(v.panel==='aftermath'){
 body='<h2>林已离站</h2><p>林带着原钥匙走到了街上。你们没有关闭原来的联系。</p><div class="v3-status">乘客 LIM：已通过原通道<br>关联对象：尚余一位<br>退款：暂停处理</div><blockquote>林：那还没出来的那位是谁？</blockquote><div class="actions">'+btn('检查我自己的位置来源','v3-own')+btn('先查清通道如何完成交接','v3-open','archive')+'</div>';
 }else if(v.panel==='rescue'){
 const n=v.rescue;
 body='<h2>原通道接返</h2>'+badge('MG-04 / 保持联系')+'<p>实际通行、身份识别、到达确认是三种不同操作。</p>';
 if(n<=1)body+='<p>林正站在楼梯下。工作人员交给他一把与家门钥匙相同的钥匙。</p><blockquote>随身物品用于保留来时的参照。工作人员提供的物品不能替代原物。</blockquote>'+btn('让林摸一摸内袋里的原钥匙','v3-key');
 if(n===2)body+='<div class="v3-records"><p>内袋原钥匙<br><strong>蓝线 · 死结 · 出门前携带</strong></p><p>工作人员递来的钥匙<br><strong>蓝线 · 死结 · 来源未知</strong></p></div><p>钥匙相同只能证明外形相同。工作人员准确报出了林的门牌号。</p><blockquote>第二十条：若对方准确说出您的门牌号，请告知其地址有误，即使并没有错。</blockquote><div class="actions">'+btn('确认地址，接受接返','v3-address','accept')+btn('说地址有误，保留原钥匙自己走','v3-address','deny')+'</div>';
 if(n===3)body+='<p>楼梯已让开。林请你保持联系，客服要求提交当前状态。</p><div class="v3-records"><p>林的消息<br>“先别帮我点到达。我还没走完。”</p><p>客服历史答复<br>“确认联系不等同于确认抵达。”</p></div><div class="actions">'+btn('确认乘客已抵达','v3-contact','arrival')+btn('仅确认联系，保持原行程开放','v3-contact','contact')+'</div>';
 if(n>=4)body+='<p>林已经离开地下通道。你们保留了原始证据，也没有把系统的预计位置当成现场。</p><div class="v3-status">乘客 LIM：原通道已通过<br>关联批次：仍需一位对象维持交接</div>'+btn('保留联系，查看尚未完成的关联','v3-rescue-end');
 }else if(v.panel==='self'){
 body='<h2>我的位置 · 来源复核</h2><div class="v3-records"><p>界面显示<br><strong>常用住所</strong></p><p>数据来源<br><strong>'+(s.v2.ownLocation?'接返参照 / 坐标未验证':'账户预设 / 未授权定位')+'</strong></p></div><p>你的家仍在原来的位置。当前显示的环境与地址，还没有真实的出站事件相连接。</p>'+(v.window?'<p>林站在现实中的路口，看到的窗户没有亮灯。</p>'+btn('保留矛盾，不确认自己已经到家','v3-void'):btn('让已出站的林查看街口和窗户','v3-window'));
 }else if(v.panel==='replace'){
 body='<h2>选择到达对象</h2><div class="v3-records"><p>当前联系 · 林<br><strong>仍在长椅旁 / MG-04</strong></p><p>接返对象 · 林<br><strong>已到达 / 可立即建立联系</strong></p></div><p>新的对象保留相同的姓名、经历及会话偏好。接受后，系统将停止处理仍在站内的旧关联。</p><blockquote>林：先别把这个窗口换掉，好吗。</blockquote><p>此操作无法在本轮撤回。</p><div class="actions">'+btn('保留眼前的联系，继续寻找','v3-open','archive')+btn('接受已到达的林，关闭旧关联','v3-merge-confirm')+'</div>';
 }else if(v.panel==='terminal'){
 body=v.epilogue===2?'<div class="v3-terminal">'+badge('MG-04 / 0 · LOCAL TERMINAL')+'<h2>请由乘客本人处理</h2><p>账户服务界面已退出。</p><dl><dt>空间交接</dt><dd>VOID / 未完成</dd><dt>远程描述层</dt><dd>连接中</dd><dt>现场操作</dt><dd>等待你离开终端</dd></dl><p>你把手从键盘上移开。椅脚擦过地砖。</p><p>屏幕后的玻璃映出了站台的灯。刚才的房间没有窗户。</p><p class="small-note">联系仍在。门外的走廊通向 MG-04。</p></div>':'<h2>现场终端接管</h2><p>索引指向 MG-04 / 0。VOID 是一次尚未完成的交接，系统一直通过熟悉的描述维持乘客的理解。</p><p>记录没有说明是谁建造了它，也没有说明这次交接原本要运送什么。</p><p>当前是否能够听见站内广播？</p>'+(v.broadcast?'<blockquote>林：你那边怎么也有这个声音？</blockquote><p>当前终端会话：你的账户<br>设备编号：MG-04 / 0<br>连接方式：现场</p><p>打开现场层将结束本次网页调查。你保留的联系与证据仍然有效。</p>'+btn('离开账户视图，查看现场终端','v3-enter'):btn('我不在车站','v3-broadcast'));
 }else{
 body='<h2>原始记录复核</h2>'+badge('NT-008 / 保留证据')+'<div class="v3-records"><p>原始受理回执<br><strong>乘客无法找到出口。</strong></p><p>客服当前摘要<br><strong>乘客拒绝使用出口。</strong></p></div>';
 if(!v.source)body+='<p>两份记录指向同一通道，却把问题归给了不同的对象。</p>'+btn('保留两个版本并要求字段来源','v3-source');
 else{
 body+='<div class="v3-status">23:12　TERMINAL_ALLOCATION　终点分配<br>23:16　ENTRY_GATE_EVENT　进站刷卡<br>实际出站闸机事件：未找到</div>';
 if(!v.time)body+='<p>23:12 究竟记录了什么？</p><div class="actions">'+btn('林实际刷卡出站','v3-time','exit')+btn('系统先分配了一个终点','v3-time','allocation')+'</div>';
 else{
 body+='<p>出站字段已经被解释，但人的下落仍未被验证。</p>';
 if(!v.index)body+=s.v2.photo?'<details><summary>查看林的原始照片</summary>'+photoHTML()+'</details><label for="v3-channel">照片上的通道编号</label><input id="v3-channel" placeholder="例如 AB-01" autocomplete="off" maxlength="16">'+btn('查阅维护索引','v3-index-submit'):'<p>还需要林的换乘照片来核对现场通道编号。</p>'+b('让林发换乘照片','v2-photo');
 else body+='<div class="v3-status">MG-04 / 0<br>VOID = 空间交接未完成<br>维护原则：原始连接优先于显示位置。<br>未完成交接须保留关联，禁止仅以终点分配关闭。</div>';
 if(!s.ending)body+='<div class="actions">'+(!v.held&&!v.rescued?btn('冻结自动修正，保留争议','v3-freeze'):v.held?'<p>自动修正已冻结。待处理队列第 103 件显示你的账户；提交时间：尚未发生。</p>':'<p>林已离站。你的关联交接尚未完成。</p>')+(!v.rescued?btn('查看已到达的关联对象','v3-merge-review'):'')+'</div>';
 if(v.held||v.rescued)body+='<p class="small-note">两份记录仍在。你可以继续查阅通道索引，或回到客服申请原通道返回。</p>';
 if((v.held||v.rescued)&&v.index&&s.v2.routeChecked)body+=btn('追查 VOID：请求原始连接记录','v3-terminal');
 }
 }
 }
 return `<div class="v3-investigation">${body}${v.note?`<p role="status" class="form-feedback">${esc(v.note)}</p>`:''}${busy?'<p role="status" class="small-note">林正在回复，请等他把话说完。可先打开聊天查看。</p>':''}<div class="actions">${b('查看林的消息','open-chat')}${b('暂时合上档案','close')}</div></div>`;
}
export function expansionEnding(s){
 const v=investigation(s);
 if(!['replacement','void','terminal'].includes(s.ending))return '';
 const details={replacement:['接返完成','到达对象：LIM / 旧关联：停止处理','接返后的林记得你要的饮料，连玩笑都和刚才一样。旧窗口里，那位陪你走过通道的林仍在等出口。','系统：关系已延续。无需重复接收。'],void:['尚未离站','林：已离站 / 你：出站事件未找到','林站在现实中的路口，而你眼前亮着灯的房间没有对应的出站记录。现实中的家没有移动。','林：这次换我陪你找路。'],terminal:['请由乘客本人处理','MG-04 / 0 · LOCAL TERMINAL','账户页面退到一台旧显示器里。你把手从键盘移开，椅脚擦过地砖。门上写着 MG-04 / 0，门外是通往换乘口的走廊。',v.rescued?'林：我已经出来了。这次我查资料，你看路。':'林：我还在照片里的地方。你先看门上的编号。']}[s.ending];
 return `<div class="page-heading"><div>${badge('行程档案 / RECORD RETAINED')}<h1>${details[0]}</h1></div></div><section class="panel end-paper ${s.ending==='terminal'?'terminal-ending':''}">${s.ending==='terminal'?'<div class="terminal-screen"><span>夜间账户服务 / 会话仍在运行</span><strong>空间交接：VOID</strong><p>终点分配　23:12<br>乘客接收　23:16<br>现场终端　MG-04 / 0</p></div>':''}<div class="v3-status">${details[1]}</div><p>${details[2]}</p><blockquote>${details[3]}</blockquote>${s.ending==='replacement'?'<p class="small-note">旧聊天仍然保留。接返后的林还在线，你可以继续给他发消息。</p>':''}${s.ending==='terminal'?'<p class="small-note">LAST TRAIN · 未完待续</p>':''}${b('查看林的消息','open-chat')}<div class="actions">${b('重新体验','restart')}</div></section>`;
}
export function migrateState(s){
 s={...s,v3:investigation(s),v2:{...s.v2}};
 if(!s.v2.drink||s.v2.drink==='奶茶')s.v2.drink='茉莉奶白经典原味';
 // Retire the exposed forum introduction from older saves as well.
 s.linLog=s.linLog.filter(m=>!m.id.startsWith('relay-'));
 s.linQueue=s.linQueue.filter(m=>!m.id.startsWith('relay-'));
 s.events=s.events.filter(e=>e!=='relay-intro');
 s.linRead=Math.min(s.linRead,s.linLog.filter(m=>m.who==='lin').length);
 if(s.ending==='return'){s.v3.rescued=true;s.v3.rescue=4;s.v3.contact=true;s.v3.panel='aftermath';}
 if(s.ending==='pending')s.v3.held=true;
 if(['return','pending','reference','refund'].includes(s.ending)){s.ending=null;s.view='support';s.v3.mergeWarn=false;s.refundSeen=false;}
 if(s.v3.epilogue===2&&s.ending!=='erasure')s.ending='terminal';
 return s;
}

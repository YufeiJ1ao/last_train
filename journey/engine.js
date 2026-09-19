import {openingReplies,intentFor,linBusy} from './messages.js';
const newMessage=(id,who,text,time='23:48')=>({id,who,text,time});
export const createState=()=>({schema:8,round:Date.now().toString(36)+Math.random().toString(36).slice(2),view:'opening',opening:0,claim:false,formMessage:'',plan:false,compared:false,proof:false,linChecked:false,linRead:0,preserve:false,selected:'28',mapVersion:'current',seen:[],chat:[],asked:[],ending:null,refundable:6.10,linLog:[],linQueue:[newMessage('hello','lin','救命…')],events:[],sequence:0,togetherAsked:false,memoryAsked:false,rulesRead:false,ruleCompared:false,refundSeen:false,signal:null});
export const duplicateKnown=s=>s.seen.includes('28')||s.seen.includes('43');
export const canResolve=s=>Boolean(s.opening===3&&s.claim&&s.plan&&s.compared&&s.proof&&s.linChecked&&s.asked.includes('time')&&s.togetherAsked&&s.ruleCompared&&!linBusy(s));
export const canRefund=s=>Boolean(canResolve(s)&&s.refundSeen&&s.linLog.some(m=>m.id==='refund-blackout-0'));
function incoming(s,key,lines,time='23:52'){
 if(s.events.includes(key))return;
 s.events.push(key);lines.forEach((text,i)=>s.linQueue.push(newMessage(key+'-'+i,'lin',text,time)));
}
function outgoing(s,text){s.sequence++;s.linLog.push(newMessage('player-'+s.sequence,'me',text,s.proof?'23:54':'23:49'));}
function signal(s,kind){s.sequence++;s.signal={id:s.round+'-'+s.sequence,kind,at:Date.now()};}
function topic(s,key,question){
 if(question)outgoing(s,question);
 const repeated={together:'我记得你就在我旁边。你真的不记得了？',memory:'可能是我记错了吧……可那个人真的很像你。',duplicate:'站牌上还是雷恩街，我没看错。',missing:'这里看起来很正常。你说地图上没有，我反而不敢走了。',stillwell:'就是这个名字。你能查到它在哪吗？',waiting:'嗯，我没动。'};
 const previous=key==='wait'||key==='exit'?'waiting':key;
 if(question&&s.events.includes(previous)&&repeated[previous]){s.sequence++;incoming(s,'followup-'+s.sequence,[repeated[previous]],'23:54');return;}
 if(key==='together'&&s.plan){s.togetherAsked=true;incoming(s,'together',['咱们不是一块出站的吗？','你还在闸机那儿等了我一下。不是吧，你比我还健忘哈哈。']);}
 else if(key==='memory'&&s.togetherAsked){s.memoryAsked=true;incoming(s,'memory',['你还帮我扶了门呀。','……不过你那时候一直没说话。','你现在在哪？']);}
 else if(key==='duplicate'&&s.claim)incoming(s,'duplicate',['两个雷恩街？不会吧，我刚刚还看过这块牌子。','等下，长椅上那个袋子也还在。这站是不是有两个出口啊。']);
 else if(key==='missing'&&s.claim)incoming(s,'missing',['有啊，我就站在这里。','灯、长椅、线路图都好好的。站名……我怎么又看不清了。']);
 else if(key==='stillwell')incoming(s,'stillwell',['斯蒂尔韦尔？刚才广播好像说过这个名字。','但我记得我们今天的路线不经过那儿啊。']);
 else if((key==='wait'||key==='exit')&&s.proof){s.linChecked=true;incoming(s,'waiting',key==='exit'?['刚才明明就在长椅右边。现在那儿只有一面墙。','我先不动，你帮我看看吧。']:['好，我就在椅子边等你。','你慢慢看，我今天跟闸机的仇可以晚点报。'],'23:54');}
 else if(key==='blackout')incoming(s,'blackout-reply',['就一瞬间。我再睁眼，还是这张长椅。','你那边刚刚点什么了吗？'],'23:54');
 else{
  const answers={key:'钥匙？在我兜里呢。这回没丢，放心哈哈。',time:'我手机上是 23:54 啊。站里的钟……等等，秒针怎么没动。',where:'我在站里，长椅旁边。刚才以为出来了，走两步又看见闸机。',care:s.proof?'你别这么说，我本来还觉得只是自己迷路了。我先等你。':'没事没事，我先把这笔冤枉钱讨回来。',drink:'好好好，退回来就请！奶茶咖啡随你挑。',hello:'在呢在呢。你是不是也被那个退款页面绕晕了。',other:s.proof?'我这边信号断断续续的。你是问出口，还是问那两个同名站？':'你说的是哪一段？我现在只想把多扣的六镑一讨回来，呜呜。'};
  s.sequence++;incoming(s,'reply-'+s.sequence,[answers[key]||'我也记不太清了。你再看看那张路线？'],s.proof?'23:54':'23:49');
 }
}
export function transition(s,action,value){
 const next={...s,seen:[...s.seen],chat:[...s.chat],asked:[...s.asked],linLog:[...s.linLog],linQueue:[...s.linQueue],events:[...s.events]};
 if(s.ending&&!['nav','plan','inspect','mapVersion','read','deliver'].includes(action))return next;
 switch(action){
  case 'deliver':if(next.linQueue[0]?.id===value)next.linLog.push(next.linQueue.shift());break;
  case 'opening':{
   const step=typeof value==='object'?value.step:value,text=typeof value==='object'?value.text:openingReplies[step];
   if(step!==next.opening||step>=3||linBusy(next))break;
   outgoing(next,text);next.opening++;
   if(step===0)incoming(next,'overcharge',['我好像又被地铁多扣钱了'],'23:48');
   if(step===1)incoming(next,'opening-detail',['门开着嘛。我以为它今天终于决定善待我了。','我这边账户退款页一直转圈，呜呜。','你能不能帮我看一下。退回来请你喝东西。'],'23:48');
   if(step===2)next.view='history';
   break;
  }
  case 'nav':if(next.opening===3&&['history','map','support'].includes(value))next.view=value;break;
  case 'start':if(next.opening===3){next.claim=true;next.view='claim';incoming(next,'route',['我应该是在奥德维克下的。返程路线和刷卡回执都发你啦，靠谱吧！'],'23:49');}break;
  case 'plan':if(next.opening===3)next.plan=true;break;
  case 'mapVersion':if(['current','archive'].includes(value)){next.mapVersion=value;if(value==='archive'&&next.compared)incoming(next,'archive',['你把地图换回旧的了？','刚才那块站牌好像暗了一下。']);}break;
  case 'inspect':
   next.selected=value;if(!next.seen.includes(value))next.seen.push(value);
   if(['28','43'].includes(value)&&next.claim)incoming(next,'map-duplicate',['你也看到雷恩街了？','我刚才明明已经过了这一站。怎么又是这个名字。']);
   if(value==='06'&&next.claim&&!next.events.includes('stillwell'))topic(next,'stillwell');
   if(value==='44'&&!next.ending){signal(next,'static');incoming(next,'unknown-station',['刚刚周围突然一点声音都没有了。','……你那边点什么了吗？']);}
   break;
  case 'compare':if(next.claim&&duplicateKnown(next))next.compared=true;break;
  case 'ask':if((value==='where'&&next.claim)||(value==='duplicate'&&duplicateKnown(next))||(value==='time'&&next.proof)||(value==='missing'&&next.claim)||(value==='rules'&&next.ruleCompared)){
   if(!next.asked.includes(value))next.asked.push(value);if(value==='duplicate')next.compared=true;
  }break;
  case 'proof':if(next.asked.includes('duplicate')){next.proof=true;incoming(next,'exit',['等一下，出口怎么又找不到了？刚才还在长椅右边。'],'23:54');}break;
  case 'lin-topic':topic(next,value.topic,value.question);break;
  case 'lin-text':if(!linBusy(next)&&typeof value==='string'&&value.trim())topic(next,intentFor(value,next),value.trim().slice(0,320));break;
  case 'check-lin':if(next.proof&&!linBusy(next))topic(next,'wait','先别跟着指示走，留在原地。我在核对记录。');break;
  case 'read':if(Number.isFinite(value))next.linRead=Math.max(next.linRead,value);break;
  case 'rules':if(next.proof)next.rulesRead=true;break;
  case 'rule-compare':if(next.rulesRead){next.ruleCompared=true;incoming(next,'rules-read',['那个安全须知我刚刚也看了。','我这边写着：请勿继续核对同行人员。你那边也是这句吗？'],'23:54');}break;
  case 'refund-offer':if(canResolve(next)&&!next.refundSeen){next.refundSeen=true;signal(next,'blackout');incoming(next,'refund-blackout',['欸？刚刚怎么突然眼前一黑','你还在看退款页面吗？'],'23:54');}break;
  case 'preserve':if(canResolve(next)){next.preserve=true;next.view='resolution';}break;
  case 'return':if(next.preserve&&canResolve(next)&&value==='museum'){next.ending='return';next.view='ending';incoming(next,'returned',['回到博物馆花园了，出站了！上面的店还开着。','我自己走回去，饮料还是算我的。'],'23:55');}break;
  case 'refund':if(canRefund(next)&&value===true){next.ending='refund';next.view='ending';incoming(next,'closed',['他们说，你已经替我确认到站了。','你选的是哪里？'],'23:55');}break;
 }
 return next;
}

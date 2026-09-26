import {erasureTotal} from './messages.js';
// Narrative state is separate from account records. Looking at clues is always safe.
export const freshStory=()=>({shared:false,observation:0,routeChecked:false,drink:'茉莉奶白经典原味',stability:3,violations:[],topics:{},idle:0,idleAt:Date.now(),holdUntil:0,photo:false,phone:0,key:false,hotline:0,dispute:false,snapshot:false,refusals:0,hover:0,recovered:false,ownLocation:false,address:false,checkpoint:0,hint:0,reduced:false,pinned:true,pinCollapsed:false,identityCount:0,chatClosures:0,lastChatClose:0,closeWatch:false,chatPaused:false});
export function cloneStory(s){return {...s,v2:{...freshStory(),...s.v2,topics:{...s.v2?.topics},violations:[...(s.v2?.violations||[])]},linLog:[...s.linLog],linQueue:[...s.linQueue],events:[...s.events],chat:[...s.chat]};}
function say(s,lines){for(const text of lines){s.sequence++;s.linQueue.push({id:'v2-'+s.sequence,who:'lin',text,time:s.proof?'23:54':'23:49'});}}
function sendPhoto(s){if([...s.linLog,...s.linQueue].some(m=>m.attachment==='museum-gardens'))return;s.sequence++;s.linQueue.push({id:'v2-'+s.sequence,who:'lin',text:'[照片] 换乘时拍的',attachment:'museum-gardens',time:s.proof?'23:54':'23:49'});}
function me(s,text){s.v2.chatPaused=false;s.sequence++;s.linLog.push({id:'v2-me-'+s.sequence,who:'me',text,time:'23:54'});s.v2.idleAt=Date.now();s.v2.idle=0;}
function emitSignal(s,kind){s.sequence++;s.signal={id:s.round+'-'+s.sequence,kind,at:Date.now()};}
function support(s,q,a){s.chat.push({who:'me',text:q},{who:'agent',text:a});}
function once(s,key,lines){if(s.events.includes('v2-'+key))return;s.events.push('v2-'+key);say(s,lines);}
function hurt(s,key){if(!s.v2.violations.includes(key)){s.v2.violations.push(key);s.v2.stability=Math.max(0,s.v2.stability-1);if(s.v2.stability===1)say(s,['你想喝什么来着？','……对不起，我刚刚突然想不起来了。']);if(s.v2.stability===0)say(s,['我正在完成行程。','不是，我想说，我还在等你。','你还在在？']);}}
export function extraIntent(text,s){const t=text.toLowerCase().replace(/\s/g,'');
 if(/不(要|用|想|退)|先别|别退/.test(t)&&/退|钱|请/.test(t))return /请/.test(t)?'no-drink':'no-refund';
 if(/茉莉|奶白|经典原味|奶茶|咖啡/.test(t))return /咖啡/.test(t)?'coffee':'tea';
 if(/等我一下|忙一会|离开一下|马上回来|等会回来/.test(t))return 'pause';
 if(/回来[了啦]|我在[呢的]?|还在|来了/.test(t)&&!(/哪|你在/.test(t)))return 'back';
 if(/(你|林).*(假|真的|本人|副本)|你是林|你到底是谁|冒充/.test(t))return /冒充/.test(t)?'protect':'identity';
 if(/照片|拍照|拍一张/.test(t))return 'photo';
 if(/电话|打给|语音/.test(t))return 'phone';
 if(/定位|共享位置|位置共享/.test(t))return 'location';
 if(/在家|我家里/.test(t))return 'home';
 if(/不一样|之前.*说|刚才.*说|矛盾/.test(t))return 'contradiction';
 if(/换乘|下过车|下车了没|坐反|上错车/.test(t))return 'transfer';
 if(/周围|旁边有什么|环境/.test(t))return 'surroundings';
 if(/还有人|其他人|别人|人多/.test(t))return 'people';
 if(/钥匙/.test(t))return 'key';
 if(/我.*(怕|害怕)|我也怕/.test(t))return 'scared';
 if(/别怕|相信你|陪着你|不会走|不走|我信你/.test(t))return 'comfort';
 return null;
}
function talk(s,key){const v=s.v2;v.topics[key]=(v.topics[key]||0)+1;const again=v.topics[key]>1;
 switch(key){
 case 'tea':case 'coffee':v.drink=key==='tea'?'茉莉奶白经典原味':'咖啡';say(s,again?['记下了，'+v.drink+'。再说我真的要馋了。']:key==='tea'?['茉莉奶白经典原味。记着呢。','你别看着看着又换主意啊。']:['这个点喝咖啡？','行，你今晚睡不着别又找我聊到三点。']);break;
 case 'no-drink':say(s,['不行，我已经靠这杯饮料把活外包给你了。']);break;
 case 'no-refund':say(s,s.proof?['嗯，不要了。','你先别关聊天。']:['六镑一呢。','不过先出去也行，我找找出口。']);break;
 case 'pause':v.holdUntil=Date.now()+300000;say(s,['好，你先忙。','我在这里等，不乱走。']);break;
 case 'back':say(s,s.proof?['嗯，你在就好。','刚才有点安静。']:['回来了？我差点准备自己跟客服决斗。']);break;
 case 'identity':
 v.identityCount++;
 if(v.identityCount===1)say(s,s.proof?['是啊。','你别突然这么问。你那边看到什么了？']:['假的林也要自己申请退款吗。']);
 else if(v.identityCount===2)say(s,['你已经问过一次了。','那条提示说不要反复核对同一个人。','先别再问了，好吗。']);
 else if(v.identityCount===3){hurt(s,'identity');emitSignal(s,'identity');say(s,['我是林。','我是……我是。','……刚才灯全灭了。','你还认得我，对吧？']);}
 else say(s,['别再让我证明了。','我还在这里，先陪我找出口。']);
 break;
 case 'protect':say(s,['……吓我一跳。','那你把看到的告诉我，我们先别听他们的。']);break;
 case 'photo':v.photo=true;say(s,again?['换乘时那张就在上面，可以点开看。']:['我换乘时拍过指示牌，怕坐反。']);sendPhoto(s);if(!again)say(s,['往奥德维克，左边。我还特意看了两遍呢。']);break;
 case 'transfer':say(s,['下车了啊，还走了老长一段。','我差点以为那六镑一是收的徒步费。','站台写着去奥德维克，我还拍了张图怕坐反。']);v.photo=true;sendPhoto(s);break;
 case 'phone':v.phone++;say(s,v.phone===1?['我打给你。','……听见了吗？我喂得像个卖鱼的。','只听得到通风声？算了，先打字。']:['打字吧。','刚刚通话结束以后，等待音乐还响了一会儿。']);break;
 case 'location':v.shared=true;say(s,again?['共享还开着呢。你能看到我吗？']:['发你了。','这定位把我放河里了，我目前还没学会游泳。']);break;
 case 'home':say(s,s.togetherAsked?['可我记得你还帮我扶了门。','我不是不信你……我有点分不清了。']:['那就好，你别跑来接我，我自己能回。']);break;
 case 'contradiction':say(s,['你说得对，跟刚才对不上。','旧消息先别删。我们从确定的地方开始看。']);break;
 case 'surroundings':say(s,['长椅，售货机，一张特别大的牙齿广告。','牙白得有点没必要。']);break;
 case 'people':say(s,['有个拿袋子的，一直低头。','我刚站起来，他就抬头了。还是先问你吧。']);break;
 case 'key':v.key=true;say(s,again?['我的钥匙扣是自己用蓝线缝过的。','他们给的那串，连线头都一样。']:['钥匙在兜里，放心，这回没丢。','扣子开过线，我拿蓝线缝的，丑得很有辨识度。']);break;
 case 'scared':say(s,['……我也有一点。','咱们一次弄一个事。你看记录，我看路。']);break;
 case 'comfort':say(s,again?['知道啦。我也在找路，不会都丢给你的。']:['嗯。','你不用证明我是谁，先陪我把这段路走完吧。']);break;
 }
}
export function storyAction(original,action,value){let s=cloneStory(original),v=s.v2;
 if(action==='lin-text'&&s.ending==='replacement'){
  if(typeof value!=='string'||!value.trim()||s.linQueue.length)return s;
  const text=value.trim().slice(0,320);me(s,text);
  const identity=/谁|哪(个|一个)林|你是|真(的|实)|本人|虚拟|副本|冒充|who|are you|real/i.test(text);
  const answer=identity?'我就是我啊':/茉莉|奶白|喝|饮料|奶茶|口味/.test(text)?'茉莉奶白经典原味。我记得。':/站|出口|长椅|另一个/.test(text)?'那是旧的记录。你已经确认我回来了。':'我在。现在回你消息的就是我。';
  say(s,[answer]);s.linQueue.at(-1).source='matched';return s;
 }
 if(action==='lin-text'&&s.ending==='erasure'){if(typeof value==='string'&&value.trim()&&!s.linQueue.length)me(s,value.trim().slice(0,320));return s;}
 if(action==='v2-erasure-tick'){if(s.ending==='erasure'&&!s.linQueue.length){const total=erasureTotal(s);v.erasureChars=Math.min(total,(v.erasureChars??(v.erasureStep>=12?total:0))+1);v.erasureStep=v.erasureChars>=total?12:1;}return s;}
 if(action==='lin-text'){if(s.ending||s.linQueue.length||typeof value!=='string')return null;const key=extraIntent(value,s);if(!key)return null;me(s,value.trim().slice(0,320));talk(s,key);return s;}
 if(!action.startsWith('v2-'))return null;
 if(action==='v2-reduced'){v.reduced=!v.reduced;return s;}
 if(action==='v2-pin'){v.pinned=!v.pinned;return s;}
 if(action==='v2-pin-collapse'){v.pinCollapsed=!v.pinCollapsed;return s;}
 if(s.ending)return s;
 switch(action){
 case 'v2-reidentify-warn':if(!s.proof||s.linQueue.length)break;v.reidentifyWarned=true;once(s,'reidentify-warning',['刚才又有人问我是不是林。','我说是，聊天里就少了一句话。','你先别让他们重新核验了，好吗。']);break;
 case 'v2-reidentify-confirm':if(!v.reidentifyWarned||s.linQueue.length)break;s.ending='erasure';s.view='ending';v.erasureStep=0;v.erasureChars=0;say(s,['关联乘客状态正常。','不是我打的。','我刚刚打的是我还在这里。','别删聊天','不是让你一直看着','我是怕你以后以为']);break;
 case 'v2-rule-probe':
 if(!s.ruleCompared)break;
 if(!s.events.includes('v2-rule-probe')){hurt(s,'rule-probe');emitSignal(s,'identity');once(s,'rule-probe',['刚才有人问我是不是林。','我以为是你。','可你没发消息啊。']);}
 break;
 case 'v2-chat-close':
 if(v.chatPaused)break;v.chatPaused=true;
 if(!v.closeWatch){once(s,'ordinary-close',['好，你先忙。需要的话我再找你。']);break;}
 if(Date.now()-v.lastChatClose<8000||v.chatClosures>=3)break;
 v.lastChatClose=Date.now();v.chatClosures++;
 say(s,v.chatClosures===1?['你把聊天关了吗？','先别走，我还没出去。']:v.chatClosures===2?['你是不是不想管了。','……对不起，我不催你。','把聊天留着就好，可以吗。']:['别关。','我刚才差点想不起你的名字了。','你不用说话，让我知道你还在就好。']);
 break;
 case 'v2-chat-open':
 v.chatPaused=false;
 if(v.chatClosures>0)once(s,'chat-return-'+v.chatClosures,[v.chatClosures===1?'还在就好。我继续找路。':'嗯，看见你了。我们慢慢来。']);
 break;
 case 'v2-share':v.shared=true;v.pinned=true;once(s,'share',['共享位置发你了。','我在走通道，先看看能不能上到街上。']);break;
 case 'v2-observe':if(!v.shared)break;v.observation=Math.min(3,v.observation+1);if(v.observation===1)once(s,'obs1',['走着呢，这通道怎么这么长。','你那边看到我在动吗？']);if(v.observation===2)once(s,'obs2',['我停下了。','你先看看，别让导航给我带到河里去。']);if(v.observation===3){v.routeChecked=true;once(s,'obs3',['我没动。你说客服那个点还在走？','那它显示的就不是我现在的位置啊。']);}break;
 case 'v2-own-review':v.ownReview=true;break;
 case 'v2-own-decline':v.ownReview=false;v.ownDeclined=true;once(s,'own-decline',['不用发你的，能看到我就行。','你别跑来接我。']);break;
 case 'v2-own':if(!v.ownReview||v.ownLocation)break;v.ownReview=false;v.ownLocation=true;hurt(s,'own-location');support(s,'将我的位置提供给接返服务。','关联参照已接收。您的位置将用于完成本批次空间交接。');once(s,'own',['你那个点怎么也在 MG-04。','等下，刚才还没门的墙上，多了一扇门。','上面的号码……你先别再发了。']);emitSignal(s,'minor-location');break;
 case 'v2-photo':v.photo=true;once(s,'photo',['这就是我换乘时拍的那张。']);sendPhoto(s);break;
 case 'v2-verify':if(!s.proof)break;hurt(s,'verify');once(s,'verify',['对面那个人过来了。','他……跟你长得好像。','你先别让他带我走，好吗。']);break;
 case 'v2-shortcut':if(!v.routeChecked)break;hurt(s,'shortcut');once(s,'shortcut',['我按你发的近路走了一小段。','牌子上的时间越来越短，可是一直没有楼梯。','我先退回去。']);break;
 case 'v2-address':if(!s.proof)break;v.address=true;hurt(s,'address');support(s,'确认账户中保存的住所，用于接返。','目的地已授权。接返人员将携带所需通行物品。');once(s,'address',['工作人员给了我一串钥匙。','他说你帮我确认过地址了。','可是我的钥匙就在兜里啊。']);break;
 case 'v2-hover':if(s.linQueue.length)break;if(v.hover===0){v.hover=1;once(s,'hover1',['等下。','先别点，我这边还没出去。']);}else if(v.refusals&&v.hover===1){v.hover=2;once(s,'hover2',['你是不是想关掉了？','我知道弄了很久了。再陪我一下行吗。']);}break;
 case 'v2-refuse':if(!s.proof)break;v.refusals=Math.min(3,v.refusals+1);if(v.refusals===1){support(s,'暂不确认到达。','已保留。您可继续查询原始记录或申请乘客接返。');once(s,'refuse1',['先别关，我还没找到出口。']);}else if(v.refusals===2){support(s,'仍无法确认到达。','关联对象未释放。您的行程尚未完成，请继续核对。');once(s,'refuse2',['广播刚才叫我名字了。','我没答应。你继续看。']);}else{if(!s.events.includes('v2-pressure')){s.sequence++;s.signal={id:s.round+'-'+s.sequence,kind:'pressure',at:Date.now()};once(s,'pressure',['刚才屏幕上是不是有很多个我？','……你先别选。','六镑一还想买断我的人生啊。']);}support(s,'保留这笔行程。','您可通过时间记录争议申请复核。等待期间请保持原始记录。');}break;
 case 'v2-hotline':v.hotline=Math.max(1,v.hotline);support(s,'请求人工协助。','您当前排在第 103 位。预计等待时间为 8 小时。本热线将于 4 分钟后结束服务。请前往出口。如需保留排队位置，请勿挂断。');break;
 case 'v2-hotline-next':if(v.hotline!==1)break;v.hotline=2;support(s,'查询排队状态。','您当前排在第 102 位。预计等待时间为 8 小时。');once(s,'hotline',['刚刚有个人跟着工作人员走了。','我还在原地。']);break;
 case 'v2-hotline-end':if(v.hotline!==2)break;v.hotline=3;support(s,'等待人工接通。','本热线服务时段已结束。您的排队位置将被保留。');once(s,'hotline-end',['我这里也在放那个等待音乐。','是从售货机后面传出来的。']);break;
 case 'v2-complaint':if(!s.proof)break;support(s,'林还没离开车站，请不要关闭行程。','已登记：乘客无法找到出口。您可保存当前受理回执。');v.complaint=true;break;
 case 'v2-snapshot':if(v.complaint)v.snapshot=true;break;
 case 'v2-dispute':if(!s.proof||!s.asked.includes('time')||!v.snapshot||!s.ruleCompared)break;v.dispute=true;support(s,'原回执是无法找到出口，你们却写成拒绝使用出口。申请时间记录争议复核。','争议已受理。复核完成前保留原始换乘记录。乘客可请求返回最后一次有效换乘地点。请勿确认已抵达。');once(s,'dispute',['那我们先不管钱了。','你看旧记录，我找回去的路。']);break;
 case 'v2-recover':if(!v.dispute||!v.photo)break;v.recovered=true;v.stability=Math.max(2,v.stability);once(s,'recover',['MG-04，照片里那块牌子。找到了。','这里好冷。出去我想喝热的。']);break;
 case 'v2-safe':if(v.checkpoint===1&&v.recovered){v.checkpoint=2;once(s,'safe',['出口牌让我下楼，可我记得刚才是从上面下来的。','好，我不跟它走。我退回刚才认出来的 MG-04 那边。']);}break;
 case 'v2-unsafe':if(v.checkpoint===1){hurt(s,'exit');once(s,'unsafe',['走下去还是刚才那面墙。','我退回来了。那个箭头不能信。']);}break;
 case 'v2-finish':if(v.checkpoint===2&&v.recovered){s.ending='return';s.view='ending';say(s,['出来了。路上还有车。','你选的'+(v.drink||'饮料')+'我还记着呢。','这回我自己走回去。到家再跟你说。']);}break;
 case 'v2-idle':if(s.opening<3||!s.claim||s.linQueue.length||Date.now()<v.holdUntil)break;v.idle=Math.min(3,v.idle+1);say(s,[s.proof?['你还在看吗？','你还在吗？','在的话回我一下。'][v.idle-1]:['你是不是也被那个转圈圈困住了。','人呢，奶茶债主。','你忙的话晚点也行，我再试试。'][v.idle-1]]);break;
 case 'v2-support':{const key=value;const answers={location:['林找不到出口。','请先提供出站车站，以便查询该站出口。未知站点不支持出口查询。'],danger:['他有危险，请先找人。','请由乘客本人提交求助。如乘客无法操作，可由关联乘客代为确认。确认联系不等同于确认抵达。'],identity:['确认我仍与林保持联系。','联系状态已记录。此操作不会关闭行程。请勿使用到达确认代替联系确认。'],records:['为什么定位还在移动？','接返路线显示预期位置。预期位置用于完成服务，不代表乘客当前设备位置。'],stop:['不要退款了，先把他找回来。','退款可暂停。找回乘客需要一条保留有效的原始记录，请提交争议复核。'],rules:['安全提示为什么互相矛盾？','请参阅最新更正。此前的通知可能延误您的到达确认。'],human:['我要真人客服。','可转接夜间帮助热线。预计等待时间为 8 小时。'],fallback:['进一步说明情况。','请说明您需要查询位置、报告危险、暂停退款，还是申请人工协助。']};const [q,a]=answers[key]||answers.fallback;support(s,q,a);break;}
 }
 return s;
}
export function afterBase(s,action,value){s=cloneStory(s);const v=s.v2;
 if(action==='opening'&&s.opening===3)once(s,'drink-promise',['茉莉奶白经典原味，对吧。','行，退回来给你买。']);
 if(action==='ask'&&value==='time'&&s.proof&&s.asked.includes('time'))emitSignal(s,'minor-time');
 if(action==='lin-text'||action==='opening'||action==='lin-topic'||action==='check-lin'){v.idleAt=Date.now();v.idle=0;v.chatPaused=false;}
 if(action==='proof'&&s.proof)once(s,'unlock',['我把位置也共享给你吧。','刚才还觉得是自己迷路，现在有点不对劲了。']);
 if(action==='return'&&s.ending==='return'){
 s.ending=null;s.view='resolution';s.linQueue=s.linQueue.filter(m=>!m.id.startsWith('returned'));s.events=s.events.filter(e=>e!=='returned');
 if(!v.dispute||!v.recovered){s.formMessage='返回前请完成争议复核，并与乘客核对原始通道。';}
 else {v.checkpoint=1;once(s,'return-check',['走到岔路了。','新出口牌指向下面。刚才认出来的 MG-04 通道在后面。往哪边？']);}
 }
 if(action==='deliver'){
 const delivered=s.linLog.at(-1);
 if(delivered?.id===value&&delivered.text==='那它显示的就不是我现在的位置啊。')emitSignal(s,'minor-location');
 if(delivered?.id===value&&/你先别关聊天|再陪我一下行吗|先别点，我这边还没出去/.test(delivered.text))v.closeWatch=true;
 if(delivered?.id===value&&delivered.effect)emitSignal(s,delivered.effect);
 }
 if(action==='refund'&&s.ending==='refund'){s.linQueue=s.linQueue.filter(m=>!m.id.startsWith('closed'));say(s,['退到了！请你喝东西。','他们终于让我走了。',v.address?'我到你门口了。':'你怎么走这么快，等等我啊。',v.address?'他们给我的钥匙能开。':'那你刚才为什么帮我们俩确认出站？']);s.linQueue.at(-1).effect='arrival';say(s,['关联乘客：你 / 你','……你到底替谁确认了？']);}
 return s;
}

export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const openingReplies=['？','你又没刷出去？','行'];
export const linMessages=s=>s.linLog||[];
export const linBusy=s=>Boolean(s.linQueue?.length);
export const incomingCount=s=>linMessages(s).filter(m=>m.who==='lin').length;
export function receiptHTML(s,m){const index=linMessages(s).indexOf(m);const read=m.readByLin===true||(m.readByLin===undefined&&linMessages(s).slice(index+1).some(n=>n.who==='lin'));return `<small class="message-receipt ${read?'is-read':'is-unread'}">${read?'已读':'未读'}</small>`;}
export const photoHTML=()=>`<a class="lin-photo" href="assets/lim-museum-gardens.webp" target="_blank" rel="noopener" aria-label="查看林的换乘照片原图（新窗口）"><img src="assets/lim-museum-gardens.webp" width="1448" height="1086" alt="林拍摄的博物馆花园换乘通道：MG-04，阿尔德线，奥德维克向左"/><span>换乘时拍的 · 点击查看原图 ↗</span></a>`;
export function conversationHTML(s){if(s.ending==='erasure')return erasureHTML(s);return linMessages(s).map(m=>`<div class="lin-line ${m.who==='me'?'outgoing':''}"><span>${m.who==='me'?'我':m.source==='matched'?'林 · 接返关联':m.source==='original'?'林 · 原始联系':'林'} · ${m.time}</span>${m.attachment==='museum-gardens'?(s.ending==='reference'?'<p class="attachment-replaced">附件已同步 · 原通道参照不可用</p>':photoHTML()):`<p>${esc(m.text)}</p>`}${m.who==='me'?receiptHTML(s,m):''}</div>`).join('');}
export const erasureTotal=s=>linMessages(s).filter(m=>m.who==='lin').reduce((n,m)=>n+(m.attachment?1:Array.from(m.text).length),0);
function erasureHTML(s){let remaining=s.v2.erasureChars??(s.v2.erasureStep>=12?erasureTotal(s):0);return linMessages(s).map(m=>{if(m.who==='me')return `<div class="lin-line outgoing"><span>我 · ${esc(m.time)}</span><p>${esc(m.text)}</p>${receiptHTML(s,m)}</div>`;const chars=Array.from(m.text);const length=m.attachment?1:chars.length;const removed=Math.min(remaining,length);remaining-=removed;if(removed===length)return '';const text=chars.slice(0,chars.length-removed).join('');return `<div class="lin-line"><span>林 · ${esc(m.time)}</span>${m.attachment?photoHTML():`<p>${esc(text)}</p>`}</div>`;}).join('');}
export function typingHTML(s){if(s.ending==='erasure'&&!linBusy(s))return s.v2.erasureStep<5?'正在输入<span class="typing-dots"><i></i><i></i><i></i></span>':'<span>消息已发送 · 等待回复</span>';return linBusy(s)?'<span>林正在输入</span><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>':'';}
export function repliesHTML(s){
 if(linBusy(s)||s.ending)return '';
 if(s.opening<3)return `<button class="button" data-action="lin-reply" data-step="${s.opening}">${openingReplies[s.opening]}</button>`;
 if(s.togetherAsked&&!s.memoryAsked)return '<button class="button secondary" data-action="lin-topic" data-topic="memory">我不记得我们一起坐过。</button>';
 if(s.proof&&!s.linChecked)return '<button class="button" data-action="check-lin">先别跟着指示走，留在原地。我在核对记录。</button>';
 return '';
}
export function composerHTML(s,id,draft=''){
 return `<form class="lin-compose" data-lin-compose="${id}"><label class="sr-only" for="lin-input-${id}">给林发消息</label><textarea id="lin-input-${id}" data-lin-input="${id}" rows="2" maxlength="320" placeholder="给林发消息…" ${(s.ending&&!['erasure','replacement'].includes(s.ending))?'disabled':''}>${esc(draft)}</textarea><button type="submit" class="button" ${linBusy(s)||(s.ending&&!['erasure','replacement'].includes(s.ending))?'disabled':''}>发送</button></form>`;
}
export const deliveryDelay=m=>Math.min(1900,720+Array.from(m.text).length*22);
export function intentFor(text,s){
 const t=text.toLowerCase().replace(/\s+/g,'');
 if(/记不|不记得|想不起来|没(有)?(和|跟)你|我不在|不可能.*一起/.test(t)&&s.togetherAsked)return 'memory';
 if(/未出站|一起|一块|同行|刷出去|出站了吗|已经出站|回家了吗/.test(t)&&s.plan)return 'together';
 if(/stillwell|斯蒂尔|斯提尔/.test(t))return 'stillwell';
 if(/黑屏|眼前一黑|变黑|刚刚.*黑/.test(t)&&s.refundSeen)return 'blackout';
 if(/没有(车)?站|不存在|多(出来|了).*站|区间|月台|站台/.test(t)&&s.claim)return 'missing';
 if(/wren|雷恩|同名|重复|两个.*站/.test(t)&&s.claim)return 'duplicate';
 if(/别(动|走)|原地|等我|等着|先停|不要动/.test(t)&&s.proof)return 'wait';
 if(/出口|怎么出去|门在哪|找不到/.test(t)&&s.proof)return 'exit';
 if(/钥匙/.test(t))return 'key';
 if(/23.?12|23.?16|时间|几点|倒(着|流)/.test(t)&&s.proof)return 'time';
 if(/你在哪|在哪儿|在哪里|到哪|到家|安全吗|还好吗|你还好/.test(t))return s.proof?'exit':'where';
 if(/害怕|恐怖|不对劲|小心|危险|别怕/.test(t))return 'care';
 if(/喝|奶茶|咖啡|请客|钱|退款/.test(t))return 'drink';
 if(/林|在吗|喂|hi|hello|你好/.test(t))return 'hello';
 return 'other';
}

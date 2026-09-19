export const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const openingReplies=['？','你又没刷出去？','行'];
export const linMessages=s=>s.linLog||[];
export const linBusy=s=>Boolean(s.linQueue?.length);
export const incomingCount=s=>linMessages(s).filter(m=>m.who==='lin').length;
export function conversationHTML(s){return linMessages(s).map(m=>`<div class="lin-line ${m.who==='me'?'outgoing':''}"><span>${m.who==='me'?'我':'林'} · ${m.time}</span><p>${esc(m.text)}</p></div>`).join('');}
export function typingHTML(s){return linBusy(s)?'<span>林正在输入</span><span class="typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>':'';}
export function repliesHTML(s){
 if(linBusy(s)||s.ending)return '';
 if(s.opening<3)return `<button class="button" data-action="lin-reply" data-step="${s.opening}">${openingReplies[s.opening]}</button>`;
 if(s.togetherAsked&&!s.memoryAsked)return '<button class="button secondary" data-action="lin-topic" data-topic="memory">我不记得我们一起坐过。</button>';
 if(s.proof&&!s.linChecked)return '<button class="button" data-action="check-lin">先别跟着指示走，留在原地。我在核对记录。</button>';
 return '';
}
export function composerHTML(s,id,draft=''){
 return `<form class="lin-compose" data-lin-compose="${id}"><label class="sr-only" for="lin-input-${id}">给林发消息</label><textarea id="lin-input-${id}" data-lin-input="${id}" rows="2" maxlength="320" placeholder="给林发消息…" ${s.ending?'disabled':''}>${esc(draft)}</textarea><button type="submit" class="button" ${linBusy(s)||s.ending?'disabled':''}>发送</button></form>`;
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

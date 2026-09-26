import {playSignal} from './effects.js';
let lastEffectId=null;
import {conversationHTML,repliesHTML,incomingCount,typingHTML,linBusy} from './messages.js';
const $=id=>document.getElementById(id);
let state=null,signature='',lastConnection=0,connected=false,readSent='';
let inputSequence=0;
function account(){try{return window.opener&&!window.opener.closed?window.opener:null;}catch{return null;}}
function send(type,extra={}){const target=account();if(target)target.postMessage({channel:'nt-lin-v9',type,round:state?.round,...extra},location.origin);}
function updateConnection(){
 connected=Boolean(account()&&Date.now()-lastConnection<15000);
 $('connection-state').textContent=connected?'账户页已连接 · 消息同步中':'账户页未连接';
 $('connection-note').hidden=connected;
 $('focus-account').disabled=!account();
 document.querySelectorAll('[data-action]').forEach(b=>b.disabled=!connected);
 $('chat-input').disabled=!connected||Boolean(state?.ending&&!['erasure','replacement'].includes(state.ending))||Boolean(state?.linQueue?.length);
 $('chat-compose button').disabled=$('chat-input').disabled;
}
function markRead(){
 if(!state||!connected||document.visibilityState!=='visible'||!document.hasFocus())return;
 const key=state.round+':'+incomingCount(state);
 if(key!==readSent){readSent=key;send('read');}
 document.title='林 · 消息';
}
window.addEventListener('message',e=>{
 if(e.origin!==location.origin||e.source!==account()||e.data?.channel!=='nt-lin-v9'||e.data.type!=='snapshot')return;
 const next=e.data.state;
 if(!next||!Number.isInteger(next.opening)||next.opening<0||next.opening>3||typeof next.round!=='string')return;
 state=next;
 if(lastEffectId!==null&&state.signal?.id&&state.signal.id!==lastEffectId)playSignal(state.signal.kind);lastEffectId=state.signal?.id||'';
 const endButton=$('end-conversation');endButton.hidden=Boolean(state.ending&&state.ending!=='erasure');endButton.textContent=state.v2?.chatPaused?'重新联系林':'暂时结束聊天';endButton.dataset.action=state.v2?.chatPaused?'resume-chat':'end-chat';
 lastConnection=Date.now();updateConnection();
 const key=JSON.stringify(state);
 if(key!==signature){
  signature=key;
  const nearBottom=$('chat-thread').scrollHeight-$('chat-thread').clientHeight-$('chat-thread').scrollTop<80;
  $('chat-thread').innerHTML=conversationHTML(state);
  $('chat-replies').innerHTML=repliesHTML(state);
 $('chat-waiting').innerHTML=typingHTML(state);
 $('chat-input').disabled=linBusy(state)||Boolean(state.ending&&!['erasure','replacement'].includes(state.ending));
 $('chat-compose button').disabled=linBusy(state)||Boolean(state.ending&&!['erasure','replacement'].includes(state.ending));
  $('chat-attachment').hidden=!state.claim;
  if(!linBusy(state)&&state.ending!=='erasure')$('chat-waiting').textContent=state.ending==='replacement'?'接返关联仍在线。':state.ending?'本次会话已结束。可在账户页重新体验。':state.opening<3?'点选回复继续对话。':'继续核对行程，有新消息时会在这里显示。';
  if(nearBottom)$('chat-thread').scrollTop=$('chat-thread').scrollHeight;
  const unread=Math.max(0,incomingCount(state)-state.linRead);
  document.title=(unread?`(${unread}) `:'')+'林 · 消息';
 }
 markRead();
});
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-action]');if(!b||b.disabled||!connected)return;
 if(b.dataset.action==='lin-reply'){send('reply',{step:Number(b.dataset.step)});b.disabled=true;}
 else if(b.dataset.action==='end-chat')send('end-chat');
 else if(b.dataset.action==='resume-chat')send('resume-chat');
 else if(b.dataset.action==='check-lin'){send('check-lin');b.disabled=true;}
 else if(b.dataset.action==='lin-topic')send('topic',{topic:b.dataset.topic});
 else if(b.dataset.action==='plan'){send('plan');account()?.focus();}
});
document.getElementById('chat-compose').addEventListener('submit',e=>{
 e.preventDefault();
 const input=document.getElementById('chat-input');
 const text=input.value.trim();
 if(!text||!connected||(state?.ending&&!['erasure','replacement'].includes(state.ending))||state?.linQueue?.length)return;
 send('text',{id:`input-${++inputSequence}`,text});
 input.value='';
 input.focus();
});
document.getElementById('chat-input').addEventListener('keydown',e=>{
 if(e.key==='Enter'&&!e.shiftKey&&!e.isComposing){e.preventDefault();e.currentTarget.form.requestSubmit();}
});
$('focus-account').addEventListener('click',()=>account()?.focus());
window.addEventListener('focus',markRead);document.addEventListener('visibilitychange',markRead);
send('hello');
setInterval(()=>{updateConnection();send('hello');},4000);
setTimeout(updateConnection,1200);

let lastEffectAt=0,effectTimer=null;
export function playSignal(kind){
 const layer=document.getElementById('screen-signal');
 if(!layer||Date.now()-lastEffectAt<1400)return;
 lastEffectAt=Date.now();clearTimeout(effectTimer);
 const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 layer.hidden=false;layer.className='screen-signal '+(kind==='static'?'signal-static':'signal-blackout')+(reduced?' reduced-signal':'');
 layer.textContent=kind==='static'?'ST—□□ / 位置信息不可用\n0x0000  ▒░  — — —\nROUTE: ▯▯▯  /  NODE NOT RESOLVED':'';
 if(typeof layer.showPopover==='function'){try{layer.showPopover();}catch{}}
 effectTimer=setTimeout(()=>{if(typeof layer.hidePopover==='function'){try{layer.hidePopover();}catch{}}else layer.hidden=true;layer.textContent='';},reduced?600:380);
}

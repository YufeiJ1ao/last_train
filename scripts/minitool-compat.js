/* Only API fallbacks actually used by this game; no forbidden capabilities. */
(function(){
 if(!Array.prototype.at)Object.defineProperty(Array.prototype,'at',{value:function(i){i=Math.trunc(i)||0;return this[i<0?this.length+i:i];},configurable:true,writable:true});
 if(!Element.prototype.replaceChildren)Element.prototype.replaceChildren=function(){while(this.firstChild)this.removeChild(this.firstChild);for(var i=0;i<arguments.length;i++)this.appendChild(typeof arguments[i]==='string'?document.createTextNode(arguments[i]):arguments[i]);};
 if(!HTMLFormElement.prototype.requestSubmit)HTMLFormElement.prototype.requestSubmit=function(){if(this.reportValidity&&!this.reportValidity())return;this.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));};
 var dialog=document.getElementById('modal');
 if(typeof dialog.showModal!=='function'){
  dialog.classList.add('fallback-dialog');dialog.setAttribute('role','dialog');dialog.setAttribute('aria-modal','true');
  dialog.showModal=function(){this.setAttribute('open','');this.open=true;};
  dialog.close=function(){this.removeAttribute('open');this.open=false;this.dispatchEvent(new Event('close'));};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&dialog.open){e.preventDefault();dialog.close();}});
 }
})();

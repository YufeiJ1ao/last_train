// Original procedural sound design. No recordings, remote media or audio permissions.
let ctx=null,master=null,enabled=false,playing=false,nodes=[];
try{enabled=localStorage.getItem('last-train-sound')==='on';}catch{}
export const audioEnabled=()=>enabled;
function setup(){
 if(ctx)return true;
 const AudioContext=window.AudioContext||window.webkitAudioContext;if(!AudioContext)return false;
 try{ctx=new AudioContext();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);return true;}catch{return false;}
}
function ambient(){
 if(nodes.length)return;
 const length=ctx.sampleRate*8,buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);let brown=0;
 for(let i=0;i<length;i++){brown=(brown+(Math.random()*2-1)*.018)/1.018;data[i]=brown*2;}
 const source=ctx.createBufferSource();source.buffer=buffer;source.loop=true;
 const low=ctx.createBiquadFilter();low.type='lowpass';low.frequency.value=520;
 const volume=ctx.createGain();volume.gain.value=.24;source.connect(low);low.connect(volume);volume.connect(master);source.start();nodes.push(source);
 // Quiet ventilation hum and two restrained, detuned pad tones.
 [48,73.42,110.1].forEach((hz,i)=>{const osc=ctx.createOscillator(),gain=ctx.createGain();osc.type='sine';osc.frequency.value=hz;gain.gain.value=i===0?.018:.008;osc.connect(gain);gain.connect(master);osc.start();nodes.push(osc);});
}
export function audioStart(){
 playing=true;if(!enabled||document.hidden||!setup())return;
 ambient();ctx.resume().then(()=>{if(enabled&&playing&&!document.hidden)master.gain.setTargetAtTime(.48,ctx.currentTime,.5);}).catch(()=>{});
}
export function audioPause(){playing=false;if(ctx){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(0,ctx.currentTime);ctx.suspend().catch(()=>{});}}
export function audioToggle(){enabled=!enabled;try{localStorage.setItem('last-train-sound',enabled?'on':'off');}catch{}if(enabled)audioStart();else audioPause();}
export function audioIncoming(){
 if(!enabled||!playing||document.hidden||!ctx||ctx.state!=='running')return;
 [660,880].forEach((hz,i)=>{const t=ctx.currentTime+i*.09,o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=hz;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.065,t+.009);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(master);o.start(t);o.stop(t+.2);o.onended=()=>{o.disconnect();g.disconnect();};});
}

/* ESBUILD_PATH can point at an existing esbuild installation. No runtime dependencies. */
const fs=require('node:fs'),path=require('node:path');
const esbuild=require(process.env.ESBUILD_PATH||'esbuild');
const root=path.resolve(__dirname,'..'),src=path.join(root,'journey'),out=path.join(root,'minitool');
fs.mkdirSync(path.join(out,'assets'),{recursive:true});
let html=fs.readFileSync(path.join(src,'index.html'),'utf8');
html=html.replace('<script type="module" src="game.js"></script>','<script src="./compat.js" defer></script><script src="./app.js" defer></script>');
html=html.replace(/<button[^>]*data-action="popout"[^>]*>.*?<\/button>/gs,'');
html=html.replace(/(?:href|src)="(game.css|v2.css|mobile.css)"/g,'href="./$1"');
fs.writeFileSync(path.join(out,'index.html'),html);
for(const name of ['game.css','v2.css','mobile.css'])fs.copyFileSync(path.join(src,name),path.join(out,name));
fs.copyFileSync(path.join(src,'assets/lim-museum-gardens.webp'),path.join(out,'assets/lim-museum-gardens.webp'));
fs.copyFileSync(path.join(root,'scripts/minitool-compat.js'),path.join(out,'compat.js'));
esbuild.build({entryPoints:[path.join(src,'game.js')],outfile:path.join(out,'app.js'),bundle:true,format:'iife',target:['es2017','chrome61'],minify:false,charset:'utf8',define:{'window.LAST_TRAIN_MINITOOL':'true'},plugins:[{name:'offline-adapter',setup(build){
 build.onLoad({filter:/\.js$/},args=>{
  let s=fs.readFileSync(args.path,'utf8');
  if(path.basename(args.path)==='game.js'){
   s=s.replace(/function publish\(\)\{[^\n]*\}/,'function publish(){}');
   s=s.replace(/function openChatWindow\(\)\{[\s\S]*?\n\}/,'function openChatWindow(){openChat();}');
   s=s.replace(/function receiveChat\(event\)\{[\s\S]*?window.addEventListener\('message',receiveChat\);/,'');
   s=s.replace(/<a class="text-button" href="network.svg"[^>]*>.*?<\/a>/g,'');
   s=s.replace(/<a href="\.\.\/#time-guidance"[^>]*>.*?<\/a>/g,'<button class="text-button" data-action="full-rules">阅读完整安全须知</button>');
   s=s.replace(/<div class="chat-window-actions">[\s\S]*?<\/div>/g,'');
   s=s.replace(/\$\{button\('独立窗口 ↗','popout','','quiet'\)\}/g,'');
   s=s.replace('独立聊天窗口也会同步重置。','');
   s=s.replace(/<a href="\.\.\/"[^>]*>.*?<\/a>/g,'<button class="text-button" data-action="full-rules">阅读完整原文</button>');
  }
  if(path.basename(args.path)==='messages.js'){
   s=s.replace('<a class="lin-photo" href="assets/lim-museum-gardens.webp" target="_blank" rel="noopener" aria-label="查看林的换乘照片原图（新窗口）">','<button type="button" class="lin-photo" data-action="v2-photo" aria-label="查看林的换乘照片">');
   s=s.replace('点击查看原图 ↗</span></a>','点击查看附件</span></button>');
  }
  return {contents:s,loader:'js'};
 });
}}]}).then(()=>console.log('Built offline MiniTool in '+out)).catch(e=>{console.error(e);process.exit(1);});

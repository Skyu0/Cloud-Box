const $=s=>document.querySelector(s),FONTS=['Archivo','Bebas Neue','Playfair Display','Montserrat','Poppins','Oswald'];
let sample=null,dl=null,ref=null,spec=null,cv=null,sc=1,W=1080,H=1080;
const aiReady=()=>!!(sample||(window.CONFIG&&CONFIG.AI_ENDPOINT));(async()=>{try{if(window.claude){sample=await claude.use('sample');dl=await claude.use('downloads')}}catch(e){}$('#warn').hidden=aiReady()})();
let last='s1';const show=id=>{if(id!=='lib')last=id;['s1','s2','s3','s4','lib'].forEach(s=>$('#'+s).hidden=s!==id)};
const esc=t=>String(t??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const readURL=f=>new Promise(r=>{const x=new FileReader();x.onload=()=>r(x.result);x.readAsDataURL(f)});
const loadImg=u=>new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=u});
const hex=c=>/^#[0-9a-f]{6}$/i.test(c||'')?c.toLowerCase():'#000000';
const note=(t)=>{const n=$('#note');n.textContent=t;n.hidden=!t};
async function shrink(file,max=1024){const i=await loadImg(await readURL(file)),k=Math.min(1,max/Math.max(i.width,i.height)),c=document.createElement('canvas');c.width=Math.round(i.width*k);c.height=Math.round(i.height*k);c.getContext('2d').drawImage(i,0,0,c.width,c.height);return{blob:await new Promise(r=>c.toBlob(r,'image/jpeg',.85)),w:i.width,h:i.height}}
const PROMPT=`You analyze a graphic design image so it can be rebuilt as editable layers. Reply with ONLY JSON: {"feasible":boolean,"reason":"one plain sentence for the user","background":"#rrggbb","palette":["#rrggbb", up to 6 distinct main colors including the background],"elements":[...]}. Elements go back to front. Each element: {"kind":"text|image|logo|shape","name":"short label such as Headline","x":0..1,"y":0..1,"w":0..1,"h":0..1 (top-left corner and size as fractions of the full image),"text":"exact visible text (text only)","fontSize":fraction of image height (text only),"font":"closest of: ${FONTS.join(', ')} (text only)","weight":400 or 700,"align":"left|center|right","color":"palette hex (text only)","fill":"palette hex (shape only)","shape":"rect|circle (shape only)","radius":0..0.5 corner radius as fraction of the shorter side (rect only)}. Use kind image for photo areas and logo for brand marks. Set feasible false and explain if the design relies on a photo background, gradients, hand-drawn lettering, heavy effects, overlapping transparency, or needs more than 25 elements. Every color must come from palette.`;
$('#ref').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
 if(!aiReady()){show('s1');$('#warn').hidden=false;return}
 show('s2');$('#busy').className='msg';$('#busy').textContent='Reading the design… this can take up to a minute.';
 try{ref=await shrink(f);$('#refimg').src=URL.createObjectURL(ref.blob);
  spec=await analyze(ref.blob);
  verdict()}catch(err){show('s3');$('#formwrap').hidden=true;$('#verdict').className='msg bad';$('#verdict').textContent=err&&err.code==='not_granted'?'Permission to use Claude was declined, so the design can’t be scanned.':'The scan didn’t work this time. Please try again or use another design.'}};
function verdict(){show('s3');const ok=spec&&spec.feasible&&Array.isArray(spec.elements)&&spec.elements.length&&Array.isArray(spec.palette);
 $('#formwrap').hidden=!ok;$('#verdict').className='msg'+(ok?'':' bad');
 if(!ok){$('#verdict').textContent='This design is too complex to emulate. '+(spec&&spec.reason||'')+' Try a simpler layout.';return}
 $('#verdict').textContent='This design can be emulated. Add what goes in each spot below.';
 const f=$('#fields');f.innerHTML='';
 spec.elements.forEach((el,i)=>{if(el.kind==='text')f.insertAdjacentHTML('beforeend',`<div class="row"><label>${esc(el.name||'Text')}</label><textarea rows="2" data-i="${i}">${esc(el.text)}</textarea></div>`);
  else if(el.kind==='image'||el.kind==='logo')f.insertAdjacentHTML('beforeend',`<div class="row"><label>${el.kind==='logo'?'Logo':'Image'}: ${esc(el.name||'')}</label><input type="file" accept="image/*" data-i="${i}"></div>`)});
 $('#pal').innerHTML=spec.palette.map((c,i)=>`<div class="sw"><i style="background:${hex(c)}"></i><input type="color" data-p="${i}" value="${hex(c)}"></div>`).join('')}
$('#again').onclick=()=>show('s1');$('#back').onclick=()=>show('s3');
$('#go').onclick=async()=>{$('#go').disabled=true;try{await gen()}catch(e){console.error(e)}$('#go').disabled=false};
async function gen(){
 await Promise.all(FONTS.flatMap(f=>[`400 40px "${f}"`,`700 40px "${f}"`].map(s=>document.fonts.load(s))));
 const long=1080;W=ref.w>=ref.h?long:Math.round(long*ref.w/ref.h);H=ref.w>=ref.h?Math.round(long*ref.h/ref.w):long;
 const map={};spec.palette.forEach((c,i)=>map[hex(c)]=$(`[data-p="${i}"]`).value);const col=c=>map[hex(c)]||hex(c);
 $('#holder').innerHTML='<canvas id="c"></canvas>';if(cv)cv.dispose();
 cv=new fabric.Canvas('c',{width:W,height:H,preserveObjectStacking:true,backgroundColor:col(spec.background)});
 for(const[i,el]of spec.elements.entries()){const x=el.x*W,y=el.y*H,w=el.w*W,h=el.h*H;let o;
  if(el.kind==='shape'){o=el.shape==='circle'?new fabric.Ellipse({left:x,top:y,rx:w/2,ry:h/2,fill:col(el.fill)}):new fabric.Rect({left:x,top:y,width:w,height:h,rx:(el.radius||0)*Math.min(w,h),ry:(el.radius||0)*Math.min(w,h),fill:col(el.fill)})}
  else if(el.kind==='text'){o=new fabric.Textbox($(`textarea[data-i="${i}"]`).value,{left:x,top:y,width:w,fontSize:Math.max(8,el.fontSize*H),fontFamily:FONTS.includes(el.font)?el.font:'Archivo',fontWeight:el.weight>=600?'bold':'normal',textAlign:el.align||'left',fill:col(el.color),lineHeight:1.1});
   while(o.height>h*1.2&&o.fontSize>10){o.set('fontSize',o.fontSize*.92);o.initDimensions()}}
  else{const file=$(`input[data-i="${i}"]`).files[0];
   if(!file)o=new fabric.Rect({left:x,top:y,width:w,height:h,fill:'#d9d9d9',stroke:'#999'});
   else{const u=await readURL(file),im=await new Promise(r=>fabric.Image.fromURL(u,r)),k=(el.kind==='logo'?Math.min:Math.max)(w/im.width,h/im.height);
    im.scale(k);im.set({left:x+(w-im.width*k)/2,top:y+(h-im.height*k)/2});
    if(el.kind!=='logo')im.clipPath=new fabric.Rect({left:x,top:y,width:w,height:h,absolutePositioned:true});o=im}}
  cv.add(o)}
 cv.on('selection:created',sync);cv.on('selection:updated',sync);cv.on('selection:cleared',sync);
 show('s4');fit();sync();note('')}
function fit(){sc=Math.min(1,(innerWidth-48)/W,(innerHeight*.7)/H);cv.setZoom(sc);cv.setDimensions({width:W*sc,height:H*sc})}
addEventListener('resize',()=>cv&&!$('#s4').hidden&&fit());
FONTS.forEach(f=>$('#ff').add(new Option(f,f)));
const sel=()=>cv&&cv.getActiveObject(),fillable=o=>o&&['textbox','rect','ellipse'].includes(o.type);
function sync(){const o=sel();document.querySelectorAll('.tool').forEach(t=>t.disabled=!o);
 if(o){const t=o.type==='textbox';$('#ff').disabled=$('#fs').disabled=!t;$('#cl').disabled=!fillable(o);
  if(t){$('#fs').value=Math.round(o.fontSize);$('#ff').value=o.fontFamily}if(fillable(o))$('#cl').value=hex(o.fill)}}
$('#fs').oninput=e=>{const o=sel();if(o&&o.type==='textbox'&&+e.target.value>0){o.set('fontSize',+e.target.value);cv.requestRenderAll()}};
$('#ff').onchange=e=>{const o=sel();if(o&&o.type==='textbox'){o.set('fontFamily',e.target.value);cv.requestRenderAll()}};
$('#cl').oninput=e=>{const o=sel();if(fillable(o)){o.set('fill',e.target.value);cv.requestRenderAll()}};
$('#fw').onclick=()=>{const o=sel();o&&cv.bringForward(o)};$('#bw').onclick=()=>{const o=sel();o&&cv.sendBackwards(o)};
$('#del').onclick=()=>{const o=sel();if(o){cv.remove(o);cv.discardActiveObject();cv.requestRenderAll();sync()}};
$('#addt').onclick=()=>{const t=new fabric.Textbox('New text',{left:W*.1,top:H*.1,width:W*.5,fontSize:H*.06,fontFamily:'Archivo',fill:'#000000'});cv.add(t);cv.setActiveObject(t);sync()};
$('#fup').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;try{const n=f.name.replace(/\.\w+$/,''),ff=new FontFace(n,await f.arrayBuffer());await ff.load();document.fonts.add(ff);window.Lib&&Lib.add('Fonts',f);if(!FONTS.includes(n)){FONTS.push(n);$('#ff').add(new Option(n,n))}
 const o=sel();if(o&&o.type==='textbox'){o.set('fontFamily',n);$('#ff').value=n}cv.requestRenderAll();note('Font “'+n+'” added.')}catch(x){note('That font file couldn’t be loaded.')}};
const toBlob=u=>{const[h,b]=u.split(','),a=atob(b),n=new Uint8Array(a.length);for(let i=0;i<a.length;i++)n[i]=a.charCodeAt(i);return new Blob([n],{type:h.match(/:(.*?);/)[1]})};
async function flat(url,q){const i=await loadImg(url),c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(i,0,0);return c.toDataURL('image/jpeg',q||.95)}
async function out(o){const fmt=$('#fmt').value;let url;
 if(o)url=o.toDataURL({format:'png',multiplier:2,enableRetinaScaling:false});
 else{cv.discardActiveObject();cv.renderAll();url=cv.toDataURL({format:'png',multiplier:1/sc,enableRetinaScaling:false});sync()}
 const base=o?'cloudbox-selection':'cloudbox-design';let blob,ext=fmt;
 if(fmt==='png')blob=toBlob(url);
 else if(fmt==='jpeg'){blob=toBlob(await flat(url));ext='jpg'}
 else{const j=await flat(url),i=await loadImg(j),pdf=new jspdf.jsPDF({unit:'px',format:[i.width,i.height],orientation:i.width>i.height?'l':'p',hotfixes:['px_scaling']});pdf.addImage(j,'JPEG',0,0,i.width,i.height);blob=pdf.output('blob')}
 const name=`${base}.${ext}`;
 if(dl){try{await dl.save({filename:name,data:blob})}catch(e){}}
 else{const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;a.click()}}
$('#exs').onclick=()=>{const o=sel();if(o)out(o)};$('#exa').onclick=()=>out(null);

async function analyze(blob){if(sample)return sample.json(PROMPT,{images:[blob],modelTier:'default'});
 const image=(await readURL(blob)).split(',')[1],r=await fetch(CONFIG.AI_ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+(await Auth.token())},body:JSON.stringify({image,mime:'image/jpeg',prompt:PROMPT})});
 if(!r.ok)throw{code:'upstream_error'};return r.json()}

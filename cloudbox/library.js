(()=>{
const FOLDERS=['Backgrounds','Elements','Icons','Fonts','Images','Logos'],q=s=>document.querySelector(s);let cur='Backgrounds',db;
const open=()=>new Promise((ok,no)=>{const r=indexedDB.open('cloudbox',1);r.onupgradeneeded=()=>r.result.createObjectStore('assets',{keyPath:'id'}).createIndex('u','user');r.onsuccess=()=>ok(r.result);r.onerror=()=>no(r.error)});
const tx=async(mode,fn)=>{db=db||await open();return new Promise((ok,no)=>{const t=db.transaction('assets',mode),r=fn(t.objectStore('assets'));t.oncomplete=()=>ok(r.result);t.onerror=()=>no(t.error)})};
const uid=()=>Auth.user&&Auth.user.id,fname=a=>a.name.replace(/\.\w+$/,'');
const all=async()=>uid()?((await tx('readonly',s=>s.index('u').getAll(uid())))||[]).sort((a,b)=>b.ts-a.ts):[];
const tabs=id=>['tab-s','tab-l'].forEach(t=>q('#'+t).classList.toggle('on',t===id));
const L=window.Lib={
 async add(folder,file){await tx('readwrite',s=>s.put({id:crypto.randomUUID(),user:uid(),folder,name:file.name,blob:file,ts:Date.now()}))},
 async del(id){await tx('readwrite',s=>s.delete(id))},
 async loadFonts(){for(const a of(await all()).filter(a=>a.folder==='Fonts')){const n=fname(a);if(FONTS.includes(n))continue;
  try{const f=new FontFace(n,await a.blob.arrayBuffer());await f.load();document.fonts.add(f);FONTS.push(n);q('#ff').add(new Option(n,n))}catch(e){}}},
 async pick(a,folder){if(!cv)return;
  if(folder==='Fonts'){const o=cv.getActiveObject(),n=fname(a);if(o&&o.type==='textbox'){o.set('fontFamily',n);q('#ff').value=n;cv.requestRenderAll()}return}
  const im=await new Promise(r=>fabric.Image.fromURL(URL.createObjectURL(a.blob),r));
  if(folder==='Backgrounds'){const k=Math.max(W/im.width,H/im.height);im.scale(k);im.set({left:(W-im.width*k)/2,top:(H-im.height*k)/2});cv.add(im);im.sendToBack()}
  else{const k=Math.min(1,W*.4/im.width,H*.4/im.height);im.scale(k);im.set({left:W*.1,top:H*.1});cv.add(im)}
  cv.setActiveObject(im);cv.requestRenderAll()},
 async render(box,onPick){const items=(await all()).filter(a=>a.folder===cur);
  box.innerHTML=`<div class="bar">${FOLDERS.map(f=>`<button class="o chip${f===cur?' on':''}" data-f="${f}">${f}</button>`).join('')}</div>
  <div class="bar"><label class="btn">Upload to ${cur}<input type="file" multiple hidden accept="${cur==='Fonts'?'.ttf,.otf,.woff,.woff2':'image/*'}"></label></div><div class="grid"></div>`;
  box.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{cur=b.dataset.f;L.render(box,onPick)});
  box.querySelector('input').onchange=async e=>{for(const f of e.target.files)await L.add(cur,f);if(cur==='Fonts')await L.loadFonts();L.render(box,onPick)};
  const g=box.querySelector('.grid');
  if(!items.length)g.innerHTML='<div class="small">Nothing here yet.</div>';
  for(const a of items){const d=document.createElement('div');d.className='cell';
   d.innerHTML=(cur==='Fonts'?'<div class="aa">Aa</div>':'<img alt="">')+'<span></span><button class="x">×</button>';
   d.querySelector('span').textContent=a.name;
   if(cur==='Fonts')d.firstChild.style.fontFamily='"'+fname(a)+'"';else d.firstChild.src=URL.createObjectURL(a.blob);
   d.onclick=()=>onPick&&onPick(a,cur);
   d.querySelector('.x').onclick=async e=>{e.stopPropagation();await L.del(a.id);L.render(box,onPick)};
   g.append(d)}}};
q('#tab-s').onclick=()=>{show(last);tabs('tab-s')};
q('#tab-l').onclick=()=>{show('lib');tabs('tab-l');L.render(q('#libpage'))};
q('#libbtn').onclick=()=>{const p=q('#libpanel');p.hidden=!p.hidden;if(!p.hidden)L.render(p,L.pick)};
addEventListener('authchange',()=>{if(Auth.user)L.loadFonts()});
})();

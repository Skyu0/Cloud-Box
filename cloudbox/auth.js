(()=>{
const C=window.CONFIG,sb=C.SUPABASE_URL&&C.SUPABASE_ANON_KEY&&window.supabase?supabase.createClient(C.SUPABASE_URL,C.SUPABASE_ANON_KEY):null,LS=localStorage,q=s=>document.querySelector(s);
const hash=async(p,s)=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s+p)))].map(b=>b.toString(16).padStart(2,'0')).join('');
const A=window.Auth={user:null,cloud:!!sb,
 async token(){if(!sb)return'';const{data}=await sb.auth.getSession();return data.session?data.session.access_token:''},
 async signup(email,pw){email=email.trim().toLowerCase();
  if(sb){const{data,error}=await sb.auth.signUp({email,password:pw});if(error)throw error;if(!data.session)throw new Error('Check your email to confirm your account, then log in.');return}
  const u=JSON.parse(LS.cb_users||'{}');if(u[email])throw new Error('That email already has an account.');
  const s=crypto.randomUUID();u[email]={s,h:await hash(pw,s)};LS.cb_users=JSON.stringify(u);LS.cb_session=email},
 async login(email,pw){email=email.trim().toLowerCase();
  if(sb){const{error}=await sb.auth.signInWithPassword({email,password:pw});if(error)throw error;return}
  const u=JSON.parse(LS.cb_users||'{}')[email];if(!u||u.h!==await hash(pw,u.s))throw new Error('Wrong email or password.');LS.cb_session=email},
 async logout(){if(sb)await sb.auth.signOut();else LS.removeItem('cb_session')}};
const msg=t=>{const m=q('#amsg');m.textContent=t||'';m.hidden=!t};
async function refresh(){let u=null;
 if(sb){const{data}=await sb.auth.getSession();if(data.session)u={id:data.session.user.id,email:data.session.user.email}}
 else if(LS.cb_session)u={id:LS.cb_session,email:LS.cb_session};
 A.user=u;q('#auth').hidden=!!u;q('#app').hidden=!u;q('#who').hidden=!u;q('#whoe').textContent=u?u.email:'';dispatchEvent(new Event('authchange'))}
async function go(mode){try{await A[mode](q('#em').value,q('#pw').value);msg('');q('#pw').value='';await refresh()}catch(e){msg(e.message||'Something went wrong.')}}
q('#aform').onsubmit=e=>{e.preventDefault();go('login')};q('#bs').onclick=()=>go('signup');
q('#lo').onclick=async()=>{await A.logout();refresh()};
q('#amode').textContent=sb?'':'Local mode: accounts and your library stay on this device. Add Supabase keys in config.js for cloud accounts.';
if(sb)sb.auth.onAuthStateChange(()=>refresh());
setTimeout(refresh,0);
if('serviceWorker'in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js'));
})();

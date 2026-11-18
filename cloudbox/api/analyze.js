// Vercel serverless function. Env vars: GEMINI_API_KEY, GEMINI_MODEL (optional), SUPABASE_URL + SUPABASE_ANON_KEY (to require login).
module.exports=async(req,res)=>{
 if(req.method!=='POST')return res.status(405).end();
 const{SUPABASE_URL,SUPABASE_ANON_KEY,GEMINI_API_KEY,GEMINI_MODEL='gemini-2.5-flash'}=process.env;
 if(SUPABASE_URL){const t=(req.headers.authorization||'').replace('Bearer ','');
  const u=await fetch(SUPABASE_URL+'/auth/v1/user',{headers:{Authorization:'Bearer '+t,apikey:SUPABASE_ANON_KEY}});
  if(!u.ok)return res.status(401).json({error:'login required'})}
 const{image,mime='image/jpeg',prompt}=req.body||{};
 if(!image||!prompt)return res.status(400).json({error:'bad request'});
 const r=await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,{method:'POST',
  headers:{'Content-Type':'application/json','x-goog-api-key':GEMINI_API_KEY},
  body:JSON.stringify({contents:[{parts:[{text:prompt},{inline_data:{mime_type:mime,data:image}}]}],generationConfig:{responseMimeType:'application/json'}})});
 if(!r.ok)return res.status(502).json({error:'ai failed'});
 const j=await r.json(),t=j.candidates?.[0]?.content?.parts?.[0]?.text||'';
 try{res.status(200).json(JSON.parse(t))}catch{res.status(502).json({error:'bad ai output'})}};

const express=require('express'),analyze=require('./api/analyze.js'),app=express();
app.use(express.json({limit:'6mb'}));
app.post('/api/analyze',(req,res)=>analyze(req,res));
app.use((req,res,next)=>/^\/(server\.js|package\.json|package-lock\.json|api|README\.md)/.test(req.path)?res.status(404).end():next());
app.use(express.static(__dirname));
app.listen(process.env.PORT||3000,()=>console.log('Cloud Box running'));

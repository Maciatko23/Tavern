const fs=require('fs'),path=require('path');
const R='C:/Users/macie/OneDrive/Dokumenty/RMMZ/Tawerna';
const infos=JSON.parse(fs.readFileSync(R+'/data/MapInfos.json','utf8'));
const name=id=>infos[id]?infos[id].name:'?';
const out={};
for(const m of infos){ if(!m)continue; const f=R+'/data/Map'+String(m.id).padStart(3,'0')+'.json'; if(!fs.existsSync(f))continue;
 const d=JSON.parse(fs.readFileSync(f,'utf8')); const t=new Set();
 for(const e of d.events||[]){ if(!e)continue; for(const p of e.pages||[]) for(const c of p.list||[]) if(c.code===201&&c.parameters[0]===0) t.add(c.parameters[1]); }
 out[m.id]=[...t]; }
fs.writeFileSync(R+'/docs/questy_mapa/tmp/transfers.json',JSON.stringify(out));
const start=[162,24,13,111,8,4,125,3,20];
const seen=new Set(start),q=[...start];
while(q.length){const a=q.shift(); for(const b of out[a]||[]) if(!seen.has(b)){seen.add(b);q.push(b);} }
console.log('reachable via event transfers:',[...seen].sort((a,b)=>a-b).map(i=>i+':'+name(i)).join('\n'));
console.log('--- not reached:');
console.log(Object.keys(out).map(Number).filter(i=>!seen.has(i)).map(i=>i+':'+name(i)+' ->'+out[i].join(',')).join('\n'));

const q=require('./qraw.json');
const ids=process.argv.slice(2);
for(const id of ids){const x=q[id];if(!x){console.log(id,'??');continue;}
 console.log('=== '+id+' '+(x.title||'')+' | giver='+x.giver+' | where='+(x.where||'')+' | when='+(x.when||''));
 console.log('  offer.cond='+JSON.stringify(x.offer&&x.offer.cond));
 (x.steps||[]).forEach((s,i)=>{const o={};for(const k of ['type','nazwa','spot','spots','map','to','kind','n','hours','at','night','check','talk'])if(s[k]!==undefined)o[k]=s[k];
  console.log('  ['+i+'] '+JSON.stringify(o)+' :: '+(s.text||'').slice(0,230));});
}

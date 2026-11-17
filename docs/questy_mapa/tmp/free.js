const cache={};
function load(id){return cache[id]||(cache[id]=require('./mapdump_'+id+'.json'));}
function occ(id){const d=load(id);if(d._o)return d._o;const o=new Set();for(const e of d.ev)if(!/^(Miejsce|Znacznik)/.test(e[1]))o.add(e[2]+','+e[3]);return d._o=o;}
// nearest free rectangle w x h (all passable, no event incl. 1-cell margin) to (tx,ty)
function find(id,tx,ty,w,h,margin=1,maxr=40){const d=load(id),o=occ(id);let best=null;
 for(let y=margin;y<d.h-h-margin;y++)for(let x=margin;x<d.w-w-margin;x++){let ok=true;
  for(let yy=y-margin;yy<y+h+margin&&ok;yy++)for(let xx=x-margin;xx<x+w+margin;xx++){if(d.rows[yy][xx]!=='.'||o.has(xx+','+yy)){ok=false;break;}}
  if(ok){const dist=Math.hypot(x+w/2-tx,y+h/2-ty);if(!best||dist<best.d)best={x,y,d:Math.round(dist)};}}
 return best;}
module.exports={find,load};
if(require.main===module){const a=process.argv.slice(2).map(Number);console.log(JSON.stringify(find(a[0],a[1],a[2],a[3],a[4],a[5]===undefined?1:a[5])));}

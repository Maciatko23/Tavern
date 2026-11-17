const id=process.argv[2];const d=require('./mapdump_'+id+'.json');
const nat=/^(Sosna|Małe drzewo|Splot|Wysoki|Pieniek|Kłoda|Dzika|Omszały|Pęknięty|Płaski|Ruda|Zasiek|Skała|Skalna|Wielki|Martwe|Ostry|Sterta|Dwie|Ogromny|Kamienny|Poszarpana|Drzewo|Gruz|Skupisko|Szeroki|Kolczaste|Suchy|Kłąb|Gęste|Menhir|Stos|Długa|Wysoka|Duże|Mały|Liściaste|Dąb|Brzoza|Krzak|Kępa|Zarośla|Głaz|Ziele|Len|Krwawnik|Niebieskie|Chrust|Kamień|Pień|Tree|Bush|Rock|Drewno|Gałąź|Szyszki|Ogród|Mech|Paproć|Wrzos|Trawa)/i;
const by={};for(const e of d.ev){ if(nat.test(e[1]))continue; (by[e[1]]=by[e[1]]||[]).push(e[2]+','+e[3]);}
console.log('=== map',id,d.name,d.w+'x'+d.h);
for(const [n,v] of Object.entries(by)) console.log(' ',n.slice(0,48),'|',v.slice(0,4).join(' '),v.length>4?'(+'+(v.length-4)+')':'');

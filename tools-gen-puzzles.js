/* TYPESET puzzle generator — offline tool, not loaded by the game.
   Usage:  node tools-gen-puzzles.js 70   -> writes puzzles.js (paste its PUZZLES array into index.html)
   Append-only: existing puzzles in index.html are kept as-is; pass a count larger than the current list to extend it.
   Needs two word lists next to it:
     enable.txt  https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt   (validation dictionary; also feeds words.js)
     g10k.txt    https://raw.githubusercontent.com/first20hours/google-10000-english/master/google-10000-english-usa-no-swears.txt  (frequency list -> "common" fill words)
   Puzzle i uses tier i % 5 (1★..5★ then back to 1★), so keep the count a multiple of 5.

   Fills 5x5 grids (spacer layout per weekday), cuts the open cells into
   letter blocks per the tier's block composition, and emits a PUZZLES array. */
const fs=require("fs");
const enable=new Set(fs.readFileSync("enable.txt","utf8").split("\n").map(s=>s.trim()).filter(w=>/^[a-z]{2,5}$/.test(w)));
const g10k=fs.readFileSync("g10k.txt","utf8").split("\n").map(s=>s.trim());
const COMMON2="ad ah am an as at ax be by do go ha he hi id if in is it me my no of oh on or ow ox pa so to up us we ye".split(" ");
const web2=new Set(fs.readFileSync("/usr/share/dict/words","utf8").split("\n").filter(w=>/^[a-z]{2,5}$/.test(w)));
/* abbreviations / names / fragments that slip through the dictionaries */
const BLOCK=new Set("las reg mel shaw ana mem casa sec dee ser del rom eng ons asp devel lib yahoo ala pas ain ave bio lol wow eco pic pics tex tec med mag mags ref refs spec specs sci soc mfg int ext pro pros exp est etc fax faxes tel vol vols mac mics doc docs ann ben dan don jan jim joe jon ken lee les lou max moe pat ray rob ron roy sam sal sol sue tim tom von wan yen yer yep yup ala als alt gen gov hey hrs ies ing ipod ism lat lbs log logs lts msg nat oct pty pvt res ret sep sim src std tba thu tue wed mon fri sat sun fwd gmt pst utc uni univ var vars ver vid vids vip wiki xml php sql cgi cms dns dvd faq faqs ftp gif gifs gnu html http https ibm ieee ipad ips jpg mba mlb mpg mtv nba nfl nhl obj pdf png ppm pmc rss sms tcp tgp url urls usb vhs wav xbox zip cc bb dd ee ff gg hh ii jj kk ll mm nn oo pp qq rr ss tt uu vv ww xx yy zz ac ad? ax? aa ka monte sri chile anime costa leone erica jane henry peter paris roman john james mary david mark paul lisa anna maria carl eric adam alex andy brad chad dave dean doug earl gary greg jack jake jeff jess jose josh juan kate kyle luis lynn matt mike neil nick pete phil rick ryan sean seth todd tony wade zach bush ford ohio texas utah iowa cuba iran iraq peru rome asia china india japan spain italy kenya tokyo delhi miami vegas tampa york maine idaho nokia sony intel cisco ebay honda mazda lexus volvo linux intel excel apple cody abby amy ann beth carl cole dana dean ella emma erin eve gina hugo ivan jody joel judy jill kim kurt leo lily luke lynn mae meg mia noah omar owen ross ruby ruth sara tara ted tina troy vera zoe hans otto olaf ali ari ben eli ian jay joy kay les lin liz mel ned pam pat ray reg rex rob ron roy sal sam sue tom von wes viv ala usa uk eu un nyc ny la ca fl tx nj pa dc oz cd cds dvd tv pc pcs vs etc inc ltd llc corp dept eg ie ok colin ralph lewis genoa dom phi mas leu psi dis rep con yok askoi tepoy sperm sex sexy porn nude rape damn hell ass arse crap piss tit tits boob boobs cum dick cock fuck shit anal anus nazi slut whore dildo penis vagina pussy bitch cunt fart poop jew jews arab arabs negro chink spic kike gook tard retard idiot ugly fat? cody abu ahmed ali amir arjun beta chi delta gamma theta omega sigma alpha iota zeta eta rho tau phi psi chi nu mu xi laura terry cad sen til cos pee dos gee gal gals lad lads ish sup yo ya ye? gonna wanna perry nam pac mil col bra dow mono naked inter meth coke dope weed alan sally whats thats dont cant wont isnt roger ware".split(" "));
const common={2:COMMON2,3:[],4:[],5:[]};
function okCommon(w){
  if(BLOCK.has(w)) return false;
  if(web2.has(w)) return true;
  if(w.endsWith("s")&&web2.has(w.slice(0,-1))) return true;      // plural / 3rd person
  if(w.endsWith("es")&&web2.has(w.slice(0,-2))) return true;
  if(w.endsWith("ed")&&(web2.has(w.slice(0,-2))||web2.has(w.slice(0,-1)))) return true;
  if(w.endsWith("ing")&&web2.has(w.slice(0,-3))) return true;
  if(w.endsWith("er")&&web2.has(w.slice(0,-2))) return true;
  return false;
}
for(const w of g10k) if(/^[a-z]{3,5}$/.test(w)&&enable.has(w)&&okCommon(w)&&!common[w.length].includes(w)) common[w.length].push(w);
console.error("common sizes",Object.fromEntries(Object.entries(common).map(([k,v])=>[k,v.length])));
const wide={2:COMMON2,3:[],4:[],5:[]};
for(const w of enable) if(w.length>=3) wide[w.length].push(w);

function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(arr,rng){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}

/* ---- Weekday tiers: spacer layouts + block composition ---- */
const TIERS=[
 {name:"Easy",   stars:1, layouts:[[[0,0],[0,4],[4,0],[4,4],[2,1],[2,3]], [[0,1],[0,3],[4,1],[4,3],[2,0],[2,4]], [[0,2],[4,2],[2,0],[2,4],[1,1],[3,3]]],
   weights:{S:5,D:5}, rot:0},
 {name:"Casual", stars:2, layouts:[[[0,0],[4,4],[0,4],[4,0],[2,2]], [[1,0],[3,4],[0,3],[4,1],[2,2]], [[0,1],[4,3],[1,4],[3,0],[2,2]]],
   weights:{S:3,D:7}, rot:.25},
 {name:"Medium", stars:3, layouts:[[[0,0],[0,4],[4,0],[4,4]], [[0,2],[4,2],[2,0],[2,4]], [[1,1],[1,3],[3,1],[3,3]]],
   weights:{S:1.5,D:6,T:2.5}, rot:.5},
 {name:"Hard",   stars:4, layouts:[[[0,0],[4,4],[1,3],[3,1]], [[0,4],[4,0],[1,1],[3,3]], [[0,2],[4,2],[2,0],[2,4]], [[1,2],[3,2],[2,0],[2,4]]],
   weights:{D:4,T:4,Q:2}, rot:.6},
 {name:"Master", stars:5, layouts:[[[0,0],[2,2],[4,4]], [[0,0],[2,2]], [[0,4],[2,2],[4,0]], [[1,1],[3,3]], [[1,2],[3,2]]],
   weights:{D:1.5,T:2,L:3,Q:2,M:1.5}, rot:.75, rare:true},
];

/* ---- Grid fill ---- */
function spansOf(isOpen){
  const out=[];
  for(let r=0;r<5;r++){let run=[];for(let c=0;c<=5;c++){if(c<5&&isOpen(r,c))run.push([r,c]);else{if(run.length>=2)out.push(run);run=[];}}}
  for(let c=0;c<5;c++){let run=[];for(let r=0;r<=5;r++){if(r<5&&isOpen(r,c))run.push([r,c]);else{if(run.length>=2)out.push(run);run=[];}}}
  return out;
}
function fill(spacers,rng,opts){
  const sp=new Set(spacers.map(([r,c])=>r+","+c));
  const isOpen=(r,c)=>!sp.has(r+","+c);
  const spans=spansOf(isOpen);
  // every open cell must belong to at least one span
  for(let r=0;r<5;r++)for(let c=0;c<5;c++)if(isOpen(r,c)&&!spans.some(s=>s.some(([a,b])=>a===r&&b===c)))throw new Error("isolated cell "+r+","+c);
  const g=Array.from({length:5},(_,r)=>Array.from({length:5},(_,c)=>isOpen(r,c)?"":"#"));
  const assigned=new Array(spans.length).fill(null);
  const used=new Set();
  let nodes=0; const BUDGET=opts.budget||150000;
  const rare=/[qzxj]/;
  function cands(i,list){
    const s=spans[i]; const out=[];
    for(const w of list){ if(used.has(w))continue; let ok=true;
      for(let k=0;k<s.length;k++){const ch=g[s[k][0]][s[k][1]]; if(ch&&ch!==w[k]){ok=false;break;}}
      if(ok)out.push(w);}
    return out;
  }
  function solve(){
    if(++nodes>BUDGET) return false;
    let best=-1,bestC=null;
    for(let i=0;i<spans.length;i++){ if(assigned[i])continue;
      let c=cands(i,common[spans[i].length]);
      if(c.length===0&&opts.wide) c=cands(i,wide[spans[i].length]);
      if(c.length===0) return false;
      if(bestC===null||c.length<bestC.length){best=i;bestC=c;}
    }
    if(best<0) return true;
    let order=shuffle(bestC,rng);
    if(opts.rare && assigned.filter(Boolean).length<2) order.sort((a,b)=>(rare.test(b)?1:0)-(rare.test(a)?1:0));
    // widen a little for variety: if common gave few options, also allow some wide words
    if(opts.wide && order.length<4){ const extra=shuffle(cands(best,wide[spans[best].length]).filter(w=>!order.includes(w)),rng).slice(0,12); order=order.concat(extra); }
    const s=spans[best]; const prev=s.map(([r,c])=>g[r][c]);
    for(const w of order.slice(0,opts.branch||24)){
      assigned[best]=w; used.add(w);
      for(let k=0;k<s.length;k++) g[s[k][0]][s[k][1]]=w[k];
      if(solve()) return true;
      used.delete(w); assigned[best]=null;
      for(let k=0;k<s.length;k++) g[s[k][0]][s[k][1]]=prev[k];
    }
    return false;
  }
  if(!solve()) return null;
  return {g,spans,words:assigned.slice()};
}

/* ---- Block tiling ---- */
const SHAPES={
  S:[[[0,0]]],
  D:[[[0,0],[0,1]],[[0,0],[1,0]]],
  T:[[[0,0],[0,1],[0,2]],[[0,0],[1,0],[2,0]]],
  L:[[[0,0],[1,0],[1,1]],[[0,0],[0,1],[1,0]],[[0,0],[0,1],[1,1]],[[0,1],[1,0],[1,1]]],
  Q:[[[0,0],[0,1],[1,0],[1,1]]],
  M:[[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]],[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]]],
};
function weightedOrder(weights,rng){
  const items=Object.entries(weights).filter(([,w])=>w>0).flatMap(([t,w])=>SHAPES[t].map(sh=>({t,sh,w})));
  const out=[]; let pool=items.slice();
  while(pool.length){ const tot=pool.reduce((a,x)=>a+x.w,0); let r=rng()*tot; let i=0; for(;i<pool.length;i++){r-=pool[i].w;if(r<=0)break;} i=Math.min(i,pool.length-1); out.push(pool[i]); pool.splice(i,1); }
  return out;
}
function tile(g,weights,rng){
  const covered=Array.from({length:5},()=>new Array(5).fill(false));
  const pieces=[]; let nodes=0;
  function firstFree(){for(let r=0;r<5;r++)for(let c=0;c<5;c++)if(g[r][c]!=="#"&&!covered[r][c])return[r,c];return null;}
  function rec(){
    if(++nodes>20000) return false;
    const f=firstFree(); if(!f) return true;
    for(const {t,sh} of weightedOrder(weights,rng)){
      const [ar,ac]=sh[0]; const r0=f[0]-ar, c0=f[1]-ac;
      let ok=true; for(const [dr,dc] of sh){const r=r0+dr,c=c0+dc; if(r<0||r>4||c<0||c>4||g[r][c]==="#"||covered[r][c]){ok=false;break;}}
      if(!ok)continue;
      for(const [dr,dc] of sh)covered[r0+dr][c0+dc]=true;
      pieces.push({t,sh,r0,c0});
      if(rec())return true;
      pieces.pop(); for(const [dr,dc] of sh)covered[r0+dr][c0+dc]=false;
    }
    return false;
  }
  return rec()?pieces:null;
}
function compScore(pieces,weights){
  const tot=Object.values(weights).reduce((a,b)=>a+b,0); const n=pieces.length; let d=0;
  for(const t of Object.keys(SHAPES)){const want=(weights[t]||0)/tot; const have=pieces.filter(p=>p.t===t).length/n; d+=Math.abs(want-have);}
  return d;
}
function rotateCells(cells){ // 90° clockwise, cells [[dr,dc,ch]] within bbox
  const h=Math.max(...cells.map(c=>c[0]))+1;
  return cells.map(([r,c,ch])=>[c,h-1-r,ch]);
}

/* ---- Build ---- */
const N=+process.argv[2]||35;
/* APPEND-ONLY: puzzles already published in index.html are the schedule that
   players have seen. They are loaded here and kept verbatim; only indices
   beyond them are generated. Never regenerate an existing entry — it would
   silently swap a past (or today's) puzzle under players' feet.            */
const PUZ=[];
try{
  const html=fs.readFileSync(require("path").join(__dirname,"index.html"),"utf8");
  const m=html.match(/const PUZZLES = (\[[\s\S]*?\n\]);/);
  if(m){
    const existing=eval(m[1]);
    for(const q of existing){
      const words=[]; // rebuild the word list from the grid so the duplicate check still applies
      const isOpen=(r,c)=>q.g[r][c]!=="#";
      for(const sp of spansOf(isOpen)) words.push(sp.map(([r,c])=>q.g[r][c]).join("").toLowerCase());
      PUZ.push(Object.assign({},q,{_words:words,_uncommon:[],_kept:true}));
    }
  }
}catch(e){ console.error("could not read existing puzzles:",e.message); }
console.error("keeping",PUZ.length,"published puzzles; generating",Math.max(0,N-PUZ.length),"new");
for(let i=PUZ.length;i<N;i++){
  const tier=TIERS[i%TIERS.length];
  const layout=tier.layouts[Math.floor(i/TIERS.length)%tier.layouts.length];
  let res=null, pieces=null, seed=1000+i*97;
  for(let attempt=0;attempt<400&&!pieces;attempt++){
    const rng=mulberry32(seed+attempt*7919);
    res=fill(layout,rng,{wide:false, rare:!!tier.rare, branch:attempt<8?24:40, budget:250000});
    if(!res)continue;
    // reject grids that reuse too many words from an earlier puzzle
    if(PUZ.some(q=>res.words.filter(w=>w.length>=3&&q._words.includes(w)).length>=3)){res=null;continue;}
    let best=null;
    for(let k=0;k<30;k++){const p=tile(res.g,tier.weights,rng); if(!p)continue; const s=compScore(p,tier.weights); if(!best||s<best.s)best={p,s};}
    if(best)pieces=best.p;
  }
  if(!pieces){console.error("FAILED puzzle",i);process.exit(1);}
  const rng=mulberry32(seed+5);
  const out=pieces.map(p=>{
    const cells=p.sh.map(([dr,dc])=>[dr,dc,res.g[p.r0+dr][p.c0+dc].toUpperCase()]);
    let k=0;
    if(p.t!=="S"&&rng()<tier.rot){ k=1+Math.floor(rng()*3); }
    return {s:cells.map(([r,c])=>[r,c]), l:cells.map(c=>c[2]).join(""), at:[p.r0,p.c0], k};
  });
  // sanity: exact cover
  const cover=Array.from({length:5},()=>new Array(5).fill(0));
  out.forEach(p=>p.s.forEach(([dr,dc])=>cover[p.at[0]+dr][p.at[1]+dc]++));
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){const want=res.g[r][c]==="#"?0:1; if(cover[r][c]!==want)throw new Error("cover mismatch");}
  const uncommon=res.words.filter(w=>!common[w.length].includes(w));
  PUZ.push({sp:layout, stars:tier.stars, tier:tier.name, g:res.g.map(r=>r.map(ch=>ch==="#"?"#":ch.toUpperCase()).join("")), p:out, _words:res.words, _uncommon:uncommon});
}
// report
PUZ.forEach((p,i)=>{
  const comp={}; p.p.forEach(x=>{const t=x.s.length===1?"S":x.s.length===4?"Q":x.s.length===6?"M":x.s.length===2?"D":(x.s.every(([r])=>r===x.s[0][0])||x.s.every(([,c])=>c===x.s[0][1]))?"T":"L"; comp[t]=(comp[t]||0)+1;});
  if(p._kept) return;
  console.error(`#${i+1} ${"★".repeat(p.stars)} ${p.tier} par=${p.p.length} rot=${p.p.filter(x=>x.k).length} ${JSON.stringify(comp)} words=${p._words.join(",")}${p._uncommon.length?"  UNCOMMON:"+p._uncommon.join(","):""}`);
  console.error("   "+p.g.join(" / "));
});
// emit JS
const lines=PUZ.map(p=>{
  const pcs=p.p.map(x=>`{s:${JSON.stringify(x.s)},l:"${x.l}",at:[${x.at}],k:${x.k}}`).join(",\n      ");
  return `  { sp:${JSON.stringify(p.sp)}, stars:${p.stars}, tier:"${p.tier}",\n    g:${JSON.stringify(p.g)},\n    p:[\n      ${pcs}\n    ] }`;
});
fs.writeFileSync("puzzles.js","const PUZZLES = [\n"+lines.join(",\n")+"\n];\n");
console.error("wrote",PUZ.length,"puzzles");

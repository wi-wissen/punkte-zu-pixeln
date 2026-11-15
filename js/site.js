(function(){
const CH=[["index.html","Start"],["00-einstieg.html","Einstieg"],["01-koordinaten.html","Koordinaten"],["02-figuren.html","Figuren aus Dreiecken"],
 ["03-kollision.html","Kollisionen"],["04-kamera.html","Kamera und Pixel"],["05-licht.html","Licht und Schatten"],["06-geschichte.html","Geschichte"],["07-weltmodell.html","Die Spielwelt"]];
const page=+document.body.dataset.page;
const sun='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const moon='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
let saved=null;try{saved=localStorage.getItem("theme");}catch(e){}
if(saved)document.documentElement.dataset.theme=saved;
const isDark=()=>document.documentElement.dataset.theme?document.documentElement.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;
const main=document.querySelector("main");
const header=document.createElement("header");header.className="top";
header.innerHTML='<a class="brand" href="index.html"><svg width="24" height="24" viewBox="0 0 26 26" aria-hidden="true"><polygon points="13,3 24,21 2,21" fill="var(--ac)"/></svg>3D-Spiele erklärt <small>· Von Punkten zu Pixeln</small></a><button id="theme" aria-label="Hell/Dunkel wechseln"></button>';
const links=CH.slice(1).map((c,i)=>`<a href="${c[0]}" class="${i===page-1?"cur":""}"><b>${i||"·"}</b><span>${c[1]}</span></a>`).join("");
const mnav=document.createElement("details");mnav.className="mnav";
mnav.innerHTML=`<summary>Kapitel: ${CH[page][1]}</summary>`+links.replace(/<b>.*?<\/b>/g,"");
const layout=document.createElement("div");layout.className="layout";
const nav=document.createElement("nav");nav.className="chapters";nav.innerHTML="<h2>KAPITEL</h2>"+links;
document.body.insertBefore(header,main);document.body.insertBefore(mnav,main);document.body.insertBefore(layout,main);
layout.append(nav,main);
if(document.body.dataset.fig){const a=document.createElement("aside");a.className="fig";
 a.innerHTML=`<img src="${document.body.dataset.fig}" alt=""><p>${document.body.dataset.cap||""}</p>`;layout.append(a);}
const btn=header.querySelector("#theme");
const paint=()=>{btn.innerHTML=isDark()?moon:sun;};paint();
btn.onclick=()=>{const t=isDark()?"light":"dark";document.documentElement.dataset.theme=t;try{localStorage.setItem("theme",t);}catch(e){}paint();document.dispatchEvent(new Event("themechange"));};
matchMedia("(prefers-color-scheme:dark)").addEventListener("change",()=>{paint();document.dispatchEvent(new Event("themechange"));});
if(page>0){const p=document.createElement("div");p.className="pager";const prev=CH[page-1],next=CH[page+1];
 p.innerHTML=`<a class="prev" href="${prev[0]}">← ${prev[1]}</a>`+(next?`<a href="${next[0]}">Weiter: ${next[1]} →</a>`:`<a href="index.html">Zurück zum Start</a>`);main.append(p);}
const f=document.createElement("footer");
f.innerHTML='Lizenz: <a href="https://creativecommons.org/licenses/by/4.0/deed.de">CC BY 4.0</a> · <a href="https://github.com/wi-wissen/punkte-zu-pixeln">Quelltext auf GitHub</a> · Die Bilder der Ritterin wurden mit KI erzeugt.';
document.body.append(f);
document.querySelectorAll(".quiz").forEach(q=>{
  const opts=[...q.querySelectorAll("li")].map(l=>l.innerHTML),c=+q.dataset.c;
  q.innerHTML=`<div class="q">${q.dataset.q}</div>`+opts.map((o,i)=>`<button data-i="${i}"><i>${"ABCD"[i]}</i><span>${o}</span></button>`).join("")+'<div class="why"></div>';
  q.querySelectorAll("button").forEach(b=>b.onclick=()=>{const i=+b.dataset.i;
    q.querySelectorAll("button").forEach(x=>x.className="");b.className=i===c?"ok":"no";
    q.querySelector(".why").textContent=i===c?"Richtig. "+q.dataset.why:"Noch nicht. Rechne noch einmal nach.";});
});
document.querySelectorAll(".tabs[data-for]").forEach(t=>t.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;
  t.querySelectorAll("button").forEach(x=>x.className=x===b?"on":"");}));
})();

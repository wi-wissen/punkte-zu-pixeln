(function(){
const CH=[
 ["index.html","Start"],
 ["00-einstieg.html","Einstieg"],
 ["01-koordinaten.html","Koordinaten"],
 ["02-figuren.html","Figuren aus Dreiecken"],
 ["03-kollision.html","Kollisionen"],
 ["04-kamera.html","Kamera und Pixel"],
 ["05-licht.html","Licht und Schatten"],
 ["06-geschichte.html","Geschichte"],
 ["07-weltmodell.html","Die Spielwelt"]];
const page=+document.body.dataset.page; // 0 = Start, 1.. = Kapitel
const sun='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
const moon='<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>';
let saved=null;try{saved=localStorage.getItem("theme");}catch(e){}
if(saved)document.documentElement.dataset.theme=saved;
const isDark=()=>document.documentElement.dataset.theme?document.documentElement.dataset.theme==="dark":matchMedia("(prefers-color-scheme:dark)").matches;
const main=document.querySelector("main");
const header=document.createElement("header");header.className="top";
header.innerHTML='<a class="brand" href="index.html"><svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><polygon points="13,3 24,21 2,21" fill="var(--ac)"/></svg>3D-Spiele erklärt <small>· Von Punkten zu Pixeln</small></a><button id="theme" aria-label="Hell/Dunkel wechseln"></button>';
const layout=document.createElement("div");layout.className="layout";
const nav=document.createElement("nav");nav.className="chapters";
nav.innerHTML="<h2>KAPITEL</h2>"+CH.slice(1).map((c,i)=>`<a href="${c[0]}" class="${i===page-1?"cur":i<page-1?"done":""}"><b>${i<page-1?"✓":i}</b><span>${c[1].replace("Einstieg: ","")}</span></a>`).join("");
document.body.insertBefore(header,main);document.body.insertBefore(layout,main);
layout.append(nav,main);
const btn=header.querySelector("#theme");
const paint=()=>{btn.innerHTML=isDark()?moon:sun;};paint();
btn.onclick=()=>{const t=isDark()?"light":"dark";document.documentElement.dataset.theme=t;try{localStorage.setItem("theme",t);}catch(e){}paint();document.dispatchEvent(new Event("themechange"));};
matchMedia("(prefers-color-scheme:dark)").addEventListener("change",()=>{paint();document.dispatchEvent(new Event("themechange"));});
// Pager
if(page>0){
  const p=document.createElement("div");p.className="pager";
  const prev=CH[page-1],next=CH[page+1];
  p.innerHTML=`<a class="prev" href="${prev[0]}">← ${prev[1].replace("Einstieg: ","")}</a>`+(next?`<a href="${next[0]}">Weiter: ${next[1]} →</a>`:`<a href="index.html">Zurück zum Start</a>`);
  main.append(p);
}
const f=document.createElement("footer");
f.innerHTML='Lizenz: <a href="https://creativecommons.org/licenses/by/4.0/deed.de">CC BY 4.0</a> · <a href="https://github.com/wi-wissen/punkte-zu-pixeln">Quelltext auf GitHub</a>';
document.body.append(f);
// Verständnisfragen:  <div class="quiz" data-q="…" data-c="1" data-why="…"><i>Antwort A</i> …
document.querySelectorAll(".quiz").forEach(q=>{
  const opts=[...q.querySelectorAll("li")].map(l=>l.textContent);
  const c=+q.dataset.c;
  q.innerHTML=`<div class="q">${q.dataset.q}</div>`+opts.map((o,i)=>`<button data-i="${i}"><i>${"ABCD"[i]}</i><span>${o}</span></button>`).join("")+'<div class="why"></div>';
  q.querySelectorAll("button").forEach(b=>b.onclick=()=>{
    const i=+b.dataset.i;
    q.querySelectorAll("button").forEach(x=>x.className="");
    b.className=i===c?"ok":"no";
    q.querySelector(".why").textContent=i===c?"Richtig. "+q.dataset.why:"Noch nicht. Probiere eine andere Antwort.";
  });
});
})();

/* mini3d: eine winzige 3D-Bibliothek zum Verstehen.
   Alles Wichtige steht in project(): Division durch die Tiefe. */
(function(){
const M3D={};
M3D.css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();

// Leinwand scharf machen (Retina) und logische Größe w x h festlegen
M3D.setup=function(canvas,w,h){
  const dpr=window.devicePixelRatio||1;
  canvas.width=w*dpr;canvas.height=h*dpr;
  const ctx=canvas.getContext("2d");ctx.setTransform(dpr,0,0,dpr,0,0);
  canvas.w=w;canvas.h=h;return ctx;
};
// Zeigerposition in logischen Leinwandkoordinaten
M3D.pos=function(canvas,e){
  const r=canvas.getBoundingClientRect();
  return {x:(e.clientX-r.left)*canvas.w/r.width,y:(e.clientY-r.top)*canvas.h/r.height};
};

// Drehungen eines Punkts p=[x,y,z]
M3D.rotY=(p,a)=>[p[0]*Math.cos(a)+p[2]*Math.sin(a),p[1],-p[0]*Math.sin(a)+p[2]*Math.cos(a)];
M3D.rotX=(p,a)=>[p[0],p[1]*Math.cos(a)-p[2]*Math.sin(a),p[1]*Math.sin(a)+p[2]*Math.cos(a)];

/* Projektion: Ein Punkt (x,y,z) vor der Kamera landet bei
   x' = x * f / z   und   y' = y * f / z.   (z = Tiefe, f = Brennweite)
   Je weiter weg (z groß), desto näher an der Bildmitte. */
M3D.project=function(p,cam){
  const z=p[2]+cam.dist;
  const s=cam.f/z;
  return [cam.cx+p[0]*s*cam.scale, cam.cy-p[1]*s*cam.scale, z];
};

// Würfel: 8 Eckpunkte, 12 Dreiecke (je 2 pro Seite)
M3D.cube=function(s){
  s=s||1;
  const v=[[-s,-s,-s],[s,-s,-s],[s,s,-s],[-s,s,-s],[-s,-s,s],[s,-s,s],[s,s,s],[-s,s,s]];
  const quads=[[0,1,2,3],[5,4,7,6],[4,0,3,7],[1,5,6,2],[3,2,6,7],[4,5,1,0]];
  const t=[];quads.forEach((q,i)=>{t.push([q[0],q[2],q[1],i]);t.push([q[0],q[3],q[2],i]);});
  return {v,t};
};


M3D.de=(v,n)=>v.toFixed(n==null?1:n).replace(".",",").replace("-","−");
M3D.hex=h=>{h=h.replace("#","");if(h.length===3)h=h.replace(/./g,"$&$&");return [0,2,4].map(i=>parseInt(h.substr(i,2),16));};
M3D.mix=(a,b,t)=>{const A=M3D.hex(a),B=M3D.hex(b);return "rgb("+A.map((v,i)=>Math.round(v+(B[i]-v)*t)).join(",")+")";};
M3D.font=w=>(w||600)+" 15px Figtree,system-ui,sans-serif";
// Kugel aus S Segmenten rundum und T Ringen: 2·S·(T−1) Dreiecke
M3D.sphere=function(S,T,r){
  const v=[[0,r,0]],t=[];
  for(let i=1;i<T;i++){const a=Math.PI*i/T;for(let j=0;j<S;j++){const b=2*Math.PI*j/S;v.push([r*Math.sin(a)*Math.cos(b),r*Math.cos(a),r*Math.sin(a)*Math.sin(b)]);}}
  v.push([0,-r,0]);const last=v.length-1,id=(i,j)=>1+(i-1)*S+(j%S);
  for(let j=0;j<S;j++){t.push([0,id(1,j),id(1,j+1),0]);t.push([last,id(T-1,j+1),id(T-1,j),0]);}
  for(let i=1;i<T-1;i++)for(let j=0;j<S;j++){t.push([id(i,j),id(i+1,j),id(i+1,j+1),0]);t.push([id(i,j),id(i+1,j+1),id(i,j+1),0]);}
  // Umlaufsinn so drehen, dass jede Normale nach außen zeigt
  t.forEach(q=>{const a=v[q[0]],b=v[q[1]],c=v[q[2]],n=M3D.cross(M3D.sub(b,a),M3D.sub(c,a));
    if(M3D.dot(n,[a[0]+b[0]+c[0],a[1]+b[1]+c[1],a[2]+b[2]+c[2]])<0){const h=q[1];q[1]=q[2];q[2]=h;}});
  return {v,t};
};
M3D.sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
M3D.cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
M3D.dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
M3D.norm=a=>{const l=Math.hypot(a[0],a[1],a[2])||1;return [a[0]/l,a[1]/l,a[2]/l];};

/* Mesh zeichnen. mode: "fill" | "wire" | "points"
   Gefüllt: Dreiecke von hinten nach vorn (Malerverfahren), Helligkeit nach Winkel zum Licht. */
M3D.drawMesh=function(ctx,mesh,o){
  const rot=p=>M3D.rotX(M3D.rotY(p,o.ay),o.ax);
  const rv=mesh.v.map(rot);
  const pv=rv.map(p=>M3D.project(p,o.cam));
  const ink=M3D.css("--ik"),tx=M3D.css("--tx"),ac=M3D.css("--ac");
  const cols=[M3D.css("--c1"),M3D.css("--c2"),M3D.css("--c3")];
  ctx.lineJoin="round";
  if(o.mode==="fill"||o.mode==="wire"){
    const tris=mesh.t.map(t=>{
      const a=rv[t[0]],b=rv[t[1]],c=rv[t[2]];
      const n=M3D.norm(M3D.cross(M3D.sub(b,a),M3D.sub(c,a)));
      const z=(pv[t[0]][2]+pv[t[1]][2]+pv[t[2]][2])/3;
      return {t,n,z};
    }).sort((p,q)=>q.z-p.z);
    const L=M3D.norm(o.light||[-0.4,0.8,-0.5]);
    tris.forEach(({t,n})=>{
      // Rückseiten weglassen (Normale zeigt von der Kamera weg)
      const a=rv[t[0]];
      const facing=M3D.dot(n,[a[0],a[1],a[2]+o.cam.dist])<0;
      if(o.mode==="fill"&&!facing)return;
      ctx.beginPath();
      t.slice(0,3).forEach((i,k)=>k?ctx.lineTo(pv[i][0],pv[i][1]):ctx.moveTo(pv[i][0],pv[i][1]));
      ctx.closePath();
      if(o.mode==="fill"){
        const lam=Math.max(0,M3D.dot(n,L));
        ctx.fillStyle=o.smooth?M3D.mix(cols[2],cols[0],lam):cols[Math.min(2,Math.round((1-lam)*2))];ctx.fill();
        ctx.strokeStyle=ink;if(o.lines!==false){ctx.lineWidth=o.lw||1.6;ctx.stroke();}
      }else{ctx.strokeStyle=tx;ctx.lineWidth=1.5;ctx.stroke();}
    });
  }
  if(o.points||o.mode==="points"){
    pv.forEach(p=>{ctx.beginPath();ctx.arc(p[0],p[1],4.5,0,7);ctx.fillStyle=ac;ctx.fill();});
  }
  return pv;
};

// Würfel per Ziehen drehen; ruft draw() bei jeder Änderung auf
M3D.drag=function(canvas,state,draw){
  let down=null;
  canvas.style.cursor="grab";
  canvas.addEventListener("pointerdown",e=>{down={x:e.clientX,y:e.clientY,ax:state.ax,ay:state.ay};state.auto=false;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener("pointermove",e=>{if(!down)return;
    state.ay=down.ay+(e.clientX-down.x)*0.01;state.ax=down.ax+(e.clientY-down.y)*0.01;draw();});
  const up=()=>{down=null;};
  canvas.addEventListener("pointerup",up);canvas.addEventListener("pointercancel",up);
};

// Hilfsfunktion: Ziffer-Wechsel der Farbmodi (Hell/Dunkel) neu zeichnen
document.addEventListener("themechange",()=>window.__redraw&&window.__redraw.forEach(f=>f()));
M3D.onTheme=f=>{(window.__redraw=window.__redraw||[]).push(f);};

window.M3D=M3D;
})();

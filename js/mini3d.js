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
  const t=[];quads.forEach((q,i)=>{t.push([q[0],q[2],q[1],i,[[0,1],[1,0],[1,1]]]);t.push([q[0],q[3],q[2],i,[[0,1],[0,0],[1,0]]]);});
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
M3D.rgb=n=>M3D.hex(M3D.css(n));
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


/* ---------- Software-Rasterisierer: genau das Verfahren aus Kapitel 4 ---------- */
M3D.edge=(a,b,p)=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
M3D.raster=function(w,h){
  const img=new ImageData(w,h),d=img.data,zb=new Float32Array(w*h),st={};
  return {img,st,w,h,
    clear(bg){zb.fill(Infinity);for(let i=0;i<w*h;i++){d[i*4]=bg[0];d[i*4+1]=bg[1];d[i*4+2]=bg[2];d[i*4+3]=255;}
      st.verts=st.trisAll=st.tris=st.tested=st.filled=st.rejected=0;},
    // a,b,c = [x,y,z,u,v] auf dem Bildschirm; col = [r,g,b] oder tex = {n,data}
    tri(a,b,c,col,tex,shade){
      const ar=M3D.edge(a,b,c);if(!ar)return;
      const x0=Math.max(0,Math.floor(Math.min(a[0],b[0],c[0]))),x1=Math.min(w-1,Math.floor(Math.max(a[0],b[0],c[0])));
      const y0=Math.max(0,Math.floor(Math.min(a[1],b[1],c[1]))),y1=Math.min(h-1,Math.floor(Math.max(a[1],b[1],c[1])));
      for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){
        st.tested++;const p=[x+.5,y+.5];
        const ga=M3D.edge(b,c,p)/ar,gb=M3D.edge(c,a,p)/ar,gc=1-ga-gb;      // Anteile der drei Ecken
        if(ga<0||gb<0||gc<0)continue;
        const iz=ga/a[2]+gb/b[2]+gc/c[2],z=1/iz,i=y*w+x;                    // Tiefe dieses Pixels
        if(z>=zb[i]){st.rejected++;continue;}                              // Tiefenpuffer
        zb[i]=z;st.filled++;let r=col;
        if(tex){const u=(ga*a[3]/a[2]+gb*b[3]/b[2]+gc*c[3]/c[2])*z,v=(ga*a[4]/a[2]+gb*b[4]/b[2]+gc*c[4]/c[2])*z;
          r=tex.data[Math.min(tex.n-1,Math.max(0,Math.floor(v*tex.n)))*tex.n+Math.min(tex.n-1,Math.max(0,Math.floor(u*tex.n)))];}
        d[i*4]=r[0]*shade;d[i*4+1]=r[1]*shade;d[i*4+2]=r[2]*shade;
      }}};
};
// Ein Netz mit dem Rasterisierer zeichnen. o: ax, ay, pos, cam, dark/light (Farben) oder tex, own (eigene Drehung)
M3D.renderMesh=function(r,mesh,o){
  const pos=o.pos||[0,0,0],L=M3D.norm(o.light||[-0.4,0.8,-0.5]);
  const rv=mesh.v.map(p=>{let q=o.own?M3D.rotX(M3D.rotY(p,o.own[1]),o.own[0]):p;q=M3D.rotX(M3D.rotY(q,o.ay),o.ax);return [q[0]+pos[0],q[1]+pos[1],q[2]+pos[2]];});
  const pv=rv.map(p=>M3D.project(p,o.cam));r.st.verts+=rv.length;r.st.trisAll+=mesh.t.length;
  mesh.t.forEach(t=>{const a=rv[t[0]],b=rv[t[1]],c=rv[t[2]],n=M3D.norm(M3D.cross(M3D.sub(b,a),M3D.sub(c,a)));
    if(M3D.dot(n,[a[0],a[1],a[2]+o.cam.dist])>=0)return;                 // Rückseite
    r.st.tris++;const lam=Math.max(0,M3D.dot(n,L)),uv=t[4]||[[0,0],[0,0],[0,0]];
    const P=k=>[pv[t[k]][0],pv[t[k]][1],pv[t[k]][2],uv[k][0],uv[k][1]];
    if(o.tex)r.tri(P(0),P(1),P(2),null,o.tex,.35+.65*lam);
    else r.tri(P(0),P(1),P(2),o.dark.map((v,i)=>v+(o.light2[i]-v)*lam),null,1);});
};
// Kisten-Textur mit n x n Pixeln aus drei Farben
M3D.crate=function(n,cols){const data=[];for(let y=0;y<n;y++)for(let x=0;x<n;x++){
  const e=x===0||y===0||x===n-1||y===n-1,e2=x===1||y===1||x===n-2||y===n-2,dg=Math.abs(x-y)<=1||Math.abs(x+y-(n-1))<=1,pl=y%4===0;
  data.push(e?cols[2]:e2?cols[1]:dg?cols[2]:pl?cols[1]:cols[0]);}return {n,data};};
M3D.drawTex=function(ctx,tex,x,y,size){const s=size/tex.n;for(let j=0;j<tex.n;j++)for(let i=0;i<tex.n;i++){const c=tex.data[j*tex.n+i];
  ctx.fillStyle="rgb("+c.map(Math.round).join(",")+")";ctx.fillRect(x+i*s,y+j*s,s+.5,s+.5);}};
/* ---------- Blockwelt in schräger Ansicht ---------- */
// get(x,y,z) -> Blocktyp (0 = Luft); o: ox, oy, s (Kachelgröße), pal(typ) -> [oben, links, rechts], mark:[x,y,z]
M3D.iso=function(ctx,get,dim,o){
  const s=o.s,V=(x,y,z)=>[o.ox+(x-z)*s,o.oy+(x+z)*s*.5-y*s];let faces=0;
  const quad=(pts,col)=>{ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.closePath();ctx.fillStyle=col;ctx.fill();ctx.stroke();faces++;};
  ctx.lineJoin="round";ctx.lineWidth=o.lw||1;ctx.strokeStyle=o.line;
  for(let x=0;x<dim[0];x++)for(let z=0;z<dim[2];z++)for(let y=0;y<dim[1];y++){const t=get(x,y,z);if(!t)continue;const pal=o.pal(t,x,y,z);
    if(!get(x,y+1,z))quad([V(x,y+1,z),V(x+1,y+1,z),V(x+1,y+1,z+1),V(x,y+1,z+1)],pal[0]);
    if(!get(x,y,z+1))quad([V(x,y,z+1),V(x+1,y,z+1),V(x+1,y+1,z+1),V(x,y+1,z+1)],pal[1]);
    if(!get(x+1,y,z))quad([V(x+1,y,z),V(x+1,y+1,z),V(x+1,y+1,z+1),V(x+1,y,z+1)],pal[2]);}
  if(o.mark){const [x,y,z]=o.mark;ctx.strokeStyle=o.markCol;ctx.lineWidth=3;ctx.beginPath();
    [[[0,0,0],[1,0,0]],[[1,0,0],[1,0,1]],[[1,0,1],[0,0,1]],[[0,0,1],[0,0,0]],[[0,1,0],[1,1,0]],[[1,1,0],[1,1,1]],[[1,1,1],[0,1,1]],[[0,1,1],[0,1,0]],[[0,0,0],[0,1,0]],[[1,0,0],[1,1,0]],[[1,0,1],[1,1,1]],[[0,0,1],[0,1,1]]]
     .forEach(([a,b])=>{const p=V(x+a[0],y+a[1],z+a[2]),q=V(x+b[0],y+b[1],z+b[2]);ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);});ctx.stroke();}
  return faces;
};
window.M3D=M3D;
})();

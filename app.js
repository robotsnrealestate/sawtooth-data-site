(function(){
  var reduce=false; try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  var C={scr:'#080D12',grid:'rgba(150,180,200,.09)',line:'#7D93A1',pt:'#D4E0E7',acc:'#FF6A2C',teal:'#2FC9B8',txt:'#9FB4C0'};
  var MONO='11px "IBM Plex Mono",monospace';

  /* ---------- scene builders ---------- */
  function handScene(){
    // 21-pt hand topology, normalized 0..1 within region
    var base=[[.50,.96],[.37,.84],[.28,.75],[.21,.67],[.15,.60],
      [.45,.62],[.43,.46],[.42,.35],[.41,.26],
      [.53,.60],[.53,.43],[.53,.31],[.53,.21],
      [.61,.62],[.63,.47],[.64,.36],[.65,.28],
      [.69,.67],[.72,.55],[.74,.46],[.76,.39]];
    var bones=[[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[0,9],[9,10],[10,11],[11,12],[0,13],[13,14],[14,15],[15,16],[0,17],[17,18],[18,19],[19,20]];
    var tips=[4,8,12,16,20];
    // drifting feature points
    var feats=[]; for(var i=0;i<26;i++) feats.push({x:Math.random(),y:Math.random(),p:Math.random()*6.28,s:.1+Math.random()*.3});
    return function(ctx,w,h,t){
      var m=Math.min(w,h), pad=m*0.1;
      var rx=pad, ry=pad*0.6, rw=w-pad*2, rh=h-pad*1.6;
      // feature points
      ctx.fillStyle='rgba(47,201,184,.5)';
      for(var i=0;i<feats.length;i++){var f=feats[i];var fx=(f.x)*w, fy=(f.y)*h+Math.sin(t*f.s+f.p)*4;ctx.fillRect(fx,fy,1.6,1.6);}
      // compute hand pts with finger curl
      var pts=base.map(function(b,idx){
        var x=rx+b[0]*rw, y=ry+b[1]*rh;
        // curl: pull non-wrist points slightly, fingertips most
        var fi=tips.indexOf(idx);
        var curl=Math.sin(t*0.9)*0.5+0.5; // 0..1
        var sway=Math.sin(t*0.6+b[0]*4)*m*0.012;
        if(idx!==0){ y-= (1-b[1])*0; }
        if(fi>=0){ y+= curl*rh*0.06; x+= Math.sin(t*0.7+fi)*m*0.01; }
        return [x+sway, y];
      });
      // bones
      ctx.lineWidth=Math.max(1.4,m*0.009); ctx.strokeStyle=C.acc; ctx.lineCap='round';
      ctx.beginPath();
      bones.forEach(function(b){ctx.moveTo(pts[b[0]][0],pts[b[0]][1]);ctx.lineTo(pts[b[1]][0],pts[b[1]][1]);});
      ctx.stroke();
      // joints
      for(var j=0;j<pts.length;j++){var r=(j===0?m*0.016:m*0.011);ctx.beginPath();ctx.fillStyle=(tips.indexOf(j)>=0?C.acc:C.pt);ctx.arc(pts[j][0],pts[j][1],r,0,6.283);ctx.fill();if(tips.indexOf(j)>=0){ctx.strokeStyle='rgba(255,106,44,.35)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(pts[j][0],pts[j][1],r+3+Math.sin(t*3)*1.5,0,6.283);ctx.stroke();}}
      // bbox around hand
      var xs=pts.map(function(p){return p[0];}),ys=pts.map(function(p){return p[1];});
      var x0=Math.min.apply(0,xs),x1=Math.max.apply(0,xs),y0=Math.min.apply(0,ys),y1=Math.max.apply(0,ys);
      var bx=x0-m*0.05,by=y0-m*0.05,bw=(x1-x0)+m*0.1,bh=(y1-y0)+m*0.1;
      ctx.strokeStyle='rgba(255,106,44,.55)';ctx.lineWidth=1.2;ctx.setLineDash([5,4]);ctx.strokeRect(bx,by,bw,bh);ctx.setLineDash([]);
      ctx.font=MONO;ctx.fillStyle=C.acc;ctx.textBaseline='alphabetic';
      ctx.fillText('hand · 0.'+(33+Math.floor((Math.sin(t)*0.5+0.5)*18))+' m',bx,by-6);
      // depth readout rows bottom-left
      ctx.fillStyle=C.txt;
      var rows=['frame '+String(300+Math.floor(t*25)%1365).padStart(4,'0'),'pose 21 pts · 2 hands','depth 0.1–3.6 m'];
      for(var k=0;k<rows.length;k++){ctx.fillText(rows[k],pad*0.6,h-pad*0.6-(rows.length-1-k)*14);}
    };
  }

  function shelfScene(){
    // shelves with products; one gap; price mismatch flag
    var rows=[0.30,0.56,0.82];
    var prod=[]; // {row, x, w, kind}
    rows.forEach(function(ry,ri){
      var x=0.06; var rng=(ri*7+3);
      while(x<0.92){
        var w=0.05+((rng=(rng*9301+49297)%233280)/233280)*0.05;
        var gap=(ri===1 && x>0.42 && x<0.58); // leave a gap mid-row-1
        if(!gap) prod.push({row:ri,x:x,w:w,ri:ri});
        x+=w+0.012;
      }
    });
    var gapBox={row:1,x:0.44,w:0.14};
    return function(ctx,w,h,t){
      var m=Math.min(w,h),pad=m*0.09;
      var ax=pad,ay=pad*0.9,aw=w-pad*2,ah=h-pad*1.7;
      // shelf lines
      ctx.strokeStyle=C.line;ctx.lineWidth=1.4;
      rows.forEach(function(ry){var y=ay+ry*ah+ah*0.13;ctx.beginPath();ctx.moveTo(ax,y);ctx.lineTo(ax+aw,y);ctx.stroke();});
      // scan sweep 0..1 loop
      var sx=(t*0.16)%1.25; var scanX=ax+sx*aw;
      // products
      ctx.font=MONO;
      prod.forEach(function(p){
        var px=ax+p.x*aw, py=ay+rows[p.row]*ah-ah*0.14, pw=p.w*aw, ph=ah*0.27;
        var scanned=(px+pw)<=scanX;
        ctx.strokeStyle=C.line;ctx.lineWidth=1;ctx.strokeRect(px,py,pw,ph);
        if(scanned){
          ctx.strokeStyle=C.teal;ctx.lineWidth=1.4;ctx.strokeRect(px+1,py+1,pw-2,ph-2);
          if(p.w>0.07){ctx.fillStyle='rgba(47,201,184,.9)';ctx.fillText('SKU',px+3,py-3);}
        }
      });
      // gap box flagged (always visible once scan passed it)
      var gx=ax+gapBox.x*aw, gy=ay+rows[1]*ah-ah*0.14, gw=gapBox.w*aw, gh=ah*0.27;
      if(scanX>gx){
        ctx.strokeStyle=C.acc;ctx.lineWidth=1.6;ctx.setLineDash([5,4]);ctx.strokeRect(gx,gy,gw,gh);ctx.setLineDash([]);
        ctx.fillStyle=C.acc;ctx.fillText('GAP',gx+4,gy+gh*0.6);
      }
      // price mismatch tag on a product row 2
      var mx=ax+0.66*aw, my=ay+rows[2]*ah-ah*0.14;
      if(scanX>mx){ctx.strokeStyle=C.acc;ctx.setLineDash([4,3]);ctx.lineWidth=1.4;ctx.strokeRect(mx,my-ah*0.02,aw*0.14,ah*0.31);ctx.setLineDash([]);ctx.fillStyle=C.acc;ctx.fillText('$ ≠ plan',mx,my-5);}
      // scan line
      if(sx<1){ctx.strokeStyle=C.acc;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(scanX,ay);ctx.lineTo(scanX,ay+ah);ctx.stroke();
        var g=ctx.createLinearGradient(scanX-30,0,scanX,0);g.addColorStop(0,'rgba(255,106,44,0)');g.addColorStop(1,'rgba(255,106,44,.18)');ctx.fillStyle=g;ctx.fillRect(scanX-30,ay,30,ah);}
      // readout
      var done=Math.min(1,sx);
      ctx.fillStyle=C.txt;
      ctx.fillText((sx<1?'SCANNING':'COMPLETE')+' · '+Math.round(done*100)+'%',pad*0.6,h-pad*0.6-14);
      ctx.fillStyle=C.acc;ctx.fillText('1 gap · 1 price flag',pad*0.6,h-pad*0.6);
    };
  }

  function aisleScene(){
    var N=6, lanes=[0.66,0.40], items=[];
    for(var s=-1;s<=1;s+=2){for(var li=0;li<lanes.length;li++){for(var i=0;i<N;i++){items.push({side:s,lane:li,phase:(i/N)+li*0.5/N});}}}
    return function(ctx,w,h,t){
      var VPx=w*0.5, VPy=h*0.46, speed=0.05, pad=Math.min(w,h)*0.09;
      ctx.strokeStyle=C.grid; ctx.lineWidth=1; ctx.beginPath();
      [[0,h],[w,h],[0,0],[w,0]].forEach(function(c){ctx.moveTo(c[0],c[1]);ctx.lineTo(VPx,VPy);});
      ctx.stroke();
      ctx.font=MONO; ctx.textBaseline='alphabetic';
      var draws=items.map(function(it){return {it:it,tt:((t*speed)+it.phase)%1};}).sort(function(a,b){return a.tt-b.tt;});
      draws.forEach(function(d){
        var it=d.it, tt=d.tt, ease=tt*tt;
        var wallEdge=VPx+it.side*(w*0.52)*ease;
        var yC=VPy+(lanes[it.lane]*h-VPy)*ease;
        var scale=0.12+ease*0.9, bw=w*0.11*scale+2, bh=h*0.26*scale+2;
        var bx=it.side<0?wallEdge:wallEdge-bw, by=yC-bh;
        ctx.globalAlpha=Math.min(1,tt/0.08);
        ctx.strokeStyle=C.line; ctx.lineWidth=1; ctx.strokeRect(bx,by,bw,bh);
        if(tt>0.5){ctx.strokeStyle=C.teal;ctx.lineWidth=1.4;ctx.strokeRect(bx+1,by+1,bw-2,bh-2);
          if(tt>0.62 && bw>26){ctx.fillStyle='rgba(47,201,184,.9)';ctx.fillText('SKU',bx+3,by-3);}}
        ctx.globalAlpha=1;
      });
      var rx=VPx, ry=h*0.6;
      ctx.strokeStyle=C.acc; ctx.lineWidth=1.4; ctx.beginPath();
      ctx.moveTo(rx-15,ry);ctx.lineTo(rx-5,ry);ctx.moveTo(rx+5,ry);ctx.lineTo(rx+15,ry);
      ctx.moveTo(rx,ry-15);ctx.lineTo(rx,ry-5);ctx.moveTo(rx,ry+5);ctx.lineTo(rx,ry+15);ctx.stroke();
      var sy=VPy+(h-VPy)*((t*0.3)%1);
      ctx.strokeStyle='rgba(255,106,44,.5)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,sy);ctx.lineTo(w,sy);ctx.stroke();
      ctx.fillStyle=C.txt; ctx.fillText('AISLE 7 · SCANNING', pad*0.6, h-pad*0.6-14);
      ctx.fillStyle=C.acc; ctx.fillText('facings · price check', pad*0.6, h-pad*0.6);
    };
  }

  /* ---------- runner ---------- */
  function mount(el){
    var canvas=el.querySelector('canvas'); if(!canvas) return;
    var ctx=canvas.getContext('2d'); if(!ctx) return;
    var ratio=parseFloat(el.getAttribute('data-ratio'))||1.2;
    var kind=el.getAttribute('data-scene');
    var scene=(kind==='aisle')?aisleScene():shelfScene();
    var dpr=Math.min(2,window.devicePixelRatio||1), cssW=0,cssH=0;
    function resize(){
      var r=el.getBoundingClientRect(); cssW=r.width; cssH=cssW/ratio;
      el.style.height=''; canvas.style.height=cssH+'px';
      canvas.width=Math.round(cssW*dpr); canvas.height=Math.round(cssH*dpr);
    }
    function bg(){
      ctx.setTransform(dpr,0,0,dpr,0,0);
      ctx.fillStyle=C.scr; ctx.fillRect(0,0,cssW,cssH);
      // grid
      ctx.strokeStyle=C.grid; ctx.lineWidth=1; var step=Math.max(26,cssW/16);
      ctx.beginPath();
      for(var x=step;x<cssW;x+=step){ctx.moveTo(x,0);ctx.lineTo(x,cssH);}
      for(var y=step;y<cssH;y+=step){ctx.moveTo(0,y);ctx.lineTo(cssW,y);}
      ctx.stroke();
    }
    function frame(ts){ if(stopped) return; bg(); scene(ctx,cssW,cssH,ts/1000); raf=requestAnimationFrame(frame); }
    var raf=null, stopped=true;
    function start(){ if(!stopped) return; stopped=false; raf=requestAnimationFrame(frame); }
    function stop(){ stopped=true; if(raf) cancelAnimationFrame(raf); }
    try{ new ResizeObserver(function(){resize(); if(stopped){bg();scene(ctx,cssW,cssH,1.2);} }).observe(el); }catch(e){}
    resize();
    if(reduce){ bg(); scene(ctx,cssW,cssH,3.0); return; }
    bg(); scene(ctx,cssW,cssH,0.2);
    if('IntersectionObserver' in window){
      new IntersectionObserver(function(es){es.forEach(function(e){e.isIntersecting?start():stop();});},{threshold:.12}).observe(el);
    } else { start(); }
    document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
  }
  [].forEach.call(document.querySelectorAll('.inst[data-scene]'),mount);

  /* ---------- hero reactive field ---------- */
  (function(){
    var host=document.querySelector('.hero'); if(!host) return;
    var cv=host.querySelector('.herofx'); if(!cv) return;
    var ctx=cv.getContext('2d'); if(!ctx) return;
    var dpr=Math.min(2,window.devicePixelRatio||1);
    var W=0,H=0,gap=0,pts=[];
    var mx=-999,my=-999,tx=-999,ty=-999,active=0,ta=0,raf=null,stopped=true;
    function build(){
      var r=host.getBoundingClientRect(); W=r.width; H=r.height;
      cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr);
      cv.style.width=W+'px'; cv.style.height=H+'px';
      gap=Math.max(34,Math.min(50,W/30));
      var cols=Math.ceil(W/gap)+1, rows=Math.ceil(H/gap)+1; pts=[];
      for(var j=0;j<rows;j++)for(var i=0;i<cols;i++){pts.push({x:i*gap,y:j*gap,ph:i*0.6+j*0.9});}
    }
    function draw(ts){
      if(stopped) return;
      ctx.setTransform(dpr,0,0,dpr,0,0); ctx.clearRect(0,0,W,H);
      tx+=(mx-tx)*0.09; ty+=(my-ty)*0.09; ta+=(active-ta)*0.06;
      var t=ts/1000, R=Math.min(220,Math.max(150,W*0.14)), R2=R*R, near=[];
      if(ta>0.01){
        var g=ctx.createRadialGradient(tx,ty,0,tx,ty,R*1.1);
        g.addColorStop(0,'rgba(47,201,184,'+(0.13*ta)+')'); g.addColorStop(1,'rgba(47,201,184,0)');
        ctx.fillStyle=g; ctx.beginPath(); ctx.arc(tx,ty,R*1.1,0,6.283); ctx.fill();
      }
      for(var k=0;k<pts.length;k++){
        var p=pts[k];
        var px=p.x+Math.cos(t*0.5+p.ph)*1.5, py=p.y+Math.sin(t*0.45+p.ph)*1.5, rad=0.9, a=0.09;
        var dx=px-tx, dy=py-ty, d2=dx*dx+dy*dy;
        if(ta>0.01 && d2<R2){
          var dist=Math.sqrt(d2)||1, f=1-dist/R, m=f*ta;
          px+=dx/dist*m*9; py+=dy/dist*m*9; rad=0.9+f*2.3*ta; a=0.09+f*0.6*ta;
          near.push([px,py,f]);
        }
        ctx.beginPath(); ctx.fillStyle='rgba(155,192,206,'+a+')'; ctx.arc(px,py,rad,0,6.283); ctx.fill();
      }
      var lim=gap*gap*2.2;
      for(var u=0;u<near.length;u++)for(var v=u+1;v<near.length;v++){
        var ax=near[u][0],ay=near[u][1],bx=near[v][0],by=near[v][1],ddx=ax-bx,ddy=ay-by,dd=ddx*ddx+ddy*ddy;
        if(dd<lim){var la=(1-Math.sqrt(dd)/(gap*1.5))*0.45*ta*Math.min(near[u][2],near[v][2]);
          if(la>0.02){ctx.strokeStyle='rgba(47,201,184,'+la+')';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.stroke();}}
      }
      if(ta>0.02){ctx.strokeStyle='rgba(255,106,44,'+(0.5*ta)+')';ctx.lineWidth=1.2;ctx.beginPath();ctx.arc(tx,ty,7+Math.sin(t*3)*1.6,0,6.283);ctx.stroke();}
      raf=requestAnimationFrame(draw);
    }
    function staticDraw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);for(var k=0;k<pts.length;k++){ctx.beginPath();ctx.fillStyle='rgba(155,192,206,.09)';ctx.arc(pts[k].x,pts[k].y,0.9,0,6.283);ctx.fill();}}
    function start(){if(!stopped)return;stopped=false;raf=requestAnimationFrame(draw);}
    function stop(){stopped=true;if(raf)cancelAnimationFrame(raf);}
    host.addEventListener('pointermove',function(e){var r=host.getBoundingClientRect();mx=e.clientX-r.left;my=e.clientY-r.top;active=1;if(tx<-900){tx=mx;ty=my;}},{passive:true});
    host.addEventListener('pointerleave',function(){active=0;});
    try{new ResizeObserver(function(){build();if(stopped)staticDraw();}).observe(host);}catch(e){build();}
    build();
    if(reduce){staticDraw();return;}
    if('IntersectionObserver' in window){new IntersectionObserver(function(es){es.forEach(function(e){e.isIntersecting?start():stop();});},{threshold:.02}).observe(host);}else{start();}
    document.addEventListener('visibilitychange',function(){document.hidden?stop():start();});
  })();

  /* ---------- video timecodes + autoplay ---------- */
  function fmt(s){s=Math.floor(s||0);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0');}
  var vids=[].slice.call(document.querySelectorAll('video[data-clip]'));
  vids.forEach(function(v){var tc=v.parentNode.querySelector('.tc');
    function u(){if(tc)tc.textContent=fmt(v.currentTime)+' / '+fmt(v.duration);}
    v.addEventListener('timeupdate',u);v.addEventListener('loadedmetadata',u); if(reduce)v.setAttribute('controls','');});
  if('IntersectionObserver' in window && !reduce){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting){var p=v.play();if(p&&p.catch)p.catch(function(){});}else v.pause();});},{threshold:.25});
    vids.forEach(function(v){io.observe(v);});
  }
  var bgvs=[].slice.call(document.querySelectorAll('video[data-bg]'));
  if('IntersectionObserver' in window){
    var io2=new IntersectionObserver(function(es){es.forEach(function(e){var v=e.target;if(e.isIntersecting&&!reduce){var p=v.play();if(p&&p.catch)p.catch(function(){});}else v.pause();});},{threshold:.05});
    bgvs.forEach(function(v){io2.observe(v);});
  }
  [].forEach.call(document.querySelectorAll('.photostrip img'),function(im){im.addEventListener('error',function(){im.style.display='none';});});

  /* ---------- contact form ---------- */
  var cform=document.getElementById('cform');
  if(cform){
    var cstatus=document.getElementById('c-status'), csend=document.getElementById('c-send');
    function gv(id){var e=document.getElementById(id);return (e&&e.value||'').trim();}
    function mailtoFallback(p){
      var subj='Inquiry from '+(p.name||p.email)+(p.company?' ('+p.company+')':'');
      var body='Name: '+p.name+'\nEmail: '+p.email+'\nCompany: '+p.company+'\nAbout: '+(p.kind||'')+'\n\n'+p.problem;
      window.location.href='mailto:tim@fizzion.ai?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
      cform.reset();cstatus.className='status ok';cstatus.textContent='Opening your email to send this to Tim. Just hit send.';
    }
    cform.addEventListener('submit',function(e){
      e.preventDefault();
      var payload={name:gv('c-name'),email:gv('c-email'),company:gv('c-company'),kind:gv('c-kind'),problem:gv('c-problem'),company_hp:gv('c-hp')};
      cstatus.className='status';
      if(!payload.email||!payload.problem){cstatus.className='status err';cstatus.textContent='Add your email and a line on what you need so Tim can reply.';return;}
      var label=csend.textContent; csend.disabled=true; csend.textContent='Sending...'; cstatus.textContent='';
      fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
        .then(function(r){return r.json().catch(function(){return {ok:r.ok};});})
        .then(function(d){
          if(d&&d.ok){cform.reset();cstatus.className='status ok';cstatus.textContent='Got it. Tim will get back to you.';}
          else{mailtoFallback(payload);}
        })
        .catch(function(){mailtoFallback(payload);})
        .finally(function(){csend.disabled=false;csend.textContent=label;});
    });
  }
})();

/* ---------- universal phone-trail cursor ---------- */
(function(){
  var fine=false,red=false;
  try{fine=matchMedia('(pointer:fine)').matches;red=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  if(!fine||red) return;
  var cv=document.createElement('canvas'); cv.id='cursorfx'; cv.setAttribute('aria-hidden','true');
  document.body.appendChild(cv);
  var ctx=cv.getContext('2d'); if(!ctx) return;
  document.documentElement.classList.add('cursorfx-on');
  var dpr=Math.min(2,window.devicePixelRatio||1),W=0,H=0;
  function resize(){W=window.innerWidth;H=window.innerHeight;cv.width=Math.round(W*dpr);cv.height=Math.round(H*dpr);cv.style.width=W+'px';cv.style.height=H+'px';}
  resize(); window.addEventListener('resize',resize);
  var mx=W/2,my=H/2,N=9,nodes=[];
  for(var i=0;i<N;i++)nodes.push({x:mx,y:my,ph:i*0.7});
  var mode='idle',ctaT=0,camT=0,aT=1,raf=null,stopped=false;
  function set(e){
    mx=e.clientX;my=e.clientY;var t=e.target,c='idle';
    if(t&&t.closest){c=t.closest('.btn')?'cta':(t.closest('a,button,[role=button]')?'link':(t.closest('input,textarea,select')?'text':'idle'));}
    mode=c;
  }
  window.addEventListener('pointermove',set,{passive:true});
  window.addEventListener('pointerdown',set,{passive:true});
  document.addEventListener('mouseleave',function(){mode='idle';});
  function L(a,b,t){return a+(b-a)*t;}
  function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();}
  function phone(x,y,s,ang,col,a){
    ctx.save();ctx.translate(x,y);ctx.rotate(ang);
    var w=s*0.58,h=s,r=s*0.18;
    ctx.lineWidth=Math.max(1,s*0.08);ctx.strokeStyle='rgba('+col.r+','+col.g+','+col.b+','+a+')';
    rr(-w/2,-h/2,w,h,r);ctx.stroke();
    ctx.fillStyle='rgba('+col.r+','+col.g+','+col.b+','+a+')';
    ctx.beginPath();ctx.arc(0,-h/2+s*0.15,s*0.055,0,6.283);ctx.fill();
    ctx.restore();
  }
  function camera(x,y,s,col,a){
    ctx.save();ctx.translate(x,y);ctx.lineWidth=Math.max(1.5,s*0.07);
    ctx.strokeStyle='rgba('+col.r+','+col.g+','+col.b+','+a+')';
    var w=s*1.5,h=s*1.05,r=s*0.18;
    rr(-w/2,-h/2+s*0.12,w,h,r);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-s*0.26,-h/2+s*0.12);ctx.lineTo(-s*0.14,-h/2-s*0.04);ctx.lineTo(s*0.14,-h/2-s*0.04);ctx.lineTo(s*0.26,-h/2+s*0.12);ctx.stroke();
    ctx.beginPath();ctx.arc(0,s*0.1,s*0.34,0,6.283);ctx.stroke();
    ctx.beginPath();ctx.arc(0,s*0.1,s*0.17,0,6.283);ctx.stroke();
    ctx.restore();
  }
  function frame(ts){
    if(stopped){raf=requestAnimationFrame(frame);return;}
    ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,W,H);
    ctaT=L(ctaT,mode==='cta'?1:0,0.14);camT=L(camT,mode==='link'?1:0,0.14);
    aT=L(aT,mode==='text'?0.1:1,0.2);
    nodes[0].x=L(nodes[0].x,mx,0.5);nodes[0].y=L(nodes[0].y,my,0.5);
    for(var i=1;i<N;i++){nodes[i].x=L(nodes[i].x,nodes[i-1].x,0.42);nodes[i].y=L(nodes[i].y,nodes[i-1].y,0.42);}
    var base={r:120,g:138,b:150},neon={r:57,g:255,b:20},teal={r:47,g:201,b:184};
    function mix(a,b,t){return{r:a.r+(b.r-a.r)*t,g:a.g+(b.g-a.g)*t,b:a.b+(b.b-a.b)*t};}
    var col=mix(base,neon,ctaT);col=mix(col,teal,camT*(1-ctaT));
    var t=ts/1000,i;
    for(i=N-1;i>=1;i--){
      var n=nodes[i],pm=nodes[i-1];
      var ang=Math.atan2(n.y-pm.y,n.x-pm.x)+Math.PI/2;
      var f=1-i/N, s=(9+f*9)*(1+ctaT*0.7), wob=Math.sin(t*3+n.ph)*(1.5+ctaT*5);
      phone(n.x+Math.cos(ang)*wob,n.y+Math.sin(ang)*wob,s,ang,col,(0.12+f*0.45)*aT*(1-camT*0.7));
    }
    var a0=Math.atan2(nodes[0].y-nodes[1].y,nodes[0].x-nodes[1].x)+Math.PI/2;
    if(camT>0.03){
      camera(mx,my,11+camT*9,teal,(0.55+0.45*camT)*aT);
      ctx.strokeStyle='rgba(47,201,184,'+(0.45*camT*aT)+')';ctx.lineWidth=1.4;
      ctx.beginPath();ctx.arc(mx,my,16+camT*16+Math.sin(t*4)*2.5*camT,0,6.283);ctx.stroke();
    }else{
      phone(mx,my,19*(1+ctaT*0.85),a0,col,0.92*aT);
      if(ctaT>0.03){ctx.strokeStyle='rgba(57,255,20,'+(0.5*ctaT*aT)+')';ctx.lineWidth=1.6;
        ctx.beginPath();ctx.arc(mx,my,17+ctaT*13+Math.sin(t*5)*3,0,6.283);ctx.stroke();}
    }
    raf=requestAnimationFrame(frame);
  }
  document.addEventListener('visibilitychange',function(){stopped=document.hidden;});
  raf=requestAnimationFrame(frame);
})();

/* ---------- nav scroll highlight ---------- */
(function(){
  var links=[].slice.call(document.querySelectorAll('nav a.link'));
  if(!links.length||!('IntersectionObserver' in window)) return;
  var map={},ids=[];
  links.forEach(function(a){var h=a.getAttribute('href')||'';if(h.charAt(0)==='#'&&h.length>1){map[h.slice(1)]=a;ids.push(h.slice(1));}});
  var vis={};
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){vis[e.target.id]=e.isIntersecting?e.intersectionRatio:0;});
    var best=null,br=0;
    ids.forEach(function(id){var r=vis[id]||0;if(r>br){br=r;best=id;}});
    links.forEach(function(a){a.classList.remove('active');});
    if(best&&map[best])map[best].classList.add('active');
  },{threshold:[0.12,0.3,0.55],rootMargin:'-64px 0px -42% 0px'});
  ids.forEach(function(id){var el=document.getElementById(id);if(el)io.observe(el);});
})();

/* ---------- fade-up reveal on scroll ---------- */
(function(){
  if(!('IntersectionObserver' in window)) return;
  var reduce=false; try{reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){}
  if(reduce) return;
  // each entry: a selector for a group whose members reveal together, staggered in DOM order
  var groups=[
    '.band.shoppers .fieldrow',
    '.intro .lede, .intro .industries',
    '.home-cards .pcard',
    '#merchandise .lane',
    '.band.outcome .lane',
    '#robotics .feature-txt',
    '#robotics .samples .clip',
    '#robotics .spec',
    '.photostrip figure',
    '#process h2',
    '#process .steps li',
    '.xlink',
    '#contact h2, #contact .lede',
    '#contact .cform',
    'footer > div',
    'footer .credit'
  ];
  var vh=window.innerHeight||document.documentElement.clientHeight;
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
  },{threshold:0.15,rootMargin:'0px 0px -8% 0px'});
  groups.forEach(function(sel){
    var els=[].slice.call(document.querySelectorAll(sel));
    var i=0;
    els.forEach(function(el){
      // leave anything already on screen at load fully visible (no flash)
      var r=el.getBoundingClientRect();
      if(r.top < vh*0.9){ return; }
      el.classList.add('reveal');
      var rd=(i%3)+1; if(els.length>1){ el.setAttribute('data-rd',String(rd)); }
      i++;
      io.observe(el);
    });
  });
})();

/* ---------- dataset spec wizard ---------- */
(function(){
  var wiz=document.getElementById('wiz'); if(!wiz) return;
  var track=document.getElementById('wizTrack'),panel=document.getElementById('wizPanel'),foot=document.getElementById('wizFoot');
  if(!track||!panel||!foot) return;
  var book=wiz.getAttribute('data-book')||'#';
  var steps=[
    {k:'Region',opts:['United States','Latin America','Western Europe','Eastern Europe','India','Southeast Asia','Open / Still deciding']},
    {k:'Environment',opts:['Warehouse & 3PL','Manufacturing','Assembly','Retail floor','Household','Expert trades','Open / Still deciding']},
    {k:'Modality',opts:['Egocentric','Stereo egocentric','Exocentric','Teleoperation','Hand tracking','Depth & LiDAR','Tactile','Open / Still deciding']}
  ];
  var sel=[null,null,null],cur=0;
  function done(){return sel[0]&&sel[1]&&sel[2];}
  function renderTrack(){
    track.innerHTML='';
    steps.forEach(function(s,i){
      var b=document.createElement('button');b.type='button';
      b.className='wiz-chip'+(i===cur&&!done()?' cur':'')+(sel[i]?' done':'');
      b.innerHTML='<span class="wk">'+s.k+'</span><span class="wv"></span>';
      b.querySelector('.wv').textContent=sel[i]||'—';
      b.addEventListener('click',function(){cur=i;render();});
      track.appendChild(b);
    });
  }
  function renderPanel(){
    panel.innerHTML='';
    if(done()) return;
    var lbl=document.createElement('div');lbl.className='wiz-steplabel';lbl.textContent='Step '+(cur+1)+' of 3 · '+steps[cur].k;
    panel.appendChild(lbl);
    var g=document.createElement('div');g.className='wiz-opts';
    steps[cur].opts.forEach(function(o){
      var btn=document.createElement('button');btn.type='button';btn.className='spec-opt';btn.textContent=o;
      btn.addEventListener('click',function(){
        sel[cur]=o;
        var next=-1;for(var j=0;j<3;j++){if(!sel[j]){next=j;break;}}
        cur=next<0?0:next; render();
      });
      g.appendChild(btn);
    });
    panel.appendChild(g);
  }
  function specText(){return 'Region: '+sel[0]+'  ·  Environment: '+sel[1]+'  ·  Modality: '+sel[2];}
  function mailtoUrl(){
    var subj='Dataset spec: '+sel[0]+' / '+sel[1]+' / '+sel[2];
    var body='My dataset spec for a Fizzion collection:\n\n'+specText()+'\n\n(Sent from the spec builder on physicaldataintelligence / sawtoothindustries.dev. Booking a call as well.)';
    return 'mailto:tim@fizzion.ai?subject='+encodeURIComponent(subj)+'&body='+encodeURIComponent(body);
  }
  function postSpec(email){
    var payload={name:'Dataset spec ('+sel[0]+')',email:email,company:'',kind:'Robot training data',problem:specText(),company_hp:''};
    return fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)})
      .then(function(r){return r.json().catch(function(){return {ok:r.ok};});})
      .then(function(d){return !!(d&&d.ok);})
      .catch(function(){return false;});
  }
  function renderFoot(){
    foot.innerHTML='';
    if(!done()) return;
    var sum=document.createElement('div');sum.className='sum';
    sum.innerHTML='Your spec: <b></b> · <b></b> · <b></b>';
    var bs=sum.querySelectorAll('b'); bs[0].textContent=sel[0]; bs[1].textContent=sel[1]; bs[2].textContent=sel[2];
    foot.appendChild(sum);
    var row=document.createElement('div');row.className='wiz-send';
    var inp=document.createElement('input');inp.type='email';inp.className='wiz-email';inp.placeholder='Your email';inp.autocomplete='email';inp.setAttribute('aria-label','Your email');
    var go=document.createElement('button');go.type='button';go.className='btn';go.textContent='Send spec & book a call';
    var cp=document.createElement('button');cp.type='button';cp.className='btn ghost';cp.textContent='Copy spec';
    cp.addEventListener('click',function(){try{navigator.clipboard.writeText(specText());cp.textContent='Copied';setTimeout(function(){cp.textContent='Copy spec';},1500);}catch(e){}});
    row.appendChild(inp);row.appendChild(go);row.appendChild(cp);
    foot.appendChild(row);
    var note=document.createElement('p');note.className='wiz-note';note.textContent='Send Tim your spec, then pick a time. He’ll have it ready before the call.';
    foot.appendChild(note);
    go.addEventListener('click',function(){
      var email=(inp.value||'').trim();
      if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)){note.textContent='Add your email so Tim can match your spec to the booking.';inp.focus();return;}
      try{window.open(book,'_blank','noopener');}catch(e){}
      go.disabled=true;go.textContent='Sending…';
      postSpec(email).then(function(ok){
        go.disabled=false;
        if(ok){go.textContent='Sent ✓';note.textContent='Sent to Tim, and the calendar opened in a new tab so you can pick a time.';}
        else{go.textContent='Send spec & book a call';note.innerHTML='Could not send automatically. ';
          var a=document.createElement('a');a.href=mailtoUrl();a.textContent='Email it to Tim instead';a.style.textDecoration='underline';note.appendChild(a);}
      });
    });
  }
  function render(){renderTrack();renderPanel();renderFoot();}
  render();
})();

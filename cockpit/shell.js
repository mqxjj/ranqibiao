/* ============================================================
   shell.js · 二级页面共享：导航注入 / 时钟 / 激活态 / 图表工具
   子代理每页引入：<script src="shell.js"></script>
   ============================================================ */

// ====== 导航配置（13 项，全项目唯一，禁止页面重写） ======
const NAV=[
  {key:'cockpit',label:'领导驾驶舱',href:'index.html',icon:'M3 12l9-9 9 9M5 10v10h5v-6h4v6h5V10'},
  {key:'overview',label:'燃气概况一张图',href:'overview.html',icon:'M9 20l-5.5-2.5L9 15l5.5 2.5L9 20zm0-5L3.5 12.5 9 10l5.5 2.5L9 15zM9 5L3.5 7.5 9 10l5.5-2.5L9 5z M15 20l-5.5-2.5L15 15l5.5 2.5L15 20z'},
  {key:'basic',label:'基础信息管理',href:'basic.html',icon:'M4 5h16M4 5v14a1 1 0 001 1h14a1 1 0 001-1V5M4 5l1-2h14l1 2M9 9h6'},
  {key:'risk',label:'风险评估',href:'risk.html',icon:'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z M12 8v4M12 16h.01'},
  {key:'hidden',label:'隐患管理',href:'hidden.html',icon:'M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6l8-4z M8 12h8'},
  {key:'monitor',label:'运行监测',href:'monitor.html',icon:'M3 12h4l3-9 4 18 3-9h4'},
  {key:'warning',label:'预测预警',href:'warning.html',icon:'M12 2v4M12 18v4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M2 12h4M18 12h4M4.2 19.8l2.8-2.8M17 7l2.8-2.8M9 16l3-3 3 3'},
  {key:'leak',label:'泄漏研判',href:'leak.html',icon:'M12 2c-3 4-6 7-6 11a6 6 0 0012 0c0-4-3-7-6-11z'},
  {key:'emergency',label:'应急处置',href:'emergency.html',icon:'M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z M13 3v8h6'},
  {key:'inspect',label:'巡查巡检',href:'inspect.html',icon:'M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11'},
  {key:'assess',label:'考核评价',href:'assess.html',icon:'M12 2l3 6 6 .9-4.5 4.4 1 6.7L12 16l-5.5 3 1-6.7L3 8.9 9 8z'},
  {key:'complaint',label:'投诉处置',href:'complaint.html',icon:'M21 11.5a8.5 8.5 0 01-12.5 7.5L3 21l2-5.5A8.5 8.5 0 1121 11.5z'},
  {key:'auxiliary',label:'辅助管理',href:'auxiliary.html',icon:'M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z'},
];
// 警情/隐患徽标计数（驾驶舱侧栏红点）
const NAV_BADGE={monitor:3,warning:2,hidden:5};

function svgIcon(d,w=16,h=16){return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" width="${w}" height="${h}"><path d="${d}"/></svg>`}

// ====== 注入侧栏导航（同步、幂等） ======
function injectNav(){
  const nav=document.getElementById('nav');
  if(!nav) return;
  const page=document.body.dataset.page||'';
  nav.innerHTML=`<div class="grp">监管应用</div>`+NAV.map(it=>{
    const b=NAV_BADGE[it.key];
    return `<a href="${it.href}" data-nav="${it.key}" class="${it.key===page?'active':''}">${svgIcon(it.icon)}<span>${it.label}</span>${b?`<span class="badge">${b}</span>`:''}</a>`;
  }).join('');
}

// ====== 时钟 ======
function pad(n){return n<10?'0'+n:n}
function startClock(){
  const els=document.querySelectorAll('.clk');
  if(!els.length) return;
  const tick=()=>{
    const d=new Date();
    const w=['日','一','二','三','四','五','六'][d.getDay()];
    const s=`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} 星期${w} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    els.forEach(e=>e.textContent=s);
  };
  tick();setInterval(tick,1000);
}

// ====== 抽屉/弹窗 ======
function openDrawer(title,html){
  let m=document.querySelector('.mask'),d=document.querySelector('.drawer');
  if(!m){m=document.createElement('div');m.className='mask';document.body.appendChild(m);m.onclick=closeDrawer}
  if(!d){d=document.createElement('div');d.className='drawer';document.body.appendChild(d)}
  d.innerHTML=`<div class="dh"><span class="tt">${title}</span><span class="x" onclick="closeDrawer()">×</span></div><div class="db">${html}</div>`;
  requestAnimationFrame(()=>{m.classList.add('on');d.classList.add('on')});
}
function closeDrawer(){
  const m=document.querySelector('.mask'),d=document.querySelector('.drawer');
  if(d)d.classList.remove('on'); if(m)m.classList.remove('on');
}

// ====== 图表绘制（纯 Canvas，无依赖） ======
function lineChart(canvas,data,opt={}){
  const ctx=canvas.getContext('2d');
  const dpr=window.devicePixelRatio||1;
  const W=canvas.clientWidth,H=canvas.clientHeight;
  canvas.width=W*dpr;canvas.height=H*dpr;ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  const pad=6,max=Math.max(...data)*1.15,min=Math.min(...data)*0.9;
  const x=i=>pad+i*(W-2*pad)/(data.length-1);
  const y=v=>H-pad-(v-min)/(max-min)*(H-2*pad);
  // 网格
  ctx.strokeStyle='rgba(34,211,238,.08)';ctx.lineWidth=1;
  for(let i=1;i<4;i++){ctx.beginPath();ctx.moveTo(0,H*i/4);ctx.lineTo(W,H*i/4);ctx.stroke()}
  // 渐变填充
  const g=ctx.createLinearGradient(0,0,0,H);
  g.addColorStop(0,'rgba(34,211,238,.35)');g.addColorStop(1,'rgba(34,211,238,0)');
  ctx.beginPath();ctx.moveTo(x(0),y(data[0]));
  data.forEach((v,i)=>i&&ctx.lineTo(x(i),y(v)));
  ctx.lineTo(x(data.length-1),H-pad);ctx.lineTo(x(0),H-pad);ctx.closePath();
  ctx.fillStyle=g;ctx.fill();
  // 线
  ctx.beginPath();ctx.moveTo(x(0),y(data[0]));
  data.forEach((v,i)=>i&&ctx.lineTo(x(i),y(v)));
  ctx.strokeStyle=opt.color||'#22D3EE';ctx.lineWidth=2;ctx.shadowColor=opt.color||'#22D3EE';ctx.shadowBlur=6;
  ctx.stroke();ctx.shadowBlur=0;
  // 点
  ctx.fillStyle='#E6F1FF';
  data.forEach((v,i)=>{ctx.beginPath();ctx.arc(x(i),y(v),2.5,0,7);ctx.fill()});
}
function barChart(canvas,data,labels,opt={}){
  const ctx=canvas.getContext('2d');const dpr=window.devicePixelRatio||1;
  const W=canvas.clientWidth,H=canvas.clientHeight;
  canvas.width=W*dpr;canvas.height=H*dpr;ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  const pad=10,max=Math.max(...data)*1.15;
  const bw=(W-2*pad)/data.length*0.55;
  const x=i=>pad+i*(W-2*pad)/data.length+( (W-2*pad)/data.length-bw)/2;
  const y=v=>H-pad-6-(v/max)*(H-2*pad-6);
  data.forEach((v,i)=>{
    const g=ctx.createLinearGradient(0,y(v),0,H-pad);
    g.addColorStop(0,opt.color||'#22D3EE');g.addColorStop(1,'rgba(124,58,237,.3)');
    ctx.fillStyle=g;ctx.shadowColor=opt.color||'#22D3EE';ctx.shadowBlur=6;
    ctx.fillRect(x(i),y(v),bw,H-pad-y(v));ctx.shadowBlur=0;
  });
  if(labels){ctx.fillStyle='#8FA8C8';ctx.font='11px sans-serif';ctx.textAlign='center';
    labels.forEach((l,i)=>ctx.fillText(l,x(i)+bw/2,H-2))}
}
function donut(canvas,segs){ // [{v,color}]
  const ctx=canvas.getContext('2d');const dpr=window.devicePixelRatio||1;
  const W=canvas.clientWidth,H=canvas.clientHeight;
  canvas.width=W*dpr;canvas.height=H*dpr;ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  const cx=W/2,cy=H/2,R=Math.min(W,H)/2-6,r=R*0.62;
  const tot=segs.reduce((s,x)=>s+x.v,0);let a=-Math.PI/2;
  segs.forEach(s=>{
    const e=a+s.v/tot*Math.PI*2;
    ctx.beginPath();ctx.arc(cx,cy,R,a,e);ctx.arc(cx,cy,r,e,a,true);
    ctx.closePath();ctx.fillStyle=s.color;ctx.shadowColor=s.color;ctx.shadowBlur=8;ctx.fill();ctx.shadowBlur=0;
    a=e;
  });
}
function spark(canvas,data,color='#22D3EE'){
  const ctx=canvas.getContext('2d');const dpr=window.devicePixelRatio||1;
  const W=canvas.clientWidth,H=canvas.clientHeight;
  canvas.width=W*dpr;canvas.height=H*dpr;ctx.scale(dpr,dpr);
  ctx.clearRect(0,0,W,H);
  const max=Math.max(...data),min=Math.min(...data);
  const x=i=>i*W/(data.length-1),y=v=>H-(v-min)/(max-min+0.001)*H;
  ctx.beginPath();ctx.moveTo(x(0),y(data[0]));
  data.forEach((v,i)=>i&&ctx.lineTo(x(i),y(v)));
  ctx.strokeStyle=color;ctx.lineWidth=1.5;ctx.shadowColor=color;ctx.shadowBlur=4;ctx.stroke();ctx.shadowBlur=0;
}

// ====== 通用渲染助手 ======
const LVLCLS={红:'red',橙:'org',黄:'yel',蓝:'blu'};
const TAGCLS={红:'danger',橙:'warn',黄:'warn',蓝:'info'};
function lvlTag(l){const c=LVLCLS[l]||'blu';return `<span class="lvl ${c}"><i></i>${l}</span>`}
function tag(t,l){const c=TAGCLS[l]||'info';return `<span class="tag ${c}">${t}</span>`}
function trendWord(t){const up=t>0;const cls=up?'up':'down';const a=Math.abs(t);return `<span class="trend ${cls}">${up?'▲':'▼'} ${a}%</span>`}

// 揭幕动效
function revealAll(){
  document.querySelectorAll('[data-r]').forEach(el=>{
    el.classList.add('reveal');
    el.style.animationDelay=(parseInt(el.dataset.r)||0)+'ms';
  });
}

// 启动
document.addEventListener('DOMContentLoaded',()=>{injectNav();startClock();revealAll()});

/* ============================================================
   map.js · 共享 Leaflet 真实地图模块（科技深空风格）
   使用：每个页面 <script src="map.js"></script> 后调用
       initGasMap(containerId, { showLayers?: {...}, theme?: 'pipe'|'risk'|'emergency' })
   依赖：Leaflet 1.9.4（CSS + JS），需在HTML head中引入
   ============================================================ */

// 管网连接（对应 DB.stations 的索引对）
const PIPE_PAIRS=[[0,1],[1,2],[1,3],[2,10],[2,11],[3,4],[5,6],[5,7],[7,8],[8,9],[0,7],[3,5]];

// 警情映射到场站索引（与驾驶舱保持一致）
const ALARM_STATION_IDX=[0,5,6];

// 全局单例：避免同一页面重复初始化
const MAP_SINGLETON={};

/* ---------- 主题色（CSS变量风格，纯JS可直接用） ---------- */
const PALETTE={
  pipeLine1:'#22D3EE',
  pipeLine2:'#7C3AED',
  station:'#22D3EE',
  stationWarn:'#FBBF24',
  alarm:'#FF4D5E',
  hazard:'#FB923C',
  protection:'#22C55E',
  fillBase:'rgba(34,211,238,.15)',
  fillAlarm:'rgba(255,77,94,.18)',
  fillHazard:'rgba(251,146,60,.20)',
  fillProtect:'rgba(34,197,94,.18)',
};

/* ============================================================
   initGasMap(containerId, opts)
   @param containerId 挂载DOM的id，如 "leafMap"
   @param opts.showLayers 默认勾选的图层
   @param opts.theme 一张图主题（pipe/risk/emergency）会自动推荐默认图层
   @returns {map,layers:{pipe,station,alarm,hazard,protect},redraw,onToggle}
   ============================================================ */
function initGasMap(containerId,opts={}){
  const el=document.getElementById(containerId);
  if(!el){console.warn('[GasMap] container #'+containerId+' not found');return null}
  // 单例保护
  if(MAP_SINGLETON[containerId])return MAP_SINGLETON[containerId];

  /* ---------- 默认图层 ---------- */
  const defaults={pipe:true,station:true,alarm:true,hazard:false,protect:false};
  if(opts.theme==='risk'){Object.assign(defaults,{hazard:true,protect:true})}
  if(opts.theme==='emergency'){Object.assign(defaults,{alarm:true,hazard:true,protect:true})}
  const showLayers=Object.assign({},defaults,opts.showLayers||{});

  /* ---------- Leaflet 实例 ---------- */
  if(typeof L==='undefined'){
    el.innerHTML=`<div style="padding:20px;color:#FBBF24;font-size:13px">
      ⚠ 无法加载 Leaflet 地图SDK，请检查网络。<br>
      需要访问 unpkg.com 以加载地图瓦片资源。</div>`;
    return null;
  }
  const map=L.map(containerId,{
    center:DB.geo.center,
    zoom:DB.geo.zoom,
    minZoom:7,
    maxZoom:18,
    zoomControl:true,
    attributionControl:false,
    preferCanvas:true,
  });

  // ====== 高清卫星影像底图（Esri World Imagery，覆盖全域含松原区域）======
  // 真实卫星影像 + 深色滤镜，与科技深空风格融合
  const basePane=map.createPane('baseTilePane');
  basePane.style.zIndex=1;
  // --- 瓦片出错隐藏（避免 429 空块漏出 API KEY REQUIRED 水印）---
  const hideBadTile=e=>{try{const i=e.tile;i.style.display='none'}catch(_){}};
  // 主源：Esri World Imagery（高清卫星影像，免费无 key，全球覆盖含松原市全域）
  const tileImg=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{
    maxZoom:18,pane:'baseTilePane',opacity:0.88
  });
  tileImg.on('tileerror',hideBadTile);
  tileImg.addTo(map);
  // 地名/道路标注层（同色系深灰，叠加在卫星影像上）
  const labelPane=map.createPane('baseLabelPane');
  labelPane.style.zIndex=2;labelPane.style.pointerEvents='none';
  const tileLabel=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{
    maxZoom:18,pane:'baseLabelPane',opacity:0.65
  });
  tileLabel.on('tileerror',hideBadTile);
  tileLabel.addTo(map);
  // 出错瓦片统一隐藏 + 深色滤镜兜底（让卫星影像与科技风格融合）
  if(!document.getElementById('_tileFixCss')){
    const s=document.createElement('style');s.id='_tileFixCss';
    s.textContent=`
      .leaflet-container{background:#070F24!important}
      .leaflet-container .leaflet-tile{transition:opacity .3s;background-color:#070F24!important}
      .leaflet-tile-loaded.leaflet-tile-error{display:none!important}
      /* 卫星影像深色滤镜：降低亮度、提升对比、降低饱和，与科技深空风格融合 */
      #baseTilePane .leaflet-tile-loaded:not(.leaflet-tile-error){filter:brightness(0.55) contrast(1.08) saturate(0.82)}
    `;
    document.head.appendChild(s);
  }

  // ====== 炫酷矢量风格底图：吉林省行政轮廓 + 某某市5区县发光边界（参考黑龙江指挥中心风格）======
  loadAdminGeo(map);

  /* ---------- 5 图层组（独立控制开关） ---------- */
  const layers={
    pipe:L.layerGroup(),
    station:L.layerGroup(),
    alarm:L.layerGroup(),
    hazard:L.layerGroup(),
    protect:L.layerGroup(),
  };
  Object.entries(layers).forEach(([k,ly])=>{if(showLayers[k])ly.addTo(map)});

  /* ---------- 1. 管网 Polyline ---------- */
  PIPE_PAIRS.forEach(([a,b])=>{
    const sa=DB.stations[a],sb=DB.stations[b];
    if(!sa||!sb)return;
    const latlngs=[[sa.lat,sa.lng],[sb.lat,sb.lng]];
    L.polyline(latlngs,{
      color:PALETTE.pipeLine1,weight:3,opacity:.85,dashArray:null,lineCap:'round'
    }).addTo(layers.pipe).bindTooltip(`${DB.pipelines[(a+b)%DB.pipelines.length]?.id||'GP-主线路'}`);
  });

  /* ---------- 2. 场站 CircleMarker ---------- */
  DB.stations.forEach((s,i)=>{
    const col=s.status==='关注'?PALETTE.stationWarn:PALETTE.station;
    const outer=L.circleMarker([s.lat,s.lng],{
      radius:10,color:col,fillColor:col,fillOpacity:.15,weight:2
    }).bindTooltip(`<b>${s.name}</b><br>类型：${s.type}<br>压力：${s.press}<br>状态：${s.status}`,{sticky:true});
    outer.on('click',()=>{
      openDrawer(s.name,`<div class="field"><div class="k">编号</div><div class="v mono">${s.id}</div></div>
      <div class="field"><div class="k">类型</div><div class="v">${s.type}</div></div>
      <div class="field"><div class="k">所在区县</div><div class="v">${s.dist}</div></div>
      <div class="field"><div class="k">运行压力</div><div class="v mono">${s.press}</div></div>
      <div class="field"><div class="k">负责人</div><div class="v">${s.head}</div></div>
      <div class="field"><div class="k">运行状态</div><div class="v">${s.status==='正常'?'<span class="t-ok">● 正常</span>':'<span class="t-warn">● 关注</span>'}</div></div>`);
    });
    outer.addTo(layers.station);
    // 中心光点
    L.circleMarker([s.lat,s.lng],{
      radius:3.5,color:col,fillColor:col,fillOpacity:1,weight:0
    }).addTo(layers.station);
    // 标签文字
    L.marker([s.lat,s.lng],{
      icon:L.divIcon({className:'',html:`<div style="color:${col};font-size:14px;font-weight:600;font-family:var(--sans);text-shadow:0 0 6px #000,0 0 3px #000;white-space:nowrap;margin-left:16px;margin-top:-6px">${s.name}</div>`,iconSize:[0,0]}),
      interactive:false
    }).addTo(layers.station);
  });

  /* ---------- 3. 报警点（脉冲效果） ---------- */
  ALARM_STATION_IDX.forEach(i=>{
    const s=DB.stations[i];if(!s)return;
    const latlng=[s.lat,s.lng];
    // 外圈脉冲（CSS动画+SVG Icon实现）
    const pulseIcon=L.divIcon({className:'',
      html:`<div class="alarm-pulse" style="position:relative;width:30px;height:30px;transform:translate(-50%,-50%)">
        <span style="position:absolute;inset:0;border-radius:50%;border:2px solid ${PALETTE.alarm};animation:gas-alarm-ripple 1.8s ease-out infinite"></span>
        <span style="position:absolute;inset:4px;border-radius:50%;border:1.5px solid ${PALETTE.alarm};animation:gas-alarm-ripple 1.8s ease-out infinite .3s"></span>
        <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:8px;height:8px;background:${PALETTE.alarm};border-radius:50%;box-shadow:0 0 8px ${PALETTE.alarm}"></span>
      </div>`,iconSize:[0,0]});
    L.marker(latlng,{icon:pulseIcon,zIndexOffset:1000})
      .bindTooltip(`<b style="color:${PALETTE.alarm}">⚠ 报警</b><br>${DB.alarms[i%DB.alarms.length]?.type||'燃气泄漏'}<br>${DB.alarms[i%DB.alarms.length]?.loc||s.name}`,{sticky:true})
      .addTo(layers.alarm);
  });

  /* ---------- 4. 危险源 Triangle/Icon ---------- */
  DB.hazards.forEach(h=>{
    const col=PALETTE.hazard;
    const ic=L.divIcon({className:'',
      html:`<div style="position:relative;transform:translate(-50%,-50%)">
        <svg width="26" height="26" viewBox="0 0 26 26">
          <polygon points="13,2 24,23 2,23" fill="${col}" opacity=".25" stroke="${col}" stroke-width="2"/>
          <text x="13" y="19" fill="${col}" font-size="13" font-weight="bold" text-anchor="middle">!</text>
        </svg></div>`,iconSize:[0,0]});
    L.marker([h.lat,h.lng],{icon:ic,zIndexOffset:500})
      .bindTooltip(`<b style="color:${col}">⚠ ${h.name}</b><br>类别：${h.type}<br>等级：${h.level}<br>规模：${h.cap}`,{sticky:true})
      .addTo(layers.hazard);
  });

  /* ---------- 5. 防护目标 Shield ---------- */
  DB.protection.forEach(p=>{
    const col=PALETTE.protection;
    const ic=L.divIcon({className:'',
      html:`<div style="position:relative;transform:translate(-50%,-50%)">
        <svg width="22" height="22" viewBox="0 0 22 22">
          <path d="M11 2 L20 6 V11 C20 16 15.5 19.5 11 21 C6.5 19.5 2 16 2 11 V6 Z"
            fill="${col}" opacity=".22" stroke="${col}" stroke-width="1.8"/>
          <path d="M11 6 L11 17 M7 10 L15 10" stroke="${col}" stroke-width="2" stroke-linecap="round"/>
        </svg></div>`,iconSize:[0,0]});
    L.marker([p.lat,p.lng],{icon:ic,zIndexOffset:200})
      .bindTooltip(`<b style="color:${col}">🛡 ${p.name}</b><br>类型：${p.type}<br>涉及人员：${fmt(p.people)}人<br>区域：${p.dist}`,{sticky:true})
      .addTo(layers.protect);
  });

  /* ---------- 注入报警脉冲 CSS（仅一次） ---------- */
  if(!document.getElementById('_gasMapCss')){
    const s=document.createElement('style');
    s.id='_gasMapCss';
    s.textContent=`@keyframes gas-alarm-ripple{0%{transform:scale(.3);opacity:1}70%{transform:scale(2.4);opacity:0}100%{transform:scale(2.4);opacity:0}}`;
    document.head.appendChild(s);
  }

  /* ---------- 图层开关公共API ---------- */
  function toggleLayer(key,on){
    if(!layers[key])return;
    if(on){if(!map.hasLayer(layers[key]))layers[key].addTo(map)}
    else{if(map.hasLayer(layers[key]))map.removeLayer(layers[key])}
  }

  /* ---------- 渲染图层控件（面板HTML） ---------- */
  function renderLayerCtrl(ctrlId){
    const box=document.getElementById(ctrlId);if(!box)return;
    const configs=[
      {k:'pipe',n:'燃气管网',c:PALETTE.pipeLine1,s:'线型'},
      {k:'station',n:'场站设施',c:PALETTE.station,s:'圆点'},
      {k:'alarm',n:'报警点位',c:PALETTE.alarm,s:'脉冲'},
      {k:'hazard',n:'危险源',c:PALETTE.hazard,s:'三角'},
      {k:'protect',n:'防护目标',c:PALETTE.protection,s:'盾牌'},
    ];
    box.innerHTML=`<div class="map-ctrl-inner">
      <div class="mc-title">图层要素</div>
      ${configs.map(c=>`<label class="mc-row">
        <input type="checkbox" data-ly="${c.k}" ${showLayers[c.k]?'checked':''}>
        <i class="mc-ic" style="background:${c.c}"></i>
        <span>${c.n}</span>
      </label>`).join('')}
    </div>`;
    box.querySelectorAll('input[type=checkbox]').forEach(inp=>{
      inp.onchange=()=>toggleLayer(inp.dataset.ly,inp.checked);
    });
  }

  /* ---------- 主题切换 ---------- */
  function setTheme(t){
    const ly={pipe:t==='pipe'||t==='risk'||t==='emergency',
      station:true,
      alarm:t!=='pipe',
      hazard:t==='risk'||t==='emergency',
      protect:t==='risk'||t==='emergency'};
    Object.entries(ly).forEach(([k,v])=>toggleLayer(k,v));
  }

  /* ---------- 全局 fitBounds ---------- */
  function fitAll(){map.fitBounds(DB.geo.bounds,{padding:[20,20]})}

  const api={map,layers,renderLayerCtrl,toggleLayer,setTheme,fitAll,redraw:()=>map.invalidateSize()};
  MAP_SINGLETON[containerId]=api;
  return api;
}

/* ============================================================
   loadAdminGeo(map) · 矢量行政边界渲染（CARTO 深色底图之上叠加）
   · 吉林省行政轮廓线（淡白描边）
   · 某某市下辖5区县（半透明填充 + 发光边界 + 名称注记）
   · 某某市整体市界发光描边
   · 中心高光脉冲标记
   ============================================================ */
async function loadAdminGeo(map){
  try{
    // 1) 拉取 GeoJSON：吉林省外轮廓 + 松原5区县
    const [jlFull, syFull] = await Promise.all([
      fetch('https://geo.datav.aliyun.com/areas_v3/bound/220000_full.json',{cache:'force-cache'}).then(r=>r.json()),
      fetch('https://geo.datav.aliyun.com/areas_v3/bound/220700_full.json',{cache:'force-cache'}).then(r=>r.json())
    ]);

    // 2) 吉林省：淡外轮廓，不填充
    const jlPane=map.createPane('jlPane');jlPane.style.zIndex=3;
    const syAdcodes=new Set(syFull.features.map(f=>String(f.properties.adcode)));
    L.geoJSON(jlFull,{
      pane:'jlPane',
      style:f=>{
        const adc=String(f.properties.adcode);
        if(syAdcodes.has(adc)||adc==='220700')return {fill:false,stroke:false};
        return {
          color:'rgba(200,220,255,.18)',
          weight:0.8,
          opacity:.9,
          fillColor:'rgba(20,40,80,.22)',
          fillOpacity:.6,
          dashArray:'3 5'
        };
      },
      interactive:false
    }).addTo(map);

    // 3) 某某市5区县：渐变发光描边 + 半透明蓝紫填充
    const syPane=map.createPane('syPane');syPane.style.zIndex=4;
    const syNamePane=map.createPane('syNamePane');syNamePane.style.zIndex=7;syNamePane.style.pointerEvents='none';
    const distColors=['#22D3EE','#7C3AED','#38BDF8','#818CF8','#06B6D4'];
    L.geoJSON(syFull,{
      pane:'syPane',
      style:f=>{
        const idx=Math.max(0,syFull.features.indexOf(f))%distColors.length;
        const c=distColors[idx];
        return {
          // 发光效果：粗线低透明度做"外发光"
          color:c,
          weight:2.2,
          opacity:.95,
          fillColor:c,
          fillOpacity:.07,
          lineJoin:'round',
          lineCap:'round'
        };
      },
      onEachFeature(f,l){
        l.on({
          mouseover:e=>{const ll=e.target;ll.bringToFront();ll.setStyle({weight:3.4,fillOpacity:.14,opacity:1})},
          mouseout :e=>{const ll=e.target;const idx=Math.max(0,syFull.features.indexOf(f))%distColors.length;
            ll.setStyle({color:distColors[idx],weight:2.2,fillOpacity:.07,opacity:.95})}
        });
        // 区县名注记
        const name=f.properties.name||f.properties.adcode;
        if(!name)return;
        // 获取几何中心点（bbox 或 centroid）
        let c=f.properties.center||f.properties.centroid;
        if(!c){
          // 简易：bbox 中点（若有）
          if(f.bbox)c=[(f.bbox[0]+f.bbox[2])/2,(f.bbox[1]+f.bbox[3])/2];
          else {try{c=L.geoJSON(f).getBounds().getCenter();c=[c.lng,c.lat]}catch(_){c=DB.geo.center.slice().reverse()}}
        }
        const idx=syFull.features.indexOf(f)%distColors.length;
        const col=distColors[idx];
        L.marker([c[1],c[0]],{
          pane:'syNamePane',
          interactive:false,
          icon:L.divIcon({className:'',
            html:`<div style="transform:translate(-50%,-50%);text-align:center;pointer-events:none">
              <div style="font-size:16px;font-weight:700;color:${col};letter-spacing:2px;
                text-shadow:0 0 8px ${col}, 0 0 3px #000;white-space:nowrap">${name}</div>
              <div style="width:8px;height:8px;border-radius:50%;background:${col};margin:5px auto 0;
                box-shadow:0 0 12px ${col}"></div>
            </div>`,iconSize:[0,0]})
        }).addTo(map);
      }
    }).addTo(map);

    // 4) 某某市外发光描边（整体市界）：2 层叠加营造辉光
    const syOuter=await fetch('https://geo.datav.aliyun.com/areas_v3/bound/220700.json',{cache:'force-cache'}).then(r=>r.json());
    // 外发光
    const syGlowPane=map.createPane('syGlowPane');syGlowPane.style.zIndex=5;
    L.geoJSON(syOuter,{
      pane:'syGlowPane',
      interactive:false,
      style:{color:'#22D3EE',weight:9,opacity:.14,fill:false,lineJoin:'round'}
    }).addTo(map);
    // 主描边
    const syOuterPane=map.createPane('syOuterPane');syOuterPane.style.zIndex=6;
    L.geoJSON(syOuter,{
      pane:'syOuterPane',
      interactive:false,
      style:{color:'#22D3EE',weight:2,opacity:.95,fill:false,
        dashArray:'6 4',lineJoin:'round'}
    }).addTo(map);

    // 5) 中心高光脉冲标记：宁江区中心（DB.geo.center）
    const cIcon=L.divIcon({className:'',
      html:`<div style="position:relative;transform:translate(-50%,-50%);width:60px;height:60px">
        <span style="position:absolute;inset:0;border-radius:50%;border:2px solid #22D3EE;animation:gas-alarm-ripple 2.8s ease-out infinite;opacity:.6"></span>
        <span style="position:absolute;inset:14px;border-radius:50%;border:1.5px solid #7C3AED;animation:gas-alarm-ripple 2.8s ease-out infinite 1s;opacity:.7"></span>
        <span style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:12px;height:12px;border-radius:50%;
          background:linear-gradient(135deg,#22D3EE,#7C3AED);box-shadow:0 0 16px #22D3EE,0 0 28px #7C3AED"></span>
      </div>`,iconSize:[0,0]});
    L.marker(DB.geo.center,{icon:cIcon,interactive:false,pane:'syNamePane'}).addTo(map);
  }catch(err){
    console.warn('[loadAdminGeo] 行政边界渲染降级：', err&&err.message||err);
  }
}
/* ============================================================
   Stage 自适应缩放（解决 1920×1080 大屏在 100% 比例下显示不全）
   用法：HTML结构：<div class="stage-wrap"><div class="stage">...原1920容器...</div></div>
   CSS：styles.css 中 .stage-wrap / .stage
   ============================================================ */
let _stageTimer=null;
function fitStage(){
  const st=document.querySelector('.stage');
  if(!st)return;
  const sx=window.innerWidth/1920;
  const sy=window.innerHeight/1080;
  // Math.max：铺满视口，无两侧空白
  const scale=Math.max(sx,sy);
  st.style.transform=`scale(${scale})`;
  st.style.left=((window.innerWidth-1920*scale)/2/scale)+'px';
  st.style.top='0px';
  st.style.paddingTop='0px';
  // 触发地图重算
  Object.values(MAP_SINGLETON).forEach(g=>{try{setTimeout(()=>g.map&&g.map.invalidateSize(),60)}catch(_){}});
}
function bindStage(){
  window.addEventListener('resize',()=>{clearTimeout(_stageTimer);_stageTimer=setTimeout(fitStage,100)});
  fitStage();
}
document.addEventListener('DOMContentLoaded',()=>{if(document.querySelector('.stage'))bindStage()});

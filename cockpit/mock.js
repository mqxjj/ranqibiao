/* ============================================================
   mock.js · 松原智慧燃气监管 · 共享 Mock 数据（跨页唯一数据源）
   页面只读此处，禁止散落硬编码；签名贴近未来真实 API
   ============================================================ */
// 工具
const delay=(ms=400)=>new Promise(r=>setTimeout(r,ms));
const fmt=(n)=>n.toString().replace(/\B(?=(\d{3})+(?!\d))/g,',');

const DB={
  city:'松原市',
  districts:['宁江区','前郭县','长岭县','乾安县','扶余市'],
  // ====== 顶层 KPI（驾驶舱头部） ======
  kpi:{
    users:{val:428650,u:'户',trend:+3.2,sub:'管道天然气用户'},
    pipe:{val:3847.6,u:'公里',trend:+1.8,sub:'燃气管网总长'},
    stations:{val:186,u:'座',trend:+2,sub:'场站/调压设施'},
    devices:{val:9420,u:'台',trend:+5.6,sub:'物联感知设备'},
    online:{val:9156,u:'台',trend:+0.4,sub:'在线率 97.2%'},
    alarms30:{val:128,u:'起',trend:-12,sub:'近30日报警'},
    hidden:{val:43,u:'项',trend:-8,sub:'未整改隐患'},
    supply:{val:1.86,u:'亿m³',trend:+6.5,sub:'年供气量'},
  },
  // ====== 管网 ======
  pipelines:[
    {id:'GP-001',mat:'PE',dia:'DE160',len:12.4,press:'中压',year:'2018',dist:'宁江区',status:'正常'},
    {id:'GP-002',mat:'PE',dia:'DE110',len:8.7,press:'中压',year:'2017',dist:'宁江区',status:'正常'},
    {id:'GP-003',mat:'钢管',dia:'D219',len:15.2,press:'次高压',year:'2015',dist:'前郭县',status:'正常'},
    {id:'GP-004',mat:'PE',dia:'DE90',len:6.3,press:'低压',year:'2019',dist:'前郭县',status:'正常'},
    {id:'GP-005',mat:'钢管',dia:'D159',len:22.8,press:'次高压',year:'2014',dist:'长岭县',status:'关注'},
    {id:'GP-006',mat:'PE',dia:'DE160',len:9.1,press:'中压',year:'2020',dist:'长岭县',status:'正常'},
    {id:'GP-007',mat:'PE',dia:'DE110',len:5.4,press:'低压',year:'2016',dist:'乾安县',status:'正常'},
    {id:'GP-008',mat:'钢管',dia:'D219',len:18.6,press:'次高压',year:'2013',dist:'乾安县',status:'关注'},
    {id:'GP-009',mat:'PE',dia:'DE160',len:11.3,press:'中压',year:'2019',dist:'扶余市',status:'正常'},
    {id:'GP-010',mat:'钢管',dia:'D273',len:26.5,press:'高压',year:'2012',dist:'扶余市',status:'关注'},
    {id:'GP-011',mat:'PE',dia:'DE90',len:4.2,press:'低压',year:'2021',dist:'宁江区',status:'正常'},
    {id:'GP-012',mat:'钢管',dia:'D159',len:14.7,press:'中压',year:'2016',dist:'前郭县',status:'正常'},
  ],
  // ====== 地理锚点（松原市真实经纬度范围） ======
  geo:{
    center:[45.15,124.83],    // 宁江区中心
    bounds:[[44.00,123.20],[45.60,126.30]], // 松原全域
    zoom:9,
    // 百分比(0-100) → 经纬度映射（lat南→北 / lng西→东）
    pctToLL(x,y){return[45.60-(y/100)*1.60,123.20+(x/100)*3.10]}
  },
  // ====== 场站（含真实经纬度 & 0-100% 定位双套） ======
  stations:[
    {id:'MS-01',name:'松原门站',type:'门站',x:42,y:38,lat:45.00,lng:124.50,dist:'宁江区',status:'正常',head:'王建国',press:'0.40MPa'},
    {id:'MS-02',name:'哈达山储备站',type:'储备站',x:56,y:46,lat:44.86,lng:124.94,dist:'前郭县',status:'正常',head:'李志远',press:'1.60MPa'},
    {id:'MS-03',name:'镜湖调压站',type:'调压站',x:38,y:52,lat:44.77,lng:124.38,dist:'宁江区',status:'正常',head:'张伟',press:'0.30MPa'},
    {id:'MS-04',name:'长岭门站',type:'门站',x:30,y:70,lat:44.48,lng:124.13,dist:'长岭县',status:'正常',head:'刘洋',press:'0.40MPa'},
    {id:'MS-05',name:'太平山调压站',type:'调压站',x:22,y:78,lat:44.35,lng:123.88,dist:'长岭县',status:'关注',head:'陈刚',press:'0.30MPa'},
    {id:'MS-06',name:'乾安门站',type:'门站',x:50,y:30,lat:45.12,lng:124.75,dist:'乾安县',status:'正常',head:'赵明',press:'0.40MPa'},
    {id:'MS-07',name:'让字堡调压站',type:'调压站',x:62,y:24,lat:45.22,lng:125.12,dist:'乾安县',status:'正常',head:'孙强',press:'0.30MPa'},
    {id:'MS-08',name:'扶余门站',type:'门站',x:74,y:18,lat:45.31,lng:125.49,dist:'扶余市',status:'正常',head:'周涛',press:'0.40MPa'},
    {id:'MS-09',name:'三岔河储备站',type:'储备站',x:84,y:30,lat:45.12,lng:125.80,dist:'扶余市',status:'正常',head:'吴磊',press:'1.60MPa'},
    {id:'MS-10',name:'陶赖昭调压站',type:'调压站',x:70,y:40,lat:44.96,lng:125.37,dist:'扶余市',status:'正常',head:'郑斌',press:'0.30MPa'},
    {id:'MS-11',name:'江北调压站',type:'调压站',x:46,y:42,lat:44.93,lng:124.63,dist:'宁江区',status:'正常',head:'黄宇',press:'0.30MPa'},
    {id:'MS-12',name:'江南调压站',type:'调压站',x:40,y:44,lat:44.90,lng:124.44,dist:'宁江区',status:'关注',head:'林峰',press:'0.30MPa'},
  ],
  // ====== 危险源（LNG/CNG/高压储罐等，图层可切换） ======
  hazards:[
    {id:'HZ-01',name:'松原门站 LNG 储罐区',type:'LNG储罐',level:'重大',x:43,y:39,lat:44.98,lng:124.53,cap:'2×150m³',dist:'宁江区'},
    {id:'HZ-02',name:'哈达山储备站高压球罐',type:'高压球罐',level:'重大',x:57,y:47,lat:44.85,lng:124.97,cap:'4×5000m³',dist:'前郭县'},
    {id:'HZ-03',name:'三岔河储备站 LPG 区',type:'LPG储罐',level:'较大',x:85,y:31,lat:45.10,lng:125.83,cap:'6×200m³',dist:'扶余市'},
    {id:'HZ-04',name:'长岭天然气调压柜',type:'高压设施',level:'一般',x:31,y:71,lat:44.47,lng:124.16,cap:'DN200',dist:'长岭县'},
    {id:'HZ-05',name:'乾安压缩天然气子站',type:'CNG子站',level:'较大',x:51,y:31,lat:45.10,lng:124.78,cap:'450kg/h',dist:'乾安县'},
    {id:'HZ-06',name:'江北 LNG 气化站',type:'LNG气化',level:'重大',x:47,y:43,lat:44.91,lng:124.66,cap:'2000Nm³/h',dist:'宁江区'},
  ],
  // ====== 防护目标（学校/医院/居民区，图层可切换） ======
  protection:[
    {id:'PT-01',name:'松原市第一中学',type:'学校',x:41,y:40,lat:44.96,lng:124.47,people:3200,dist:'宁江区'},
    {id:'PT-02',name:'前郭县人民医院',type:'医院',x:54,y:45,lat:44.88,lng:124.87,people:1500,dist:'前郭县'},
    {id:'PT-03',name:'长岭县实验小学',type:'学校',x:29,y:68,lat:44.51,lng:124.10,people:2100,dist:'长岭县'},
    {id:'PT-04',name:'乾安县中心医院',type:'医院',x:49,y:29,lat:45.13,lng:124.72,people:900,dist:'乾安县'},
    {id:'PT-05',name:'扶余市职业教育中心',type:'学校',x:72,y:20,lat:45.28,lng:125.43,people:2800,dist:'扶余市'},
    {id:'PT-06',name:'宁江区镜湖居民区',type:'居民区',x:37,y:51,lat:44.78,lng:124.35,people:12000,dist:'宁江区'},
    {id:'PT-07',name:'三岔河商贸中心',type:'商业综合体',x:82,y:29,lat:45.13,lng:125.74,people:5000,dist:'扶余市'},
    {id:'PT-08',name:'乾安西湖花园小区',type:'居民区',x:60,y:25,lat:45.20,lng:125.06,people:6500,dist:'乾安县'},
  ],
  // ====== 物联设备 ======
  devices:[
    {id:'DT-2024-001',type:'可燃气体探测器',loc:'宁江区-松江大街',online:true,val:'0.08%LEL',bat:'92%',alarm:false},
    {id:'DT-2024-002',type:'压力变送器',loc:'宁江区-镜湖调压站',online:true,val:'0.31MPa',bat:'86%',alarm:false},
    {id:'DT-2024-003',type:'可燃气体探测器',loc:'前郭县-哈达山储备站',online:true,val:'0.12%LEL',bat:'78%',alarm:false},
    {id:'DT-2024-004',type:'流量计',loc:'前郭县-前郭门站',online:true,val:'1280m³/h',bat:'91%',alarm:false},
    {id:'DT-2024-005',type:'可燃气体探测器',loc:'长岭县-长岭大街',online:false,val:'--',bat:'15%',alarm:false},
    {id:'DT-2024-006',type:'压力变送器',loc:'长岭县-太平山调压站',online:true,val:'0.29MPa',bat:'64%',alarm:true},
    {id:'DT-2024-007',type:'可燃气体探测器',loc:'乾安县-乾安大街',online:true,val:'0.21%LEL',bat:'88%',alarm:true},
    {id:'DT-2024-008',type:'流量计',loc:'乾安县-乾安门站',online:true,val:'960m³/h',bat:'73%',alarm:false},
    {id:'DT-2024-009',type:'可燃气体探测器',loc:'扶余市-扶余大街',online:true,val:'0.06%LEL',bat:'95%',alarm:false},
    {id:'DT-2024-010',type:'压力变送器',loc:'扶余市-三岔河储备站',online:true,val:'0.41MPa',bat:'81%',alarm:false},
    {id:'DT-2024-011',type:'温度变送器',loc:'宁江区-松原门站',online:true,val:'-8℃',bat:'90%',alarm:false},
    {id:'DT-2024-012',type:'可燃气体探测器',loc:'宁江区-江北小区',online:true,val:'0.15%LEL',bat:'69%',alarm:true},
  ],
  // ====== 警情（实时） ======
  alarms:[
    {id:'A20260901-07',time:'09:41:22',loc:'乾安县-乾安大街中段',type:'燃气浓度超标',lvl:'橙',status:'处置中',deal:'乾安燃气公司'},
    {id:'A20260901-06',time:'09:38:05',loc:'长岭县-太平山调压站',type:'压力异常',lvl:'红',status:'处置中',deal:'长岭燃气公司'},
    {id:'A20260901-05',time:'09:30:47',loc:'宁江区-江北小区3号楼',type:'疑似泄漏',lvl:'黄',status:'已派单',deal:'宁江燃气公司'},
    {id:'A20260901-04',time:'09:12:18',loc:'前郭县-哈达山储备站',type:'设备离线',lvl:'蓝',status:'已恢复',deal:'前郭燃气公司'},
    {id:'A20260901-03',time:'08:56:33',loc:'扶余市-三岔河储备站',type:'流量波动',lvl:'黄',status:'处置中',deal:'扶余燃气公司'},
    {id:'A20260901-02',time:'08:30:09',loc:'宁江区-江南调压站',type:'温度异常',lvl:'蓝',status:'已恢复',deal:'宁江燃气公司'},
    {id:'A20260901-01',time:'08:15:42',loc:'乾安县-让字堡调压站',type:'压力异常',lvl:'橙',status:'已恢复',deal:'乾安燃气公司'},
    {id:'A20260831-18',time:'23:48:11',loc:'长岭县-长岭大街',type:'燃气浓度超标',lvl:'红',status:'已闭环',deal:'长岭燃气公司'},
    {id:'A20260831-17',time:'22:20:36',loc:'前郭县-前郭门站',type:'设备离线',lvl:'蓝',status:'已闭环',deal:'前郭燃气公司'},
    {id:'A20260831-16',time:'20:05:18',loc:'扶余市-扶余大街',type:'疑似泄漏',lvl:'黄',status:'已闭环',deal:'扶余燃气公司'},
  ],
  // ====== 隐患 ======
  hidden:[
    {id:'H-2401',type:'管道腐蚀',lvl:'红',loc:'扶余市 GP-010',resp:'扶余燃气公司',status:'整改中',due:'2026-09-05'},
    {id:'H-2402',type:'第三施工破坏',lvl:'橙',loc:'长岭县 GP-005',resp:'长岭燃气公司',status:'整改中',due:'2026-09-08'},
    {id:'H-2403',type:'阀井积水',lvl:'黄',loc:'乾安县 GP-008',resp:'乾安燃气公司',status:'待验收',due:'2026-09-03'},
    {id:'H-2404',type:'设备老化',lvl:'橙',loc:'宁江区-江南调压站',resp:'宁江燃气公司',status:'整改中',due:'2026-09-06'},
    {id:'H-2405',type:'标识缺失',lvl:'蓝',loc:'前郭县 GP-003',resp:'前郭燃气公司',status:'已整改',due:'2026-08-30'},
    {id:'H-2406',type:'占压管线',lvl:'黄',loc:'宁江区-松江大街',resp:'宁江燃气公司',status:'整改中',due:'2026-09-10'},
    {id:'H-2407',type:'法兰渗漏',lvl:'红',loc:'长岭县-太平山调压站',resp:'长岭燃气公司',status:'整改中',due:'2026-09-04'},
    {id:'H-2408',type:'阴极保护失效',lvl:'黄',loc:'乾安县 GP-008',resp:'乾安燃气公司',status:'待审核',due:'2026-09-12'},
    {id:'H-2409',type:'安全间距不足',lvl:'橙',loc:'扶余市-三岔河储备站',resp:'扶余燃气公司',status:'整改中',due:'2026-09-09'},
    {id:'H-2410',type:'警示牌缺失',lvl:'蓝',loc:'前郭县 GP-004',resp:'前郭燃气公司',status:'已整改',due:'2026-08-29'},
  ],
  // ====== 风险评估（四色图） ======
  risks:[
    {area:'宁江区-松江大街',lvl:'红',score:82,segs:4},
    {area:'扶余市-三岔河',lvl:'红',score:79,segs:3},
    {area:'长岭县-太平山',lvl:'红',score:76,segs:2},
    {area:'乾安县-乾安大街',lvl:'橙',score:64,segs:5},
    {area:'前郭县-哈达山',lvl:'橙',score:61,segs:3},
    {area:'宁江区-江北',lvl:'橙',score:58,segs:6},
    {area:'长岭县-长岭大街',lvl:'黄',score:44,segs:7},
    {area:'乾安县-让字堡',lvl:'黄',score:41,segs:4},
    {area:'扶余市-扶余大街',lvl:'黄',score:38,segs:5},
    {area:'前郭县-前郭门站',lvl:'蓝',score:24,segs:2},
  ],
  // ====== 应急资源 ======
  emergency:{
    vehicles:[{n:'抢修车',v:28,on:26},{n:'应急指挥车',v:6,on:6},{n:'消防车',v:12,on:11},{n:'救护车',v:8,on:8}],
    teams:[{n:'燃气抢险队',v:14},{n:'消防队',v:8},{n:'医疗救援',v:6},{n:'公安警戒',v:10}],
    materials:[{n:'堵漏夹具',v:120},{n:'法兰盲板',v:340},{n:'应急阀门',v:86},{n:'防护服',v:240},{n:'气体检测仪',v:160}],
    experts:[{n:'王国平',t:'燃气输配专家',o:'住建局'},{n:'李建华',t:'应急处置专家',o:'消防救援'},{n:'张明远',t:'管网安全专家',o:'燃气集团'},{n:'陈志刚',t:'风险评估专家',o:'安科院'}],
  },
  // ====== 燃气企业 ======
  enterprises:[
    {name:'松原中燃城市燃气发展有限公司',users:186420,pipe:1620,stations:78,rate:'A',dist:'宁江区'},
    {name:'前郭县燃气有限公司',users:58300,pipe:480,stations:24,rate:'A',dist:'前郭县'},
    {name:'长岭县燃气有限公司',users:64120,pipe:560,stations:26,rate:'B',dist:'长岭县'},
    {name:'乾安县燃气有限公司',users:46800,pipe:520,stations:22,rate:'A',dist:'乾安县'},
    {name:'扶余市燃气有限公司',users:73010,pipe:668,stations:36,rate:'B',dist:'扶余市'},
  ],
  // ====== 用户结构 ======
  users:[
    {type:'城镇管道天然气',v:312540,pct:72.9},
    {type:'农村管道天然气',v:116110,pct:27.1},
  ],
  // ====== 供气趋势（近12月，亿m³） ======
  supplyTrend:[0.142,0.135,0.138,0.151,0.158,0.164,0.171,0.168,0.159,0.146,0.138,0.148],
  // ====== 报警趋势（近7日） ======
  alarmTrend:[18,12,16,9,14,11,8],
  // ====== 设备在线率（按区） ======
  onlineByDist:[
    {dist:'宁江区',total:2840,online:2786,rate:98.1},
    {dist:'前郭县',total:1980,online:1920,rate:97.0},
    {dist:'长岭县',total:1860,online:1782,rate:95.8},
    {dist:'乾安县',total:1420,online:1368,rate:96.3},
    {dist:'扶余市',total:1320,online:1300,rate:98.5},
  ],
  // ====== 巡查巡检 ======
  inspections:[
    {id:'X-260901-12',plan:'宁江区9月入户安检',area:'宁江区',period:'月',target:5200,done:3120,rate:60,state:'进行中'},
    {id:'X-260901-11',plan:'前郭县三季度巡线',area:'前郭县',period:'季',target:480,done:480,rate:100,state:'已完成'},
    {id:'X-260901-10',plan:'长岭县阀井检查',area:'长岭县',period:'月',target:86,done:54,rate:63,state:'进行中'},
    {id:'X-260901-09',plan:'乾安县企业安检',area:'乾安县',period:'季',target:42,done:38,rate:90,state:'进行中'},
    {id:'X-260901-08',plan:'扶余市隐患复查',area:'扶余市',period:'月',target:18,done:18,rate:100,state:'已完成'},
  ],
  // ====== 投诉处置 ======
  complaints:[
    {id:'C-260901-08',src:'12345热线',person:'刘女士',item:'疑似燃气味',trans:'宁江燃气',state:'办理中',time:'09:20'},
    {id:'C-260901-07',src:'微信小程序',person:'张先生',item:'表具异常',trans:'宁江燃气',state:'已办结',time:'08:42'},
    {id:'C-260901-06',src:'12345热线',person:'王女士',item:'气压不足',trans:'前郭燃气',state:'办理中',time:'08:05'},
    {id:'C-260831-15',src:'来电',person:'赵先生',item:'施工破坏',trans:'长岭燃气',state:'已办结',time:'昨日'},
    {id:'C-260831-14',src:'12345热线',person:'孙女士',item:'费用疑问',trans:'扶余燃气',state:'已办结',time:'昨日'},
  ],
  complaintStat:{total:286,done:268,rate:93.7},
  // ====== 考核评价 ======
  assess:[
    {ent:'松原中燃',safety:92,hidden:88,complaint:95,deploy:90,total:91.5,rank:'A'},
    {ent:'前郭燃气',safety:90,hidden:90,complaint:92,deploy:88,total:90.0,rank:'A'},
    {ent:'长岭燃气',safety:84,hidden:80,complaint:88,deploy:82,total:83.5,rank:'B'},
    {ent:'乾安燃气',safety:91,hidden:86,complaint:90,deploy:89,total:89.0,rank:'A'},
    {ent:'扶余燃气',safety:82,hidden:78,complaint:85,deploy:80,total:81.3,rank:'B'},
  ],
  // ====== 泄漏研判模型结果 ======
  leakModels:[
    {name:'泄漏溯源分析',desc:'结合压力/流量异常与GIS拓扑，追溯泄漏源管段',result:'GP-008 K2+180 处'},
    {name:'泄漏扩散分析',desc:'基于气象(风速2.1m/s 东南风)与燃气扩散模型',result:'影响半径 86m'},
    {name:'爆炸预测分析',desc:'可燃气体爆炸冲击波超压预测',result:'破坏半径 32m'},
  ],
  // ====== 知识/案例/专家库 ======
  knowledge:[
    {cat:'知识库',items:['城镇燃气管理条例','GB50028城镇燃气设计规范','CJJ51城镇燃气设施运行维护','燃气应急预案编制导则']},
    {cat:'案例库',items:['2019·某市第三方施工挖断中压管','2021·某小区入户管腐蚀泄漏','2023·调压站法兰渗漏处置']},
    {cat:'专家库',items:['王国平·燃气输配','李建华·应急处置','张明远·管网安全','陈志刚·风险评估']},
  ],
};

// ====== API 桩（签名贴近真实 API；// TODO: 替换为真实接口） ======
const API={
  // GET /api/cockpit/overview
  async overview(){await delay();return{code:0,data:{kpi:DB.kpi,enterprises:DB.enterprises,users:DB.users}}},
  // GET /api/pipelines
  async pipelines(){await delay();return{code:0,data:DB.pipelines,total:DB.pipelines.length}},
  // GET /api/stations
  async stations(){await delay();return{code:0,data:DB.stations,total:DB.stations.length}},
  // GET /api/devices
  async devices(){await delay();return{code:0,data:DB.devices,total:DB.devices.length}},
  // GET /api/alarms
  async alarms(){await delay();return{code:0,data:DB.alarms,total:DB.alarms.length}},
  // GET /api/hidden
  async hidden(){await delay();return{code:0,data:DB.hidden,total:DB.hidden.length}},
  // GET /api/risks
  async risks(){await delay();return{code:0,data:DB.risks,total:DB.risks.length}},
  // GET /api/emergency
  async emergency(){await delay();return{code:0,data:DB.emergency}},
};

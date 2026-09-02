# 设计契约 · 松原智慧燃气安全综合监管平台（领导驾驶舱）

## 技术栈与交付
- stack: vanilla HTML + CSS + 原生 JS / pure-static（离线可开，零外部依赖）
- 图表: 纯 Canvas/SVG 自绘，禁用 CDN 字体/库
- 字体: 系统字体栈（离线），数字用等宽

## 风格层
- style: tech-dark（科技深空）
- aesthetic: 政务驾驶舱 × 科技深空：深蓝/深灰底 + 青色主点缀 + 紫色辅光晕 + 玻璃拟态面板 + 扫描线/网格纹理
- tone: 沉稳、高信息密度、可指挥、有呼吸感

## 设计 Token（所有页面共用，写入 styles.css :root）
- --bg: #050A1A（深空底）；--bg2: #0A1530；--panel: rgba(12,26,56,.72)
- --accent: #22D3EE（青·主）；--accent2: #7C3AED（紫·辅）；--accent3: #00E5FF
- --warn: #FBBF24；--danger: #FF4D5E；--success: #22C55E
- --text: #E6F1FF；--sub: #8FA8C8；--dim: #5A7396
- --line: rgba(34,211,238,.18)；--line2: rgba(124,58,237,.18)
- --r: 6/10/14；shadow: 0 0 24px rgba(0,229,255,.08)
- 字号: 12/14/16/20/28/36；间距 4 基；图标统一 inline SVG（lucide 风格描边 1.6，currentColor）

## 组件规范
- 面板 .panel: 玻璃拟态（背景 var(--panel) + 1px 边线 + 内发光 + 左上角科技角标）
- 面板标题 .panel-h: 左竖条 + 标题 + 右侧 更多→
- KPI 卡 .kpi: 大数字(等宽) + 标签 + 趋势 + 迷你趋势条
- 列表 .list / .row: 警情/工单行，状态色点 + 时间 + 内容 + 级别 tag
- tag: .tag.danger/.warn/.info/.ok
- 表格 .tbl: 深色表头 + 斑马行 + hover 高亮
- 按钮 .btn: 描边/实色两态 + hover 发光
- 地图: SVG 路径绘管网 + 圆点场站 + 脉冲报警点

## App Shell + 规范导航（二级页面共用，逐字粘贴，禁止重写）
- 主驾驶舱 index.html 为全屏 1920×1080 大屏（无侧栏，自有布局）
- 二级页面 shell：
  - 顶栏 .topbar（高 56）：左=返回驾驶舱 + 模块名；中=面包屑；右=时间/在线状态/用户
  - 左栏 .sidenav（宽 220，fixed）：13 项导航，逐页一致；当前项 .active（左竖青条 + 文字亮）
  - 主区 .main（margin-left:220）：模块专属内容，仅此区变化
- 激活规则：body[data-page="xxx"]，shell.js 读取后给匹配 a 加 .active
- mount: 每页 inline shell HTML（最稳，零 JS 依赖），shell.js 仅做时间/激活/交互增强

## 页面清单（13）
| 页面 | 文件 | 责任 | 导航 |
|---|---|---|---|
| 驾驶舱 | index.html | 全市燃气态势总览大屏 | →各二级 |
| 概况一张图 | overview.html | 大数据/GIS 一张图，3 主题切换（管网GIS/安全风险/应急调度） | - |
| 基础信息 | basic.html | 管线/场站/危险源/防护目标档案管理 | - |
| 风险评估 | risk.html | 风险清单/四色图/评估报告 | - |
| 隐患管理 | hidden.html | 隐患台账/审核/整改/统计 | - |
| 运行监测 | monitor.html | 7×24 物联监测看板/报警 | - |
| 预测预警 | warning.html | 实时监测/泄漏预警/处置档案 | - |
| 泄漏研判 | leak.html | 溯源/扩散/爆炸预测分析 | - |
| 应急处置 | emergency.html | 预案/调度/事故全闭环 | - |
| 巡查巡检 | inspect.html | 入户检查周期/作业/计划分派 | - |
| 考核评价 | assess.html | 综合打分/多维考评/图表 | - |
| 投诉处置 | complaint.html | 投诉上报/办结/统计 | - |
| 辅助管理 | auxiliary.html | 知识库/案例库/专家库 | - |

## Mock Schema（见 mock.js，跨页一致）
- 管网: pipelines[]（id,材质,管径,长度,压力级,敷设年代,状态）
- 场站: stations[]（id,名称,类型[门站/调压站/储备站],经纬,状态,负责人）
- 设备: devices[]（id,类型,位置,在线,最近值,电池,报警）
- 警情: alarms[]（id,时间,位置,类型,级别,状态,处置）
- 隐患: hidden[]（id,类型,级别,位置,责任,状态,期限）
- 风险: risks[]（区域,等级[红橙黄蓝],分值,管段数）
- 应急: emergency[]（车辆/人员/物资/专家）
- KPI: 用户/管网/场站/设备总量与同比
- 投诉/巡检/考核: 各列表
- 企业/用户: 燃气企业、城乡用户数

## 交互要点
- 驾驶舱: 模块卡片可点击 → 对应二级页；地图点位可点击弹详情；警情/隐患行 hover 高亮
- 二级页: 主题 tab 切换（overview）；列表筛选/分页；详情抽屉；时间实时刷新；返回驾驶舱
- 全局: 顶栏时钟实时；数据滚动/轮播；进入有 staggered 揭幕动效

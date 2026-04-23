# Diriyah · 活动日运营 — 编排控制台

> **场景编排层**（Scenario Orchestration Layer）的实时交互式 Demo —— Pilot A · Event Day Operations。
>
> **语言** · [English](./README.md) · **简体中文**

![Status](https://img.shields.io/badge/status-demo-3ec1a6) ![Next.js](https://img.shields.io/badge/Next.js-14-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38bdf8)

---

## 1 · 这是什么

这是一个**完整可交互的操作员控制台（Operator Console）Demo**，把 Pilot A 提案变成客户可以**亲眼看、亲手点**的产品。界面每一处都对应到业务与逻辑深度说明 PDF 中的具体章节：

- 四区运营台布局 —— PDF Figure 2
- 5 个压力测试场景 —— PDF §10（反应式人流 / 预测式停车 / 医疗上下文融合 / 降雨 Overlay / VIP 并行规则）
- 规则触发 → 推荐 → 操作员审批 → 跨系统 fan-out → ACK 回收 → 自动回滚 —— PDF §08 时序
- 事件溯源审计日志 —— PDF §08
- KPI 相对 BAU 的实时变化 —— PDF §09

**完全不连后端**。整个 Demo 是一个**脚本化场景播放器**，设计目标是：**上台稳、讲故事清楚、90 秒让客户看懂**编排层的价值。

---

## 2 · 界面结构

深色运营台风格，对标 PSIM / 指挥中心视觉。

```
┌─ Header ────────────────────────────────────────────────────────────────────┐
│  DIRIYAH · ORCHESTRATION CONSOLE   Event Day · National Day 2026      LIVE  │
├─────────────┬──────────────────────────────────────────┬────────────────────┤
│ Scenario    │   Flow Map  (A / B / Plaza + P1–P4)      │  推荐卡 (Rec)      │
│  State      │                                          │  · pending/firing  │
│ 出席人数     ├──────────────────────────────────────────┤  · 审批/拒绝        │
│ 热点         │   Stage Progress + 3 个实时 KPI          │                    │
│ PSIM        ├──────────────────────────────────────────┼────────────────────┤
│ 停车场       │   场景启动器 · 5 个压力测试              │   审计日志         │
│ 天气         │                                          │   · 事件溯源        │
└─────────────┴──────────────────────────────────────────┴────────────────────┘
```

---

## 3 · 五个场景

每张场景卡片都会触发一条脚本时间线：状态变化 → 规则命中 → 推荐卡浮出 → 操作员点击审批 → 3 通道 fan-out 并回收 ACK → 阈值回落时自动回滚。

| # | 场景 | 规则 | 优先级 | 演示价值 |
|---|---|---|---|---|
| 01 | B 门人流热点 → 分流至 A 门 | `EVT-CROWD-001` | HIGH | 基础闭环，30 秒内自动回滚 |
| 02 | P4 停车场即将饱和 → 提前引导至 P2 | `EVT-PARK-002` | MEDIUM | 预测式价值，显式展示 trade-off |
| 03 | 广场中心 L3 医疗紧急事件 | `EVT-SEC-003` | **CRITICAL** | 上下文融合 + **对 MEDIUM 规则的自动告警抑制** |
| 04 | 突发降雨 Overlay | `EVT-WEATHER-001` | HIGH · BATCH | Overlay 调权（不替换规则）模式 |
| 05 | 临时 VIP 车队 | `EVT-VIP-001` | HIGH · PARALLEL | 优先级并行执行，不打断常规客流 |

---

## 4 · 技术栈

- **Next.js 14**（App Router）+ **TypeScript 5**
- **Tailwind CSS 3.4** —— 自定义设计 token，贴合 PDF 配色（深色板 + 青绿色主色 + 金色 VIP）
- **React Reducer + Context** —— 无外部状态库、无后端、无 WebSocket
- 所有场景以浏览器内异步时间线执行；每个场景只会改动唯一的 `ScenarioState` 对象（对应 PDF §04）

核心代码结构：

```
app/
  layout.tsx          — 根布局
  page.tsx            — 控制台主页面
  globals.css         — tailwind + 设计 token
components/
  Header.tsx          — 顶栏：LIVE + 时钟 + 重置
  LeftPanel.tsx       — 左侧场景状态面板
  FlowMap.tsx         — 中部流向图（A/B/P + 停车场 + 分流弧）
  StageProgress.tsx   — 阶段进度 + 3 个 KPI
  Recommendations.tsx — 推荐卡：审批/拒绝/fan-out
  AuditLog.tsx        — 审计日志（事件溯源）
  ScenarioLauncher.tsx— 5 个场景一键触发
  ui.tsx              — 共享小组件
lib/
  types.ts            — 领域模型
  initialState.ts     — 初始状态 + 场景元数据
  scenarios.ts        — 5 条脚本时间线 + 审批后效果
  store.tsx           — reducer + Provider
```

---

## 5 · 本地运行

需要 **Node 18+**。

```bash
# 安装依赖
npm install

# 开发模式
npm run dev
# → 打开 http://localhost:3000

# 生产构建
npm run build
npm run start
```

无需任何环境变量、无外部服务、无数据库。

---

## 6 · 客户演示推荐路径

给客户演示时，下面的顺序最有说服力：

1. **静态加载** —— 先讲清 4 个分区和 KPI 基线。
2. **点 Scenario 01** —— 最易理解的闭环，指出 3 通道 fan-out 和自动回滚。
3. **点 Scenario 02** —— 引入预测价值（"我们比 P4 饱和提前 12 分钟做出动作"）。
4. **点 Scenario 03** —— 全场最强点。指出 SUPPRESSION 标记、以及 MEDIUM 级别的 P4 推荐在 CRITICAL 医疗事件到达时自动变灰的效果。
5. **点 Scenario 04** —— 说明降雨是 Overlay（调权），不是替换 playbook。
6. **点 Scenario 05** —— 说明 VIP 以**并行**方式执行，不会冻结常规客流。
7. **滚动审计日志** —— 每一次决策、ACK、抑制、回滚都被事件溯源地记录下来。

全程约 **4 分钟**，全部在单一控制台页面完成。

---

## 7 · 这个 Demo **不**是什么

为了让故事清楚，刻意保持极简：

- 不连真实的 MQTT broker，总线在浏览器内部建模
- 不连真实的写入适配器，4 个通道（VMS / App Push / Access / PSIM Notify）只记录模拟的 ACK 与合理的延迟
- 无身份认证、无角色切换，所有用户都是 "Ops Lead"
- 无持久化，刷新即重置

这些都是刻意为之。现场 Demo 必须稳、快、只讲一个故事。PDF 里的工程提案才描述真正生产架构。

---

## 8 · 与提案 PDF 的对照

| 控制台区域 | 对应 PDF 章节 |
|---|---|
| Header（LIVE / 活动时钟 / T+…） | §07 |
| 左侧面板 —— 出席、热点、PSIM、停车、天气 | §04 Scenario State |
| Flow Map —— A/B/Plaza/停车场 | §07、§10 场景 01/03 |
| Stage Progress + 3 个 KPI | §05、§09 |
| 推荐卡 —— 优先级、影响预览、trade-off、置信度、通道 | §06、§07 |
| 审批 → fan-out → ACK → EXECUTED | §08 时序图 |
| 阈值回落时自动回滚 | §02 ④ + §10 |
| 审计日志 | §08 |
| 5 场景启动器 | §10 |

---

## 9 · 许可

仅用于沟通和演示目的，不用于生产环境。

© 2026 · Prepared for the Diriyah pilot conversation.

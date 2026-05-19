---
name: Aero Ambient Telemetry
description: 诗意的大气仪表美学 — 顶部巨型 WebGL 流体色场与诗意衬线大字相遇，底部冷静的电子钴蓝 1px 线框网格输出气象级数据读数。为 *感受天气的人* 设计，而不是 *查看温度的人*。
---

# Aero Ambient Telemetry · 大气仪表协议

> "Lucid drift — atmospheric swell."
> 这不是天气 App，这是大气的诗意仪表板。

---

## 1. 核心哲学 · Instrument Poetica

**Ambient Instrument** 是一种**诗意与精密并置**的美学 —— 顶部是无尽演化的流体噪声色场（ambient），底部是 1px 钴蓝线框里的精确气象读数（instrument）。两者之间没有过渡装饰，只有一行用 `Instrument Serif` 写就的诗意条件句作为桥梁。

**三条不可违反的律令：**
1. **上软下硬** — 顶部 viewport 必须是 WebGL 流体 + 60px 大圆角；下部所有数据模块必须是 1px 钴蓝直角硬线框
2. **诗意与数据分轨** — 所有诗意词（`Lucid`, `drift`, `Atmospheric swell`）使用 `Instrument Serif`；所有数字与 meta（`74°F`, `SW 12kts`, `sys.status`）使用 `Inter`
3. **钴蓝是唯一的墨水** — 所有边框、分隔线、图标 stroke、主文字只用 `#2F36F1`；电子粉 `#F949E0` 是 **唯一强调色**（accent 诗意词 + 经纬度坐标）

---

## 2. 设计 Token

```css
:root {
  /* ── Core Palette ── */
  --bg-color:     #FBE2D0;   /* 桃粉纸张，全局底 */
  --ink-primary:  #2F36F1;   /* 电子钴蓝，唯一墨水 */
  --ink-accent:  #F949E0;   /* 电子粉，唯一 accent（节制使用，≤2 处）*/

  /* ── Shader Palette（仅限 WebGL viewport 内部）── */
  --shader-blue:   #2F36F1;
  --shader-pink:   #F949E0;
  --shader-peach:  #FFB17A;
  --shader-violet: #8C7EFD;

  /* ── Typography ── */
  --font-serif: 'Instrument Serif', serif;   /* 诗意层 */
  --font-sans:  'Inter', sans-serif;         /* 数据层 */

  /* ── Geometry ── */
  --border-style: 1px solid var(--ink-primary);
  --viewport-radius: 60px;                   /* 仅 viewport 顶部 2 角用 */
}
```

字体加载：
```html
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

---

## 3. 布局骨架 · Mobile-First 500px

```
┌─ app-frame (max 500px, 全屏 flex column) ─────┐
│  ┌─ ambient-viewport (16px margin, flex:1) ─┐  │
│  │   └─ 60px 大圆角只在 top-left/top-right   │  │
│  │   ├─ #webgl-container (fluid shader)      │  │
│  │   ├─ starburst-overlay (8 线白星，中偏上)│  │
│  │   ├─ star-top-right (填充桃粉 8 瓣星)     │  │
│  │   └─ viewport-fade (底部 80px 向 bg 渐隐) │  │
│  └──────────────────────────────────────────┘  │
│  ┌─ typo-layer (padding 0 24px, margin-top:-30px) │
│  │   "Lucid(accent) drift ————————"              │
│  │   "Atmospheric swell" (右对齐)                │
│  └────────────────────────────────────────────┘  │
│  ┌─ structural-divider (spark ✦ + 2 条虚线) ──┐ │
│  └──────────────────────────────────────────┘  │
│  ┌─ data-telemetry (padding 0 16px) ─────────┐  │
│  │   row1: [Core Temp 74°F | Humidity 68%]   │  │
│  │   row2: [Wind Vec | Pressure | UV Index]  │  │
│  │   system-footer: AERO|34.05°N|Live|sys.status│
│  └────────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

---

## 4. WebGL 环境 Viewport（签名视觉 #1）

**必须使用 Three.js + GLSL shader**，不可用 canvas 2D 或 gif 替代。

核心 shader 要点：
- **Simplex 2D 噪声** 作为基础流场
- **三次 domain warping**：`st → q = noise(st+t) → r = noise(st+2q) → f = noise(st+3r)`
- **4 色混合**：`mix(Blue, Violet, f²) → mix(·, Pink, length(q)) → mix(·, Peach, r.x)`
- **Y2K 颗粒 grain**：`(random(uv*(t+10)) - 0.5) * 0.35` 强颗粒噪声
- **时间缩放** `t = u_time * 0.15`（慢演化）
- 正交相机 + full-screen quad

viewport 上叠加：
- **`starburst-overlay`** 8 线白色（`bg-color`）星爆，120×120，居中（top:45%），opacity 0.9
- **`star-top-right`** 16×16 桃粉填充 8 瓣星（`fill: var(--bg-color)`）
- **`viewport-fade`** 底部 80px `linear-gradient(to top, var(--bg-color), transparent)` 做向下消隐

---

## 5. 诗意条件句 · Poetic Condition

这是整个设计的**情绪灵魂**，不可省略或弱化。

```html
<div class="typo-layer">  <!-- margin-top: -30px，破入 viewport 底部 -->
  <div class="poetic-condition">
    <span class="accent">Lucid</span> drift
    <div class="line"></div>
  </div>
  <div class="secondary-condition">Atmospheric swell</div>
</div>
```

**必须遵守：**
- `poetic-condition`：`clamp(48px, 12vw, 64px)` `Instrument Serif` `line-height:0.9` `letter-spacing:-0.02em` **nowrap**
- 第一个词必须 `color: var(--ink-accent)`（电子粉）
- 第二个词结尾必须接**1px 钴蓝横线** `flex-grow:1 height:1px`，象征条件句向右延伸至无穷
- `secondary-condition`：32px serif **右对齐**（`text-align:right; margin-right:12px`），与上行形成错位韵律

**内容风格**：始终是 *形容词 + 抽象名词*，例如：
- `Lucid drift · Atmospheric swell`
- `Pale surge · Thermal bloom`
- `Quiet haze · Pressure fold`
- `Amber lull · Chromatic dusk`

禁止使用 `Sunny`, `Cloudy`, `74°F today` 这种直白天气词。

---

## 6. 结构分隔带 · Structural Divider

```html
<div class="structural-divider">
  <svg class="spark-icon"><!-- 8-point polygon star --></svg>
  <div class="dashed-line"></div>
  <div class="dashed-line"></div>
</div>
```

- 8 瓣 spark 填充钴蓝，12×12，`flex-shrink:0`
- 两条**程序化虚线**：`background-image: linear-gradient(to right, var(--ink-primary) 50%, transparent 50%); background-size: 16px 1px;`（**不是** `border: dashed`，dash 必须是 16px 周期等宽）
- padding `24px 24px 16px 24px`，gap 16px

---

## 7. 数据遥测模块 · Data Telemetry

```
┌─ row 1 (flex gap:8px) ────────────────┐
│  ┌─ module-main flex:2 ──────┬─ side 1 ─┐
│  │ Core Temp                 │ Humidity │
│  │ 74°F       Feels Like 76.2°│ 68%      │
│  └───────────────────────────┴──────────┘
└──────────────────────────────────────────┘
┌─ row 2 (flex gap:8px) ────────────────┐
│  ┌ Wind Vec ┬ Pressure ┬ UV Index ┐
│  └──────────┴──────────┴──────────┘
└──────────────────────────────────────┘
```

`.data-module` 规范：
- `border: 1px solid #2F36F1`
- `padding: 12px`
- `display: flex; flex-direction: column; justify-content: space-between;`
- 永不加 background-color（让 bg 透出），永不加圆角，永不加阴影

`.data-label`（标签）：
- `font-family: Inter; font-size: 9px; font-weight: 600;`
- `text-transform: uppercase; letter-spacing: 0.05em;`
- `margin-bottom: 12px`

`.data-value-large`（主读数）：
- `font-family: Instrument Serif; font-size: 48px; line-height: 1;`
- 数字本体用 serif，但 `°F` / `%` 等单位用 `Inter 500 16px` 并 `margin-top:6px` 轻微上浮

`.data-value-small`（次读数 / 多行）：
- `font-family: Inter; font-size: 12px; font-weight: 500; letter-spacing:-0.02em;`

**温度模块特例**：`.temp-module` 是 row 方向 `justify-content: space-between; align-items: flex-end;`，左大数 + 右下角 `Feels Like 76.2°` 次读数，形成**量级对比**。

---

## 8. System Footer · 分格条

```html
<div class="system-footer">
  <div class="sys-cell brand-cell">AERO</div>
  <div class="sys-cell" style="color: var(--ink-accent)">34.05°N</div>
  <div class="sys-cell">Live</div>
  <div class="sys-cell"><svg class="globe-icon">…</svg> sys.status</div>
</div>
```

- 整条 32px 高，外框 1px 钴蓝
- 每个 `sys-cell` 用 `border-right: 1px solid #2F36F1` 分隔（最后一个无右边框并 `flex-grow:1 justify-content:flex-end`）
- 字体 Inter 10px **600 全大写 letter-spacing:0.02em**
- `brand-cell`（AERO）特殊：12px 700 紧字距
- 经纬度 `34.05°N` 是**唯一允许使用 accent 粉**的小字位置
- globe icon 是 14×14 的扁椭圆地球线稿（圆 + 竖椭圆 + 3 条纬线）

---

## 9. 动效 · Motion

- **WebGL shader 常驻演化**（唯一动态）：`u_time * 0.15` 慢速，绝不可加快至"油光"质感
- **禁止** CSS transition/transform 装饰动画（hover、fade-in 等）
- **禁止** loading spinner、脉动光标
- 唯一静态装饰：`starburst-overlay` 永远静止，象征凝固的光线坐标

---

## 10. 反模式 · Anti-Patterns

| ❌ 禁止 | ✅ 应该 |
|---|---|
| 黑色/灰色文字与边框 | 统一 `#2F36F1` 钴蓝作为墨水 |
| viewport 底部也加圆角 | 只 top-left/top-right 60px，底部 0 |
| 数据模块加 background / shadow / radius | 纯 1px 直角线框，bg 透出 |
| 诗意词用 Inter / 数据用 Serif | 诗意 Serif / 数据 Sans 严格分轨 |
| `border: 1px dashed` | 必须 `background-image: linear-gradient` 16px 周期程序化虚线 |
| 使用 emoji 表示天气 ☀️🌧️ | 仅用 SVG spark / 8-line starburst / globe 线稿 |
| Accent 粉用于标题/按钮/背景 | Accent 粉只出现在 ≤2 处：`Lucid` 首词 + `34.05°N` 坐标 |
| 显示 `Sunny` `Cloudy` 直白词 | 必须 *形容词 + 抽象名词* 诗意组合 |
| 宽屏桌面 | `max-width: 500px` 紧凑移动布局 |
| shader 色彩偏离 4 色清单 | 严格 `#2F36F1 / #F949E0 / #FFB17A / #8C7EFD` mix |

---

## 11. 响应式

- 桌面：`max-width: 500px` 居中，两侧桃粉留白
- 移动：填满视口，`overflow: hidden; user-select: none; -webkit-tap-highlight-color: transparent;`
- `html, body { width:100%; height:100%; display:flex; justify-content:center; align-items:center; }`

---

## 12. 实现清单 · Implementation Checklist

- [ ] 引入 Three.js r128 + Instrument Serif + Inter 三权重
- [ ] `:root` 定义 4 个色 token + 2 字体 + `--border-style`
- [ ] `#app-frame` 500px max-width flex column 容器
- [ ] `.ambient-viewport` 16px margin + `border-radius: 60px 60px 0 0` + `flex: 1`
- [ ] Three.js ShaderMaterial + Simplex noise + domain warping + 4 色 mix + 0.35 grain
- [ ] `starburst-overlay` 8 条白线 + 中心 1.5r 圆点
- [ ] `star-top-right` 8 瓣桃粉填充星
- [ ] `viewport-fade` 80px 向 bg 渐隐
- [ ] `.typo-layer { margin-top: -30px; padding: 0 24px; z-index: 10; }`
- [ ] `.poetic-condition` clamp 48–64px serif + 首词 accent + flex-grow 横线
- [ ] `.secondary-condition` 32px serif 右对齐
- [ ] `.structural-divider` spark + 2 条 16px 周期程序化虚线
- [ ] `.data-telemetry` 2 行 flex gap:8px + module-main(flex:2) / module-side(flex:1)
- [ ] `.data-label` Inter 9px 600 全大写 letter-spacing:0.05em
- [ ] `.data-value-large` Serif 48px line-height:1 + 单位 Sans 16px 上浮
- [ ] `.system-footer` 32px 高 4 格 + 每格右 1px 边 + accent 色坐标
- [ ] 所有 svg `stroke: var(--ink-primary); fill: none;`（除 starburst 用 bg-color、顶角星填充 bg-color）
- [ ] 验证反模式清单每一项

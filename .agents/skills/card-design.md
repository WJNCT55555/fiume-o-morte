---
name: fiume-card-design
description: Design, implement, audit, and refactor Fiume (FIUME O MORTE!) card files in src/game/action_affairs, government_affairs, and party_affairs. Use for card effects, bilingual zh/it text, declarative patches, AP cost, require / requireText behavior, and style across decks.
---

# FIUME O MORTE! · 卡牌设计

用于本项目全部卡牌工作。卡牌分三副：

- **行动卡** `deck: 'azione'` — 组织、街头、宣传、劳动、运动层面的操作
- **政府卡** `deck: 'governo'` — 需掌握对应执政官席位；立法、外交、财政、制度冲突
- **党卡** `deck: 'partito'` — 军团兵运动内部的路线斗争与组织建设

每卡一个 TypeScript 文件：`src/game/action_affairs/`、`src/game/government_affairs/`、`src/game/party_affairs/`。各目录 `index.ts` 汇总导出，`src/game/registries/contentRegistry.ts` 注册至引擎。卡牌格式见 `src/game/content/types.ts`。

> 新卡以具名 `export const name: Card = { ... }` 编写，并加入所在目录的 `index.ts`；保留声明式效果补丁和双语约定。

**目标不只是让卡牌能跑，而是让每一张卡可读、可审计、双语、结构一致。**

> 本 skill 的规范标准对齐 `cnt-fai-1931_-spanish-republic-simulator8.15/.agents/skills/Card design Skill.md`，
> 并按本项目的 React/Vite + TypeScript 技术栈与声明式补丁重新表述。
> 排版参照另外两个参考实现：`cnt-fai` 的 `src/game/action_affairs`（一卡一文件 + `Card`/`GameEvent` 两层）
> 与 `social_democracy_alternate_history` 的 `source/scenes/party_affairs`（`.scene.dry`：`view-if` 可用性 /
> `on-arrival` 成本与冷却 / `@option` 分支 + `subtitle` 预览）。

## 第一遍工作流

1. 打开对应卡牌目录、效果应用器 `src/game/engine/reducers.js` 的 `applyEffect`、
   纯规则 `src/game/engine/rules.js`，以及内容常量 `src/game/data/world.js` / `parties.js` / `factions.js`。
2. 读同类相邻卡牌，再读一两张某副的卡，保持跨副约定。
3. 判断这张卡是普通卡、条件卡、链条卡还是结果卡。
4. 用**最小改动**实现卡牌的设计意图。
5. 审计全部文本、`require`、`requireText`、效果字段、helper 用法、冷却、AP、注释。
6. 跑定向检索与校验命令。

有疑问时以仓库现状为准，不要凭记忆。约定不明时，先看已实现的行动卡、政府卡、党卡再决定。

---

## 统一代码风格

### 效果书写模式

**默认声明式补丁**。`effect` 返回一个补丁对象，由 `Eng.applyEffect` 统一写入：

```js
{
  id: 'az_balcone',
  deck: 'azione',
  name: { zh: '阳台演说', it: 'Il discorso dal balcone' },
  text: { zh: '……', it: '……' },
  cost: { ap: 1 },
  effect: { legitimacy: 3, order: { fervour: 4 }, support: [['artigiani', 'LEG', 2]] }
}
```

**只在需要读状态、算数值或分支时才用函数体**：

```js
effect: function (s) {
  var gain = s.laws.portofranco >= 2 ? 9 : 5;
  return { funds: gain * 20, economy: { traffic: gain * 0.3 } };
}
```

返回 `{ next: 'event_id' }` 开子事件，返回 `{}` 表示结果确认（仅限结果卡）。

函数体模式可用 `function (s) { ... }` 或箭头函数；状态参数由 `Card` 类型提供上下文类型。

### 每张卡有多个选项

**卡牌不是一次性效果，而是一次决策。** 每张卡都必须提供 2–3 个互斥选项（对齐参考实现的
`Card.effect -> { currentEvent: { options[] } }` 与 SDAAH 的 `@option` 分支）。
单一效果的卡不算完成。

```js
{
  id: 'az_xxxx',
  deck: 'azione',
  name: { zh, it },
  text: { zh, it },        // 局面描述，不是操作说明
  cost: { ap: 1 },
  require: function (s) { return true; },        // 可选：整张卡的可用性
  requireText: { zh, it },                       // 有 require 就必须有
  options: [
    { id: 'a', text: { zh, it }, preview: ['热度 ++', '合法性 +'], effect: { ... } },
    { id: 'b', text: { zh, it }, preview: ['...'], require: function (s) { ... },
      requireText: { zh, it }, effect: function (s) { ... } },
    { id: 'c', text: { zh, it }, preview: ['...'], effect: { ... } }   // 常见：不做 / 拒绝
  ]
}
```

**成本只在选定选项后扣除**，卡牌此时才弃置并进入冷却（`Eng.settleCard`）。
「返回」按钮取消选择，不扣费、不弃牌。

选项的设计要求：

- **每个选项都是真实的政治选择**，不是同一效果的不同强度。
- **必须有一个「不做」或「拒绝」的选项**，并且它也要付出代价（热度、异议、机会成本）。
  它不能是纯粹的空操作。
- `preview` 用 2–4 个短标签概括机械后果，供玩家在决策前比较。
- 选项文本写**你做什么**；`text` 写**局面是什么**。不要在两处重复。

### 卡牌字段顺序

```js
{
  id,                    // 稳定 ID，前缀见下表
  deck,                  // 'azione' | 'governo' | 'partito'
  ministry,              // 仅 governo：七个执政官席位之一
  name: { zh, it },
  text: { zh, it },
  cost: { ap, funds, arms },
  require: function (s) { return true; },        // 可选
  requireText: { zh, it },                       // 有 require 就必须有
  options: [ ... ]
}
```

- `ministry` 只出现在政府卡上，紧跟在 `deck` 后面。
- `cost` 紧跟在 `text` 后面，便于一眼审计 AP。
- 可选字段**只在真的用到时才写**。
- `cost.ap` 缺省即 0，但**普通卡一律显式写 `ap: 1`**。

### ID 前缀

| 前缀 | 用途 |
| --- | --- |
| `az_` | 行动卡 |
| `gv_` | 政府卡 |
| `pt_` | 党卡 |
| `ev_` | 事件（不属于卡牌，但同项目内共享命名空间） |

ID 一旦发布不得复用或改义。

### 效果字段顺序

补丁对象内部按此顺序分组：

1. **支出**：`funds`、`arms`、`militants`
2. **计数器与冷却**：`counters`、`flags`
3. **核心政治状态**：`legitimacy`、`support`、`parties`、`factions`、`unions`、`land`、`industry`、`laws`、`diplo`、`cabinet`、`coalitionMerge`、`splitList`、`boycott`、`runElection`
4. **秩序与军事**：`order`（`authority` / `garrison` / `fervour` / `squadre` / `violence` / `milizia` / `civicGuard` / `coup`）
5. **经济**：`economy`、`revenueBoost`、`districts`
6. **组织与日志**：`organizations`、`journals`
7. **流程**：`next`、`phase`、`forceEnding`、`forceEndingCheck`

示例：

```js
effect: {
  funds: -320, arms: -6,
  legitimacy: 4,
  support: [['operai', 'LEG', 3], ['portuali', 'LEG', 3]],
  factions: { sindacalisti: { dis: -10 } },
  laws: { lavoro: 1 },
  order: { fervour: 5, milizia: 180 },
  economy: { unemployment: -2 },
  journals: ['carta']
}
```

### 注释

- **卡牌文件里的注释一律英文**（对齐参考 skill）。面向玩家的文本才是 `{ zh, it }`。
- 注释写**意图、史实依据或反常的设计约束**，不写显而易见的赋值。
- 中文注释必须翻译或删除。

好注释：

```js
// De Ambris wrote the Charter; the sindacalisti gain influence whenever it is actually applied.
```

坏注释：

```js
// Add 3 to legitimacy.
```

> **迁移状态**：旧版的部分卡牌注释为中文。新增或改动的卡必须用英文；
> 存量注释在下次触碰该卡时一并英文化。

---

## 共享卡牌规则

除非下文某节明确例外，三副卡一律适用。

### 完整性

- 每张实现的卡必须加入所在目录的 `index.ts`，并能被 `Eng.CARD_BY_ID` 检索到。
- **每个可见选项都必须有真实效果**。
- 每个实质性选项必须改变状态、开子事件，或有意结束这张卡。
- 不得留下 WIP、占位、调试专用选项。
- 效果里不得出现 `console.log` / `console.warn`。
- 删除卡牌时，必须同步清理 `Eng.CARD_BY_ID`、牌库抽取、存档兼容与 `tools/smoke.js`。

### 双语文本

面向玩家的每个字段都必须有 `zh` 与 `it` 两份，且**描述同一个机械后果**：

- `name`
- `text`
- `requireText`
- 事件选项的 `text`、`preview` / `subtitle`

如果选项会结束卡牌、进入冷却、消耗军械或开启子事件，两种语言必须用同样的具体程度说出来。
`it` 同时充当历史语境的原文栏位（见 `src/lib/i18n.js` 的说明）。

### 前置条件与不可用原因

卡牌可能不可用时，用 `require` 表达条件，并**必须**给出 `requireText`：

```js
require: function (s) { return s.arms >= 6; },
requireText: { zh: '需要 6 点军械', it: 'Richiede 6 armamenti' },
```

不可这样：

- 在 `effect` 里静默失败
- 只在叙述文本里暗示成本
- 靠效果自己检查能否负担

卡牌不可打时，UI 会把 `requireText` 显示为 `✕ <原因>`。原因必须具体，不要写「条件不满足」。

**例外**：链条卡可以只在某个前置事件之后可见。这属于有意设计，但要保持结构清晰，
不显然时用英文注释说明。

### 成本与卡牌流转

- 行动卡、政府卡、党卡**普通卡一律 `ap: 1`**。
- 免费卡必须有明确的设计理由，并与相邻卡一致。
- 消耗 `funds` / `arms` 必须由 `require` + `requireText` 守卫。
- **不得**在效果里手动退还 AP 来模拟「取消」。
- **不得**手动把卡塞回手牌。
- 空操作选项仍可消耗卡牌并进入冷却——如果它代表的是一次有意的政治选择。
- 链内菜单的纯导航选项不应设置冷却。

### 冷却

- `ap` 是每月的行动力预算，不是冷却。
- 需要冷却的卡走 `flags` / `counters`，由效果写入。
- 冷却期内的可用性用 `require` 表达，并在 `requireText` 里说清还剩几个月。

### Helper 用法

**不得直接改写守恒分布。** 补丁由 `Eng.applyEffect` 分发到对应 helper：

| 补丁键 | 分发的 helper | 守恒规则 |
| --- | --- | --- |
| `support: [[阶层, 政党, Δ]]` | `R.shiftClassSupport` | 阶层行归一到 100 |
| `factions: { id: { inf, dis } }` | `R.normalizeFactions` | 四个派系影响力总和 100 |
| `unions` / `land` / `industry` | `Core.normalize` + 非负钳制 | 饼图各自总和 100 |
| `parties: { 党: Δ }` | 逐党钳制 0–100 | 非守恒（政党支持度是派生值） |
| `laws` / `order` / `economy` / `diplo` | 逐字段钳制到各自区间 | 非守恒 |

禁止这样：

```js
// 直接改守恒分布
var c = s.classes.operai;
c.support.LEG += 3;
```

必须这样：

```js
support: [['operai', 'LEG', 3]]
```

只有当字段**没有**现成 helper 时，才允许手动处理：克隆相关对象、钳制有界值、返回更新后的对象。

**阶层键**必须是 `W.CLASSES` 的 ID：`portuali` `operai` `artigiani` `borghesia` `impiegati`
`contadini` `clero` `rentiers` `regnicoli`。

**政党键**必须是 `W.PARTIES` 的 ID：`LEG` `AUT` `PAD` `PCR` `ANI` `FAS` `PSI`。
（自由党、意大利人民党、阜姆共产党已移除，票源并入上述七党。）

**派系键**必须是 `W.FACTIONS` 的 ID：`arditi` `sindacalisti` `futuristi` `fascisti`。

**执政官席位**必须是 `W.MINISTRIES` 的 ID：`esteri` `interno` `difesa` `finanze` `economia`
`lavoro` `istruzione`。

### 死字段

写一个效果字段之前，先确认它存在于 `GameState` 且被玩法或 UI 读取。

危险信号：

- 一个字段只被写、从不被读
- 已经有同义字段
- 卡牌写了与 reducer 期望不一致的嵌套形状
- 卡牌使用了它不拥有的临时 UI 字段

查法：`rg "字段名" src`

### 结果卡

结果专用子事件可以用空效果确认：

```js
effect: { }
```

**仅当状态变化已经在开结果事件之前发生过**时使用。实质性玩家选择不得用空效果。

---

## 行动卡（azione）

代表组织、社会、宣传、劳动与运动层面的操作。

### 设计规则

- `deck: 'azione'`，不写 `ministry`。
- 一律 `ap: 1`。
- `require` 检查可用性：冷却、事件门、年份门、组织前置、路线前置。
- `effect` 正常是声明式补丁；需要开链条时返回 `{ next: 'ev_xxx' }`。
- 成本必须由 `require` + `requireText` 表达。
- **不要**加「取消 / 返回手牌」类选项。

### 效果优先级

行动卡常见效果：

- 阶层支持：`support: [[阶层, 'LEG', Δ]]`（零和）
- 派系影响力 / 异议：`factions: { id: { inf, dis } }`
- 资源：`funds`、`arms`、`militants`
- 秩序：`order`
- 经济：`economy`
- 日志：`journals: ['carta']`
- 旗帜：`flags`

### 特别说明

- 媒体类卡不得保留已删除的选项；年份门必须匹配当前设计，而不是过时的史实门。
- 直接行动类选项若消耗军械，必须 `require: s => s.arms >= 1`。
- 阿迪蒂 / 未来主义派系的卡应同时给 `arditi` / `futuristi` 影响力，并压低 `sindacalisti` 异议或被其反对。

---

## 政府卡（governo）

代表执政官层级的政策、立法、外交、财政与制度冲突。

### 设计规则

- `deck: 'governo'`，**必须**写 `ministry`。
- 一律 `ap: 1`。
- 必须由 `require` 守卫：对应席位是否由玩家掌握。
  标准写法：`require: function (s) { return s.cabinet.economia === 'LEG'; }`
- 每个选项都要有 `preview`，2–4 个短标签
- `requireText` 要指出**缺的是哪个部**：`{ zh: '未掌握公共经济执政官席位', it: '...' }`
- `effect` 正常是声明式补丁或开子事件。
- **法律等级按设计刻度推进**，不要用大跳跃，除非法律模型本身就期待。
- 政策对象（`laws`）只写要改的键，不要整对象覆写。

### 效果优先级

政府卡触及高影响状态，尤其要严格：

- `laws` 等级与 `W.LAWS[].max` 边界
- `cabinet` 席位变更
- `diplo` 关系（逐国钳制 0–100）
- `economy` 各字段区间
- `unions` / `land` / `industry` 饼图守恒
- `coalitionMerge` / `splitList` / `runElection` 的选举前置
- `flags` 与后续事件门的命名一致性

### 特别卡

部分政府卡结构上有意不同。

#### 选举与组阁（`runElection` / `coalitionMerge`）

- `runElection: true` 会立即结算 1921 年选举法的 76 席。
- `coalitionMerge: { FAS: n }` 把法西斯并入军团兵名单，并让出 n 个席位权重。
- `splitList` 与 `boycott` 设置 `flags.legion_alone` / `flags.boycott`，改变名单结构。
- 这些卡**不需要**开子事件，但必须用英文注释说明它们改变了选举结构。

#### 阿伦戈与宪章（`gv_arengo`）

召开阿伦戈会同时动 `laws.statuto` 与 `legitimacy`，并解锁部分事件门。
改这张卡时检查 `ev_carta_dibattito` 的 `condition` 是否仍然可达。

---

## 党卡（partito）

代表军团兵运动**内部**的路线斗争与组织建设。党卡是四个派系的表达面。

### 设计规则

- `deck: 'partito'`，不写 `ministry`。
- 一律 `ap: 1`。
- `require` 通常检查派系影响力、组织是否成立、路线旗帜。
  标准写法：`require: function (s) { return s.factions.sindacalisti.inf >= 12; }`
  或 `require: function (s) { return s.organizations.reduci.active; }`
- **党卡必须改变派系影响力**——这是党卡与行动卡的分界线。
  一张只改阶层支持、完全不动派系的卡，应该改成行动卡。
- 路线互斥：给一派影响力必然从其他派扣，靠 `normalizeFactions` 保证总和 100。

### 效果优先级

- 派系影响力与异议（必有）
- 组织成立 / 激活：`organizations: ['reduci']`
- 党员：`militants`
- 旗帜：`flags`
- 阶层支持（次要）

### 特别说明

- **法西斯派的月度漂移是引擎机制**（`R.factionDrift`），不要在党卡里重复模拟它。
  党卡只能**加速或延缓**它：给 `fascisti: { inf: ±n }`。
- 与本地人和解的路线已经改由**政党支持度**表达（自治阵营），不再是派系。
  这类卡写 `support: [['borghesia', 'AUT', -n]]`，不要再引用已删除的 `fiumani` 派系。

---

## 特殊卡政策

**允许特殊结构，不允许特殊绕过。**

一张卡可以因为下列原因而特殊：

- 自定义 UI（本项目暂无）
- 链条 / 嵌套菜单
- 史实事件链
- 结果专用子事件
- 条件可见的选项

即使特殊，也必须满足：

- 双语文本
- 真实效果
- 正确的 helper
- 正确的 AP 与冷却行为
- 无死字段
- 英文注释
- 无调试输出

当一张特殊卡有意打破通用模式时，在异常代码附近或审计报告里用**英文**说明理由。

---

## 审计清单

### 结构

- 卡在对应目录独立文件内，并由 `index.ts` 汇总；`deck` 与前缀一致（`az_` / `gv_` / `pt_`）。
- 政府卡有 `ministry`，且是七个席位之一；行动卡与党卡没有。
- 字段顺序与相邻卡一致。
- 效果的字段顺序符合「效果字段顺序」一节。
- 需要读状态或分支时才用函数体模式。

### 文本

- `name` / `text` / `requireText` 都有 `zh` 与 `it`。
- 中意两种文本描述同一个机械后果。
- 所有会失败的 `require` 都有 `requireText`，且原因具体。
- 没有残留的「取消」「返回手牌」「WIP」文本。
- 卡牌文件内没有中文注释。

### 效果

- 每个可见效果字段都存在于 `GameState`。
- 守恒分布只通过补丁键修改，没有直接赋值。
- 阶层 / 政党 / 派系 / 席位键都在相应常量表里。
- 成本在文本与代码里一致。
- 法律等级不越过 `W.LAWS[].max`。
- 流程键（`next` / `phase` / `forceEnding`）写在最后。

### 流程

- 每张卡有 2–3 个互斥选项，且其中至少一个是「不做 / 拒绝」并付出代价。
- 选项文本写「做什么」，卡牌 `text` 写「局面是什么」，两处不重复。
- 卡牌效果与选项效果对「谁负责结束这张卡」意见一致。
- 普通卡消耗 1 AP，且不被手动退还。
- 没有手动把手牌塞回去。
- 党卡确实改变了派系影响力。

---

## 校验命令

改动前后都要跑定向检索。用 PowerShell。

列出卡牌与 ID：

```powershell
node tools/probe.js "Fiume.Cards.map(c => c.id + ' | ' + c.deck + ' | ' + c.options.length + ' opts').join('\n')"
```

查卡牌文件里的中文注释（应为空）：

```powershell
rg "//.*[\u4e00-\u9fff]" src/game/action_affairs src/game/government_affairs src/game/party_affairs
```

查直接改写守恒分布：

```powershell
rg "classes\[.*\]\.support\.[A-Z]+\s*[+\-]?=|factions\..*\.inf\s*[+\-]?=" src/game/action_affairs src/game/government_affairs src/game/party_affairs
```

查调试输出：

```powershell
rg "console\.(log|warn|error|debug)" src/game/action_affairs src/game/government_affairs src/game/party_affairs
```

查占位选项：

```powershell
rg "WIP|TODO|取消|返回手牌|placeholder" src/game/action_affairs src/game/government_affairs src/game/party_affairs
rg "options: \[\s*\{" src/game/action_affairs src/game/government_affairs src/game/party_affairs   # every card must start an options array
```

写字段前先查引用：

```powershell
rg "字段名" src
```

跑项目校验：

```powershell
node tools/smoke.js        # 引擎不变量 + 史实时点断言 + 卡牌可打性
node tools/verify_ui.js    # 无头 Chrome：逐页签渲染 + 打牌 + 跑到结局
```

`tools/smoke.js` 的 `playGame` 会随机打出手牌，因此**新增卡牌后必须重跑**——
它同时验证了「卡牌不会把状态打出合法区间」。

---

## 普通卡骨架

```js
  /* One English line on the historical basis for this decision. */
  card({
    id: 'az_esempio', deck: 'azione',
    name: { zh: '示例卡牌', it: 'Carta di esempio' },
    text: { zh: '一句话描述局面。', it: 'Una frase che descrive la situazione.' },
    cost: { ap: 1 },
    require: function (s) { return s.laws.portofranco >= 1; },
    requireText: { zh: '需要自由港法令至少 1 级', it: 'Richiede Porto Franco >= 1' },
    options: [
      { id: 'pieno', text: { zh: '照原样推进', it: 'Procedere come previsto' },
        preview: ['金库 −', '合法性 +', '商业派 +'],
        effect: { funds: -180, legitimacy: 2,
                  support: [['borghesia', 'LEG', 3], ['artigiani', 'LEG', 2]],
                  economy: { capitalConfidence: 6 } } },
      { id: 'parziale', text: { zh: '只做一半，把风险留给明年', it: 'Fare metà, rimandare il rischio' },
        preview: ['金库 −', '合法性 −', '工团派异议 −'],
        effect: { funds: -80, legitimacy: -2,
                  factions: { sindacalisti: { dis: -6 }, arditi: { dis: 8 } } } },
      { id: 'nulla', text: { zh: '这个月什么都不做', it: 'Questo mese non fare nulla' },
        preview: ['热度 −', '阿迪蒂异议 +'],
        effect: { order: { fervour: -4 }, factions: { arditi: { dis: 10 } } } }
    ]
  });
```

政府卡加 `ministry`，并把 `require` 换成席位检查 + 席位专用的 `requireText`：

```js
    require: function (s) { return s.cabinet.esteri === s.playerForce; },
    requireText: { zh: '未掌握外交执政官席位', it: 'Ministero degli Esteri non controllato' },
```

党卡必须至少有一个选项改动 `factions` 的影响力。

## 报告格式

审计时先按严重度分组，再写摘要。

每条问题包含：

- 卡牌 ID 与名称
- 问题类别：格式 / 缺效果 / 条件 / helper 用法 / 死字段 / 翻译 / 注释语言 / 冷却 / AP / 特殊卡流程
- 具体修法

列出卡牌效果时包含：

- 卡名（中文 + 意大利语）
- 前置条件（`require` + `requireText`）
- 效果补丁的字段摘要
- 中文效果摘要
- 任何特殊结构说明

如果没有严重问题，明确说明，并列出残留的特殊卡例外。

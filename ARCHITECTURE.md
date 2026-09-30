# Fiume o morte! 架构

本项目现以 `D:\cnt-fai-1931_-spanish-republic-simulator8.15` 的 React/Vite 分层为准：`index.html` 只提供挂载点，`src/main.tsx` 创建 React Root，`src/App.tsx` 组合游戏页面。运行与发布均通过 Vite；不能再用 `file://` 直接打开源码入口。

## 目录与依赖方向

```text
index.html → src/main.tsx → src/App.tsx
                            ├─ src/game/GameContext.tsx   React 状态容器与动作
                            ├─ src/components/*.tsx       开始、顶栏、侧栏、主内容、事件、弹窗、结局
                            ├─ src/map/MapView.tsx        地图页面边界
                            └─ src/index.css              统一样式入口

src/game/data/*.js          世界、政党、派系与元数据
src/game/*_affairs/*.ts     行动、政府与党派卡牌；每卡一文件，index.ts 汇总
src/game/advisors/*.ts      顾问；每人一文件，index.ts 汇总
src/game/events/*.ts        事件；每事一文件，index.ts 汇总
src/game/content/types.ts   内容的 TypeScript 格式定义
src/game/registries/*.ts    保留内容顺序并校验 ID，向现有引擎注册
src/game/engine/*.js        纯规则、状态转换、选择器与存档
src/map/data/*.js           地理数据
src/lib/core.js             数学、日期和基础工具
src/lib/i18n.js             中文界面词条与翻译接口
public/img/**               肖像、历史图片、党徽和 UI 素材
```

依赖方向是组件 → `GameContext` / 选择器 → 规则与内容。游戏状态由 `Engine.dispatch` 单点更新；界面页签、弹窗和所选地区留在 React 容器，不写入存档。`Sel.Save` 继续存取 `localStorage`，保持既有存档格式。

## 旧视图的 React 适配

目前 `src/legacy/ui/` 保存从旧静态版继承的绘图与页面描述逻辑。`src/game/runtime.ts` 只加载规则与内容；`src/legacy/ui/runtime.ts` 再加载地理数据和旧视图，依赖保持单向。`src/lib/legacyReact.tsx` 将旧视图生成的**未挂载节点**转换为 React 元素；所有实际页面节点由 React Root 挂载、更新和卸载。`src/legacy/ui/` 不能再直接向 `#root` 写入节点，也不承担应用状态管理。新功能应直接写成 `src/components/` 或 `src/map/` 的 React 组件，逐步替换旧视图描述逻辑。

这个适配层保存了目前的地图、图表、事件和卡牌界面行为。规则模块仍沿用已有 JavaScript 文件；迁移时优先维持模拟结果、存档兼容与史实时点。

## 静态资源

`public/img/Portrait/` 收纳全部人物肖像，文件统一使用 `Portrait_姓名` 式下划线命名；`public/img/UI/` 收纳 `leader_frame.png`、`diplo_details_header.png` 等纹样，`public/img/History/` 收纳史料照片，`public/img/Party/` 收纳政党图像。`public/img/manifest.json` 记录外部素材许可。Vite 将 `public/` 原样复制到构建产物根目录；图片路径依赖 HTML 的 `%BASE_URL%`，可用 `VITE_BASE_PATH` 部署到子目录。

地理数据已经从 `public/geo/` 迁到 `src/map/data/` 并参与 Vite 打包，与参考项目的地图源码分层一致。

## 运行与验证

```bash
npm install
npm run dev       # 本地 Vite 服务
npm run lint      # TypeScript 检查
npm test          # 引擎完整对局与不变量
npm run build     # 生产构建
npm run verify:ui # 构建后用 Chrome 测试页面与截图
```

`tools/verify_ui.js` 使用 Vite preview 检查开局、事件、导航、地图、卡牌、推进月份、结局和不同宽度的页面。样式入口为 `src/index.css`，当前按 `theme.css`、`app.css`、`flat.css`、`redesign.css` 的顺序导入。

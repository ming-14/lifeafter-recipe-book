# 明日之后食谱大全

《明日之后》游戏食谱查询工具，支持搜索、食材筛选、完成标记与懒加载。

## 功能

- **食谱搜索** — 按名称实时搜索
- **食材筛选** — 单击包含 / 双击排除，支持组合筛选
- **完成标记** — 勾选已制作食谱，数据持久化到 localStorage
- **仅未完成** — 一键过滤已完成食谱
- **懒加载** — 分批渲染，滚动自动加载更多
- **响应式** — 适配桌面与移动端

## 项目结构

```
├── index.html                # 页面结构
├── css/
│   ├── base.css              # 重置与基础排版
│   ├── layout.css            # 容器、头部、页脚
│   ├── controls.css          # 搜索框、筛选按钮、复选框
│   ├── filter-panel.css      # 食材筛选面板
│   ├── recipe-card.css       # 食谱卡片、食材标签
│   ├── animations.css        # 动画、懒加载样式
│   └── responsive.css        # 响应式适配
├── js/
│   ├── app.js                # 入口：初始化与事件绑定
│   ├── store.js              # 状态管理与 localStorage 持久化
│   ├── data.js               # 数据加载与食材提取
│   ├── filter.js             # 筛选逻辑（搜索/包含/排除）
│   ├── render.js             # 渲染函数（统计/卡片/面板）
│   └── lazyload.js           # 懒加载与 IntersectionObserver
├── data/
│   └── food_recipes.json     # 食谱原始数据
└── httpserver.cmd             # 本地服务器启动脚本
```

## 本地运行

本项目使用 ES Module，需通过 HTTP 服务器访问，不能直接用 `file://` 打开。

```bash
# 方式一：使用项目自带脚本
./httpserver.cmd

# 方式二：Python
python -m http.server 8080

# 方式三：Node.js (npx)
npx http-server -p 8080
```

然后访问 `http://localhost:8080`。

## 数据来源

食谱数据来源于 [网易大神](https://ds.163.com/)，数据更新至 2026 年初。

## 技术栈

- 原生 HTML / CSS / JavaScript（ES Module）
- 无第三方依赖
- localStorage 状态持久化
- IntersectionObserver 懒加载

## License

MIT

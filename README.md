# 紫微斗数知识分享

一个现代简约的紫微斗数知识分享平台，支持 GitHub Pages 部署。

## 功能特性

- **九宫格首页**：知识文章列表，卡片式展示
- **详情页**：完整的 Markdown 内容渲染
- **我的分享**：Markdown 编辑器 + 实时预览 + AI 智能排版
- **管理后台**：内容增删改查、字体大小调整、AI 接口配置

## 页面结构

| 页面 | 文件 | 说明 |
|------|------|------|
| 首页 | `index.html` | 九宫格知识列表 |
| 详情 | `detail.html` | 文章完整内容 |
| 分享 | `share.html` | Markdown 编辑器 |
| 后台 | `admin.html` | 管理面板 |

## 本地运行

```bash
cd ziwei
node server.js
```

然后访问 http://localhost:4000

## GitHub Pages 部署

1. 创建 GitHub 仓库
2. 将代码推送到仓库
3. 在仓库 Settings → Pages 中启用 GitHub Pages（选择 main 分支）
4. 在管理后台配置 GitHub 信息（仓库名、Token）

## 技术栈

- **前端**：HTML5 + CSS3 + 原生 JavaScript
- **样式**：现代简约风格，CSS 变量控制
- **Markdown**：marked.js 渲染
- **数据存储**：GitHub API（JSON 文件）
- **AI 排版**：OpenAI 兼容接口

## 数据文件

```
data/
├── settings.json   # 全局设置（字体、AI、GitHub 配置）
├── content.json    # 首页九宫格文章
└── share.json      # 我的分享文章
```

## 管理后台功能

- **概览**：系统状态一览
- **知识文章**：管理九宫格内容（增删改）
- **分享文章**：管理 Markdown 文章
- **字体设置**：分区域调整字体大小
- **AI 排版**：配置 AI 接口和提示词
- **GitHub**：配置仓库和 Token

## 许可

MIT

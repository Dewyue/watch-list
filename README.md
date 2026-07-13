# 剧集清单

手机端观影清单网页，数据存放在 GitHub 仓库的 JSON 文件中，改完提交后自动发布。

**在线访问：** https://dewyue.github.io/watch-list/

## 栏目说明

| 栏目 | 说明 |
|---|---|
| 正在看 | 当前在追的电影和电视剧 |
| 抓紧看 | 优先要看的 |
| 没看完 | 看到一半还没结束的 |
| 待看 | 计划要看但还没开始的 |
| 其他 | 动漫、漫画、纪录片等 |

前四个栏目内部分 **电影** 和 **电视剧** 两个子 Tab。电影按类别分组；电视剧可按国家、类别、平台三种方式分组。

## 如何编辑（手机）

### 方式一：GitHub App（推荐）

1. 打开手机 **GitHub App**，进入仓库 `Dewyue/watch-list`
2. 找到文件 [`data/watchlist.json`](data/watchlist.json)，点右上角铅笔图标编辑
3. 修改后填写 commit 说明，点 **Commit changes**
4. 等待约 1–2 分钟（Actions 构建完成），刷新网页即可看到更新

### 方式二：手机浏览器

1. 打开 https://github.com/Dewyue/watch-list
2. 进入 `data/watchlist.json` → 点铅笔图标编辑
3. 提交后等待自动部署

## 数据格式

主要编辑 [`data/watchlist.json`](data/watchlist.json)。栏目使用英文 key，避免中文 key 导致 JSON 出错：

| key | 中文 |
|---|---|
| `watching` | 正在看 |
| `urgent` | 抓紧看 |
| `unfinished` | 没看完 |
| `todo` | 待看 |

### 电影字段

```json
{
  "title": "片名（必填）",
  "genre": "类别（必填，用于分组）",
  "synopsis": "简介（可选）",
  "duration": "148分钟（可选）",
  "actors": ["演员A", "演员B"],
  "director": "导演名（可选）"
}
```

### 电视剧字段

```json
{
  "title": "剧名（必填）",
  "country": "美国（可选，按国家分组用）",
  "genre": "悬疑（可选，按类别分组用）",
  "platform": "Netflix（可选，按平台分组用）",
  "synopsis": "简介（可选）",
  "seasons": 2,
  "episodes": 16
}
```

### 其他（动漫/漫画/纪录片）

放在顶层 `others` 数组，`type` 取值：

| type | 含义 |
|---|---|
| `anime` | 动漫 |
| `manga` | 漫画 |
| `documentary` | 纪录片 |
| `star` | 演员作品（某演员出演的影视合集） |
| `other` | 其他 |

```json
{
  "title": "作品名（必填）",
  "type": "anime",
  "synopsis": "简介（可选）",
  "progress": "第 12 集 / 已完结（可选）"
}
```

## 常见 JSON 错误

- 最后一项后面**不要**加逗号
- 字符串必须用双引号 `"`，不能用单引号
- `actors` 是数组：`["演员A", "演员B"]`，不是字符串
- 数字字段 `seasons`、`episodes` 不要加引号

可用 [jsonlint.com](https://jsonlint.com) 检查语法。

## 本地开发

```bash
bun install
bun run dev
```

本地开发地址：http://localhost:5173

## 构建与部署

推送到 `main` 分支后，GitHub Actions 自动构建并发布到 GitHub Pages。

- 仓库：https://github.com/Dewyue/watch-list
- 网站：https://dewyue.github.io/watch-list/

首次部署需在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。

## 添加到手机主屏幕

1. 用 Safari / Chrome 打开网站
2. 选择「添加到主屏幕」
3. 之后可像 App 一样打开，支持离线查看（数据更新需联网刷新）

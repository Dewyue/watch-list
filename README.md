# 剧集清单

手机端个人观影清单：正在看、抓紧看、没看完、待看、其他。可在网页里改进度、增删条目，也可从 TMDB 自动补全简介与演员信息。数据保存在本机浏览器。

**在线访问：** https://dewyue.github.io/watch-list/

## 网页内编辑（推荐）

每条右侧点 **···** 即可操作：

| 栏目 | 可用操作 |
|---|---|
| 正在看 | 修改进度（季/集） |
| 抓紧看 | 移到正在看、删除 |
| 没看完 | 移到正在看、删除 |
| 待看 | 移到正在看、移到抓紧看、删除 |

修改保存在**本机浏览器**，立即生效。页面右上角 **数据** 可配置 TMDB API Key、导出/导入 JSON（换设备同步），或恢复默认清单。

### 添加新条目

每个栏目右上角有 **添加** 按钮：

1. 输入片名/剧名（支持中英文）
2. 点「搜索并添加」→ 自动从 TMDB 联网补全简介、演员、分类、国家、平台等
3. 若多个匹配结果，会列出供你选择
4. 搜不到时可点「仅添加名称（不联网）」

首次使用前，请在 **数据** 页免费注册 [TMDB](https://www.themoviedb.org/settings/api) 并保存 API Key。

打开网站后会**自动**对全部条目批量补全一次（底部有进度条）；也可在 **数据** 页点「一键补全全部条目」手动重跑。你的备注（`note`）和观看进度不会被覆盖。

开发者可用脚本更新种子数据：

```bash
TMDB_API_KEY=你的key bun run enrich
```

## 栏目说明

| 栏目 | 说明 |
|---|---|
| 正在看 | 当前在追的电影和电视剧 |
| 抓紧看 | 优先要看的 |
| 没看完 | 看到一半还没结束的 |
| 待看 | 计划要看但还没开始的 |
| 其他 | 动漫、漫画、纪录片等 |

前四个栏目中，**正在看 / 抓紧看 / 没看完** 为平铺列表；**待看** 分电影和电视剧子 Tab，按类别等分组（默认折叠）。

## 如何编辑（GitHub 批量维护）

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
  "synopsis": "简介（可选，TMDB 联网导入）",
  "note": "你自己的备注（可选，如「带点颜色」「周星驰」）",
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
  "synopsis": "简介（可选，TMDB 联网导入）",
  "note": "你自己的备注（可选）",
  "progress": "S1E2（可选，观看进度）",
  "actors": ["演员A", "演员B"],
  "seasons": 2,
  "episodes": 16
}
```

**进度写法：**

| 你备忘录里写的 | JSON 里填 |
|---|---|
| `1-2`、`8-2` | `S1E2`、`S8E2`（第几季第几集） |
| 单独数字 `4`、`6` | `S1E4`、`S1E6`（默认只有一季，数字是集数） |
| `1-` | `S1起`（从第1季开始看） |
| 多季剧集 `模范出租车3` | `第3季` |
| 待看整季 `9、10季` | `S9、S10` |

### 其他（动漫/漫画/纪录片）

放在顶层 `others` 数组，`type` 取值：

| type | 含义 |
|---|---|
| `anime` | 动漫 |
| `manga` | 漫画 |
| `documentary` | 纪录片 |
| `star` | 演员作品（用 `actor` 字段填写演员名作为分组标题） |
| `other` | 其他 |

```json
{
  "title": "作品名（必填）",
  "type": "anime",
  "synopsis": "简介（可选，TMDB 联网导入）",
  "note": "你自己的备注（可选）",
  "progress": "第 12 集 / 已完结（可选）",
  "duration": "120分钟（可选）",
  "actors": ["演员A"],
  "director": "导演名（可选）",
  "country": "日本（可选）",
  "genre": "动画（可选）",
  "platform": "B站（可选）",
  "seasons": 1,
  "episodes": 12
}
```

在 App 内点 **··· → 从 TMDB 补全详情**，可联网填充 `synopsis`、时长、主演、导演等；你的 `note` 不会被覆盖。

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

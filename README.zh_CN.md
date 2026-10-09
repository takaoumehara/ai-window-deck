[English](README.md) | [日本語](README.ja.md) | [Deutsch](README.de.md) | [Español](README.es.md) | [Français](README.fr.md) | [한국어](README.ko.md) | [Português (BR)](README.pt_BR.md) | **简体中文**

# AI Window Deck

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

**更多云端会话，更多思考空间。**

面向云端 Claude Code 与 Codex 的窗口管理器，同时推进多个项目也不会混乱。

一款 Chrome 扩展程序，适合需要同时并排使用多个 AI 工具和参考资料的人。保存经常一起使用的窗口，在画布上排好布局，一次性以平铺的 Chrome 窗口全部打开，并用一个快捷键将其中一个窗口放大突出显示。

你的 Chrome 个人资料、登录状态、密码管理器和其他扩展程序都保持原样。AI Window Deck 只负责排列普通的 Chrome 窗口。

<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="docs/images/focus-preview-en-dark.gif">
    <img src="docs/images/focus-preview-en-light.gif" width="720" alt="五个平铺的窗口。按 Alt+X 放大其中一个，再按一次即回到原来的位置。">
  </picture>
</p>

网站: <https://ai-window-deck.vercel.app/>

## 使用流程

| **① 注册 URL** | **② 布局** |
| --- | --- |
| <img src="site/assets/img/01-step1-urls.png" alt="① 注册 URL" width="400"> | <img src="site/assets/img/02-step2-layout.png" alt="② 布局" width="400"> |
| 为每个窗口保存名称和 URL，每个 URL 以标签页打开。 | 在画布上放置窗口，并调整其网格区域。 |
| **③ 聚焦视图** | **④ 启动** |
| <img src="site/assets/img/03-step3-focus.png" alt="③ 聚焦视图" width="400"> | <img src="site/assets/img/04-step4-launch.png" alt="④ 启动" width="400"> |
| 选择放大尺寸和基准位置：原地放大或居中。 | 选择显示器，按保存的布局打开 Chrome 窗口。 |

## 功能

- **窗口库。** 每个已保存的窗口都有一个名称和一个或多个 URL，这些 URL 会以标签页的形式打开。你可以逐个添加窗口，以文本形式批量粘贴，或导入、导出 `.txt` 文件。
- **布局画布。** 将窗口拖到 12 × 12 的画布上，并可从任意边缘调整大小。可选布局包括自动、纵向、横向、网格、焦点（一个大窗口）和自由。画布支持撤消和重做，还可以保存多个布局预设（A、B……）。
- **启动与重新平铺。** 点击一次即可打开布局中的所有窗口，并将其平铺到你选择的显示器上，同时为标签页分组。*重新平铺* 会把已启动的窗口移回原位。
- **Spotlight。** `Alt+X` 可放大当前窗口：宽高各一半、半宽全高、四分之三、仅全高、全屏或自定义大小。你可以选择从窗口当前位置放大，还是在屏幕中央放大。再次按 `Alt+X` 或按 `Alt+Z`，即可将其放回原来的平铺位置。
- **在窗口间切换。** 切换到上一个或下一个窗口，聚焦窗口 1–8，撤消上一次排列，以及切换全屏。
- **多显示器。** 选择在哪一台或哪几台显示器上打开窗口组。
- **浮动控制器与大窗口。** 可以保持一个紧凑的控制器常开，也可以在独立窗口中打开设置。
- **备份。** 以 JSON 文件备份或恢复所有窗口、布局和设置。
- **8 种语言。** English、日本語、Deutsch、Español、Français、한국어、Português (Brasil) 和简体中文。在你手动选择语言之前，面板会跟随浏览器语言。

<p align="center"><img src="site/assets/img/05-focus-enlarge.png" width="720" alt="聚焦放大对比：左为原地放大，右为居中"></p>
<p align="center"><em>原地放大 / 居中 —— 在第 ③ 步选择基准位置。</em></p>

## 安装

### Chrome 应用商店

可从 [Chrome 应用商店](https://chromewebstore.google.com/detail/ai-window-deck/hnadegmlbljffcogkclppfdcaiijjcgc) 安装。

### 通过发布版 ZIP 安装

1. 从 [Releases](https://github.com/takaoumehara/ai-window-deck/releases) 下载 `AI-Window-Deck-vX.Y.Z.zip` 并解压。
2. 打开 `chrome://extensions`，开启 **开发者模式**。
3. 点击 **加载已解压的扩展程序**，然后选择解压后的文件夹。

### 从源代码安装

```sh
git clone https://github.com/takaoumehara/ai-window-deck.git
cd ai-window-deck
npm install
npm run build
```

然后使用 **加载已解压的扩展程序** 加载仓库文件夹（即包含 `manifest.json` 的文件夹）。由于 `dist/` 已提交到仓库中，刚克隆下来的仓库无需构建也可以直接加载。

## 使用方法

1. 点击工具栏图标。首次运行时，会有一个简短的指南标出三个步骤。
2. 在 *选择目标显示器* 中 **选择显示器**。
3. 在 *窗口* 侧边栏中点击 **+** **注册窗口**：填写名称以及一个或多个 URL。
4. **将窗口拖到画布上。** 设置所需的窗口数量，选择布局，并从边缘调整各个窗格的大小。
5. 点击 **启动**。每个窗口都会在各自的 Chrome 窗口中打开，并按画布布局平铺。
6. 工作时使用 Spotlight 和导航快捷键。

提示：

- 在侧边栏中，双击窗口卡片或在卡片上按 `Enter` 即可编辑，按 `Delete` 则删除。
- 对话框可按 `Escape` 关闭，键盘焦点会回到打开该对话框的按钮上。
- *在大窗口中打开* 会以比工具栏弹出窗口更宽敞的尺寸打开同一个面板。

### 键盘快捷键

| 命令 | 默认快捷键 |
| --- | --- |
| Spotlight：放大当前窗口 / 放回其平铺位置 | `Alt+X` |
| 将窗口放回最初所在的平铺位置 | `Alt+Z` |
| 排列（重新平铺）窗口组中的窗口 | `Alt+A` |
| 全屏 / 退出全屏 | `Alt+Q` |
| 撤消上一次排列 | 未设置 |
| 下一个窗口 / 上一个窗口 | 未设置 |
| 聚焦窗口 1–8 | 未设置 |

Chrome 只允许扩展程序建议四个默认快捷键。你可以在 `chrome://extensions/shortcuts` 中分配或更改其中任意快捷键；面板中的 *更改快捷键* 链接会打开该页面。在 macOS 上，Chrome 会将 `Alt` 显示为 `⌥`。

## 权限与隐私

| 权限 | 用途 |
| --- | --- |
| `tabs` | 将已保存的 URL 以标签页形式打开，并读取已打开窗口的标题和 URL，以便列出和排列这些窗口。 |
| `tabGroups` | 为窗口组打开的每个窗口的标签页组设置名称和颜色。 |
| `storage` | 保存你的窗口、布局和偏好设置。 |
| `system.display` | 读取显示器的尺寸和位置，以便将窗口平铺到正确的显示器上。 |

AI Window Deck 没有主机权限，也没有内容脚本，不会读取网页内容。它不发起任何网络请求，也不加载远程代码。没有数据分析，也不需要账号。设置通过 `chrome.storage.sync` 存储，因此如果你开启了 Chrome 同步，Chrome 可以在你自己的设备之间同步这些设置。用于撤消的临时状态保存在 `chrome.storage.session` 中。任何数据都不会发送给开发者或第三方。

完整的隐私政策请参阅 [PRIVACY.md](PRIVACY.md)。

## 开发

需要 Node.js 20+ 和 Python 3。

```sh
npm install           # dependencies
npm run build         # build the React panel into dist/
npm test              # unit tests (node --test)
npm run dev           # Vite dev server for the panel (no chrome.* APIs)
./tools/package.sh    # build, validate and zip AI-Window-Deck-v<version>.zip
```

仓库结构：

| 路径 | 内容 |
| --- | --- |
| `manifest.json`, `background.js` | 扩展程序清单和 Service Worker（窗口放置、快捷键） |
| `src/` | 弹出窗口和选项页面使用的 React + Tailwind 面板 |
| `dist/` | 构建后的面板。已提交到仓库中，因此仓库可以按原样以“已解压”方式加载 |
| `identify.html`, `identify.js` | 识别显示器时在该显示器上短暂显示的编号 |
| `_locales/`, `tools/strings.json`, `tools/ui-strings.json` | 翻译（见下文） |
| `tools/` | i18n 构建、打包、包校验 |
| `store-assets/` | Chrome 应用商店的商品详情文案、屏幕截图、宣传图块和截图脚本 |
| `test/` | 单元测试 |

`deck.html`、`deck.js`、`dock.html` 和 `dock.js` 是 1.7 之前版本的面板。保留它们仅供参考，不会被打包。

### 翻译

面板文本位于 `tools/ui-strings.json`。Chrome 自身使用的文本（扩展程序说明和快捷键名称）位于 `tools/strings.json`。编辑其中任一文件后，请运行：

```sh
python3 tools/build-i18n.py
```

该命令会重新生成 `src/lib/ui-strings.js` 和 `_locales/*/messages.json`。如果某个面板语言缺少键，构建会失败。`npm test` 还会检查所有语言中的占位符是否一致。

## 发布流程

1. 在 `manifest.json` 和 `package.json` 中提升 `version`，并更新 `CHANGELOG.md`。
2. 运行 `npm test` 和 `./tools/package.sh`。该脚本会校验 ZIP：引用的文件、每个语言中的 `__MSG_` 键以及说明的长度。
3. 将 ZIP 上传到 Chrome 应用商店开发者信息中心。
4. 商店批准该版本后，在 `main` 上打 `vX.Y.Z` 标签，并将 ZIP 附加到 GitHub Release。

详情请参阅 [docs/RELEASING.md](docs/RELEASING.md)。

## 支持

请在 [GitHub Issues](https://github.com/takaoumehara/ai-window-deck/issues) 上报告问题和提出建议。

如果 AI Window Deck 对你的日常工作有帮助，欢迎在 [Ko-fi](https://ko-fi.com/G2G71VP1DF) 上支持开发。

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/G2G71VP1DF)

## 许可证

[MIT](LICENSE) © 2026 Takao Umehara

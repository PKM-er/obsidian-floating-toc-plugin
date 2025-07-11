# Changelog

## 2.7.0 (2025-07-11)
### #142 #135  fixed
 Supports title search. Default shortcut key `alt+f` activates.
### #140 #142 fixed
增加一个选项    可以设置 指示条旁边显示标题的背景色
### fix: 修复嵌入笔记右侧留空问题
#139
### Update manifest.json and CHANGELOG.md for version 2.6.5


## 2.6.5 (2025-04-01)
### #133 fixed
### Update manifest.json and CHANGELOG.md for version 2.6.4


## 2.6.4 (2025-03-28)
### 修复修改设置后不生效
### Update manifest.json and CHANGELOG.md for version 2.6.3


## 2.6.3 (2025-03-28)
### #132 fixed
### Update manifest.json and CHANGELOG.md for version 2.6.2


## 2.6.2 (2025-03-27)
### Update manifest.json
### Merge branch 'master' of https://github.com/PKM-er/obsidian-floating-toc-plugin
### fixed console error
### Update README-zh_cn.md
### Update README.md
### Update CHANGELOG.md
### Update manifest.json
### Merge branch 'master' of https://github.com/PKM-er/obsidian-floating-toc-plugin
### Update manifest.json and CHANGELOG.md for version 2.6.0


## Floating TOC 2.6.1 重装升级

### 核心架构改进
- **设置页重构**：核心设置不再依赖 Style Setting 插件，提升独立性和稳定性
- **性能优化**：大文档加载机制改进，显著提升目录创建效率

### 新增样式选项
新增多种浮动目录视觉样式，可通过以下开关控制：
- `default-bar-style` - 默认条状样式
- `enable-edge-style` - 边缘贴合样式（Dropbox风格）
- `enable-bar-icon` - 显示条状图标
- `enable-bold-bar` - 加粗条状样式
- `enable-dot-style` - 圆点样式
- `enable-square-style` - 方形样式
- `enable-vertical-line-style` - 垂直线样式
- `enable-hollow-line-style` - 空心线样式

### 交互功能增强
- **一键折叠按钮**：新增快速折叠/展开全部标题的功能
- **自动隐藏**：增加启动时自动隐藏 Floating TOC 的设置选项
- **悬停灵敏度**：优化 hover 触发逻辑，减少误触发
- **隐藏控制**：支持通过 `cssclass hide-floating-toc` 在特定笔记中隐藏 TOC

## 实用功能优化
- **复制 TOC 改进**：
  - 复制的目录结果现在是双链可导航形式
  - 与 Better PDF Export 插件配合可导出带导航目录的文档
- **宽度自适应**：
  - 智能判断标题长度，短标题不再占用多余空间
- **配色系统**：
  - 默认使用主题配色
  - 仍支持通过 Style Setting 进行个性化配色

 如何调整为sspai风格： 浮动位置选择 left, 目录标题单行显示，指示条样式bold，在指示条旁边显示标题上下级。
## 2.6.0 (2025-03-25)
### 增加一键折叠按钮，优化大文档加载性能
修改复制标题功能为复制TOC目录
优化大文档目录生成效率
当目录pin的时候编辑器缩进会参考浮动目录实际宽度。
### Update manifest.json and CHANGELOG.md for version 2.5.3


## 2.5.3 (2025-03-24)
### 增加 bold 样式
感谢 @QuestionWorks 的贡献。
### Update manifest.json and CHANGELOG.md for version 2.5.2


## 2.5.2 (2025-03-22)
### #129 #125 fixed
### Update manifest.json
### Merge branch 'master' of https://github.com/PKM-er/obsidian-floating-toc-plugin
### Update manifest.json and CHANGELOG.md for version 2.5.0


## 2.5.0 (2025-03-17)
### #123 #121 #120 优化大文档下性能表现
### Update manifest.json and CHANGELOG.md for version 2.4.9


## 2.4.9 (2025-03-17)
### Update main.ts

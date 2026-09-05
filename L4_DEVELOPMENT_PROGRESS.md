# L4 从零重写开发进度

## 定义

L4 指算法级重写：保留原站运行时捕获、截图和资源作为真值，但运行时不再依赖原站 bundle、提取后的 Shader 或原站框架实现。重写后的代码必须能独立解释每一个输入、数学步骤、时间窗口和输出。

当前项目是混合状态：React 页面结构、Road 时间线、Canvas 逻辑和调试面板已经重构；Hero 主 Shader 位于 `src/glsl/hero_main_fragment.glsl`，因此属于移植，不属于 L4。

## 当前分层

| 模块 | 当前状态 | L4 状态 | 说明 |
| --- | --- | --- | --- |
| Hero 视频与首屏 mask | 移植 + React 驱动 | 未开始 | 仍使用提取 Shader 的完整实现 |
| Hero transition modes | 移植 | 未开始 | 多个 mode 混在同一个 fragment shader |
| Paper / Plan / Tree | 移植 + 参数重构 | 未开始 | 参数已由 CPU 时间线驱动，但算法来源未独立验证 |
| Fly / Transition 序列帧 | React Canvas 重构 | 部分完成 | Canvas 绘制逻辑已独立，素材仍是镜像资源 |
| Footer WebGL transition | 移植 + React 驱动 | 未开始 | 仍依赖提取后的 transition shader 语义 |
| Ink SVG filter | React/SVG 重构 | 部分完成 | alpha 合成链已明确，尚缺独立算法说明与 demo |
| Application 3D 表单 | React/CSS 重构 | 部分完成 | 视觉交互独立实现，尚无单独原理 demo |
| Road 时间线 | 重构 | 部分完成 | 逻辑已抽象，但章节常量仍分散在多个组件 |

## 转为 L4 还需要做什么

### P0：建立可验证的 L4 基线

- [ ] 保留原站各章节截图、运行时 Shader、uniform 快照和滚动位置作为 `SOURCE` 真值。
- [ ] 为每个场景建立 start / hold / exit 时间表，并统一收敛到一个 scene config。
- [ ] 明确标注每段代码是 `SOURCE`（直接提取）、`PORT`（移植）还是 `REWRITE`（从零重写）。
- [ ] 建立本地与原站的固定 viewport、固定 hero film、固定时间点验证脚本。
- [ ] 记录每个重写模块的已知差异，不把视觉相似误认为算法等价。

### P1：重写 Hero Shader

- [ ] 将一个全屏 Shader 拆成独立的坐标、cover、噪声、遮罩、色彩和合成函数。
- [ ] 为每个 `uMode` 单独建立 pass 或独立 demo：breathe、slabs、halftone、noise warp、diagonal burn 等。
- [ ] 重新定义 typed 参数对象，替代 `uRay1`、`uEndF` 这类压缩语义的 vec4 参数。
- [ ] 把 CPU uniform 驱动整理为 `HeroShaderParams`，说明每个参数的单位、范围、来源和时间窗口。
- [ ] 使用原生 WebGL2 重写至少一个核心效果，不导入提取的 fragment shader。
- [ ] 通过截图、边界帧和固定 seed 验证坐标、噪声、遮罩前沿和颜色合成。

### P1：重写 Canvas 与序列帧系统

- [ ] 把帧索引、预加载、最近可用帧兜底、交叉淡化和 chroma-key mask 分成独立模块。
- [ ] 用状态图说明 `idle -> preload -> active -> fallback -> ready` 的转换。
- [ ] 为桌面与移动端定义同一套逻辑帧进度和不同的资源 tier 选择规则。
- [ ] 用离线 fixture 测试首帧、尾帧、缺帧、快速滚动和资源延迟，不依赖真实网络速度。

### P2：重写 Footer、Ink 与 Application

- [ ] Footer transition 改成独立 WebGL demo，并记录纹理输入、转场 progress 和输出合成。
- [ ] Ink filter 改成可单独运行的 SVG/WebGL demo，解释噪声、阈值、位移和 alpha composite。
- [ ] Application 表单将 CSS 透视、hover depth、orbit geometry 和提交状态拆成可学习模块。
- [ ] 为每个模块提供一张原站截图、一张重写结果图和差异说明。

### P2：代码可学习化

- [ ] 将 `src/index.css` 从单行生产 CSS 拆成 tokens、layout、navigation、scene、application、responsive 文件。
- [ ] 将重复的 `5350`、`3900`、`4650` 等时间常量移入统一的 `scene-config.js`。
- [ ] 给组件补充“输入 / 输出 / 所属时间段 / 渲染层 / 资源依赖”文档。
- [ ] 给 Shader 补充 uniform 表、坐标系示意、伪代码和逐函数注释。
- [ ] 增加单元测试、固定截图测试和资源完整性检查。

## L4 验收标准

只有同时满足以下条件，模块才可标记为 `L4 / REWRITE`：

1. 运行时不读取原站 bundle，也不直接 import 提取 Shader。
2. 算法输入、坐标变换、时间推进、噪声/遮罩/合成步骤均有文档。
3. 至少有固定 viewport 下的首帧、中间帧、边界帧对比结果。
4. 资源延迟、缺帧、移动端和 prefers-reduced-motion 状态有验证记录。
5. 允许呈现细节不同，但必须明确写出“算法一致”或“仅行为相似”，不夸大还原程度。
6. 重写 demo 可以脱离当前 Pear.No 页面单独运行。

## 推荐目录

```text
recon/
  evidence/             # 原站截图、uniform、Shader 和网络证据
  docs/                 # 组件原理与来源说明
ports/
  hero-breathe/         # L4 独立重写 demo
  hero-burn/
  footer-transition/
  ink-reveal/
src/
  reconstruction/       # 页面级复刻代码
  shaders/              # 解释后的重写 Shader
```

当前优先级是：先完成 `hero-breathe` 或 `hero-burn` 一个独立 L4 demo，再以同样的方法扩展到 Canvas、Footer 和 Application。不要先把所有代码重命名或格式化，却没有可验证的算法重写结果。

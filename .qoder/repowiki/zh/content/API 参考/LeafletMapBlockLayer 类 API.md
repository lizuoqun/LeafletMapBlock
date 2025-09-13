# LeafletMapBlockLayer 类 API

<cite>
**本文档中引用的文件**  
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L1-L78)
- [@types/leaflet/index.d.ts](file://node_modules/@types/leaflet/index.d.ts#L1760-L1769)
</cite>

## 目录
1. [简介](#简介)
2. [构造函数](#构造函数)
3. [配置选项详解](#配置选项详解)
4. [createTile 方法机制](#createtile-方法机制)
5. [生命周期方法与执行顺序](#生命周期方法与执行顺序)
6. [实际应用示例](#实际应用示例)
7. [与地图事件的同步机制](#与地图事件的同步机制)

## 简介
`LeafletMapBlockLayer` 是一个基于 Leaflet 的自定义图层类，继承自 `L.GridLayer`，用于在地图上渲染带有边框和坐标标注的瓦片网格。该图层通过 Canvas 技术动态生成每个瓦片，标注其 `x`、`y`、`z` 坐标，适用于地图服务调试、分块逻辑验证和可视化分析。

该图层特别适用于排查地图瓦片加载异常、坐标映射错误或缩放层级错位等问题，通过高对比度的边框和文本标注，直观展示瓦片分布。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L1-L10)

## 构造函数
```typescript
new LeafletMapBlockLayer(options?: LeafletMapBlockOptions)
```

该构造函数接受一个可选的配置对象 `options`，用于自定义图层的视觉样式。若未传入参数，则使用内置的默认值。

构造函数调用父类 `L.GridLayer` 的构造方法，并合并用户传入的配置项与默认值，形成最终的图层配置。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L28-L35)

## 配置选项详解
`LeafletMapBlockLayer` 支持以下配置项，均通过 `CanvasLayerOptions` 接口定义，继承自 `L.GridLayerOptions`。

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| `color` | `string` | `'red'` | 瓦片边框的颜色，接受任何有效的 CSS 颜色值（如 `'#ff0000'`、`'rgb(255,0,0)'`）。 |
| `weight` | `number` | `2` | 边框线宽，单位为像素。 |
| `lineDash` | `number[]` | `[5, 5]` | 虚线样式，数组 `[a, b]` 表示线段长 `a`、间隔 `b`。`[0, 0]` 表示实线。 |
| `font` | `string` | `'12px Arial'` | 文本字体配置，格式为 `'字号 字体族'`，如 `'14px sans-serif'`。 |
| `textColor` | `string` | `'black'` | 坐标文本的颜色。 |
| `textSize` | `number` | `12` | 文本字号，单位为像素。注意：此值通过 `font` 字符串整体设置，不可单独配置。 |
| `showGridText` | `boolean` | `true` | 是否显示瓦片坐标文本（`x,y,z`）。 |

> **注意**：文档中提到的 `color`、`weight`、`font`、`textColor`、`textSize` 在源码中对应的键名为 `strokeStyle`、`lineWidth`、`gridFont`、`gridTextColor`。`textSize` 并非独立配置项，而是 `gridFont` 字符串的一部分。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L11-L25)
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L30-L35)

## createTile 方法机制
`createTile(coords: {x: number, y: number, z: number}, done: Function)` 方法是 `L.GridLayer` 的核心生命周期方法，被 `LeafletMapBlockLayer` 重写以实现自定义瓦片渲染。

### 调用时机
此方法在以下情况下被 Leaflet 框架自动调用：
- 地图初始化时，加载初始视图范围内的瓦片。
- 用户进行地图平移或缩放操作后，需要加载新的瓦片时。
- 图层被添加到地图上时，触发首次瓦片加载。

### 参数说明
- `coords`: 一个包含 `x`、`y`、`z` 属性的对象，表示当前瓦片的坐标。
  - `x`, `y`: 瓦片在当前缩放层级下的行列索引。
  - `z`: 当前地图的缩放级别（zoom level）。
- `done`: 一个回调函数，用于通知 Leaflet 瓦片已准备就绪。**在本实现中，该回调未被使用**，因为 Canvas 瓦片的创建是同步的，无需异步通知。

### 执行流程
1. 创建一个 `<canvas>` 元素，并赋予类名 `my-leaflet-tile`。
2. 设置画布尺寸为 `this.getTileSize()` 返回的值（通常为 256x256 像素）。
3. 获取 2D 绘图上下文 `ctx`。
4. 根据配置项设置绘图样式：
   - 使用 `ctx.strokeStyle` 和 `ctx.lineWidth` 设置边框颜色和宽度。
   - 使用 `ctx.setLineDash()` 设置虚线样式。
   - 调用 `ctx.strokeRect()` 绘制矩形边框。
5. 如果 `showGridText` 为 `true`，则：
   - 设置文本填充色和字体。
   - 调用 `ctx.fillText()` 在画布左上角附近绘制坐标文本。
6. 直接返回创建好的 `HTMLCanvasElement`。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L37-L77)

## 生命周期方法与执行顺序
`LeafletMapBlockLayer` 继承自 `L.GridLayer`，其生命周期由 Leaflet 框架管理。关键方法的执行顺序如下：

1. **构造函数 (`constructor`)**:
   - 初始化图层实例，合并配置选项。
   - 调用 `super(data)` 初始化父类。

2. **`onAdd(map)` (继承自 `L.Layer`)**:
   - 当图层通过 `map.addLayer()` 添加到地图时调用。
   - 负责将图层容器（通常是 `div`）添加到地图的 DOM 结构中。
   - 触发图层的首次瓦片加载。

3. **`createTile(coords, done)`**:
   - 由 `L.GridLayer` 内部调度，为每一个需要的瓦片坐标调用。
   - 如上所述，负责创建并绘制单个 Canvas 瓦片。

4. **`_reset()` (继承自 `L.GridLayer`)**:
   - 当地图视图重置（如地图容器大小改变或图层被重新添加）时调用。
   - 会清空当前所有瓦片，并根据新的视图范围重新调用 `createTile` 加载瓦片。

5. **`onRemove(map)` (继承自 `L.Layer`)**:
   - 当图层从地图中移除时调用。
   - 清理 DOM 元素和事件监听器。

`createTile` 是唯一被重写的方法，其他方法均使用父类的默认实现。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L28-L77)
- [@types/leaflet/index.d.ts](file://node_modules/@types/leaflet/index.d.ts#L1769)

## 实际应用示例
以下示例展示如何使用 `LeafletMapBlockLayer` 并自定义样式，以辅助排查地图服务问题：

```typescript
import { LeafletMapBlockLayer } from './lib/LeafletMapBlock';

// 自定义配置，用于高亮显示瓦片边界，便于调试
const debugOptions = {
    strokeStyle: '#0000ff', // 蓝色边框，更醒目
    lineWidth: 3,           // 更粗的线宽
    lineDash: [8, 4],       // 更明显的虚线
    gridTextColor: '#ff0000', // 红色文本
    gridFont: '14px Verdana', // 更大的字体
    showGridText: true
};

// 创建并添加图层
const blockLayer = new LeafletMapBlockLayer(debugOptions);
map.addLayer(blockLayer);
```

此配置能清晰地暴露瓦片拼接处的缝隙或错位，帮助开发者快速定位地图服务或投影配置的问题。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L5-L9)

## 与地图事件的同步机制
`LeafletMapBlockLayer` 通过继承 `L.GridLayer`，自动与地图的 `move` 和 `zoom` 事件同步更新。

- **平移 (Pan)**: 当用户拖动地图时，Leaflet 会触发 `move` 事件。`L.GridLayer` 监听此事件，计算当前视图范围内需要的新瓦片坐标，并调用 `createTile` 为这些新坐标生成瓦片。旧的、已移出视图的瓦片会被自动回收。
- **缩放 (Zoom)**: 当用户缩放地图时，会触发 `zoom` 事件。`L.GridLayer` 会根据新的缩放级别 `z` 重新计算瓦片网格，并加载对应层级的瓦片。同时，`_reset()` 方法会被调用，确保瓦片网格正确对齐。

这种机制确保了 `LeafletMapBlockLayer` 能够实时、无缝地响应地图的任何视图变化，始终保持瓦片标注的准确性和实时性。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L37-L77)
- [@types/leaflet/index.d.ts](file://node_modules/@types/leaflet/index.d.ts#L1769)
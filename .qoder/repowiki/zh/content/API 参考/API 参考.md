# API 参考

<cite>
**Referenced Files in This Document**   
- [LeafletManyPoint.ts](file://src/lib/LeafletManyPoint.ts)
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts)
</cite>

## 目录
1. [ManyMarkersCanvas 类](#manymarkerscanvas-类)
2. [MarkerPointOptions 接口](#markerpointoptions-接口)
3. [LeafletMapBlockLayer 类](#leafletmapblocklayer-类)
4. [CanvasLayerOptions 接口](#canvaslayeroptions-接口)

## ManyMarkersCanvas 类

`ManyMarkersCanvas` 是一个基于 Leaflet 的自定义图层类，用于在地图上高效渲染大量标记点（包括图标和文本）。它通过扩展 `L.Layer` 实现，利用 HTML5 Canvas 进行绘制，以优化性能。

### 构造函数
```typescript
new ManyMarkersCanvas(points: MarkerPointOptions[])
```
- **参数**:
  - `points`: 一个 `MarkerPointOptions` 对象数组，定义了所有要渲染的标记点。

**Section sources**
- [LeafletManyPoint.ts](file://src/lib/LeafletManyPoint.ts#L19-L25)

### 方法

#### addTo(map)
将 `ManyMarkersCanvas` 图层添加到指定的地图实例中。
- **参数**:
  - `map`: `L.Map` 实例，表示目标地图。
- **返回值**: 返回 `this`，支持链式调用。
- **功能**: 除了将图层添加到地图，此方法还会初始化图标的点击和悬停事件监听器。

[SPEC SYMBOL](file://src/lib/LeafletManyPoint.ts#L35-L38)

#### redraw()
强制重新绘制整个图层。此方法会清除画布并重新渲染所有可见的图标和文本。
- **功能**: 当标记点数据或地图视图发生变化时，调用此方法可确保图层内容更新。

[SPEC SYMBOL](file://src/lib/LeafletManyPoint.ts#L55-L57)

## MarkerPointOptions 接口

该接口定义了单个标记点的数据结构。

### 属性
- `lat`: `number` - 标记点的纬度。
- `lng`: `number` - 标记点的经度。
- `title`: `string` - 显示在图标下方的文本标签。
- `icon`: `string` - 图标的 URL 或 SVG 字符串。
- `iconSize`: `number[]` - 图标的尺寸，格式为 `[宽度, 高度]`。
- `onIconClick?`: `(item: MarkerPointOptions) => void` - 点击图标时触发的回调函数。
- `onIconMouseOver?`: `(item: MarkerPointOptions) => void` - 鼠标悬停在图标上时触发的回调函数。
- `onIconMouseOut?`: `(item: MarkerPointOptions) => void` - 鼠标从图标上移开时触发的回调函数。

**Section sources**
- [LeafletManyPoint.ts](file://src/lib/LeafletManyPoint.ts#L8-L17)

## LeafletMapBlockLayer 类

`LeafletMapBlockLayer` 是一个继承自 `L.GridLayer` 的自定义图层，用于在地图的每个瓦片上绘制网格线和坐标信息。

### 构造函数
```typescript
new LeafletMapBlockLayer(options?: CanvasLayerOptions)
```
- **参数**:
  - `options` (可选): 一个 `CanvasLayerOptions` 对象，用于配置网格的外观。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L30-L35)

### 方法

#### createTile(coords)
此方法是 `L.GridLayer` 的核心方法，由 Leaflet 在需要渲染新瓦片时自动调用。
- **参数**:
  - `coords`: 包含瓦片坐标 (`x`, `y`) 和缩放级别 (`z`) 的对象。
- **返回值**: 一个配置好的 `HTMLCanvasElement`，作为地图瓦片。
- **功能**: 创建一个画布元素，并在其上绘制一个带边框的矩形。如果 `showGridText` 选项为 `true`，则还会在瓦片上绘制其坐标信息（x, y, z）。

[SPEC SYMBOL](file://src/lib/LeafletMapBlock.ts#L37-L76)

## CanvasLayerOptions 接口

该接口扩展了 `L.GridLayerOptions`，定义了 `LeafletMapBlockLayer` 的配置选项。

### 属性
- `strokeStyle?`: `string` - 网格线的颜色，默认为 `'red'`。
- `lineWidth?`: `number` - 网格线的宽度，默认为 `2`。
- `lineDash?`: `number[]` - 网格线的虚线样式，例如 `[5, 5]` 表示 5px 实线和 5px 空白交替，默认为 `[5, 5]`。
- `showGridText?`: `boolean` - 是否在瓦片上显示坐标文本，默认为 `true`。
- `gridTextColor?`: `string` - 坐标文本的颜色，默认为 `'black'`。
- `gridFont?`: `string` - 坐标文本的字体样式，例如 `'12px Arial'`，默认为 `'12px Arial'`。

**Section sources**
- [LeafletMapBlock.ts](file://src/lib/LeafletMapBlock.ts#L11-L24)
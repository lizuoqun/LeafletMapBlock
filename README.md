## Leaflet 地图分块渲染

[English doc](/doc/README-ENG.md)

### 功能概述
该模块封装了一个 Leaflet 的网格图层 `LeafletMapBlockLayer`，用于在地图上渲染带有网格和文字标记的瓦片。支持自定义网格线样式和网格文字显示。

### 接口定义
```typescript
interface CanvasLayerOptions extends L.GridLayerOptions {
    // 线颜色
    strokeStyle?: string;
    // 线宽
    lineWidth?: number;
    // 线的虚线样式：[0,0] 为实线
    lineDash?: number[];
    // 是否显示网格文字
    showGridText?: boolean;
    // 网格文字颜色
    gridTextColor?: string;
    // 网格文字大小、字体等配置
    gridFont?: string;
}
```

### 默认配置
```typescript
const defaultOptions = {
    strokeStyle: 'red',
    lineWidth: 2,
    lineDash: [5, 5],
    showGridText: true,
    gridTextColor: 'black',
    gridFont: '12px Arial'
};
```

### 使用示例
```typescript
import {LeafletMapBlockLayer} from 'leaflet-map-block/dist/LeafletMapBlock';
// 在初始化地图之后添加该图层：new 该对象，并传入参数（可选）
map.addLayer(new LeafletMapBlockLayer({lineDash: [2, 2]}));
```

<img src="/public/example.png">

### 地图块异常排查

地图上每一块都是静态资源响应的img图片，并且加入了这个插件可以在每一块地图上看到他的x,y,z的值，其实就是对应的瓦片坐标，

瓦片的x,y,z值可以在地图的url中看到，比如：https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

如果那一块地图展示异常了，能够快速的定位其静态路径
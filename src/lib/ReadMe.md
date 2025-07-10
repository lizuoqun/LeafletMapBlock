## 自定义图层

上一篇文章讲了GridLayer，这是自定义网格图层，他是对应的瓦片一块块添加canvas的图层，适合对单块瓦片进行叠加canvas进行自定义操作的，当需要对一整个地图上叠加canvas的时候（绘制全球上的图片文字什么的），就可以继承Layer基类来实现功能。

### 继承Layer类与封装

下面是一个简单的继承实现：

- 先需要继承[L.Layer](https://leafletjs.cn/reference.html#layer)类
- 执行流程：在`new ManyMarkersCanvas()` 的时候会执行`initialize` 方法
- 之后执行`addTo`方法，在这个方法当中执行了`map.addLayer`  这个执行会自动触发`onAdd` 方法
- 将map存起来，通过`initCanvas` 去创建一个canvas、将canvas和ctx上下文也保存到全局，最后将canvas加到地图窗口

```ts
import L from "leaflet";

export const ManyMarkersCanvas = L.Layer.extend({

  _map: null,
  _canvas: null,
  _context: null,

  initialize() {
    // 这是初始化用到的，相当于构造
  },

  addTo(map) {
    map.addLayer(this);
    return this;
  },

  onAdd(map) {
    this._map = map;
    this._initCanvas();
    this.getPane().appendChild(this._canvas);
  },

  _initCanvas() {
    const {x, y} = this._map.getSize();

    this._canvas = L.DomUtil.create(
      "canvas",
      "leaflet-layer leaflet-modify-layer"
    );
    this._canvas.width = x;
    this._canvas.height = y;
    this._context = this._canvas.getContext("2d");
  },


  redraw() {
    this._redraw(true);
  },

  _redraw(clear) {
    if (clear) {
      this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
  },
})
```

在vue当中使用就是这样：

```ts
import {ManyMarkersCanvas} from './lib/LeafletManyPoint'

const manyMark = new ManyMarkersCanvas();
// 这个map是初始化地图来的map
manyMark.addTo(map);
```

这样就将一个自定义的canvas叠加到了地图之上，可以打开F12找到一个class类名为leaflet-modify-layer的canvas。

### 绘制文本

添加一个绘制文本的方法，也就是调用canvas的绘制文本的方法，其中使用`this._map.latLngToContainerPoint`
将原本的经纬度转换成canvas的坐标位置。在`addTo`和`_redraw`方法当中调用这个`_drawText`

```ts
_drawText()
{
  this._context.font = "16px Arial";
  this._context.fillStyle = '#fff'
  const point = this._map.latLngToContainerPoint([19.9042, 116.4074]);
  this._context.fillText('Canvas', point.x, point.y);
}
```

压力测试：当用leaflet当中的绘制点的方法是将所有的点都当做一个div元素标签加到html当中的，这样就会导致数据量大渲染的时候就会卡顿，但是绘制在canvas上就没得这个困扰了，丝滑多了

```ts
for (let i = 0; i < 10000; i++) {
  this._context.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},1)`
  const point = this._map.latLngToContainerPoint([Math.random() * 180 - 90, Math.random() * 360 - 180]);
  this._context.fillText(i, point.x, point.y);
}
```

### 地图事件处理

在拖动、放大缩小地图的时候会发现绘制到地图上的这个目标canvas会变，不会跟着地图的层级位置进行调整，所以需要添加地图的监听事件进行处理，首先修改`onAdd`
方法，这个方法会在添加图层到地图自动执行，在这里添加地图监听：

```ts
onAdd(map)
{
  this._map = map;
  this._initCanvas();
  this.getPane().appendChild(this._canvas);

  map.on("moveend", this._reset, this);
  map.on("resize", this._reset, this);
  if (map._zoomAnimated) {
    map.on("zoomanim", this._animateZoom, this);
  }
}
```

添加了对地图拖动和尺寸变化以及放大缩小的监听，先看`_reset`方法的实现

```ts
_reset()
{
  const topLeft = this._map.containerPointToLayerPoint([0, 0]);
  L.DomUtil.setPosition(this._canvas, topLeft);

  const {x, y} = this._map.getSize();
  this._canvas.width = x;
  this._canvas.height = y;

  this._redraw();
}
```


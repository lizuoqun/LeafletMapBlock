## 自定义图层-海量数据加载

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

1. 重置 Canvas 位置和大小：
    - 使用 `containerPointToLayerPoint([0, 0])` 获取地图容器左上角在图层中的坐标 `topLeft`
      ，并调用 `L.DomUtil.setPosition(this._canvas, topLeft)` 将 canvas 元素的位置设置为该点，以确保 canvas 与地图对齐。
    - 获取当前地图视口的尺寸 `{x, y}`，并根据此更新 canvas 的宽度和高度，保证 canvas 填满整个地图容器。

2. 触发重绘：
    - 调用 `this._redraw()` 方法，清空并重新绘制 canvas 上的内容（如文本或图标），确保地图缩放、移动或调整窗口大小后，canvas
      内容能正确显示。

当地图视口发生变化时，重新定位和调整 canvas 图层的大小，并触发内容重绘，以保持 canvas 图层与地图视口的一致性

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

还有一个就是地图放大缩小的监听（`_animateZoom`）

1. 方法作用
    - 实现地图缩放动画时 canvas 的平滑变换
    - 利用 Leaflet 提供的缩放动画 API，根据当前缩放级别和地图中心点计算出新的偏移量和缩放比例，对 canvas 元素应用
      CSS变换（`transform`），从而实现视觉上的缩放过渡效果。

---

2. 关键逻辑解析
    - `this._map.getZoomScale(event.zoom)`：
        - 获取当前缩放级别与基础缩放级别的比例因子，用于确定缩放程度。
    - `this._map._latLngBoundsToNewLayerBounds(...)`：
        - 将当前地图可视区域（LatLngBounds）转换为新的图层坐标下的边界，并从中提取偏移量（`.min`），用于定位 canvas。
    - `L.DomUtil.setTransform(this._canvas, offset, scale)`：
        - 对 canvas 元素应用基于 offset 的位移和 scale 的缩放变换，使 canvas 内容在缩放动画中保持与地图同步显示。

---

在地图执行缩放动画时，动态调整 canvas 图层的位置与缩放比例，使其内容能够平滑地跟随地图缩放变化，提升用户体验。

```js
_animateZoom(event)
{
  const scale = this._map.getZoomScale(event.zoom);
  const offset = this._map._latLngBoundsToNewLayerBounds(
    this._map.getBounds(),
    event.zoom,
    event.center
  ).min;

  L.DomUtil.setTransform(this._canvas, offset, scale);
}
```

### 构造值传值

既然是自定义canvas，那么数据就应该从使用方的角度传入，这里定义一个点数组，从外界传入，下面是新增的部分：

- 定义数据类型，在initialize方法中获取传入值
- 将数据写入到类属性_pointList中

```ts
export interface MarkerPointOptions {
  lat: number;
  lng: number;
  title: string;
  icon: string;
  iconSize: number[];
}

export const ManyMarkersCanvas = L.Layer.extend({
  _pointList: null,

  initialize(Points: MarkerPointOptions[]) {
    this._pointList = Points;
    L.Util.setOptions(this, Points);
  }
});
```

### 渲染图片

> 前言：`context.drawImage(image, dx, dy, dWidth, dHeight);`
> 这个方法当中的参数可以参考[Canvas API中文网](https://www.canvasapi.cn/CanvasRenderingContext2D/drawImage)
> ，还是先熟悉一个Canvas的API，比方说在代码里面计算xy的值为什么要减去iconSize的一半？并且在`_drawText`
> 的时候也要计算一下xy，这时`const y = point.y + iconSize[1] / 2 + 10;` 是为什么？


绘制图片的方法，就是调用canvas的绘制图片的方法，其中使用`this._map.latLngToContainerPoint`
将经纬度转换成canvas的坐标位置。在`addTo`和`_redraw`方法当中调用这个`_drawImage`，和绘制文本一样

- 从数据中获取图片地址，并创建一个Image对象，将图片地址赋给Image对象的src属性。
- 区分图片类型，如果是svg图片，则创建一个Blob对象，将svg数据赋给Blob对象，并创建一个ObjectURL对象，将ObjectURL对象赋给Image对象的src属性。
- 监听图片加载完成，将图片绘制到canvas上

```ts
_drawIcon()
{
  this._pointList.forEach((item: MarkerPointOptions) => {
    if (item.icon && this._map && this._context) {
      const {lat, lng, icon, iconSize} = item;
      const point = this._map.latLngToContainerPoint([lat, lng]);
      const x = point.x - iconSize[0] / 2;
      const y = point.y - iconSize[1] / 2;
      const img = new Image();
      img.src = icon;
      if (icon.trim().startsWith('<svg')) {
        const svgData = new Blob([icon], {type: 'image/svg+xml'});
        const svgUrl = URL.createObjectURL(svgData);
        img.src = svgUrl;

        img.onload = () => {
          this._context.drawImage(img, x, y, iconSize[0], iconSize[1]);
          URL.revokeObjectURL(svgUrl);
        };
      } else {
        img.onload = () => {
          this._context.drawImage(img, x, y, iconSize[0], iconSize[1]);
        };
      }
    }
  });
}
```

继续压力测试：绘制10000个数据【数据组装】，虽然说不会卡顿，但是会发现有一个问题，就是图片资源会一个个加载，耗时较长，这是因为在`_drawIcon`
方法中创建的Image对象，图片加载完成之后，会调用`_drawIcon`方法，导致图片依次绘制，导致图片加载速度变慢。

```ts
const Points: MarkerPointOptions[] = [];
for (let i = 0; i < 10000; i++) {
  Points.push({
    lat: Math.random() * 180 - 90,
    lng: Math.random() * 360 - 180,
    icon: i % 2 === 0 ? archeryImage : Dog,
    title: i % 2 === 0 ? `archery${i}` : `Dog${i}`,
    iconSize: [36, 36]
  });
}
const manyMark = new ManyMarkersCanvas(Points);
manyMark.addTo(map);
manyMark.addLayer();
```

利用缓存，将图片资源都缓存起来，在全局属性当中添加两个用来存缓存的变量

```ts
export const ManyMarkersCanvas = L.Layer.extend({
  imageCache: new Map(),
  svgImageCache: new Map()
});

```

这个时候将`_drawIcon`方法进行优化一下，在加载img之前先判断是否有缓存，没有缓存的话再`img.load`
加载图片写入缓存，这样就提升了效率，因为在读取图片是比较耗性能的

```ts
_drawIcon()
{
  this._pointList.forEach((item: MarkerPointOptions) => {
    if (item.icon && this._map && this._context) {
      const {lat, lng, icon, iconSize} = item;
      const point = this._map.latLngToContainerPoint([lat, lng]);
      const x = point.x - iconSize[0] / 2;
      const y = point.y - iconSize[1] / 2;

      if (icon.trim().startsWith('<svg')) {
        if (this.svgImageCache.has(icon)) {
          const cachedImg = this.svgImageCache.get(icon)!;
          this._context.drawImage(cachedImg, x, y, iconSize[0], iconSize[1]);
        } else {
          const svgData = new Blob([icon], {type: 'image/svg+xml'});
          const svgUrl = URL.createObjectURL(svgData);
          const img = new Image();
          img.src = svgUrl;

          img.onload = () => {
            this._context.drawImage(img, x, y, iconSize[0], iconSize[1]);
            this.svgImageCache.set(icon, img);
            URL.revokeObjectURL(svgUrl);
          };
        }

      } else {
        if (this.imageCache.has(icon)) {
          const cachedImg = this.imageCache.get(icon)!;
          this._context.drawImage(cachedImg, x, y, iconSize[0], iconSize[1]);
        } else {
          const img = new Image();
          img.src = icon;
          img.onload = () => {
            this._context.drawImage(img, x, y, iconSize[0], iconSize[1]);
            this.imageCache.set(icon, img);
          };
        }
      }
    }
  });
}
```

### 优化：只渲染可视范围

在绘制文本和图片的时候，是将所有的数据都绘制到了canvas上，也是一个优化点，只需要绘制当前地图可视范围的数据就行了，那么以文本为例，添加以下代码

- 利用`getBounds()`方法可以获取当前地图的可视边界，也就是上下左右四个点的经纬度
- 再用`contains()`方法判断每个点是否在可视边界内

```ts
_drawText()
{
  this._context.font = '16px Arial';
  this._context.fillStyle = '#fff';
  const bounds = this._map.getBounds();
  console.time('Text drawing time');
  this._pointList.forEach((item: MarkerPointOptions) => {
    const latLng = L.latLng(item.lat, item.lng);
    if (bounds.contains(latLng)) {
      const point = this._map.latLngToContainerPoint([item.lat, item.lng]);
      this._context.fillText(item.title, point.x, point.y);
    }
  });
  console.timeEnd('Text drawing time');
}
```

可以通过`console.time`这个来测试一下耗时时间，大概也就提升了个90%，那么绘制icon也是一样的优化办法。这里就省略了

```log
再添加了边界过滤之后
Text drawing time: 1.848876953125 ms
Text drawing time: 1.637939453125 ms
Text drawing time: 1.84912109375 ms

之前
Text drawing time: 25.839111328125 ms
Text drawing time: 25.22900390625 ms
Text drawing time: 26.098876953125 ms
```

### 图层的事件监听

这个的逻辑是监听地图对应的事件，当地图事件触发之后，可以得到对应的地图经纬度，再通过经纬度去和所有点的数据进行比较，从而去触发对应的点的事件

先修改传入的数组的数据结构，把回调进行抛出，添加了onIconClick、onIconMouseOver、onIconMouseOut三个回调

```ts
export interface MarkerPointOptions {
  lat: number;
  lng: number;
  title: string;
  icon: string;
  iconSize: number[];
  onIconClick?: (item: MarkerPointOptions) => void;
  onIconMouseOver?: (item: MarkerPointOptions) => void;
  onIconMouseOut?: (item: MarkerPointOptions) => void;
}
```

在`addTo()`方法当中调用这个`this._initIconClickEvent()`方法，并且在类当中添加一个`containerPointsCache: new Map()`
属性，这个属性用于缓存地图上的点，方便后续的判断

1. 检查地图是否存在 `if (!this._map) return;` 如果当前没有绑定地图实例，则直接返回，防止后续操作出错。
2. 定义悬停图标变量 `currentHoveredIcon` 用于记录当前鼠标悬停的图标对象，初始值为 `null`，表示没有悬停在任何图标上。

3. 地图移动或缩放时清空缓存 `this._map.on('moveend zoomend', () => {this.containerPointsCache.clear();});`
    - 当地图移动move end或缩放结束时，清除 `containerPointsCache` 缓存，因为图标的屏幕坐标会变化。
4. 封装交互检测函数：定义 `checkIconInteraction(point, eventType)` 函数：
    - 接收两个参数：当前鼠标位置 point 和事件类型 `eventType`（'click' 或 'mousemove'）。
    - 获取当前地图的可视区域 bounds。
    - 遍历所有图标点 `_pointList`，判断当前鼠标是否落在某个图标范围内。
5. 遍历图标点并进行坐标转换，对每个图标：
    - 检查是否有图标路径、地图和画布上下文存在。
    - 判断图标是否在可视区域内。
    - 使用 `containerPointsCache` 缓存机制获取或重新计算图标的屏幕坐标（优化性能）。
6. 计算图标绘制的左上角坐标
   根据图标的尺寸iconSize和中心点坐标containerPoint，计算图标的左上角坐标 `(x, y)`。
7. 判断鼠标是否在图标范围内：根据鼠标的坐标point和图标的边界范围判断是否命中该图标。
8. 处理鼠标悬停事件
    - 如果是 mousemove 事件，并且鼠标进入新的图标，则触发 onIconMouseOver回调
    - 修改鼠标样式为指针（`cursor: pointer`），提示用户可以点击
    - 如果是 click 事件，并且鼠标点击的是图标，则触发 onIconClick 回调
    - 在 mousemove 事件中，如果鼠标离开当前悬停的图标，则触发 onIconMouseOut 回调，并恢复默认鼠标样式
    - 更新 `currentHoveredIcon` 变量，记录当前鼠标悬停的图标
    - 如果没有图标被悬停，将地图容器的鼠标样式恢复为默认
9. 绑定点击事件、鼠标移动事件监听器

```ts
_initIconClickEvent()
{
  if (!this._map) return;
  // 用于记录当前鼠标所在的图标
  let currentHoveredIcon: MarkerPointOptions | null = null;

  // 在地图移动或缩放时清空缓存，因为坐标会发生变化
  this._map.on('moveend zoomend', () => {
    this.containerPointsCache.clear();
  });

  // 封装重复逻辑的函数
  const checkIconInteraction = (point: L.Point, eventType: 'click' | 'mousemove') => {
    const bounds = this._map.getBounds();
    let newHoveredIcon: MarkerPointOptions | null = null;

    this._pointList.forEach((item: MarkerPointOptions) => {
      if (!item.icon || !this._map || !this._context) return;

      const {lat, lng, iconSize} = item;
      const latLng = L.latLng(item.lat, item.lng);
      if (!bounds.contains(latLng)) return;

      // 尝试从缓存获取转换后的坐标，若没有则进行转换并缓存
      let containerPoint = this.containerPointsCache.get(item);
      if (!containerPoint) {
        containerPoint = this._map.latLngToContainerPoint([lat, lng]);
        this.containerPointsCache.set(item, containerPoint);
      }

      const x = containerPoint.x - iconSize[0] / 2;
      const y = containerPoint.y - iconSize[1] / 2;

      // 判断位置是否在图标范围内
      const isInIcon =
        point.x >= x &&
        point.x <= x + iconSize[0] &&
        point.y >= y &&
        point.y <= y + iconSize[1];

      if (isInIcon) {
        if (eventType === 'mousemove') {
          newHoveredIcon = item;
          if (currentHoveredIcon !== item && typeof item.onIconMouseOver === 'function') {
            item.onIconMouseOver(item);
          }
          // 鼠标移入，修改鼠标样式为指针
          this._map.getContainer().style.cursor = 'pointer';
        } else if (eventType === 'click' && typeof item.onIconClick === 'function') {
          item.onIconClick(item);
        }
      }
    });

    if (eventType === 'mousemove') {
      // 检测鼠标移出事件
      if (currentHoveredIcon && (!newHoveredIcon || newHoveredIcon !== currentHoveredIcon)) {
        if (typeof currentHoveredIcon.onIconMouseOut === 'function') {
          currentHoveredIcon.onIconMouseOut(currentHoveredIcon);
        }
        // 鼠标移出，修改鼠标样式为默认值
        this._map.getContainer().style.cursor = '';
      }
      currentHoveredIcon = newHoveredIcon;
      // 如果没有悬停在任何图标上，恢复默认鼠标样式
      if (!newHoveredIcon) {
        this._map.getContainer().style.cursor = '';
      }
    }
  };

  this._map.on('click', (e: any) => {
    const clickPoint = this._map.latLngToContainerPoint(e.latlng);
    checkIconInteraction(clickPoint, 'click');
  });

  // 添加鼠标移动事件监听
  this._map.on('mousemove', (e: any) => {
    const mousePoint = this._map.latLngToContainerPoint(e.latlng);
    checkIconInteraction(mousePoint, 'mousemove');
  });
}
```

那么对应的point实体构造就要变成这样，添加对应的回调函数：

```ts
  for (let i = 0; i < 10000; i++) {
  Points.push({
    lat: Math.random() * 180 - 90,
    lng: Math.random() * 360 - 180,
    icon: i % 2 === 0 ? archeryImage : Dog,
    title: i % 2 === 0 ? `archery${i}` : `Dog${i}`,
    iconSize: [36, 36],
    onIconClick: (item) => {
      alert(item.title);
    },
    onIconMouseOver: (item) => {
    },
    onIconMouseOut: (item) => {
    }
  });
}
```
> 最后：这个封装的js代码在：[Github]()

/**
 * @author modify
 * @description 自定义canvas图层
 * @date 2025-07-10
 */

import L from 'leaflet';

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

export const ManyMarkersCanvas = L.Layer.extend({

  _map: null,
  _canvas: null,
  _context: null,
  _pointList: [],
  imageCache: new Map(),
  svgImageCache: new Map(),
  containerPointsCache: new Map(),

  initialize(Points: MarkerPointOptions[]) {
    this._pointList = Points;
    L.Util.setOptions(this, Points);
  },

  addTo(map) {
    map.addLayer(this);
    this._initIconClickEvent();
    return this;
  },

  onAdd(map) {
    this._map = map;
    this._initCanvas();
    this.getPane().appendChild(this._canvas);

    map.on('moveend', this._reset, this);
    map.on('resize', this._reset, this);
    if (map._zoomAnimated) {
      map.on('zoomanim', this._animateZoom, this);
    }
  },

  _initCanvas() {
    const {x, y} = this._map.getSize();
    const isAnimated = this._map.options.zoomAnimation && L.Browser.any3d;
    this._canvas = L.DomUtil.create(
      'canvas',
      'leaflet-markers-canvas-layer leaflet-layer leaflet-modify-layer'
    );
    this._canvas.width = x;
    this._canvas.height = y;
    this._context = this._canvas.getContext('2d');
    L.DomUtil.addClass(
      this._canvas,
      `leaflet-zoom-${isAnimated ? 'animated' : 'hide'}`
    );
  },


  redraw() {
    this._redraw(true);
  },

  addLayer() {
    this._drawIcon();
    this._drawText();
  },

  _drawText() {
    this._context.font = '16px Arial';
    this._context.fillStyle = '#fff';
    this._context.textAlign = 'center';
    const bounds = this._map.getBounds();
    console.time('Text drawing time');
    this._pointList.forEach((item: MarkerPointOptions) => {
      const {lat, lng, title, iconSize} = item;
      const latLng = L.latLng(lat, lng);
      if (bounds.contains(latLng)) {
        const point = this._map.latLngToContainerPoint([lat, lng]);
        const x = point.x;
        const y = point.y + iconSize[1] / 2 + 10;

        this._context.fillText(title, x, y);
      }
    });
    console.timeEnd('Text drawing time');
  },

  _drawIcon() {
    console.time('Icon drawing time');
    const bounds = this._map.getBounds();
    this._pointList.forEach((item: MarkerPointOptions) => {
      if (item.icon && this._map && this._context) {
        const {lat, lng, icon, iconSize} = item;
        const latLng = L.latLng(item.lat, item.lng);
        if (!bounds.contains(latLng)) {
          return;
        }
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
    console.timeEnd('Icon drawing time');
  },

  _redraw(clear) {
    this.addLayer();
    if (clear) {
      this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
  },

  _reset() {
    const topLeft = this._map.containerPointToLayerPoint([0, 0]);
    L.DomUtil.setPosition(this._canvas, topLeft);

    const {x, y} = this._map.getSize();
    this._canvas.width = x;
    this._canvas.height = y;

    this._redraw();
  },

  _animateZoom(event) {
    const scale = this._map.getZoomScale(event.zoom);
    const offset = this._map._latLngBoundsToNewLayerBounds(
      this._map.getBounds(),
      event.zoom,
      event.center
    ).min;

    L.DomUtil.setTransform(this._canvas, offset, scale);
  },

  // 添加点击事件监听方法
  _initIconClickEvent() {
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

});

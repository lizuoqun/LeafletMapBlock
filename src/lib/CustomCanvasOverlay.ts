import L, { LatLng } from 'leaflet';

// 自定义 Canvas 图层类
 export class CustomCanvasOverlay extends L.GridLayer {
  private points: L.LatLngExpression[] = [];
  private svgImage: HTMLImageElement | null = null;
  private offScreenCanvas: HTMLCanvasElement | null = null;
  private isSvgLoaded = false;
  private isMapReady = false;
  private svgIcon: string;

  constructor(
    points: L.LatLngExpression[] = [],
    svgIcon: string = `<svg width="24" height="24" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="5" fill="blue" /></svg>`,
    options?: L.GridLayerOptions
  ) {
    super(options);
    this.points = points;
    this.svgIcon = svgIcon;
    this.preloadSvg();
  }

  // 预加载 SVG 图标
  private preloadSvg(): void {
    this.svgImage = new Image();
    const svgData = encodeURIComponent(this.svgIcon);
    this.svgImage.src = 'data:image/svg+xml;charset=utf-8,' + svgData;
    
    this.svgImage.onload = () => {
      this.isSvgLoaded = true;
      // 创建离屏 canvas
      const { width, height } = this.getSvgSize();
      this.offScreenCanvas = document.createElement('canvas');
      this.offScreenCanvas.width = width;
      this.offScreenCanvas.height = height;
      const offScreenCtx = this.offScreenCanvas.getContext('2d');
      offScreenCtx?.drawImage(this.svgImage!, 0, 0, width, height);
    };
  }

  // 获取 SVG 尺寸
  private getSvgSize(): { width: number; height: number } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.svgIcon, 'image/svg+xml');
    const svgElement = doc.querySelector('svg');
    
    return {
      width: parseInt(svgElement?.getAttribute('width') ?? '0', 10),
      height: parseInt(svgElement?.getAttribute('height') ?? '0', 10)
    };
  }

  // 重写 onAdd 方法，确保地图初始化完成
  onAdd(map: L.Map): this {
    super.onAdd(map);
    this.isMapReady = true;
    this.redraw(); // 手动触发重绘
    return this;
  }

  // 创建图层容器（即 canvas）
  createTile(coords: any): HTMLCanvasElement {
    const tile = L.DomUtil.create('canvas', 'my-leaflet-custom-tile') as HTMLCanvasElement;
    const size = this.getTileSize();
    tile.width = size.x;
    tile.height = size.y;
    const ctx = tile.getContext('2d');

    if (!this.isSvgLoaded || !this.offScreenCanvas || !ctx || !this.isMapReady) {
      return tile;
    }

    const svgSize = this.getSvgSize();

    this.points.forEach((item) => {
      const targetLatLng = new LatLng(item[0], item[1]);
      const tileSize = this.getTileSize().x;
      const worldPoint = this._map.project(targetLatLng, coords.z); // 当前缩放级别的世界坐标
      const targetTilePoint = worldPoint.divideBy(tileSize).floor(); // 对应的 tile 编号

      // 判断是否是目标 tile
      if (coords.x === targetTilePoint.x && coords.y === targetTilePoint.y) {
        const projectedPoint = this.projectLatLngToTileCoords(targetLatLng, coords);
        const x = (projectedPoint.x - svgSize.width / 2);
        const y = (projectedPoint.y - svgSize.height / 2);
        if (this.offScreenCanvas) {
          ctx.drawImage(this.offScreenCanvas, x, y, svgSize.width, svgSize.height);
        }
      }
    });

    return tile;
  }

  // 将经纬度投影为当前瓦片坐标系下的像素坐标
  private projectLatLngToTileCoords(latlng: L.LatLng, coords: L.Coords): { x: number; y: number } {
    const map = this._map;
    if (!map) throw new Error('Map not initialized.');

    const tileSize = this.getTileSize().x;
    const worldPoint = map.project(latlng, coords.z); // 当前缩放级别下的世界坐标
    const tilePoint = worldPoint.divideBy(tileSize).floor(); // 所在瓦片编号
    const projectedPoint = worldPoint.subtract(tilePoint.multiplyBy(tileSize)); // 瓦片内坐标

    return projectedPoint;
  }
}

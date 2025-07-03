/**
 * 渲染地图图片分块
 * @params:CanvasLayerOptions，默认值： { strokeStyle: 'red', lineWidth: 2, lineDash: [5, 5], showGridText: true,}
 *
 * 使用示例：
 * import { LeafletMapBlockLayer } from './lib/LeafletMapBlock'
 * 在初始化地图之后添加该图层：new该对象，并传入参数（可选）
 * map.addLayer(new LeafletMapBlockLayer({ lineDash: [2, 2] }));
 * */
import L from 'leaflet';

interface CanvasLayerOptions extends L.GridLayerOptions {
    // 线颜色
    strokeStyle?: string;
    // 线宽
    lineWidth?: number;
    // 线的虚线样式：[0,0]为实线
    lineDash?: number[];
    // 是否显示网格文字
    showGridText?: boolean;
    // 网格文字颜色
    gridTextColor?: string;
    // 网格文字大小、字体等配置
    gridFont?: string;
}

let options: CanvasLayerOptions = {};

export class LeafletMapBlockLayer extends L.GridLayer {

    constructor(data?: CanvasLayerOptions) {
        super(data);
        options = {
            strokeStyle: 'red',
            lineWidth: 2,
            lineDash: [5, 5],
            showGridText: true,
            gridTextColor: 'black',
            gridFont: '12px Arial',
            ...data
        };
    }


    createTile(coords: any): HTMLCanvasElement {
        const tile = L.DomUtil.create('canvas', 'my-leaflet-tile') as HTMLCanvasElement;

        const size = this.getTileSize();
        tile.width = size.x;
        tile.height = size.y;

        const ctx = tile.getContext('2d');

        const {
            strokeStyle = '',
            lineWidth = 0,
            lineDash = [0, 0],
            showGridText = true,
            gridTextColor = 'black',
            gridFont = '12px Arial'
        } = options;

        if (ctx) {
            ctx.strokeStyle = strokeStyle;
            ctx.lineWidth = lineWidth;
            ctx?.setLineDash(lineDash);
            ctx?.strokeRect(0, 0, tile.width, tile.height);

            if (showGridText) {
                ctx.fillStyle = gridTextColor;
                ctx.font = gridFont;
                ctx.fillText(`x:${coords.x}, y:${coords.y}, z:${coords.z}`, 5, 15);
            }
        }
        return tile;
    }
}

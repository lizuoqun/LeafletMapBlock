/**
 * @author modify 
 * @description 自定义canvas图层
 * @date 2025-07-10
*/

import L from "leaflet";

export interface MarkerPointOptions {
    lat: number;
    lng: number;
    title: string;
    icon: string;
    iconSize: number[];
}

export const ManyMarkersCanvas = L.Layer.extend({

    _map: null,
    _canvas: null,
    _context: null,
    _pointList: null,

    initialize(Points: MarkerPointOptions[]) {
        this._pointList = Points
        console.log('initialize', this._pointList, Points);
        L.Util.setOptions(this, Points);
    },

    addTo(map) {
        map.addLayer(this);
        return this;
    },

    onAdd(map) {
        this._map = map;
        this._initCanvas();
        this.getPane().appendChild(this._canvas);

        map.on("moveend", this._reset, this);
        map.on("resize", this._reset, this);
        if (map._zoomAnimated) {
            map.on("zoomanim", this._animateZoom, this);
        }
    },

    _initCanvas() {
        const { x, y } = this._map.getSize();
        // const isAnimated = this._map.options.zoomAnimation && L.Browser.any3d;
        const isAnimated = false
        this._canvas = L.DomUtil.create(
            "canvas",
            "leaflet-markers-canvas-layer leaflet-layer leaflet-modify-layer"
        );
        this._canvas.width = x;
        this._canvas.height = y;
        this._context = this._canvas.getContext("2d");
        L.DomUtil.addClass(
            this._canvas,
            `leaflet-zoom-${isAnimated ? "animated" : "hide"}`
        );
    },


    redraw() {
        this._redraw(true);
    },

    addLayer() {
        // this._drawIcon()
        this._drawText()
    },

    _drawText() {
        this._context.font = "16px Arial";
        this._context.fillStyle = '#fff'
        const point = this._map.latLngToContainerPoint([19.9042, 116.4074]);
        this._context.fillText('Canvas', point.x, point.y);

        for (let i = 0; i < 10000; i++) {
            this._context.fillStyle = `rgba(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255},1)`
            const point = this._map.latLngToContainerPoint([Math.random() * 180 - 90, Math.random() * 360 - 180]);
            this._context.fillText(i, point.x, point.y);
        }

        // this._pointList.forEach((item: MarkerPointOptions) => {
        //     const point = this._map.latLngToContainerPoint([item.lat, item.lng]);
        //     this._context.fillText(item.title, point.x, point.y);
        // })
    },

    _drawIcon() {
        this._pointList.forEach((item: MarkerPointOptions) => {
            if (item.icon && this._map && this._context) {
                const { lat, lng, icon, iconSize } = item
                const point = this._map.latLngToContainerPoint([lat, lng]);
                const img = new Image();
                img.src = icon;
                if (icon.trim().startsWith('<svg')) {
                    const svgData = new Blob([icon], { type: 'image/svg+xml' });
                    const svgUrl = URL.createObjectURL(svgData);
                    img.src = svgUrl;

                    img.onload = () => {
                        this._context.drawImage(img, point.x, point.y, iconSize[0], iconSize[1]);
                        URL.revokeObjectURL(svgUrl); // 释放对象 URL
                    };
                } else {
                    img.onload = () => {
                        this._context.drawImage(img, point.x, point.y, iconSize[0], iconSize[1]);
                    };
                }
            }
        });
    },

    _redraw(clear) {
        if (clear) {
            this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        }
        this.addLayer()
    },

    _reset() {
        const topLeft = this._map.containerPointToLayerPoint([0, 0]);
        L.DomUtil.setPosition(this._canvas, topLeft);

        const { x, y } = this._map.getSize();
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
})


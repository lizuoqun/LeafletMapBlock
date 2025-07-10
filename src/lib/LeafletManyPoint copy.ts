import L from "leaflet";
const markersCanvas = {

    _map: null,
    _canvas: null,
    _context: null,
    _curveInfos: [],
    _animationId: 0,

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
        let isAnimated = true

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

    _getRandomColor() {
        const colorList = ['rgb(222,255,253)',
            'rgb(234,234,234)',
            'rgb(255,255,255)',
            'rgb(156,156,156)',
            'rgb(255,106,43)']
        return colorList[Math.floor(Math.random() * colorList.length)]
    },

    addLayer() {
        this._context.font = "16px Arial";

        // ... existing code ...
        const cities = [
            // 一线城市
            { name: "北京", coord: [39.9042, 116.4074], color: "#FF5733" },
            { name: "上海", coord: [31.2304, 121.4737], color: "#FF5733" },
            { name: "广州", coord: [23.1291, 113.2644], color: "#FF5733" },
            { name: "深圳", coord: [22.5431, 114.0579], color: "#FF5733" },

            // 新一线城市
            { name: "成都", coord: [30.5728, 104.0668], color: "#FFC300" },
            { name: "杭州", coord: [30.2741, 120.1551], color: "#FFC300" },
            { name: "重庆", coord: [29.5631, 106.5518], color: "#FFC300" },
            { name: "西安", coord: [34.2632, 108.9484], color: "#FFC300" },
            { name: "苏州", coord: [31.2994, 120.6195], color: "#FFC300" },
            { name: "武汉", coord: [30.5728, 114.2694], color: "#FFC300" },
            { name: "南京", coord: [32.0415, 118.7674], color: "#FFC300" },
            { name: "天津", coord: [39.0852, 117.2056], color: "#FFC300" },
            { name: "郑州", coord: [34.7579, 113.6654], color: "#FFC300" },
            { name: "长沙", coord: [28.2184, 112.9828], color: "#FFC300" },
            { name: "东莞", coord: [23.0467, 113.7463], color: "#FFC300" },
            { name: "佛山", coord: [23.0285, 113.1290], color: "#FFC300" },
            { name: "宁波", coord: [29.8683, 121.5440], color: "#FFC300" },
            { name: "青岛", coord: [36.0700, 120.3300], color: "#FFC300" },
            { name: "沈阳", coord: [41.7967, 123.4290], color: "#FFC300" },

            // 其他省会城市
            { name: "哈尔滨", coord: [45.7569, 126.6424], color: "#DAF7A6" },
            { name: "长春", coord: [43.8868, 125.3245], color: "#DAF7A6" },
            { name: "呼和浩特", coord: [40.8427, 111.7519], color: "#DAF7A6" },
            { name: "石家庄", coord: [38.0454, 114.5025], color: "#DAF7A6" },
            { name: "太原", coord: [37.8700, 112.5600], color: "#DAF7A6" },
            { name: "西宁", coord: [36.6232, 101.7789], color: "#DAF7A6" },
            { name: "济南", coord: [36.6406, 117.0269], color: "#DAF7A6" },
            { name: "合肥", coord: [31.8611, 117.2831], color: "#DAF7A6" },
            { name: "南昌", coord: [28.6764, 115.8093], color: "#DAF7A6" },
            { name: "福州", coord: [26.0753, 119.3062], color: "#DAF7A6" },
            { name: "台北", coord: [25.0330, 121.5654], color: "#DAF7A6" },
            { name: "南宁", coord: [22.8240, 108.3291], color: "#DAF7A6" },
            { name: "贵阳", coord: [26.5783, 106.7134], color: "#DAF7A6" },
            { name: "昆明", coord: [25.0406, 102.7122], color: "#DAF7A6" },
            { name: "拉萨", coord: [29.6524, 91.1145], color: "#DAF7A6" },
            { name: "乌鲁木齐", coord: [43.8283, 87.6177], color: "#DAF7A6" },
            { name: "银川", coord: [38.4791, 106.2713], color: "#DAF7A6" },
            { name: "兰州", coord: [36.0581, 103.8346], color: "#DAF7A6" },
            { name: "海口", coord: [20.0192, 110.3331], color: "#DAF7A6" },
        ];

        const internationalCities = [
            // 亚洲城市
            { name: "东京", coord: [35.6762, 139.6503], color: "#C70039" },
            { name: "首尔", coord: [37.5665, 126.9780], color: "#C70039" },
            { name: "新加坡", coord: [1.3521, 103.8198], color: "#C70039" },
            { name: "孟买", coord: [19.0760, 72.8777], color: "#C70039" },
            { name: "迪拜", coord: [25.2048, 55.2708], color: "#C70039" },

            // 欧洲城市
            { name: "伦敦", coord: [51.5074, -0.1278], color: "#900C3F" },
            { name: "巴黎", coord: [48.8566, 2.3522], color: "#900C3F" },
            { name: "柏林", coord: [52.5200, 13.4050], color: "#900C3F" },
            { name: "罗马", coord: [41.9028, 12.4964], color: "#900C3F" },
            { name: "莫斯科", coord: [55.7558, 37.6173], color: "#900C3F" },

            // 美洲城市
            { name: "纽约", coord: [40.7128, -74.0060], color: "#3498DB" },
            { name: "洛杉矶", coord: [34.0522, -118.2437], color: "#3498DB" },
            { name: "多伦多", coord: [43.6532, -79.3832], color: "#3498DB" },
            { name: "里约热内卢", coord: [-22.9068, -43.1729], color: "#3498DB" },
            { name: "墨西哥城", coord: [19.4326, -99.1332], color: "#3498DB" },

            // 非洲城市
            { name: "开罗", coord: [30.0444, 31.2357], color: "#F39C12" },
            { name: "约翰内斯堡", coord: [-26.2041, 28.0473], color: "#F39C12" },
            { name: "内罗毕", coord: [-1.2921, 36.8219], color: "#F39C12" },

            // 大洋洲城市
            { name: "悉尼", coord: [-33.8688, 151.2093], color: "#2ECC71" },
            { name: "墨尔本", coord: [-37.8136, 144.9631], color: "#2ECC71" },
            { name: "奥克兰", coord: [-36.8485, 174.7633], color: "#2ECC71" }
        ];

        const allCities: { name: string; coord: number[]; color: string }[] = [];
        allCities.push(...cities);
        allCities.push(...internationalCities);


        // 遍历城市列表，将文字绘制到地图上
        for (const city of allCities) {
            this._context.fillStyle = city.color || '#fff'
            const point = this._map.latLngToContainerPoint(city.coord);
            this._context.fillText(city.name, point.x, point.y);
        }

        this._drawCurv()
    },

    _drawCurv() {
        this._curveInfos = [];
        for (let i = 0; i < 10; i++) {
            this._context.beginPath();
            // const start = this._map.latLngToContainerPoint([Math.random() * 90, Math.random() * 180])
            const start = this._map.latLngToContainerPoint([39.9042, 116.4074])
            this._context.moveTo(start.x, start.y);
            let end = this._map.latLngToContainerPoint([22.5431, 114.0579])
            // const end = this._map.latLngToContainerPoint([Math.random() * 90, Math.random() * 180])
            const center = {
                // x: (start.x + end.x) / (Math.random() * 2 + 1) + Math.random() * 100 - 50,
                // y: (start.y + end.y) / (Math.random() * 2 + 1) + Math.random() * 100 - 50,
                x: (start.x + end.x) / 2 + Math.random() * 100 - 50,
                y: (start.y + end.y) / 2 + Math.random() * 100 - 50,
            }
            this._curveInfos.push({
                start,
                end,
                center,
                progress: Math.random(),
                color: '#f40'
            });

            // 清除之前的动画
            if (this._animationId) {
                cancelAnimationFrame(this._animationId);
            }
            // 开始动画
            this._animateCurve();

            // this._context.quadraticCurveTo(center.x, center.y, end.x, end.y)
            // this._context.strokeStyle = this._getRandomColor();
            // this._context.lineWidth = 1;
            // this._context.stroke();
        }
    },

    _animateCurve() {
        // 清除画布
        this._context.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
        let allFinished = true;
        for (const curveInfo of this._curveInfos) {
            if (curveInfo.progress < 1) {
                allFinished = false;
                this._drawPartialCurve(curveInfo);
                curveInfo.progress += Math.random() / 500;
            } else {
                curveInfo.progress = 0
            }
        }
        if (!allFinished) {
            this._animationId = requestAnimationFrame(() => this._animateCurve());
        }
    },

    _drawPartialCurve(curveInfo: any) {
        // 获取曲线上的点
        const getPointOnQuadraticCurve = (t: number, start: { x: number, y: number }, center: { x: number, y: number }, end: { x: number, y: number }) => {
            const x = Math.pow(1 - t, 2) * start.x + 2 * (1 - t) * t * center.x + Math.pow(t, 2) * end.x;
            const y = Math.pow(1 - t, 2) * start.y + 2 * (1 - t) * t * center.y + Math.pow(t, 2) * end.y;
            return { x, y };
        };

        this._context.beginPath();
        this._context.moveTo(curveInfo.start.x, curveInfo.start.y);

        // 分段绘制曲线，提高动画流畅度
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
            const t = (i / steps) * curveInfo.progress;
            const point = getPointOnQuadraticCurve(t, curveInfo.start, curveInfo.center, curveInfo.end);
            this._context.lineTo(point.x, point.y);
        }

        const gradient = this._context.createLinearGradient(
            curveInfo.start.x,
            curveInfo.start.y,
            curveInfo.end.x,
            curveInfo.end.y
        );
        gradient.addColorStop(0, '#f40');
        gradient.addColorStop(0.5, '#000');
        gradient.addColorStop(1, '#fff');

        this._context.strokeStyle = gradient;
        // this._context.strokeStyle = curveInfo.color;
        this._context.lineWidth = 1;
        this._context.setLineDash([5, 5]);
        this._context.stroke();
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

    initialize(options) {
        L.Util.setOptions(this, options);
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
}

export const ManyMarkersCanvas = L.Layer.extend(markersCanvas)


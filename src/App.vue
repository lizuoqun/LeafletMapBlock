<script setup lang="ts">
import { onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
// import coordtransform from 'coordtransform';
import { LeafletMapBlockLayer } from './lib/LeafletMapBlock';
import { CustomCanvasOverlay } from './lib/CustomCanvasOverlay';

onMounted(() => {
  initMap();
});
const customSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="37.07" height="36" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 198"><path fill="#41B883" d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0h47.36Z"></path><path fill="#41B883" d="m0 0l128 220.8L256 0h-51.2L128 132.48L50.56 0H0Z"></path><path fill="#35495E" d="M50.56 0L128 133.12L204.8 0h-47.36L128 51.2L97.92 0H50.56Z"></path></svg>`;

console.log(customSvgIcon);


const initMap = () => {
  const nodeRandom =
    Math.floor(Math.random() * 5) + 3 === 4
      ? 6
      : Math.floor(Math.random() * 5) + 3;
  const map = L.map('map').setView([23, 113], 5);
  const tdtUrl = `http://t${nodeRandom}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}&tk=b11578e50812a12bd62c4dcd3d9dd082`;
  const tileLayer = L.tileLayer(tdtUrl, {
    maxZoom: 18,
    minZoom: 2,
    attribution: '© modify'
  });
  tileLayer.addTo(map);

  // 使用自定义的 CanvasLayer 插件
  map.addLayer(new LeafletMapBlockLayer({ lineDash: [2, 2] }));

  const pointData: L.LatLngExpression[] = [];

  for (let i = 0; i < 0; i++) {
    pointData.push([Math.random() * (53 - 4) + 4, Math.random() * (135 - 73) + 73]);
  }

  pointData.push([23.146469, 113.038278])

  // let wgs84 = coordtransform.wgs84togcj02(113.038278, 23.146469)
  // pointData.push([wgs84[1], wgs84[0]]);

  // wgs84 = coordtransform.gcj02towgs84(113.038278, 23.146469)
  // pointData.push([wgs84[1], wgs84[0]]);

  // wgs84 = coordtransform.gcj02tobd09(113.038278, 23.146469)
  // pointData.push([wgs84[1], wgs84[0]]);

  // wgs84 = coordtransform.bd09togcj02(113.038278, 23.146469)
  // pointData.push([wgs84[1], wgs84[0]]);

  const customCanvas = new CustomCanvasOverlay(pointData, customSvgIcon);
  setTimeout(() => {
    customCanvas.addTo(map);
  }, 100)

  L.marker([23.146469, 113.038278]).addTo(map).bindPopup('真实位置');
};
</script>

<template>
  <div id="map" style="width: 100%; height: 100%;"></div>
</template>

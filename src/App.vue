<script setup lang="ts">
import { onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletMapBlockLayer } from './lib/LeafletMapBlock'
onMounted(() => {
  initMap();
});

const initMap = () => {
  const nodeRandom =
    Math.floor(Math.random() * 5) + 3 === 4
      ? 6
      : Math.floor(Math.random() * 5) + 3;
  const map = L.map('map').setView([38, 120], 5);
  const tdtUrl = `http://t${nodeRandom}.tianditu.gov.cn/DataServer?T=ter_w&x={x}&y={y}&l={z}&tk=b11578e50812a12bd62c4dcd3d9dd082`;
  const tileLayer = L.tileLayer(tdtUrl, {
    maxZoom: 18,
    minZoom: 2,
    attribution: '© modify'
  });
  tileLayer.addTo(map);

  L.tileLayer('http://t0.tianditu.gov.cn/DataServer?T=cva_c&x={x}&y={y}&l={z}&tk=1d2c7980571218c7ed292fa13f2bf126', {
    maxZoom: 18,
    minZoom: 2,
    attribution: '© modify'
  }).addTo(map);

  // 使用自定义的 CanvasLayer 插件
  map.addLayer(new LeafletMapBlockLayer({ lineDash: [2, 2] }));
};
</script>

<template>
  <div id="map" style="width: 100%; height: 100%;"></div>
</template>

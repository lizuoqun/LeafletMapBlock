<script setup lang="ts">
import { onMounted } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LeafletMapBlockLayer } from './lib/LeafletMapBlock';
import './lib/leaflet-markers-canvas'
import { ManyMarkersCanvas, MarkerPointOptions } from './lib/LeafletManyPoint'
// @ts-ignore
import archeryImage from './assets/archery.png'

onMounted(() => {
  initMap();
});
const customSvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" aria-hidden="true" role="img" class="iconify iconify--logos" width="37.07" height="36" preserveAspectRatio="xMidYMid meet" viewBox="0 0 256 198"><path fill="#41B883" d="M204.8 0H256L128 220.8L0 0h97.92L128 51.2L157.44 0h47.36Z"></path><path fill="#41B883" d="m0 0l128 220.8L256 0h-51.2L128 132.48L50.56 0H0Z"></path><path fill="#35495E" d="M50.56 0L128 133.12L204.8 0h-47.36L128 51.2L97.92 0H50.56Z"></path></svg>`;

const initMap = () => {
  const nodeRandom =
    Math.floor(Math.random() * 5) + 3 === 4
      ? 6
      : Math.floor(Math.random() * 5) + 3;
  const map = L.map('map').setView([23, 113], 5);
  // http://lbs.tianditu.gov.cn/server/MapService.html
  const tdtUrl = `http://t${nodeRandom}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}&tk=b11578e50812a12bd62c4dcd3d9dd082`;
  const tileLayer = L.tileLayer(tdtUrl, {
    maxZoom: 18,
    minZoom: 2,
    attribution: '© modify'
  });
  tileLayer.addTo(map);

  const Points: MarkerPointOptions[] = [
    {
      lat: 23,
      lng: 113,
      icon: archeryImage,
      title: '自定义图标',
      iconSize: [24, 24]
    },
    {
      lat: 25,
      lng: 111,
      icon: customSvgIcon,
      title: 'SVG',
      iconSize: [24, 24]
    }
  ]
  const manyMark = new ManyMarkersCanvas(Points);
  manyMark.addTo(map);

  manyMark.addLayer()
};
</script>

<template>
  <div id="map" style="width: 100%; height: 100%;"></div>
</template>
<style>
.my-leaflet-custom-tile {
  pointer-events: auto;
}
</style>
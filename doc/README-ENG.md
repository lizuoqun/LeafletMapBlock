


## Leaflet Map Block Rendering

### Function Overview
This module encapsulates a Leaflet grid layer `LeafletMapBlockLayer` for rendering tiles with grids and text markers on the map. It supports customizing grid line styles and displaying grid text.

### Interface Definition
```typescript
interface CanvasLayerOptions extends L.GridLayerOptions {
    // Line color
    strokeStyle?: string;
    // Line width
    lineWidth?: number;
    // Dashed line style: [0,0] for solid line
    lineDash?: number[];
    // Whether to show grid text
    showGridText?: boolean;
    // Grid text color
    gridTextColor?: string;
    // Grid text size, font and other configurations
    gridFont?: string;
}
```

### Default Configuration
```typescript
const defaultOptions = {
    strokeStyle: 'red',
    lineWidth: 2,
    lineDash: [5, 5],
    showGridText: true,
    gridTextColor: 'black',
    gridFont: '12px Arial'
};
```

### Usage Example
```typescript
import {LeafletMapBlockLayer} from 'leaflet-map-block/dist/LeafletMapBlock';
// Add this layer after initializing the map: create a new object and pass in parameters (optional)
map.addLayer(new LeafletMapBlockLayer({lineDash: [2, 2]}));
```

![Example Image](/public/example.png)

### Map Block Exception Troubleshooting
Each block on the map is an img image responded by a static resource. With this plugin, you can see the x, y, z values of each map block, which correspond to the tile coordinates.

The x, y, z values of the tiles can be seen in the map URL, for example: https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png

If a map block is displayed incorrectly, you can quickly locate its static path.

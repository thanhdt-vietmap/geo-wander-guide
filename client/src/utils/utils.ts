
import { ENV } from '../config/environment';

/**
 * {
    "version": 8,
    "sources": {
        "raster_vm": {
            "type": "raster",
            "tiles": [
                "https://maps.vietmap.vn/tm/{z}/{x}/{y}@2x.png?apikey=95f852d9f8c38e08ceacfd456b59059d0618254a50d3854c"
            ],
            "tileSize": 256,
            "attribution": "Vietmap@copyright"
        }
    },
    "layers": [
        {
            "id": "layer_raster_vm",
            "type": "raster",
            "source": "raster_vm",
            "minzoom": 0,
            "maxzoom": 20
        }
    ]
}
 */
class MapUtils {
  private getApiKey(): string {
    const apiKey = ENV.LM;
    // console.log('MapUtils using API key:', apiKey ? 'Present' : 'Missing');
    return apiKey;
  }

  getVietMapLightRasterTileLayer = () => {
    const apiKey = this.getApiKey();
    return {
      version: 8,
      sources: {
        raster_vm: {
          type: "raster",
          tiles: [
            `https://maps.vietmap.vn/api/lm/{z}/{x}/{y}@2x.png?apikey=${apiKey}`,
          ],
          tileSize: 256,
          attribution: "Vietmap@copyright",
        },
      },
      layers: [
        {
          id: "layer_raster_vm",
          type: "raster",
          source: "raster_vm",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  };

  getVietMapDarkRasterTileLayer = () => {
    const apiKey = this.getApiKey();
    return {
      version: 8,
      sources: {
        raster_vm: {
          type: "raster",
          tiles: [
            `https://maps.vietmap.vn/api/dm/{z}/{x}/{y}@2x.png?apikey=${apiKey}`,
          ],
          tileSize: 256,
          attribution: "Vietmap@copyright",
        },
      },
      layers: [
        {
          id: "layer_raster_vm",
          type: "raster",
          source: "raster_vm",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  };

  getVietMapRasterTileLayer = () => {
    const apiKey = this.getApiKey();
    return {
      version: 8,
      sources: {
        raster_vm: {
          type: "raster",
          tiles: [
            `https://maps.vietmap.vn/api/tm/{z}/{x}/{y}@2x.png?apikey=${apiKey}`,
          ],
          tileSize: 256,
          attribution: "Vietmap@copyright",
        },
      },
      layers: [
        {
          id: "layer_raster_vm",
          type: "raster",
          source: "raster_vm",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  };

  getVietMapHybridRasterTileLayer = () => {
    const apiKey = this.getApiKey();
    return {
      version: 8,
      sources: {
        raster_vm: {
          type: "raster",
          tiles: [
            `https://maps.vietmap.vn/api/hm/{z}/{x}/{y}@2x.png?apikey=${apiKey}`,
          ],
          tileSize: 256,
          attribution: "Vietmap@copyright",
        },

        "satellite-tile": {
          type: "raster",
          tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "layer_satellite_vm",
          type: "raster",
          source: "satellite-tile",
          minzoom: 0,
          maxzoom: 20,
        },
        {
          id: "layer_raster_vm",
          type: "raster",
          source: "raster_vm",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  };

  getVietMapSatelliteTileLayer = () => {
    return {
      version: 8,
      sources: {
        "raster-tiles": {
          type: "raster",
          tiles: ["https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"],
          tileSize: 256,
        },
      },
      layers: [
        {
          id: "satellite-tile",
          type: "raster",
          source: "raster-tiles",
          minzoom: 0,
          maxzoom: 20,
        },
      ],
    };
  };

  getVietMapVectorTile = () => {
    const apiKey = this.getApiKey();
    const url = `https://maps.vietmap.vn/mt/tm/style.json?apikey=${apiKey}`;
    // console.log('Vector tile URL:', url);
    return url;
  };
  
  getVietMapVectorDarkTile = () => {
    const apiKey = this.getApiKey();
    const url = `https://maps.vietmap.vn/mt/dm/style.json?apikey=${apiKey}`;
    // console.log('Vector dark tile URL:', url);
    return url;
  };

  getVietMapLightVectorTile = () => {
    const apiKey = this.getApiKey();
    const url = `https://maps.vietmap.vn/mt/lm/style.json?apikey=${apiKey}`;
    // console.log('Light vector tile URL:', url);
    return url;
  };
}

export const mapUtils = new MapUtils();

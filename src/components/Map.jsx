import { useEffect, useRef } from 'react';
import { useMapConfig } from '../contexts/MapContext';
import { useMapData } from '../contexts/MapDataContext';
import { useHashRouter } from '../contexts/HashRouterContext';
import * as ol from 'openlayers';

function Map() {
  const mapContainerRef = useRef(null);
  const { 
    currentYear, 
    currentButton, 
    showCunli, 
    showFeature, 
    createCunliStyle,
    vectorCunliRef,
    mapRef,
    setMap,
    cunliInitDoneRef
  } = useMapConfig();
  const { cunliSalary, countrySort } = useMapData();
  const { params } = useHashRouter();

  // 初始化地圖
  useEffect(() => {
    if (!cunliSalary || !mapContainerRef.current || mapRef.current) return;
    
    console.log('初始化地圖');
    
    // 初始化投影和分辨率
    const projection = ol.proj.get('EPSG:3857');
    const projectionExtent = projection.getExtent();
    const size = ol.extent.getWidth(projectionExtent) / 256;
    const resolutions = new Array(20);
    const matrixIds = new Array(20);
    
    for (let z = 0; z < 20; ++z) {
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z;
    }
    
    // 創建村里向量圖層
    const vectorCunli = new ol.layer.Vector({
      source: new ol.source.Vector({
        url: 'https://kiang.github.io/taiwan_basecode/cunli/topo/20240807.json',
        format: new ol.format.TopoJSON(),
      }),
      style: createCunliStyle
    });
    
    // 存儲向量圖層的引用
    vectorCunliRef.current = vectorCunli;
    
    // 創建底圖圖層
    const baseLayer = new ol.layer.Tile({
      source: new ol.source.WMTS({
        matrixSet: 'EPSG:3857',
        format: 'image/png',
        url: 'https://wmts.nlsc.gov.tw/wmts',
        layer: 'EMAP',
        tileGrid: new ol.tilegrid.WMTS({
          origin: ol.extent.getTopLeft(projectionExtent),
          resolutions: resolutions,
          matrixIds: matrixIds
        }),
        style: 'default',
        wrapX: true,
        attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
      }),
      opacity: 0.5
    });
    
    // 創建視圖
    const defaultCenter = [121.5654, 25.0330];
    const appView = new ol.View({
      center: ol.proj.fromLonLat(defaultCenter),
      zoom: 14
    });
    
    // 創建地圖
    const map = new ol.Map({
      target: mapContainerRef.current,
      layers: [baseLayer, vectorCunli],
      view: appView
    });
    
    // 存儲地圖引用
    mapRef.current = map;
    setMap(map);
    
    // 設置點擊事件
    map.on('singleclick', (evt) => {
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (layer === vectorCunli && feature.get('VILLCODE')) {
          showFeature(feature);
          return true;
        }
      }, {
        layerFilter: (layer) => layer === vectorCunli
      });
    });
    
    // 設置地理定位
    const geolocation = new ol.Geolocation({
      projection: appView.getProjection()
    });
    
    geolocation.setTracking(true);
    
    const positionFeature = new ol.Feature();
    
    positionFeature.setStyle(new ol.style.Style({
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
          color: '#3399CC'
        }),
        stroke: new ol.style.Stroke({
          color: '#fff',
          width: 2
        })
      })
    }));
    
    let geolocationCentered = false;
    
    geolocation.on('change:position', () => {
      const coordinates = geolocation.getPosition();
      if (coordinates) {
        positionFeature.setGeometry(new ol.geom.Point(coordinates));
        if (false === geolocationCentered) {
          map.getView().setCenter(coordinates);
          geolocationCentered = true;
        }
      }
    });
    
    new ol.layer.Vector({
      map: map,
      source: new ol.source.Vector({
        features: [positionFeature]
      })
    });
    
    // 設置村里圖層變更事件
    vectorCunli.on('change', () => {
      if (!cunliInitDoneRef.current && vectorCunli.getSource().getState() === 'ready') {
        cunliInitDoneRef.current = true;
        
        // 更新村里名稱
        vectorCunli.getSource().forEachFeature((f) => {
          const p = f.getProperties();
          if (countrySort[p.VILLCODE]) {
            countrySort[p.VILLCODE].name = p.COUNTYNAME + p.TOWNNAME + p.VILLNAME;
          }
        });
        
        // 使用 URL 參數初始化顯示
        const year = params.year || currentYear;
        const button = params.button || currentButton;
        const cunliCode = params.cunliCode || '';
        
        showCunli(year, button, cunliCode);
      }
    });
    
    // 清理函數
    return () => {
      if (map) {
        map.setTarget(null);
        mapRef.current = null;
        setMap(null);
      }
    };
  }, [cunliSalary, countrySort, currentYear, currentButton, showCunli, showFeature, createCunliStyle, vectorCunliRef, mapRef, setMap, cunliInitDoneRef, params]);
  
  return <div ref={mapContainerRef} className="map" id="map"></div>;
}

export default Map; 
import { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useMapConfig, formatToTenThousand } from '../contexts/MapContext';
import { useMapData } from '../contexts/MapDataContext';
import { useHashRouter } from '../contexts/HashRouterContext';
import * as ol from 'openlayers';

function Map() {
  const mapContainerRef = useRef(null);
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [initialRender, setInitialRender] = useState(true);
  const mapInitializedRef = useRef(false); // 追蹤地圖是否已初始化
  const [currentZoom, setCurrentZoom] = useState(14); // 追蹤當前縮放級別
  
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
  const { cunliSalary, countrySort, isLoading, dataInitialized } = useMapData();
  const { params } = useHashRouter();

  // 獲取當前選擇的數據值
  const [currentValue, setCurrentValue] = useState(null);

  // 當年份或按鈕變化時，更新當前值
  useEffect(() => {
    if (cunliSalary && currentYear && currentButton) {
      // 計算當前選擇的數據類型的平均值作為顯示值
      let sum = 0;
      let count = 0;
      
      // 遍歷所有村里數據
      Object.keys(cunliSalary).forEach(cunliCode => {
        if (cunliSalary[cunliCode] && 
            cunliSalary[cunliCode][currentYear] && 
            cunliSalary[cunliCode][currentYear][currentButton] !== undefined) {
          sum += cunliSalary[cunliCode][currentYear][currentButton];
          count++;
        }
      });
      
      // 計算平均值
      if (count > 0) {
        setCurrentValue(sum / count);
      } else {
        setCurrentValue(null);
      }
    } else {
      setCurrentValue(null);
    }
  }, [cunliSalary, currentYear, currentButton]);

  // 預先計算投影和分辨率 - 使用 useMemo 避免重複計算
  const projectionConfig = useMemo(() => {
    const projection = ol.proj.get('EPSG:3857');
    const projectionExtent = projection.getExtent();
    const size = ol.extent.getWidth(projectionExtent) / 256;
    const resolutions = new Array(20);
    const matrixIds = new Array(20);
    
    for (let z = 0; z < 20; ++z) {
      resolutions[z] = size / Math.pow(2, z);
      matrixIds[z] = z;
    }
    
    return { 
      projection, 
      projectionExtent, 
      resolutions, 
      matrixIds 
    };
  }, []);

  // 當資料初始化完成後，重置初始渲染狀態
  useEffect(() => {
    if (dataInitialized && !isLoading && !isMapLoading) {
      // 給一個短暫的延遲，確保地圖已經完全渲染
      setInitialRender(false);
    }
  }, [dataInitialized, isLoading, isMapLoading]);

  // 更新村里名稱的輔助函數 - 使用 useCallback 避免重新創建
  const updateVillageNames = useCallback((vectorLayer, countrySort) => {
    console.time('updateVillageNames');
    const features = vectorLayer.getSource().getFeatures();
    const batchSize = 100;
    let index = 0;
    
    function processBatch() {
      const endIndex = Math.min(index + batchSize, features.length);
      for (let i = index; i < endIndex; i++) {
        const feature = features[i];
        const p = feature.getProperties();
        if (countrySort[p.VILLCODE]) {
          countrySort[p.VILLCODE].name = p.COUNTYNAME + p.TOWNNAME + p.VILLNAME;
        }
      }
      
      index = endIndex;
      if (index < features.length) {
        setTimeout(processBatch, 0);
      } else {
        console.timeEnd('updateVillageNames');
      }
    }
    
    processBatch();
  }, []);

  // 監聽地圖縮放級別變化
  useEffect(() => {
    if (mapRef.current) {
      const view = mapRef.current.getView();
      
      const handleZoomChange = () => {
        const zoom = view.getZoom();
        setCurrentZoom(zoom);
        
        // 當縮放級別變化時，更新向量圖層以顯示/隱藏標籤
        if (vectorCunliRef.current) {
          vectorCunliRef.current.getSource().changed();
        }
      };
      
      // 監聽縮放變化事件
      view.on('change:resolution', handleZoomChange);
      
      return () => {
        view.un('change:resolution', handleZoomChange);
      };
    }
  }, []);

  // 初始化地圖 - 只在組件掛載時執行一次
  useEffect(() => {
    // 如果地圖已經初始化過，或者資料還沒準備好，或者容器還沒準備好，則不執行
    if (mapInitializedRef.current || !cunliSalary || !mapContainerRef.current || mapRef.current) return;
    
    console.time('mapInitialization');
    setIsMapLoading(true);
    mapInitializedRef.current = true; // 標記地圖正在初始化
    
    // 使用預先計算的投影配置
    const { projection, projectionExtent, resolutions, matrixIds } = projectionConfig;
    
    // 創建村里向量圖層 - 使用更高效的加載策略
    const vectorSource = new ol.source.Vector({
      url: '20240807.json',
      format: new ol.format.TopoJSON(),
      strategy: ol.loadingstrategy.bbox,
      overlaps: false
    });
    
    // 監聽向量源加載事件
    vectorSource.once('change', () => {
      if (vectorSource.getState() === 'ready') {
        setIsMapLoading(false);
        console.timeEnd('mapInitialization');
      }
    });
    
    const vectorCunli = new ol.layer.Vector({
      source: vectorSource,
      style: createCunliStyle,
      renderMode: 'image', // 使用圖像渲染模式提高性能
      updateWhileAnimating: false, // 動畫時不更新以提高性能
      updateWhileInteracting: false // 交互時不更新以提高性能
    });
    
    // 存儲向量圖層的引用
    vectorCunliRef.current = vectorCunli;
    
    // 創建底圖圖層 - 使用預加載策略
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
        attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>',
        preload: 4 // 預加載瓦片以提高性能
      }),
      opacity: 0.5
    });
    
    // 創建視圖
    const defaultCenter = [121.5654, 25.0330];
    const appView = new ol.View({
      center: ol.proj.fromLonLat(defaultCenter),
      zoom: 14,
      minZoom: 8, // 設置最小縮放級別
      maxZoom: 18, // 設置最大縮放級別
      constrainResolution: true // 限制分辨率以提高性能
    });
    
    // 創建地圖
    const map = new ol.Map({
      target: mapContainerRef.current,
      layers: [baseLayer, vectorCunli],
      view: appView,
      loadTilesWhileAnimating: true, // 動畫時加載瓦片以提高用戶體驗
      loadTilesWhileInteracting: true // 交互時加載瓦片以提高用戶體驗
    });
    
    // 存儲地圖引用
    mapRef.current = map;
    setMap(map);
    setCurrentZoom(appView.getZoom()); // 設置初始縮放級別
    
    // 設置點擊事件 - 使用防抖動以提高性能
    let clickTimeout;
    map.on('singleclick', (evt) => {
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          if (layer === vectorCunli && feature.get('VILLCODE')) {
            // 獲取特徵的幾何中心
            const extent = feature.getGeometry().getExtent();
            const center = ol.extent.getCenter(extent);
            
            // 平滑地移動到中心點
            map.getView().animate({
              center: center,
              duration: 500
            });
            
            // 顯示特徵資訊
            showFeature(feature);
            return true;
          }
        }, {
          layerFilter: (layer) => layer === vectorCunli,
          hitTolerance: 5 // 增加點擊容差以提高用戶體驗
        });
      }, 100);
    });
    
    // 設置地理定位
    const geolocation = new ol.Geolocation({
      projection: appView.getProjection(),
      trackingOptions: {
        enableHighAccuracy: true
      }
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
        
        // 使用 Web Worker 或 requestIdleCallback 更新村里名稱以避免阻塞主線程
        if (window.requestIdleCallback) {
          requestIdleCallback(() => {
            updateVillageNames(vectorCunli, countrySort);
          });
        } else {
          setTimeout(() => {
            updateVillageNames(vectorCunli, countrySort);
          }, 0);
        }
        
        // 使用 URL 參數初始化顯示
        const year = params.year || currentYear;
        const button = params.button || currentButton;
        const cunliCode = params.cunliCode || '';
        
        showCunli(year, button, cunliCode);
      }
    });
    
    // 清理函數 - 只有在組件真正卸載時才清理地圖
    return () => {
      if (map) {
        clearTimeout(clickTimeout);
        map.setTarget(null);
        mapRef.current = null;
        setMap(null);
        mapInitializedRef.current = false; // 重置初始化標記
      }
    };
  // 只依賴於必要的變量，避免不必要的重新創建
  }, [cunliSalary, projectionConfig]); // 移除不必要的依賴項
  
  // 當 currentYear 或 currentButton 變化時，更新地圖樣式
  useEffect(() => {
    if (mapRef.current && vectorCunliRef.current) {
      // 通知向量圖層更新樣式
      vectorCunliRef.current.getSource().changed();
    }
  }, [currentYear, currentButton]);
  
  // 只在初始渲染或JSON檔還沒下載完成時顯示載入中
  const shouldShowLoading = initialRender && (isLoading || isMapLoading);
  
  // 獲取當前選擇的數據類型標籤
  const getDataTypeLabel = () => {
    switch(currentButton) {
      case 'avg': return '平均數';
      case 'mid': return '中位數';
      case 'sd': return '標準差';
      case 'mid1': return '第一分位數';
      case 'mid3': return '第三分位數';
      default: return '';
    }
  };
  
  return (
    <>
      <div ref={mapContainerRef} className="map" id="map"></div>
      {shouldShowLoading && (
        <div className="map-loading-overlay">
          <div className="map-loading-spinner"></div>
          <div className="map-loading-text">載入地圖資料中...</div>
        </div>
      )}
      <div className="zoom-info">
        <div className="zoom-level">縮放級別: {Math.round(currentZoom)}</div>
        <div className="data-type">
          {getDataTypeLabel()}: {currentValue !== null ? `${formatToTenThousand(currentValue)} 萬元` : ''}
        </div>
      </div>
    </>
  );
}

export default Map; 
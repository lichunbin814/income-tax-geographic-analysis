import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useMapData } from './MapDataContext';
import { useMapEvent } from './MapEventContext';
import { useHashRouter } from './HashRouterContext';
import * as ol from 'openlayers';

const MapContext = createContext();

// 格式化數值為萬元，最多取到小數第1位
export function formatToTenThousand(value) {
  if (value === undefined || value === null) return '';
  // 將千元轉換為萬元（除以10）
  const inTenThousand = value / 10;
  // 如果是整數，不顯示小數點
  if (inTenThousand % 1 === 0) {
    return inTenThousand.toFixed(0);
  }
  // 否則顯示到小數點第1位
  return inTenThousand.toFixed(1);
}

// 顏色映射函數 - 純函數，可以直接導出
export function colorBar(value) {
  if (value === 0)
    return "rgba(255,255,255,0.6)" //white
  else if (value <= 300)
    return "rgba(254,232,200,0.6)"
  else if (value <= 400)
    return "rgba(253,212,158,0.6)"
  else if (value <= 500)
    return "rgba(253,187,132,0.6)"
  else if (value <= 700)
    return "rgba(252,141,89,0.6)"
  else if (value <= 900)
    return "rgba(239,101,72,0.6)"
  else if (value <= 1100)
    return "rgba(215,48,31,0.6)"
  else if (value <= 1300)
    return "rgba(179,0,0,0.6)"
  else if (value <= 1500)
    return "rgba(127,0,0,0.6)"
  else
    return "rgba(64,0,0,0.6)"
}

// 獲取數據類型的顯示名稱
function getDataTypeLabel(buttonType) {
  switch(buttonType) {
    case 'avg': return '平均數';
    case 'mid': return '中位數';
    case 'sd': return '標準差';
    case 'mid1': return '第一分位數';
    case 'mid3': return '第三分位數';
    default: return '中位數';
  }
}

// 格式化數值顯示
function formatValue(value) {
  if (value === undefined || value === null) return '';
  // 轉換為萬元並格式化
  return formatToTenThousand(value);
}

export function MapProvider({ children }) {
  // 基本狀態
  const [currentYear, setCurrentYear] = useState('2022');
  const [currentButton, setCurrentButton] = useState('mid');
  const [currentCunliCode, setCurrentCunliCode] = useState('');
  const [map, setMap] = useState(null);
  const { cunliSalary, countrySort } = useMapData();
  const { showMapData } = useMapEvent();
  const { setHashValue, params } = useHashRouter();
  
  // Refs
  const mapRef = useRef(null);
  const vectorCunliRef = useRef(null);
  const stylePoolRef = useRef({});
  const cunliInitDoneRef = useRef(false);
  
  // 顯示村里資料的函數 - 使用 useCallback 以避免不必要的重新創建
  const showCunli = useCallback((theYear, theButton, cunliCode = '') => {
    const validButtons = ['avg', 'mid', 'sd', 'mid1', 'mid3'];
    
    // 驗證按鈕是否有效
    const validButton = validButtons.includes(theButton) ? theButton : 'mid';
    
    // 更新狀態
    setCurrentYear(theYear);
    setCurrentButton(validButton);
    setCurrentCunliCode(cunliCode);
    
    // 通知向量圖層更新
    if (vectorCunliRef.current) {
      vectorCunliRef.current.getSource().changed();
    }
    
    // 強制觸發地圖重繪
    if (mapRef.current) {
      mapRef.current.render();
    }
  }, []);
  
  // 顯示特定地理特徵的詳細資訊 - 使用 useCallback
  const showFeature = useCallback((feature) => {
    if (!feature || !cunliSalary) return;
    
    const cunli = feature.get('COUNTYNAME') + feature.get('TOWNNAME') + feature.get('VILLNAME');
    const cunliKey = feature.get('VILLCODE');
    
    if (!cunliSalary[cunliKey]) return;
    
    const tableData = [];
    const chartDataSet1 = [];
    const chartDataSet2 = [];
    
    for (let y in cunliSalary[cunliKey]) {
      const rowData = [y];
      for (let k in cunliSalary[cunliKey][y]) {
        rowData.push(cunliSalary[cunliKey][y][k]);
      }
      tableData.push(rowData);
      chartDataSet1.push(cunliSalary[cunliKey][y].mid);
      chartDataSet2.push(cunliSalary[cunliKey][y].avg);
    }

    const chartData = {
      labels: Object.keys(cunliSalary[cunliKey]),
      datasets: [
        {
          label: "中位數",
          backgroundColor: "rgb(255, 99, 132)",
          data: chartDataSet1
        },
        {
          label: "平均數",
          backgroundColor: "rgb(132, 99, 255)",
          data: chartDataSet2
        }
      ]
    };

    // 使用 MapEventContext 的 showMapData 函數，而不是 window 事件
    showMapData({
      title: cunli,
      tableData: tableData,
      chartData: chartData,
      chartConfig: chartData
    });
    
    // 使用 HashRouterContext 更新 URL hash
    setHashValue(currentYear, currentButton, cunliKey);
  }, [cunliSalary, currentYear, currentButton, showMapData, setHashValue]);
  
  // 創建村里樣式函數 - 使用 useCallback
  const createCunliStyle = useCallback((feature) => {
    if (!cunliSalary) return null;
    
    const key = feature.get('VILLCODE');
    let count = 0;
    let displayValue = '';
    
    if (cunliSalary[key] && cunliSalary[key][currentYear]) {
      count = cunliSalary[key][currentYear][currentButton];
      displayValue = formatValue(count);
    }
    
    const fillColor = colorBar(count);
    
    // 獲取鄉鎮名稱
    const townName = feature.get('TOWNNAME') || '';
    const villageName = feature.get('VILLNAME') || '';
    
    // 創建樣式 - 使用樣式池來提高性能
    // 加入當前縮放級別到樣式鍵中，確保縮放時樣式更新
    const zoom = mapRef.current ? mapRef.current.getView().getZoom() : 14;
    const zoomLevel = Math.floor(zoom); // 使用整數縮放級別以減少樣式數量
    const styleKey = `${fillColor}_${currentButton}_${currentYear}_${zoomLevel}`;
    
    if (!stylePoolRef.current[styleKey]) {
      stylePoolRef.current[styleKey] = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(0,0,0,0.7)',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: fillColor,
        }),
        text: new ol.style.Text({
          font: '12px "Open Sans", "Arial Unicode MS", "sans-serif"',
          fill: new ol.style.Fill({
            color: '#000'
          }),
          stroke: new ol.style.Stroke({
            color: '#fff',
            width: 3
          }),
          overflow: true,
          offsetY: -15
        })
      });
    }
    
    feature.set('fillColor', fillColor);
    const theStyle = stylePoolRef.current[styleKey].clone();
    
    // 設置文字顯示 - 顯示鄉鎮名稱和數據值
    if (displayValue) {
      // 根據縮放級別決定顯示的文字內容
      if (zoom >= 14) {
        // 高縮放級別顯示詳細信息
        theStyle.getText().setText(`${villageName}\n${displayValue}萬`);
      } else if (zoom >= 12) {
        // 中等縮放級別只顯示數據值
        theStyle.getText().setText(`${displayValue}萬`);
      } else {
        // 低縮放級別不顯示文字
        theStyle.getText().setText('');
      }
    }
    
    return theStyle;
  }, [cunliSalary, currentYear, currentButton, mapRef]);
  
  // 從 HashRouterContext 獲取參數 - 使用 useEffect
  useEffect(() => {
    if (params.year && params.button) {
      showCunli(params.year, params.button, params.cunliCode);
    }
  }, [params, showCunli]);

  // 監聽地圖縮放事件，更新樣式
  useEffect(() => {
    if (map) {
      const updateStyles = () => {
        if (vectorCunliRef.current) {
          vectorCunliRef.current.getSource().changed();
        }
      };
      
      // 監聽縮放結束事件
      map.getView().on('change:resolution', updateStyles);
      
      return () => {
        // 清理事件監聽
        map.getView().un('change:resolution', updateStyles);
      };
    }
  }, [map]);

  // 提供 Context 值
  const contextValue = {
    map,
    setMap,
    currentYear,
    currentButton,
    currentCunliCode,
    showCunli,
    showFeature,
    createCunliStyle,
    mapRef,
    vectorCunliRef,
    stylePoolRef,
    cunliInitDoneRef
  };

  return (
    <MapContext.Provider value={contextValue}>
      {children}
    </MapContext.Provider>
  );
}

// 自定義 Hook 以便於使用 Context
export function useMapConfig() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapConfig must be used within a MapProvider');
  }
  return context;
}
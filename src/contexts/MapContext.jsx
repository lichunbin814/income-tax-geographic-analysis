import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useMapData } from './MapDataContext';
import { useMapEvent } from './MapEventContext';
import { useHashRouter } from './HashRouterContext';
import * as ol from 'openlayers';

const MapContext = createContext();

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
    
    if (cunliSalary[key] && cunliSalary[key][currentYear]) {
      count = cunliSalary[key][currentYear][currentButton];
    }
    
    const fillColor = colorBar(count);
    
    if (!stylePoolRef.current[fillColor]) {
      stylePoolRef.current[fillColor] = new ol.style.Style({
        stroke: new ol.style.Stroke({
          color: 'rgba(0,0,0,0.7)',
          width: 1
        }),
        fill: new ol.style.Fill({
          color: fillColor,
        }),
        text: new ol.style.Text({
          font: '14px "Open Sans", "Arial Unicode MS", "sans-serif"',
          fill: new ol.style.Fill({
            color: 'rgba(0,0,255,1)'
          })
        })
      });
    }
    
    feature.set('fillColor', fillColor);
    const theStyle = stylePoolRef.current[fillColor].clone();
    
    if (countrySort[key] && countrySort[key][currentYear] && countrySort[key][currentButton]) {
      theStyle.getText().setText(countrySort[key][currentYear][currentButton].toString());
    }
    
    return theStyle;
  }, [cunliSalary, countrySort, currentYear, currentButton]);
  
  // 從 HashRouterContext 獲取參數 - 使用 useEffect
  useEffect(() => {
    if (params.year && params.button) {
      showCunli(params.year, params.button, params.cunliCode);
    }
  }, [params, showCunli]);

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
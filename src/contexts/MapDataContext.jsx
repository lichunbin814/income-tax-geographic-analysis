import { createContext, useState, useContext, useEffect } from 'react';

const MapDataContext = createContext();

export function MapDataProvider({ children }) {
  const [mapData, setMapData] = useState({
    cunliSalary: null,
    countrySort: {},
    countrySortPool: {},
    cunliListPool: {}
  });

  useEffect(() => {
    const processData = (data) => {
      const countrySort = {};
      const countrySortPool = {};
      const cunliListPool = {};

      // 原本 $.getJSON 裡的資料處理邏輯
      for (const cunliCode in data) {
        countrySort[cunliCode] = { name: '' };
        for (const year in data[cunliCode]) {
          countrySort[cunliCode][year] = {};
          if (!countrySortPool[year]) {
            countrySortPool[year] = {};
          }
          if (!cunliListPool[year]) {
            cunliListPool[year] = {};
          }
          for (const key in data[cunliCode][year]) {
            countrySort[cunliCode][year][key] = 0;
            if (!countrySortPool[year][key]) {
              countrySortPool[year][key] = {};
            }
            if (!cunliListPool[year][key]) {
              cunliListPool[year][key] = {};
            }
            if (!cunliListPool[year][key][data[cunliCode][year][key]]) {
              cunliListPool[year][key][data[cunliCode][year][key]] = [];
            }
            countrySortPool[year][key][data[cunliCode][year][key]] = 0;
            cunliListPool[year][key][data[cunliCode][year][key]].push(cunliCode);
          }
        }
      }

      // 排序邏輯
      for (const year in countrySortPool) {
        for (const key in countrySortPool[year]) {
          const pool = Object.keys(countrySortPool[year][key]);
          pool.sort((a, b) => b - a);
          for (let i = 0; i < pool.length; i++) {
            countrySortPool[year][key][pool[i]] = i + 1;
          }
        }
      }

      // 更新 countrySort
      for (const cunliCode in countrySort) {
        for (const year in countrySort[cunliCode]) {
          for (const key in countrySort[cunliCode][year]) {
            countrySort[cunliCode][year][key] = 
              countrySortPool[year][key][data[cunliCode][year][key]];
          }
        }
      }

      return {
        cunliSalary: data,
        countrySort,
        countrySortPool,
        cunliListPool
      };
    };

    fetch('fia_data.json')
      .then(response => response.json())
      .then(data => {
        const processedData = processData(data);
        setMapData(processedData);
        
        // 設定全域變數
        window.cunliSalary = processedData.cunliSalary;
        window.countrySort = processedData.countrySort;
        window.countrySortPool = processedData.countrySortPool;
        window.cunliListPool = processedData.cunliListPool;
        
        // 觸發自定義事件，通知資料已準備完成
        // window.dispatchEvent(new Event('mapDataReady'));
      })
      .catch(error => console.error('Error loading data:', error));
  }, []);

  return (
    <MapDataContext.Provider value={mapData}>
      {children}
    </MapDataContext.Provider>
  );
}

export const useMapData = () => useContext(MapDataContext); 
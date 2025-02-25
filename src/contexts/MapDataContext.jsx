import { createContext, useState, useContext, useEffect, useMemo } from 'react';

const MapDataContext = createContext();

export function MapDataProvider({ children }) {
  const [mapData, setMapData] = useState({
    cunliSalary: null,
    countrySort: {},
    countrySortPool: {},
    cunliListPool: {}
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use AbortController for fetch cancellation if component unmounts
    const abortController = new AbortController();
    const signal = abortController.signal;

    const processData = (data) => {
      console.time('processData'); // Performance measurement
      
      const countrySort = {};
      const countrySortPool = {};
      const cunliListPool = {};

      // Pre-allocate year and key objects to reduce object creation in loops
      const years = new Set();
      const keys = new Set();
      
      // First pass: collect all years and keys
      for (const cunliCode in data) {
        for (const year in data[cunliCode]) {
          years.add(year);
          for (const key in data[cunliCode][year]) {
            keys.add(key);
          }
        }
      }
      
      // Pre-initialize data structures
      years.forEach(year => {
        countrySortPool[year] = {};
        cunliListPool[year] = {};
        
        keys.forEach(key => {
          countrySortPool[year][key] = {};
          cunliListPool[year][key] = {};
        });
      });

      // Process data in a more optimized way
      for (const cunliCode in data) {
        countrySort[cunliCode] = { name: '' };
        
        for (const year in data[cunliCode]) {
          countrySort[cunliCode][year] = {};
          
          for (const key in data[cunliCode][year]) {
            const value = data[cunliCode][year][key];
            countrySort[cunliCode][year][key] = 0;
            
            if (!cunliListPool[year][key][value]) {
              cunliListPool[year][key][value] = [];
            }
            
            countrySortPool[year][key][value] = 0;
            cunliListPool[year][key][value].push(cunliCode);
          }
        }
      }

      // 排序邏輯 - 使用 Map 來提高排序效率
      for (const year in countrySortPool) {
        for (const key in countrySortPool[year]) {
          const pool = Object.keys(countrySortPool[year][key]);
          // Convert to numbers once for sorting
          const numericPool = pool.map(Number);
          numericPool.sort((a, b) => b - a);
          
          // Create a rank map for faster lookups
          const rankMap = new Map();
          for (let i = 0; i < numericPool.length; i++) {
            rankMap.set(numericPool[i], i + 1);
            countrySortPool[year][key][numericPool[i]] = i + 1;
          }
        }
      }

      // 更新 countrySort - 使用已計算的排名
      for (const cunliCode in countrySort) {
        for (const year in countrySort[cunliCode]) {
          if (year === 'name') continue;
          
          for (const key in countrySort[cunliCode][year]) {
            const value = data[cunliCode][year][key];
            countrySort[cunliCode][year][key] = countrySortPool[year][key][value];
          }
        }
      }

      console.timeEnd('processData'); // Performance measurement
      
      return {
        cunliSalary: data,
        countrySort,
        countrySortPool,
        cunliListPool
      };
    };

    // Prefetch and process data
    setIsLoading(true);
    
    // Use performance API to measure loading time
    const startTime = performance.now();
    
    fetch('fia_data.json', { signal })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        const processedData = processData(data);
        setMapData(processedData);
        setIsLoading(false);
        
        // 設定全域變數 - 但避免使用全域變數是更好的做法
        window.cunliSalary = processedData.cunliSalary;
        window.countrySort = processedData.countrySort;
        window.countrySortPool = processedData.countrySortPool;
        window.cunliListPool = processedData.cunliListPool;
        
        // 觸發自定義事件，通知資料已準備完成
        window.dispatchEvent(new Event('mapDataReady'));
        
        const endTime = performance.now();
        console.log(`Data loading and processing took ${endTime - startTime}ms`);
      })
      .catch(error => {
        if (error.name !== 'AbortError') {
          console.error('Error loading data:', error);
          setIsLoading(false);
        }
      });
      
    return () => {
      abortController.abort(); // Cancel fetch if component unmounts
    };
  }, []);

  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    ...mapData,
    isLoading
  }), [mapData, isLoading]);

  return (
    <MapDataContext.Provider value={contextValue}>
      {children}
    </MapDataContext.Provider>
  );
}

export const useMapData = () => useContext(MapDataContext); 
import { createContext, useContext, useEffect } from 'react';

const MapContext = createContext();

export function MapProvider({ children }) {
  useEffect(() => {
    // 確保 ol.control.Sidebar 存在
    if (window.ol && window.ol.control && window.ol.control.Sidebar) {
      // 使用全局的 ol 對象而不是導入的
      window.sidebar = new window.ol.control.Sidebar({ 
        element: 'sidebar', 
        position: 'right' 
      });
    } else {
      console.error('ol.control.Sidebar is not available');
    }
  }, []);

  return (
    <MapContext.Provider value={{}}>
      {children}
    </MapContext.Provider>
  );
}

export function useMapConfig() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapConfig must be used within a MapProvider');
  }
  return context;
} 
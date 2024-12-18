import { createContext, useContext, useEffect } from 'react';

const MapContext = createContext();

export function MapProvider({ children }) {
  useEffect(() => {
    if (window.ol && window.ol.control) {
      // 從 src/contexts 到 public/assets/map/js 的相對路徑
      import('../../public/assets/map/js/ol3-sidebar.js')
        .then(module => {
          const Sidebar = module.default;
          window.sidebar = new Sidebar({ 
            element: 'sidebar', 
            position: 'right' 
          });
        })
        .catch(error => {
          console.error('Failed to load sidebar:', error);
        });
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
import { createContext, useContext, useEffect } from 'react';

const MapContext = createContext();

export function MapProvider({ children }) {
  

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
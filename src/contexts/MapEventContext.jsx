import { createContext, useContext, useState } from 'react';

const MapEventContext = createContext();

export function MapEventProvider({ children }) {
  const [mapEventData, setMapEventData] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // 顯示地圖數據對話框
  const showMapData = (data) => {
    setMapEventData(data);
    setIsDialogOpen(true);
  };

  // 關閉對話框
  const closeDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <MapEventContext.Provider value={{
      mapEventData,
      isDialogOpen,
      showMapData,
      closeDialog
    }}>
      {children}
    </MapEventContext.Provider>
  );
}

export function useMapEvent() {
  const context = useContext(MapEventContext);
  if (!context) {
    throw new Error('useMapEvent must be used within a MapEventProvider');
  }
  return context;
} 
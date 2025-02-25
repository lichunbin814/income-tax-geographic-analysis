import { useState, useEffect } from 'react';
import { MapProvider } from './contexts/MapContext';
import { MapDataProvider } from './contexts/MapDataContext';
import { MapEventProvider, useMapEvent } from './contexts/MapEventContext';
import { HashRouterProvider } from './contexts/HashRouterContext';
import MapDataDialog from './components/MapDataDialog';
import Map from './components/Map';
import ControlPanel from './components/ControlPanel';
import './App.css';

// 創建一個包裝組件來使用 MapEvent context
function MapContainer() {
  const { mapEventData, isDialogOpen, closeDialog } = useMapEvent();

  return (
    <>
      <Map />
      <ControlPanel />
      <div id="popup" className="ol-popup">
        <a href="#" id="popup-closer" className="ol-popup-closer"></a>
        <div id="popup-content"></div>
      </div>
      <MapDataDialog
        open={isDialogOpen}
        onClose={closeDialog}
        data={mapEventData}
      />
    </>
  );
}

function App() {
  return (
    <HashRouterProvider>
      <MapDataProvider>
        <MapEventProvider>
          <MapProvider>
            <MapContainer />
          </MapProvider>
        </MapEventProvider>
      </MapDataProvider>
    </HashRouterProvider>
  );
}

export default App;

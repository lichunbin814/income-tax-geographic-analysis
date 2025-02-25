import { useState, useEffect } from 'react';
import { MapProvider } from './contexts/MapContext';
import { MapDataProvider } from './contexts/MapDataContext';
import MapDataDialog from './components/MapDataDialog';
import Map from './components/Map';
import './App.css';
import * as ol from 'openlayers';

function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    // 設置全局 ol 對象，以便其他組件可以使用
    window.ol = ol;
  }, []);

  useEffect(() => {
    const handleMapData = (event) => {
      setMapData(event.detail);
      setDialogOpen(true);
    };

    window.addEventListener('showMapData', handleMapData);
    return () => {
      window.removeEventListener('showMapData', handleMapData);
    };
  }, []);

  const handleClose = () => {
    setDialogOpen(false);
  };

  return (
    <MapDataProvider>
      <MapProvider>
        <Map />
        <div id="popup" className="ol-popup">
          <a href="#" id="popup-closer" className="ol-popup-closer"></a>
          <div id="popup-content"></div>
        </div>
        <MapDataDialog
          open={dialogOpen}
          onClose={handleClose}
          data={mapData}
        />
      </MapProvider>
    </MapDataProvider>
  );
}

export default App;

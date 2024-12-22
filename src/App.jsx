import { useState, useEffect } from 'react';
import { MapProvider } from './contexts/MapContext';
import { MapDataProvider } from './contexts/MapDataContext';
import MapDataDialog from './components/MapDataDialog';
import './App.css';

function App() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [mapData, setMapData] = useState(null);

  useEffect(() => {
    console.log('App: Setting up event listener');
    const handleMapData = (event) => {
      console.log('App: Received showMapData event:', event.detail);
      setMapData(event.detail);
      setDialogOpen(true);
    };

    window.addEventListener('showMapData', handleMapData);
    return () => {
      console.log('App: Removing event listener');
      window.removeEventListener('showMapData', handleMapData);
    };
  }, []);

  const handleClose = () => {
    console.log('App: Dialog closing');
    setDialogOpen(false);
  };

  console.log('App render:', { dialogOpen, mapData });

  return (
    <MapProvider>
      <MapDataProvider>
        <div id="map" className="map"></div>
        <div id="popup" className="ol-popup">
          <a href="#" id="popup-closer" className="ol-popup-closer"></a>
          <div id="popup-content"></div>
        </div>
        <MapDataDialog
          open={dialogOpen}
          onClose={handleClose}
          data={mapData}
        />
      </MapDataProvider>
    </MapProvider>
  );
}

export default App;

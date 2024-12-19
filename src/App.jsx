import { MapProvider } from './contexts/MapContext';
import { MapDataProvider } from './contexts/MapDataContext';
import './App.css';

function App() {
  return (
    <MapProvider>
      <MapDataProvider>
        <div id="map" className="map"></div>
        <div id="popup" className="ol-popup">
          <a href="#" id="popup-closer" className="ol-popup-closer"></a>
          <div id="popup-content"></div>
        </div>
      </MapDataProvider>
    </MapProvider>
  );
}

export default App;

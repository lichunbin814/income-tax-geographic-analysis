import { MapDataProvider } from './contexts/MapDataContext'; 
import './App.css'

function App() {
  return (
    <MapDataProvider>
      <div id="sidebar" className="sidebar collapsed">
        <div className="sidebar-tabs">
          <ul role="tablist">
            <li><a href="#home" role="tab"><i className="fa fa-bars"></i></a></li>
            <li><a href="#tools" role="tab"><i className="fa fa-arrows"></i></a></li>
            <li><a href="#cunliList" role="tab"><i className="fa fa-sort-numeric-asc"></i></a></li>
            <li><a href="https://github.com/kiang/salary" role="tab" target="_blank"><i className="fa fa-github"></i></a></li>
          </ul>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-pane" id="home">
            <h1 className="sidebar-header">
              台灣所得地圖
              <span className="sidebar-close"><i className="fa fa-caret-left"></i></span>
            </h1>
            <p id="sidebar-main-block"></p>
            <div className="pull-right">單位：千元
              <span className="colorBox" style={{backgroundColor: 'white'}}></span>&nbsp;無資料
              <span className="colorBox" style={{backgroundColor: 'rgba(254,232,200,0.6)'}}></span>&nbsp;300
              <span className="colorBox" style={{backgroundColor: 'rgba(253,212,158,0.6)'}}></span>&nbsp;400
              <span className="colorBox" style={{backgroundColor: 'rgba(253,187,132,0.6)'}}></span>&nbsp;500
              <span className="colorBox" style={{backgroundColor: 'rgba(252,141,89,0.6)'}}></span>&nbsp;700
              <span className="colorBox" style={{backgroundColor: 'rgba(239,101,72,0.6)'}}></span>&nbsp;900
              <span className="colorBox" style={{backgroundColor: 'rgba(215,48,31,0.6)'}}></span>&nbsp;1100
              <span className="colorBox" style={{backgroundColor: 'rgba(179,0,0,0.6)'}}></span>&nbsp;1300
              <span className="colorBox" style={{backgroundColor: 'rgba(127,0,0,0.6)'}}></span>&nbsp;1500
              <span className="colorBox" style={{backgroundColor: 'rgba(64,0,0,0.6)'}}></span>&nbsp;&gt;1500
            </div>
          </div>

          <div className="sidebar-pane" id="tools">
            <a className="btn btn-primary btn-lg btn-block btn-play" id="avg" href="#">平均數</a>
            <a className="btn btn-primary btn-lg btn-block btn-play" id="mid" href="#">中位數</a>
            <a className="btn btn-primary btn-lg btn-block btn-play" id="sd" href="#">標準差</a>
            <a className="btn btn-primary btn-lg btn-block btn-play" id="mid1" href="#">第一分位數</a>
            <a className="btn btn-primary btn-lg btn-block btn-play" id="mid3" href="#">第三分位數</a>
            <hr />
            年度
            {[2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011].map(year => (
              <a key={year} href="#" className="btn btn-primary btn-year" data-year={year}>{year}</a>
            ))}
          </div>

          <div className="sidebar-pane" id="cunliList"></div>
        </div>
      </div>
      <div id="map" className="map"></div>
      <div id="popup" className="ol-popup">
        <a href="#" id="popup-closer" className="ol-popup-closer"></a>
        <div id="popup-content"></div>
      </div>
    </MapDataProvider>
  )
}

export default App

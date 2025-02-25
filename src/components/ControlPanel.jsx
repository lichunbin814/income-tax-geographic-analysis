import { useState, useEffect } from 'react';
import { useMapConfig, formatToTenThousand } from '../contexts/MapContext';
import { useHashRouter } from '../contexts/HashRouterContext';
import './ControlPanel.css';

function ControlPanel() {
  const { currentYear, currentButton, showCunli } = useMapConfig();
  const { setHashValue } = useHashRouter();
  const [year, setYear] = useState(currentYear);
  const [button, setButton] = useState(currentButton);

  // 同步 props 和 state
  useEffect(() => {
    setYear(currentYear);
    setButton(currentButton);
  }, [currentYear, currentButton]);

  // 處理年份變更
  const handleYearChange = (e) => {
    const newYear = e.target.value;
    setYear(newYear);
    setHashValue(newYear, button, '');
    showCunli(newYear, button);
  };

  // 處理按鈕變更
  const handleButtonChange = (newButton) => {
    if (newButton === button) return; // 避免重複觸發相同的按鈕
    
    setButton(newButton);
    setHashValue(year, newButton, '');
    showCunli(year, newButton);
  };

  return (
    <div className="control-panel">
      <div className="control-section">
        <label htmlFor="year-select">年份：</label>
        <select 
          id="year-select" 
          value={year} 
          onChange={handleYearChange}
        >
          <option value="2022">2022</option>
          <option value="2021">2021</option>
          <option value="2020">2020</option>
          <option value="2019">2019</option>
          <option value="2018">2018</option>
          <option value="2017">2017</option>
          <option value="2016">2016</option>
          <option value="2015">2015</option>
          <option value="2014">2014</option>
          <option value="2013">2013</option>
          <option value="2012">2012</option>
        </select>
      </div>
      
      <div className="control-section">
        <div className="button-group">
          <button 
            className={button === 'avg' ? 'active' : ''} 
            onClick={() => handleButtonChange('avg')}
          >
            平均數
          </button>
          <button 
            className={button === 'mid' ? 'active' : ''} 
            onClick={() => handleButtonChange('mid')}
          >
            中位數
          </button>
          <button 
            className={button === 'sd' ? 'active' : ''} 
            onClick={() => handleButtonChange('sd')}
          >
            標準差
          </button>
          <button 
            className={button === 'mid1' ? 'active' : ''} 
            onClick={() => handleButtonChange('mid1')}
          >
            第一分位數
          </button>
          <button 
            className={button === 'mid3' ? 'active' : ''} 
            onClick={() => handleButtonChange('mid3')}
          >
            第三分位數
          </button>
        </div>
      </div>
      
      <div className="control-section">
        <div className="legend">
          <h4>圖例</h4>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(254,232,200,0.6)' }}></span>
            <span className="legend-label">0-{formatToTenThousand(300)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(253,212,158,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(300)}-{formatToTenThousand(400)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(253,187,132,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(400)}-{formatToTenThousand(500)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(252,141,89,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(500)}-{formatToTenThousand(700)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(239,101,72,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(700)}-{formatToTenThousand(900)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(215,48,31,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(900)}-{formatToTenThousand(1100)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(179,0,0,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(1100)}-{formatToTenThousand(1300)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(127,0,0,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(1300)}-{formatToTenThousand(1500)} 萬</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ backgroundColor: 'rgba(64,0,0,0.6)' }}></span>
            <span className="legend-label">{formatToTenThousand(1500)}+ 萬</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ControlPanel; 
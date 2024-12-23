// $.ajaxSetup({ async: false });

// let countrySort = {}, countrySortPool = {}, cunliListPool = {}, cunliSalary = {};
// $.getJSON('fia_data.json', function (data) {
//   cunliSalary = data;
//   for (cunliCode in cunliSalary) {
//     countrySort[cunliCode] = {
//       name: ''
//     };
//     for (year in cunliSalary[cunliCode]) {
//       countrySort[cunliCode][year] = {};
//       if (!countrySortPool[year]) {
//         countrySortPool[year] = {};
//       }
//       if (!cunliListPool[year]) {
//         cunliListPool[year] = {};
//       }
//       for (key in cunliSalary[cunliCode][year]) {
//         countrySort[cunliCode][year][key] = 0;
//         if (!countrySortPool[year][key]) {
//           countrySortPool[year][key] = {};
//         }
//         if (!cunliListPool[year][key]) {
//           cunliListPool[year][key] = {};
//         }
//         if (!cunliListPool[year][key][cunliSalary[cunliCode][year][key]]) {
//           cunliListPool[year][key][cunliSalary[cunliCode][year][key]] = [];
//         }
//         countrySortPool[year][key][cunliSalary[cunliCode][year][key]] = 0;
//         cunliListPool[year][key][cunliSalary[cunliCode][year][key]].push(cunliCode);
//       }
//     }
//   }
//   for (year in countrySortPool) {
//     for (key in countrySortPool[year]) {
//       let pool = Object.keys(countrySortPool[year][key]);
//       pool.sort(function (a, b) {
//         return b - a;
//       });
//       for (let i = 0; i < pool.length; i++) {
//         countrySortPool[year][key][pool[i]] = i + 1;
//       }
//     }
//   }
//   for (cunliCode in countrySort) {
//     for (year in countrySort[cunliCode]) {
//       for (key in countrySort[cunliCode][year]) {
//         countrySort[cunliCode][year][key] = countrySortPool[year][key][cunliSalary[cunliCode][year][key]];
//       }
//     }
//   }
//   console.log('Data loaded:', cunliSalary);
// });

var projection = ol.proj.get('EPSG:3857');
var projectionExtent = projection.getExtent();
var size = ol.extent.getWidth(projectionExtent) / 256;
var resolutions = new Array(20);
var matrixIds = new Array(20);
for (var z = 0; z < 20; ++z) {
  // generate resolutions and matrixIds arrays for this WMTS
  resolutions[z] = size / Math.pow(2, z);
  matrixIds[z] = z;
}
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');

closer.onclick = function () {
  popup.setPosition(undefined);
  closer.blur();
  return false;
};

var popup = new ol.Overlay({
  element: container,
  autoPan: true,
  autoPanAnimation: {
    duration: 250
  }
});

var nlscMatrixIds = new Array(21);
for (var i = 0; i < 21; ++i) {
  nlscMatrixIds[i] = i;
}

var stylePool = {};
var cunliStyle = function (f) {
  var key = f.get('VILLCODE'), count = 0;
  if (cunliSalary[key] && cunliSalary[key][currentYear]) {
    count = cunliSalary[key][currentYear][currentButton];
  }
  var fillColor = ColorBar(count);
  if (!stylePool[fillColor]) {
    stylePool[fillColor] = new ol.style.Style({
      stroke: new ol.style.Stroke({
        color: 'rgba(0,0,0,0.7)',
        width: 1
      }),
      fill: new ol.style.Fill({
        color: fillColor,
      }),
      text: new ol.style.Text({
        font: '14px "Open Sans", "Arial Unicode MS", "sans-serif"',
        fill: new ol.style.Fill({
          color: 'rgba(0,0,255,1)'
        })
      })
    });
  }
  f.set('fillColor', fillColor);
  var theStyle = stylePool[fillColor].clone();
  if (countrySort[key] && countrySort[key][currentYear] && countrySort[key][currentYear][currentButton]) {
    theStyle.getText().setText(countrySort[key][currentYear][currentButton].toString());
  }
  return theStyle;
}

var vectorCunli = new ol.layer.Vector({
  source: new ol.source.Vector({
    url: 'https://kiang.github.io/taiwan_basecode/cunli/topo/20240807.json',
    format: new ol.format.TopoJSON(),
  }),
  style: cunliStyle
});

var baseLayer = new ol.layer.Tile({
  source: new ol.source.WMTS({
    matrixSet: 'EPSG:3857',
    format: 'image/png',
    url: 'https://wmts.nlsc.gov.tw/wmts',
    layer: 'EMAP',
    tileGrid: new ol.tilegrid.WMTS({
      origin: ol.extent.getTopLeft(projectionExtent),
      resolutions: resolutions,
      matrixIds: matrixIds
    }),
    style: 'default',
    wrapX: true,
    attributions: '<a href="https://maps.nlsc.gov.tw/" target="_blank">國土測繪圖資服務雲</a>'
  }),
  opacity: 0.5
});

var appView = new ol.View({
  center: ol.proj.fromLonLat([120.20345985889435, 22.994906062625773]),
  zoom: 14
});

var map = new ol.Map({
  target: 'map',
  layers: [baseLayer, vectorCunli],
  view: appView
});

map.on('singleclick', function (evt) {
  map.forEachFeatureAtPixel(evt.pixel, function (feature, layer) {
    if (layer === vectorCunli && feature.get('VILLCODE')) {
      showFeature(feature);
      return true;  // 找到符合條件的 feature 後立即停止遍歷
    }
  }, {
    layerFilter: function(layer) {
      return layer === vectorCunli;
    }
  });
});

var geolocation = new ol.Geolocation({
  projection: appView.getProjection()
});

geolocation.setTracking(true);

geolocation.on('error', function (error) {
  console.log(error.message);
});

var positionFeature = new ol.Feature();

positionFeature.setStyle(new ol.style.Style({
  image: new ol.style.Circle({
    radius: 6,
    fill: new ol.style.Fill({
      color: '#3399CC'
    }),
    stroke: new ol.style.Stroke({
      color: '#fff',
      width: 2
    })
  })
}));

var geolocationCentered = false;
geolocation.on('change:position', function () {
  var coordinates = geolocation.getPosition();
  if (coordinates) {
    positionFeature.setGeometry(new ol.geom.Point(coordinates));
    if (false === geolocationCentered) {
      map.getView().setCenter(coordinates);
      geolocationCentered = true;
    }
  }
});

new ol.layer.Vector({
  map: map,
  source: new ol.source.Vector({
    features: [positionFeature]
  })
});

var currentYear = '2022', currentButton = 'mid', currentCunliCode = '',
  cunli, cunliSalary,
  valueKeys = {
    avg: 'avg',
    mid: 'mid',
    sd: 'sd',
    mid1: 'mid1',
    mid3: 'mid3'
  }, buttonKeys = {
    avg: 'avg',
    mid: 'mid',
    sd: 'sd',
    mid1: 'mid1',
    mid3: 'mid3'
  };

var showCunli = function (theYear, theButton, cunliCode) {
  if (buttonKeys[theButton]) {
    theButton = buttonKeys[theButton];
  }
  currentYear = theYear;
  currentButton = theButton;
  currentCunliCode = cunliCode;
  if (!cunliCode) {
    cunliCode = '';
  }

  vectorCunli.getSource().changed();

  $('a.btn-year').each(function () {
    if ($(this).attr('data-year') === currentYear) {
      $(this).removeClass('btn-default').addClass('btn-primary');
    } else {
      $(this).removeClass('btn-primary').addClass('btn-default');
    }
  });
  $('a.btn-play').each(function () {
    if ($(this).attr('id') === currentButton) {
      $(this).removeClass('btn-default').addClass('btn-primary');
    } else {
      $(this).removeClass('btn-primary').addClass('btn-default');
    }
  });
};

function showFeature(feature) {
  console.log('showFeature called with:', feature);
  
  var cunli = feature.get('COUNTYNAME') + feature.get('TOWNNAME') + feature.get('VILLNAME');
  var cunliKey = feature.get('VILLCODE');
  var tableData = [];
  var chartDataSet1 = [], chartDataSet2 = [];
  
  console.log('Processing data for:', { cunli, cunliKey });
  
  if (cunliSalary[cunliKey]) {
    console.log('Found salary data:', cunliSalary[cunliKey]);
    
    for (let y in cunliSalary[cunliKey]) {
      const rowData = [y];
      for (let k in cunliSalary[cunliKey][y]) {
        rowData.push(cunliSalary[cunliKey][y][k]);
      }
      tableData.push(rowData);
      chartDataSet1.push(cunliSalary[cunliKey][y].mid);
      chartDataSet2.push(cunliSalary[cunliKey][y].avg);
    }

    console.log('Prepared data:', { tableData, chartDataSet1, chartDataSet2 });

    const chartData = {
      labels: Object.keys(cunliSalary[cunliKey]),
      datasets: [
        {
          label: "中位數",
          backgroundColor: "rgb(255, 99, 132)",
          data: chartDataSet1
        },
        {
          label: "平均數",
          backgroundColor: "rgb(132, 99, 255)",
          data: chartDataSet2
        }
      ]
    };

    console.log('Chart data:', chartData);

    const event = new CustomEvent('showMapData', {
      detail: {
        title: cunli,
        tableData: tableData,
        chartData: chartData,
        chartConfig: chartData
      }
    });

    console.log('Dispatching event with data:', event.detail);
    window.dispatchEvent(event);
  } else {
    console.log('No salary data found for:', cunliKey);
  }

  var targetHash = '#' + currentYear + '/' + currentButton + '/' + cunliKey;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  }
}

var cunliInitDone = false;

vectorCunli.on('change', function (e) {
  if (!cunliInitDone && vectorCunli.getSource().getState() === 'ready') {
    cunliInitDone = true;
    
    // 更新村里名稱
    vectorCunli.getSource().forEachFeature(function (f) {
      var p = f.getProperties();
      if (countrySort[p.VILLCODE]) {
        countrySort[p.VILLCODE].name = p.COUNTYNAME + p.TOWNNAME + p.VILLNAME;
      }
    });

    // 初始化顯示
    showCunli(currentYear, currentButton);
    updateCunliList();
  }
});

function updateCunliList() {
  var salaryList = Object.keys(countrySortPool[currentYear][currentButton]).reverse();
  var cunliListHtml = '<h1>' + currentYear + ' / ' + currentButton + '</h1>';
  cunliListHtml += '<table class="table table-striped table-fixed">';
  for (k in salaryList) {
    cunliListHtml += '<tr><td>' + salaryList[k] + '</td><td>';
    for (j in cunliListPool[currentYear][currentButton][salaryList[k]]) {
      var theCode = cunliListPool[currentYear][currentButton][salaryList[k]][j];
      cunliListHtml += '<a href="#' + currentYear + '/' + currentButton + '/' + theCode + '" class="btn-cunli-list">' + countrySort[theCode].name + '</a> ';
    }
    cunliListHtml += '</td></tr>';
  }
  cunliListHtml += '</table>';
  $('#cunliList').html(cunliListHtml);
  $('.btn-cunli-list').click(function () {
    // sidebar.open('home');
  });
}

function ColorBar(value) {
  if (value == 0)
    return "rgba(255,255,255,0.6)" //white
  else if (value <= 300)
    return "rgba(254,232,200,0.6)"
  else if (value <= 400)
    return "rgba(253,212,158,0.6)"
  else if (value <= 500)
    return "rgba(253,187,132,0.6)"
  else if (value <= 700)
    return "rgba(252,141,89,0.6)"
  else if (value <= 900)
    return "rgba(239,101,72,0.6)"
  else if (value <= 1100)
    return "rgba(215,48,31,0.6)"
  else if (value <= 1300)
    return "rgba(179,0,0,0.6)"
  else if (value <= 1500)
    return "rgba(127,0,0,0.6)"
  else
    return "rgba(64,0,0,0.6)"
}

var selectedFeature = false;
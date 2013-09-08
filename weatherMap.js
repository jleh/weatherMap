
var weatherMap = {};

$(document).ready(function () {
  weatherMap.Map.initializeMap();
  weatherMap.Weather.getWeather();
  createSlider();
});

weatherMap.Map = function () {
  var map, cities = [], sliderValue = 0, selectedCity, now = moment().hours();

  function initializeMap () {
    map = L.map('map', {
      minZoom : 5,
      maxZoom : 7,
      center : [64.7975263615867, 26.4990234375],
      zoom : 6
    });

    L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  }

  function addTemperatureToMap(temperature) {
    var html = '<div id="city' + (cities.length + 1) + '">';
    html += '<img class="weatherSymbol" src="symbols/' + temperature.symbol + '.svg">';
    html += '<span>' + temperature.temperature + '</span></div>';

    var divIcon = L.divIcon({ className : 'tempLabel', html : html});

    var marker = L.marker([temperature.position[0], temperature.position[1]], { icon : divIcon });
    marker.data = temperature;
    marker.data.id = 'city' + (cities.length + 1);

    cities.push(marker);

    marker.addTo(map);

    $("#" + marker.data.id).data('weather', marker.data);
    $("#" + marker.data.id).click(cityClick);
  }

  function cityClick() {
    var data = $(this).data('weather');
    $("#weatherBox").show();
    selectedCity = data;

    updateWeatherBox(); 
  }

  function updateWeatherBox() {
    if(selectedCity) {
      $("#cityName").html(selectedCity.name + ' klo ' + getTime(sliderValue));
      $("#cityTemp").html(parseInt(selectedCity.forecast.temperatures[sliderValue].value + ' C'));
      $("#citySymbol").attr('src', 'symbols/' + selectedCity.forecast.symbols[sliderValue].value + '.svg');

      var wind = parseInt(selectedCity.forecast.winds[sliderValue].value) + ' m/s';
      //wind += ' ' + selectedCity.forecast.winddirections[sliderValue].value
      $("#cityWind").html(wind);
    }
  }

  function getTime(value) {
    var hour = now + value;

      if(hour >= 24) {
        return (hour - 24) + ':00';
      }

      return hour + ':00';
  }

  function getMap() {
    return map;
  }

  function setTime(value) {
    sliderValue = value;

    for (var i = 0; i < cities.length; i++) {
      var temperature = cities[i].data.forecast.temperatures[value],
          symbol = cities[i].data.forecast.symbols[value];


      var html = '<img class="weatherSymbol" src="symbols/' + symbol.value + '.svg">';
          html += '<span>' + parseInt(temperature.value) + '</span>';

      $("#" + cities[i].data.id).html(html);
    }

    updateWeatherBox();
  }

  return {
    initializeMap : initializeMap,
    getMap : getMap,
    addTemperatureToMap : addTemperatureToMap,
    setTime : setTime
  }
}();

weatherMap.Weather = function () {

  var SERVER_URL = "http://data.fmi.fi/fmi-apikey/API-KEY-HERE/wfs";
  var STORED_QUERY_OBSERVATION = "fmi::observations::weather::multipointcoverage";
  var STORED_QUERY_FORECAST = "fmi::forecast::hirlam::surface::point::multipointcoverage";

  var cityList = ["Helsinki", "Lahti", "Turku", "Tampere", "Jyväskylä", "Oulu", "Rovaniemi", 
                  "Vaasa", "Joensuu", "Lappeenranta", "Kajaani", "Pori"];

  function getWeather() {
    fi.fmi.metoclient.metolib.WfsRequestParser.getData({
      url : SERVER_URL,
      storedQueryId : STORED_QUERY_FORECAST,
      requestParameter : "temperature,weatherSymbol3,windspeedms,winddirection",
      begin : moment().toDate(),
      end : moment().add('hours', 24).toDate(),
      timestep : 60 * 60 * 1000,
      sites : cityList,
      callback : function(data, errors) {
        weatherMap.Weather.addWeatherToMap(data);
      }
    });
  }

  function addWeatherToMap(data) {
    for (var i = 0; i < data.locations.length; i++) {
      //var maxTime = data.locations[i].data.temperature.timeValuePairs.length - 1;
      var temperature = {
        position : data.locations[i].info.position,
        name : data.locations[i].info.name,
        time : data.locations[i].data.temperature.timeValuePairs[0].time,
        temperature : parseInt(data.locations[i].data.temperature.timeValuePairs[0].value),
        symbol : data.locations[i].data.weatherSymbol3.timeValuePairs[0].value,
        forecast : {
          temperatures : data.locations[i].data.temperature.timeValuePairs,
          symbols : data.locations[i].data.weatherSymbol3.timeValuePairs,
          winds : data.locations[i].data.windspeedms.timeValuePairs,
          winddirections : data.locations[i].data.winddirection.timeValuePairs
        }
      };

      weatherMap.Map.addTemperatureToMap(temperature);
    }
  }

  return {
    getWeather : getWeather,
    addWeatherToMap : addWeatherToMap
  }
}();

function createSlider() {
  var now = moment().hours(),
      tomorrow = moment().add('hours', 24).format('D.M.YYYY'),
      today = moment().format('D.M.YYYY');

  $('#slider').slider({
    min  : 0,
    max  : 24,
    value: 0,
    formater : function (value) {
      var hour = now + value;

      if(hour >= 24) {
        return tomorrow + ' ' + (hour - 24) + ':00';
      }

      return today + ' ' + hour + ':00';
    }
  }).on('slide', function (ev) {
    weatherMap.Map.setTime(ev.value);
  });
}
